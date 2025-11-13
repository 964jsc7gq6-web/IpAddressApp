import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários com papéis
export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  senha: text("senha").notNull(),
  nome: text("nome").notNull(),
  papel: text("papel").notNull(), // "Proprietário" ou "Comprador"
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({ id: true });
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = typeof usuarios.$inferSelect;

// Arquivos (metadados)
export const arquivos = sqliteTable("arquivos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nomeOriginal: text("nome_original").notNull(),
  caminho: text("caminho").notNull(),
  mime: text("mime").notNull(),
  tamanho: integer("tamanho").notNull(), // bytes
  criadoEm: text("criado_em").notNull(),
  entidade: text("entidade").notNull(), // "parte", "imovel", "parcela", etc
  entidadeId: integer("entidade_id").notNull(),
  tipo: text("tipo"), // "anexo", "contrato", "foto_capa", "comprovante"
});

export const insertArquivoSchema = createInsertSchema(arquivos).omit({ id: true });
export type InsertArquivo = z.infer<typeof insertArquivoSchema>;
export type Arquivo = typeof arquivos.$inferSelect;

// Partes (Proprietários e Compradores)
export const partes = sqliteTable("partes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tipo: text("tipo").notNull(), // "Proprietário" ou "Comprador"
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  rg: text("rg"),
  orgaoEmissor: text("orgao_emissor"),
  cpf: text("cpf").notNull(),
});

export const insertParteSchema = createInsertSchema(partes).omit({ id: true }).extend({
  tipo: z.enum(["Proprietário", "Comprador"]),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF deve ter no mínimo 11 dígitos"),
});

export type InsertParte = z.infer<typeof insertParteSchema>;
export type Parte = typeof partes.$inferSelect;

// Imóvel (único)
export const imoveis = sqliteTable("imoveis", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  endereco: text("endereco").notNull(),
  valor_imovel: real("valor_imovel").notNull(),
  valor_aluguel: real("valor_aluguel").notNull(),
  contrato_arquivo_id: integer("contrato_arquivo_id"),
  foto_capa_id: integer("foto_capa_id"),
});

export const insertImovelSchema = createInsertSchema(imoveis).omit({ id: true }).extend({
  valor_imovel: z.number().positive("Valor do imóvel deve ser positivo"),
  valor_aluguel: z.number().positive("Valor do aluguel deve ser positivo"),
});

export type InsertImovel = z.infer<typeof insertImovelSchema>;
export type Imovel = typeof imoveis.$inferSelect;

// Parcelas (controle financeiro de venda)
export const parcelas = sqliteTable("parcelas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imovelId: integer("imovel_id").notNull(),
  numero: integer("numero").notNull(),
  vencimento: text("vencimento").notNull(), // ISO date string
  valor: real("valor").notNull(),
  pago: integer("pago").notNull().default(0), // 0 = false, 1 = true (SQLite boolean)
  pagoEm: text("pago_em"), // ISO date string
  comprovanteId: integer("comprovante_id"),
});

export const insertParcelaSchema = createInsertSchema(parcelas).omit({ id: true }).extend({
  valor: z.number().positive("Valor deve ser positivo"),
  pago: z.number().min(0).max(1).default(0),
});

export type InsertParcela = z.infer<typeof insertParcelaSchema>;
export type Parcela = typeof parcelas.$inferSelect;

// Aluguéis
export const alugueis = sqliteTable("alugueis", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imovelId: integer("imovel_id").notNull(),
  mes: integer("mes").notNull(), // 1-12
  ano: integer("ano").notNull(),
  valor: real("valor").notNull(), // automático do imóvel
  pago: integer("pago").notNull().default(0), // 0 = false, 1 = true
  pagoEm: text("pago_em"), // ISO date string
  comprovanteId: integer("comprovante_id"),
});

export const insertAluguelSchema = createInsertSchema(alugueis).omit({ id: true }).extend({
  mes: z.number().min(1).max(12),
  ano: z.number().min(2000),
  valor: z.number().positive("Valor deve ser positivo"),
  pago: z.number().min(0).max(1).default(0),
});

export type InsertAluguel = z.infer<typeof insertAluguelSchema>;
export type Aluguel = typeof alugueis.$inferSelect;

// Condomínio
export const condominios = sqliteTable("condominios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imovelId: integer("imovel_id").notNull(),
  mes: integer("mes").notNull(), // 1-12
  ano: integer("ano").notNull(),
  valor: real("valor").notNull(), // editável
  pago: integer("pago").notNull().default(0), // 0 = false, 1 = true
  pagoEm: text("pago_em"), // ISO date string
  comprovanteId: integer("comprovante_id"),
});

export const insertCondominioSchema = createInsertSchema(condominios).omit({ id: true }).extend({
  mes: z.number().min(1).max(12),
  ano: z.number().min(2000),
  valor: z.number().positive("Valor deve ser positivo"),
  pago: z.number().min(0).max(1).default(0),
});

export type InsertCondominio = z.infer<typeof insertCondominioSchema>;
export type Condominio = typeof condominios.$inferSelect;
