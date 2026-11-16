import { z } from 'zod';

// Set this before the app constructs schemas. The browser policy forbids eval.
z.config({ jitless: true });
