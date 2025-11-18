CREATE TABLE IF NOT EXISTS "alugueis" (
	"id" serial PRIMARY KEY NOT NULL,
	"imovel_id" integer NOT NULL,
	"mes" integer NOT NULL,
	"ano" integer NOT NULL,
	"data_registro" timestamp DEFAULT now() NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pendente' NOT NULL,
	"pago_em" timestamp,
	"comprovante_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arquivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome_original" text NOT NULL,
	"caminho" text NOT NULL,
	"mime" text NOT NULL,
	"tamanho" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" integer NOT NULL,
	"tipo" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "condominios" (
	"id" serial PRIMARY KEY NOT NULL,
	"imovel_id" integer NOT NULL,
	"mes" integer NOT NULL,
	"ano" integer NOT NULL,
	"data_registro" timestamp DEFAULT now() NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pendente' NOT NULL,
	"pago_em" timestamp,
	"comprovante_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "configuracoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"configuracao_inicial" boolean DEFAULT false NOT NULL,
	"data_inicio_contrato" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "imoveis" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"endereco" text NOT NULL,
	"valor_imovel" numeric(12, 2) NOT NULL,
	"valor_aluguel" numeric(12, 2) NOT NULL,
	"contrato_arquivo_id" integer,
	"foto_capa_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "imovel_partes" (
	"id" serial PRIMARY KEY NOT NULL,
	"imovel_id" integer NOT NULL,
	"parte_id" integer NOT NULL,
	"papel_acesso" varchar(50) NOT NULL,
	CONSTRAINT "imovel_partes_imovel_id_parte_id_unique" UNIQUE("imovel_id","parte_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parcelas" (
	"id" serial PRIMARY KEY NOT NULL,
	"imovel_id" integer NOT NULL,
	"numero" integer NOT NULL,
	"data_registro" timestamp DEFAULT now() NOT NULL,
	"vencimento" timestamp NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pendente' NOT NULL,
	"pago_em" timestamp,
	"comprovante_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"nome" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"telefone" varchar(50),
	"rg" varchar(50),
	"orgao_emissor" varchar(50),
	"cpf" varchar(14) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"senha" text NOT NULL,
	"nome" text NOT NULL,
	"papel" varchar(50) NOT NULL,
	"parte_id" integer,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alugueis" ADD CONSTRAINT "alugueis_imovel_id_imoveis_id_fk" FOREIGN KEY ("imovel_id") REFERENCES "public"."imoveis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alugueis" ADD CONSTRAINT "alugueis_comprovante_id_arquivos_id_fk" FOREIGN KEY ("comprovante_id") REFERENCES "public"."arquivos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominios" ADD CONSTRAINT "condominios_imovel_id_imoveis_id_fk" FOREIGN KEY ("imovel_id") REFERENCES "public"."imoveis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominios" ADD CONSTRAINT "condominios_comprovante_id_arquivos_id_fk" FOREIGN KEY ("comprovante_id") REFERENCES "public"."arquivos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_contrato_arquivo_id_arquivos_id_fk" FOREIGN KEY ("contrato_arquivo_id") REFERENCES "public"."arquivos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_foto_capa_id_arquivos_id_fk" FOREIGN KEY ("foto_capa_id") REFERENCES "public"."arquivos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imovel_partes" ADD CONSTRAINT "imovel_partes_imovel_id_imoveis_id_fk" FOREIGN KEY ("imovel_id") REFERENCES "public"."imoveis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imovel_partes" ADD CONSTRAINT "imovel_partes_parte_id_partes_id_fk" FOREIGN KEY ("parte_id") REFERENCES "public"."partes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_imovel_id_imoveis_id_fk" FOREIGN KEY ("imovel_id") REFERENCES "public"."imoveis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_comprovante_id_arquivos_id_fk" FOREIGN KEY ("comprovante_id") REFERENCES "public"."arquivos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_parte_id_partes_id_fk" FOREIGN KEY ("parte_id") REFERENCES "public"."partes"("id") ON DELETE set null ON UPDATE no action;