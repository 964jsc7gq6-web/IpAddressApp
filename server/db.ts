import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Detectar se está usando Neon (Replit) ou PostgreSQL local (EC2)
const isNeon = process.env.DATABASE_URL.includes('neon.tech');

let pool: any;
let db: any;

if (isNeon) {
  // Usar driver Neon para bancos de dados Neon (como no ambiente Replit)
  neonConfig.webSocketConstructor = ws;
  
  const neonPool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  pool = neonPool;
  db = drizzleNeon(neonPool, { schema });
} else {
  // Usar driver PostgreSQL padrão para PostgreSQL local (como na EC2)
  const pgPool = new PgPool({ 
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  pool = pgPool;
  db = drizzlePg(pgPool, { schema });
}

export { pool, db };
