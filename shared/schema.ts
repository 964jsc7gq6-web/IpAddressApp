import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, numeric, boolean, timestamp, varchar, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Configuração inicial do sistema
export const configuracoes = pgTable("configuracoes", {
  id: serial("id").primaryKey(),
  configuracao_inicial: boolean("configuracao_inicial").notNull().default(false),
  data_inicio_contrato: timestamp("data_inicio_contrato"),
  criado_em: timestamp("criado_em").notNull().defaultNow(),
});

export const insertConfiguracaoSchema = createInsertSchema(configuracoes).omit({ id: true, criado_em: true });
export type InsertConfiguracao = z.infer<typeof insertConfiguracaoSchema>;
export type Configuracao = typeof configuracoes.$inferSelect;

// Partes (Proprietários e Compradores)
export const partes = pgTable("partes", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // "Proprietário" ou "Comprador"
  nome: text("nome").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 50 }),
  rg: varchar("rg", { length: 50 }),
  orgao_emissor: varchar("orgao_emissor", { length: 50 }),
  cpf: varchar("cpf", { length: 14 }).notNull(),
});

export const insertParteSchema = createInsertSchema(partes).omit({ id: true }).extend({
  tipo: z.enum(["Proprietário", "Comprador"]),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF deve ter no mínimo 11 dígitos"),
});

export type InsertParte = z.infer<typeof insertParteSchema>;
export type Parte = typeof partes.$inferSelect;

// Usuários com papéis
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  senha: text("senha").notNull(),
  nome: text("nome").notNull(),
  papel: varchar("papel", { length: 50 }).notNull(), // "Proprietário" ou "Comprador"
  parte_id: integer("parte_id").references(() => partes.id, { onDelete: "set null" }),
});

export const usuariosRelations = relations(usuarios, ({ one }) => ({
  parte: one(partes, {
    fields: [usuarios.parte_id],
    references: [partes.id],
  }),
}));

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({ id: true }).extend({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  papel: z.enum(["Proprietário", "Comprador"]),
});
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = typeof usuarios.$inferSelect;

// Arquivos (metadados)
export const arquivos = pgTable("arquivos", {
  id: serial("id").primaryKey(),
  nome_original: text("nome_original").notNull(),
  caminho: text("caminho").notNull(),
  mime: text("mime").notNull(),
  tamanho: integer("tamanho").notNull(), // bytes
  criado_em: timestamp("criado_em").notNull().defaultNow(),
  entidade: text("entidade").notNull(), // "parte", "imovel", "parcela", etc
  entidade_id: integer("entidade_id").notNull(),
  tipo: text("tipo"), // "anexo", "contrato", "foto_capa", "comprovante"
});

export const insertArquivoSchema = createInsertSchema(arquivos).omit({ id: true, criado_em: true });
export type InsertArquivo = z.infer<typeof insertArquivoSchema>;
export type Arquivo = typeof arquivos.$inferSelect;

// Imóvel (único)
export const imoveis = pgTable("imoveis", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  endereco: text("endereco").notNull(),
  valor_imovel: numeric("valor_imovel", { precision: 12, scale: 2 }).notNull(),
  valor_aluguel: numeric("valor_aluguel", { precision: 12, scale: 2 }).notNull(),
  contrato_arquivo_id: integer("contrato_arquivo_id").references(() => arquivos.id, { onDelete: "set null" }),
  foto_capa_id: integer("foto_capa_id").references(() => arquivos.id, { onDelete: "set null" }),
});

export const imoveisRelations = relations(imoveis, ({ one }) => ({
  contratoArquivo: one(arquivos, {
    fields: [imoveis.contrato_arquivo_id],
    references: [arquivos.id],
    relationName: "contrato",
  }),
  fotoCapa: one(arquivos, {
    fields: [imoveis.foto_capa_id],
    references: [arquivos.id],
    relationName: "foto_capa",
  }),
}));

export const insertImovelSchema = createInsertSchema(imoveis).omit({ id: true }).extend({
  valor_imovel: z.number().positive("Valor do imóvel deve ser positivo"),
  valor_aluguel: z.number().positive("Valor do aluguel deve ser positivo"),
});

export type InsertImovel = z.infer<typeof insertImovelSchema>;
export type Imovel = typeof imoveis.$inferSelect;

// Tabela de junção: relaciona partes (e usuários) com imóveis
export const imovelPartes = pgTable("imovel_partes", {
  id: serial("id").primaryKey(),
  imovel_id: integer("imovel_id").notNull().references(() => imoveis.id, { onDelete: "cascade" }),
  parte_id: integer("parte_id").notNull().references(() => partes.id, { onDelete: "cascade" }),
  papel_acesso: varchar("papel_acesso", { length: 50 }).notNull(), // "Proprietário" ou "Comprador"
}, (table) => ({
  uniqueImovelParte: unique().on(table.imovel_id, table.parte_id),
}));

