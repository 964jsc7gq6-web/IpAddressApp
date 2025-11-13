import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "database.sqlite");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      nome TEXT NOT NULL,
      papel TEXT NOT NULL CHECK(papel IN ('Proprietário', 'Comprador'))
    );

    CREATE TABLE IF NOT EXISTS arquivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_original TEXT NOT NULL,
      caminho TEXT NOT NULL,
      mime TEXT NOT NULL,
      tamanho INTEGER NOT NULL,
      criado_em TEXT NOT NULL,
      entidade TEXT NOT NULL,
      entidade_id INTEGER NOT NULL,
      tipo TEXT
    );

    CREATE TABLE IF NOT EXISTS partes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL CHECK(tipo IN ('Proprietário', 'Comprador')),
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      telefone TEXT,
      rg TEXT,
      orgao_emissor TEXT,
      cpf TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS imoveis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      endereco TEXT NOT NULL,
      valor_imovel REAL NOT NULL,
      valor_aluguel REAL NOT NULL,
      contrato_arquivo_id INTEGER,
      foto_capa_id INTEGER,
      FOREIGN KEY (contrato_arquivo_id) REFERENCES arquivos(id) ON DELETE SET NULL,
      FOREIGN KEY (foto_capa_id) REFERENCES arquivos(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS parcelas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imovel_id INTEGER NOT NULL,
      numero INTEGER NOT NULL,
      vencimento TEXT NOT NULL,
      valor REAL NOT NULL,
      pago INTEGER NOT NULL DEFAULT 0 CHECK(pago IN (0, 1)),
      pago_em TEXT,
      comprovante_id INTEGER,
      FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE,
      FOREIGN KEY (comprovante_id) REFERENCES arquivos(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS alugueis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imovel_id INTEGER NOT NULL,
      mes INTEGER NOT NULL CHECK(mes >= 1 AND mes <= 12),
      ano INTEGER NOT NULL CHECK(ano >= 2000),
      valor REAL NOT NULL,
      pago INTEGER NOT NULL DEFAULT 0 CHECK(pago IN (0, 1)),
      pago_em TEXT,
      comprovante_id INTEGER,
      FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE,
      FOREIGN KEY (comprovante_id) REFERENCES arquivos(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS condominios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imovel_id INTEGER NOT NULL,
      mes INTEGER NOT NULL CHECK(mes >= 1 AND mes <= 12),
      ano INTEGER NOT NULL CHECK(ano >= 2000),
      valor REAL NOT NULL,
      pago INTEGER NOT NULL DEFAULT 0 CHECK(pago IN (0, 1)),
      pago_em TEXT,
      comprovante_id INTEGER,
      FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE,
      FOREIGN KEY (comprovante_id) REFERENCES arquivos(id) ON DELETE SET NULL
    );
  `);

  console.log("✅ Database initialized successfully");
}
