/** TREAT AS IMMUTABLE - This file is protected by the file-edit tool
 *
 * Database configuration loader
 */
import 'dotenv/config';

/**
 * Database credentials interface
 */
export interface DatabaseCredentials {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

/**
 * Retrieves database credentials from environment variables.
 * 
 * @returns DatabaseCredentials object
 * @throws Error if required environment variables are missing
 */
export function getDatabaseCredentials(): DatabaseCredentials {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_PORT || !DB_USER || !DB_NAME) {
    throw new Error(
      'Missing required database environment variables: DB_HOST, DB_PORT, DB_USER, DB_NAME. Please update your .env file.'
    );
  }

  return {
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
    ssl: {
      rejectUnauthorized: false,
    }
  };
}