export const imovelPartesRelations = relations(imovelPartes, ({ one }) => ({
  imovel: one(imoveis, {
    fields: [imovelPartes.imovel_id],
    references: [imoveis.id],
  }),
  parte: one(partes, {
    fields: [imovelPartes.parte_id],
    references: [partes.id],
  }),
}));

export const insertImovelParteSchema = createInsertSchema(imovelPartes).omit({ id: true }).extend({
  papel_acesso: z.enum(["Proprietário", "Comprador"]),
});
export type InsertImovelParte = z.infer<typeof insertImovelParteSchema>;
export type ImovelParte = typeof imovelPartes.$inferSelect;

// Parcelas (controle financeiro de venda)
export const parcelas = pgTable("parcelas", {
  id: serial("id").primaryKey(),
  imovel_id: integer("imovel_id").notNull().references(() => imoveis.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  data_registro: timestamp("data_registro").notNull().defaultNow(),
  vencimento: timestamp("vencimento").notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pendente"),
  pago_em: timestamp("pago_em"),
  comprovante_id: integer("comprovante_id").references(() => arquivos.id, { onDelete: "set null" }),
});

export const parcelasRelations = relations(parcelas, ({ one }) => ({
  imovel: one(imoveis, {
    fields: [parcelas.imovel_id],
    references: [imoveis.id],
  }),
  comprovante: one(arquivos, {
    fields: [parcelas.comprovante_id],
    references: [arquivos.id],
  }),
}));

export const insertParcelaSchema = createInsertSchema(parcelas).omit({ 
  id: true, 
  status: true, 
  pago_em: true, 
  comprovante_id: true,
  data_registro: true,
  imovel_id: true,
}).extend({
  valor: z.number().positive("Valor deve ser positivo"),
  numero: z.number().int().positive().optional(),
  vencimento: z.string().optional(),
});

export type InsertParcela = z.infer<typeof insertParcelaSchema>;
export type Parcela = typeof parcelas.$inferSelect;
export type ParcelaComComprovante = Parcela & {
  comprovante: {
    id: number;
    nome_original: string;
    mime: string;
  } | null;
};

// Aluguéis
export const alugueis = pgTable("alugueis", {
  id: serial("id").primaryKey(),
  imovel_id: integer("imovel_id").notNull().references(() => imoveis.id, { onDelete: "cascade" }),
  mes: integer("mes").notNull(), // 1-12
  ano: integer("ano").notNull(),
  data_registro: timestamp("data_registro").notNull().defaultNow(),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pendente"),
  pago_em: timestamp("pago_em"),
  comprovante_id: integer("comprovante_id").references(() => arquivos.id, { onDelete: "set null" }),
});

export const alugueisRelations = relations(alugueis, ({ one }) => ({
  imovel: one(imoveis, {
    fields: [alugueis.imovel_id],
    references: [imoveis.id],
  }),
  comprovante: one(arquivos, {
    fields: [alugueis.comprovante_id],
    references: [arquivos.id],
  }),
}));

export const insertAluguelSchema = createInsertSchema(alugueis).omit({ 
  id: true, 
  status: true, 
  pago_em: true, 
  comprovante_id: true,
  data_registro: true,
  imovel_id: true
}).extend({
  mes: z.number().min(1).max(12),
  ano: z.number().min(2000),
  valor: z.number().positive("Valor deve ser positivo"),
});

export type InsertAluguel = z.infer<typeof insertAluguelSchema>;
export type Aluguel = typeof alugueis.$inferSelect;
export type AluguelComComprovante = Aluguel & {
  comprovante: {
    id: number;
    nome_original: string;
    mime: string;
  } | null;
};

// Condomínio
export const condominios = pgTable("condominios", {
  id: serial("id").primaryKey(),
  imovel_id: integer("imovel_id").notNull().references(() => imoveis.id, { onDelete: "cascade" }),
  mes: integer("mes").notNull(), // 1-12
  ano: integer("ano").notNull(),
  data_registro: timestamp("data_registro").notNull().defaultNow(),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pendente"),
  pago_em: timestamp("pago_em"),
  comprovante_id: integer("comprovante_id").references(() => arquivos.id, { onDelete: "set null" }),
});

export const condominiosRelations = relations(condominios, ({ one }) => ({
  imovel: one(imoveis, {
    fields: [condominios.imovel_id],
    references: [imoveis.id],
  }),
  comprovante: one(arquivos, {
    fields: [condominios.comprovante_id],
    references: [arquivos.id],
  }),
}));

export const insertCondominioSchema = createInsertSchema(condominios).omit({ 
  id: true, 
  status: true, 
  pago_em: true, 
  comprovante_id: true,
  data_registro: true,
  imovel_id: true
}).extend({
  mes: z.number().min(1).max(12),
  ano: z.number().min(2000),
  valor: z.number().positive("Valor deve ser positivo"),
});

export type InsertCondominio = z.infer<typeof insertCondominioSchema>;
export type Condominio = typeof condominios.$inferSelect;
export type CondominioComComprovante = Condominio & {
  comprovante: {
    id: number;
    nome_original: string;
    mime: string;
  } | null;
};
