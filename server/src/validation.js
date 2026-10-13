export const statuses = ['reading', 'read', 'published'];

const stringLimits = { title: 400, authors: 1000, journal: 300 };
const fields = [...Object.keys(stringLimits), 'publicationYear', 'status'];

export function validatePaper(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Send a JSON object containing the paper fields.' };
  }

  const unknownFields = Object.keys(body).filter((field) => !fields.includes(field));
  if (unknownFields.length) {
    return { error: `Unknown paper field: ${unknownFields[0]}.` };
  }
  if (partial && Object.keys(body).length === 0) {
    return { error: 'Provide at least one paper field to update.' };
  }

  const values = {};
  const errors = {};
  for (const [field, limit] of Object.entries(stringLimits)) {
    if (partial && !Object.hasOwn(body, field)) continue;
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      errors[field] = `${field[0].toUpperCase()}${field.slice(1)} is required.`;
    } else if (body[field].trim().length > limit) {
      errors[field] = `${field[0].toUpperCase()}${field.slice(1)} must be ${limit} characters or fewer.`;
    } else {
      values[field] = body[field].trim();
    }
  }

  if (!partial || Object.hasOwn(body, 'publicationYear')) {
    if (!Number.isInteger(body.publicationYear) || body.publicationYear < 1 || body.publicationYear > 9999) {
      errors.publicationYear = 'Publication year must be a whole number between 1 and 9999.';
    } else {
      values.publicationYear = body.publicationYear;
    }
  }

  if (!partial || Object.hasOwn(body, 'status')) {
    if (!statuses.includes(body.status)) {
      errors.status = 'Status must be reading, read, or published.';
    } else {
      values.status = body.status;
    }
  }

  if (Object.keys(errors).length) return { error: Object.values(errors)[0], details: errors };
  return { values };
}

export function parsePaperId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
