import { db } from './db.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initializeDatabase(): void {
  try {

    const schemaPath = path.join(__dirname, 'schema.sql');

    const schema = readFileSync(schemaPath, 'utf-8');

    db.exec(schema);
    
  } catch (error) {
    throw error;
  }
}