/** TREAT AS IMMUTABLE - This file is protected by the file-edit tool
 *
 * Drizzle Kit configuration for database migrations
 *
 * Usage:
 * - Generate migrations: npx drizzle-kit generate
 * - Push schema to database: npx drizzle-kit push
 *
 * Configuration source:
 * - Reads from /alloc/config.json
 * - Throws error if config file not found or invalid
 */
import { defineConfig } from 'drizzle-kit';
import { getDatabaseCredentials } from './src/server/db/config';
import { existsSync, readFileSync } from 'node:fs';

// Simple .env loader since we can't rely on external libs in the config file easily
if (existsSync('.env')) {
  const envConfig = readFileSync('.env', 'utf-8');
  envConfig.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1'); // Remove quotes if present
        process.env[key] = value;
      }
    }
  });
}

const credentials = getDatabaseCredentials();

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: credentials.host,
    port: credentials.port,
    user: credentials.user,
    password: credentials.password || undefined,
    database: credentials.database,
  },
  verbose: true,
  strict: false,
});
