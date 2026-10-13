import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openDatabase, paperColumns } from './database.js';
import { parsePaperId, validatePaper } from './validation.js';

export function createApp({ databasePath, serveClient = true } = {}) {
  const database = openDatabase(databasePath);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.locals.database = database;
  app.locals.closeDatabase = () => {
    if (database.open) database.close();
  };

  const findPaper = database.prepare(`SELECT ${paperColumns} FROM papers WHERE id = ?`);
  const listPapers = database.prepare(`SELECT ${paperColumns} FROM papers ORDER BY created_at DESC, id DESC`);
  const insertPaper = database.prepare(`
    INSERT INTO papers (title, authors, journal, publication_year, status, created_at, updated_at)
    VALUES (@title, @authors, @journal, @publicationYear, @status, @createdAt, @updatedAt)
  `);
  const deletePaper = database.prepare('DELETE FROM papers WHERE id = ?');
  const getMetrics = database.prepare(`
    SELECT COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'reading' THEN 1 ELSE 0 END), 0) AS reading,
      COALESCE(SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END), 0) AS read,
      COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) AS published
    FROM papers
  `);

  app.get('/api/health', (_request, response) => {
    database.prepare('SELECT 1').get();
    response.json({ status: 'ok' });
  });

  app.get('/api/metrics', (_request, response) => {
    response.json(getMetrics.get());
  });

  app.get('/api/papers', (_request, response) => {
    response.json({ papers: listPapers.all() });
  });

  app.post('/api/papers', (request, response) => {
    const result = validatePaper(request.body);
    if (result.error) return response.status(400).json(result);

    const timestamp = new Date().toISOString();
    const inserted = insertPaper.run({ ...result.values, createdAt: timestamp, updatedAt: timestamp });
    const paper = findPaper.get(inserted.lastInsertRowid);
    response.status(201).location(`/api/papers/${paper.id}`).json({ paper });
  });

  app.param('id', (request, response, next, value) => {
    const id = parsePaperId(value);
    if (id === null) return response.status(400).json({ error: 'Paper ID must be a positive integer.' });
    request.paperId = id;
    next();
  });

  app.get('/api/papers/:id', (request, response) => {
    const paper = findPaper.get(request.paperId);
    if (!paper) return response.status(404).json({ error: 'Paper not found.' });
    response.json({ paper });
  });

  const updatePaper = (partial) => (request, response) => {
    const result = validatePaper(request.body, { partial });
    if (result.error) return response.status(400).json(result);
    if (!findPaper.get(request.paperId)) return response.status(404).json({ error: 'Paper not found.' });

    const columnNames = { publicationYear: 'publication_year' };
    const assignments = Object.keys(result.values).map((field) => `${columnNames[field] || field} = @${field}`);
    database.prepare(`UPDATE papers SET ${assignments.join(', ')}, updated_at = @updatedAt WHERE id = @id`).run({
      ...result.values,
      updatedAt: new Date().toISOString(),
      id: request.paperId,
    });
    response.json({ paper: findPaper.get(request.paperId) });
  };

  app.patch('/api/papers/:id', updatePaper(true));
  app.put('/api/papers/:id', updatePaper(false));

  app.delete('/api/papers/:id', (request, response) => {
    const result = deletePaper.run(request.paperId);
    if (!result.changes) return response.status(404).json({ error: 'Paper not found.' });
    response.status(204).end();
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'API route not found.' });
  });

  const clientDirectory = fileURLToPath(new URL('../../client/dist/', import.meta.url));
  const clientIndex = `${clientDirectory}index.html`;
  if (serveClient && existsSync(clientIndex)) {
    app.use(express.static(clientDirectory));
    app.get('/{*splat}', (_request, response) => response.sendFile(clientIndex));
  }

  app.use((_request, response) => {
    response.status(404).json({ error: 'Route not found.' });
  });

  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'The request body must contain valid JSON.' });
    }
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ error: 'The request body is too large.' });
    }
    console.error('Request failed:', error.message);
    response.status(500).json({ error: 'The request could not be completed. Please try again.' });
  });

  return app;
}
