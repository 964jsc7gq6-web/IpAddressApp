# Guia de Migrations do App Ipê

## Visão Geral

Este documento descreve como gerenciar mudanças na estrutura do banco de dados de forma segura e controlada, tanto em desenvolvimento quanto em produção.

## Pré-requisitos e Configuração

### Variável DATABASE_URL

Todos os comandos de migration requerem que a variável de ambiente `DATABASE_URL` esteja configurada. Esta é a string de conexão PostgreSQL.

**No ambiente Replit (desenvolvimento):**
```bash
# DATABASE_URL já está configurado automaticamente
# Não é necessário fazer nada
```

**Em produção (deploy):**
```bash
# Configurar DATABASE_URL apontando para o banco de produção
export DATABASE_URL="postgresql://usuario:senha@host:porta/database"
```

**Para múltiplos ambientes:**
```bash
# Development
export DATABASE_URL="postgresql://dev_user:pass@dev-host:5432/app_ipe_dev"

# Staging
export DATABASE_URL="postgresql://staging_user:pass@staging-host:5432/app_ipe_staging"

# Production
export DATABASE_URL="postgresql://prod_user:pass@prod-host:5432/app_ipe_prod"
```

### Verificar Configuração

Para verificar que o DATABASE_URL está configurado corretamente:

```bash
# Mostrar apenas o host (sem expor credenciais)
echo $DATABASE_URL | sed -E 's#.*@([^:/]+).*#\1#'
```

### Migration Inicial

O projeto já possui uma migration inicial (`migrations/0000_*.sql`) que representa o estado atual do banco. Esta migration:

- Foi gerada a partir do schema em `shared/schema.ts`
- Contém todas as 9 tabelas do sistema
- Deve ser aplicada em novos ambientes antes de executar a aplicação

**Para verificar que a migration inicial está sincronizada com o schema:**

```bash
# 1. Gere uma nova migration (sem aplicar)
npx drizzle-kit generate

# 2. Se aparecer "No schema changes detected", está sincronizado
# 3. Se gerar uma migration, revise as diferenças

# 4. Descarte a migration de teste se não houver mudanças reais
rm migrations/0001_*.sql  # se aplicável
```

## Conceitos Importantes

### Migrations vs Push

- **`drizzle-kit push`**: Sincroniza o schema diretamente com o banco (APENAS para desenvolvimento). Pode causar perda de dados.
- **`drizzle-kit migrate`**: Aplica migrations SQL geradas (SEGURO para produção). Preserva dados existentes.

### Workflow de Migrations

1. **Desenvolvimento**: Alterar `shared/schema.ts` com as mudanças desejadas
2. **Gerar Migration**: Criar arquivo SQL com as mudanças
3. **Revisar Migration**: Verificar o SQL gerado
4. **Aplicar Migration**: Executar em desenvolvimento e depois em produção
5. **Commit**: Versionar o arquivo de migration no Git

## Comandos Disponíveis

### 1. Gerar uma Nova Migration

Depois de alterar `shared/schema.ts`, gere uma migration:

```bash
npx drizzle-kit generate
```

Isso irá:
- Comparar o schema atual (`shared/schema.ts`) com o estado do banco
- Criar um arquivo SQL em `migrations/` com as alterações necessárias
- Adicionar um timestamp ao nome do arquivo

**Exemplo de output:**
```
✓ Generated migration migrations/0001_amazing_change.sql
```

### 2. Aplicar Migrations Pendentes

Para aplicar todas as migrations que ainda não foram executadas:

```bash
npx drizzle-kit migrate
```

Isso irá:
- Conectar ao banco usando DATABASE_URL
- Verificar quais migrations já foram aplicadas
- Executar apenas as migrations pendentes
- Registrar cada migration aplicada

### 3. Visualizar o Banco (Drizzle Studio)

Para explorar o banco visualmente:

```bash
npx drizzle-kit studio
```

Abre uma interface web em `https://local.drizzle.studio` para visualizar tabelas, dados e relações.

## Processo Passo a Passo

### Cenário: Adicionar uma Nova Coluna

#### Passo 1: Alterar o Schema

Edite `shared/schema.ts`:

```typescript
export const imoveis = pgTable("imoveis", {
  id: serial("id").primaryKey(),
  endereco: text("endereco").notNull(),
  // Nova coluna adicionada
  cep: text("cep"),
  // ... outras colunas
});
```

#### Passo 2: Gerar Migration

```bash
npx drizzle-kit generate
```

Você verá algo como:
```
? Migration name (optional): adicionar_cep_imovel
✓ Generated migration migrations/0001_adicionar_cep_imovel.sql
```

#### Passo 3: Revisar o SQL Gerado

Abra o arquivo criado em `migrations/0001_adicionar_cep_imovel.sql`:

```sql
ALTER TABLE "imoveis" ADD COLUMN "cep" text;
```

**IMPORTANTE**: Revise sempre o SQL! Certifique-se de que:
- As alterações estão corretas
- Não há DROP de colunas com dados importantes
- Os valores DEFAULT estão adequados

#### Passo 4: Testar em Desenvolvimento

```bash
npx drizzle-kit migrate
```

Verifique se a aplicação funciona corretamente com a mudança.

#### Passo 5: Aplicar em Produção

1. Faça commit da migration:
```bash
git add migrations/
git commit -m "feat: adicionar campo CEP ao imóvel"
git push
```

2. No ambiente de produção, execute:
```bash
npx drizzle-kit migrate
```

## Boas Práticas

### ✅ Fazer

- **Sempre revisar** o SQL gerado antes de aplicar
- **Testar em desenvolvimento** antes de produção
- **Versionar migrations** no Git
- **Dar nomes descritivos** às migrations
- **Criar backups** antes de migrations complexas
- **Adicionar valores DEFAULT** ao criar colunas NOT NULL em tabelas com dados

### ❌ Não Fazer

- **Nunca editar** migrations já aplicadas
- **Nunca usar `db:push`** em produção
- **Nunca deletar** arquivos de migration do histórico
- **Não fazer múltiplas mudanças** em uma migration se puder separar

## Exemplos de Mudanças Comuns

### Adicionar Coluna Nullable

```typescript
// shared/schema.ts
export const partes = pgTable("partes", {
  // ... colunas existentes
  telefone_alternativo: text("telefone_alternativo"), // Nova coluna
});
```

```bash
npx drizzle-kit generate
# Migration gerada: ALTER TABLE "partes" ADD COLUMN "telefone_alternativo" text;
npx drizzle-kit migrate
```

### Adicionar Coluna NOT NULL com Default

```typescript
// shared/schema.ts
export const usuarios = pgTable("usuarios", {
  // ... colunas existentes
  ativo: boolean("ativo").notNull().default(true), // Nova coluna com default
});
```

```bash
npx drizzle-kit generate
# Migration gerada: ALTER TABLE "usuarios" ADD COLUMN "ativo" boolean DEFAULT true NOT NULL;
npx drizzle-kit migrate
```

### Criar Nova Tabela

```typescript
// shared/schema.ts
export const configuracoes = pgTable("configuracoes", {
  id: serial("id").primaryKey(),
  chave: text("chave").notNull().unique(),
  valor: text("valor").notNull(),
});
```

```bash
npx drizzle-kit generate
# Migration gerada: CREATE TABLE "configuracoes" (...);
npx drizzle-kit migrate
```

### Adicionar Índice

```typescript
// shared/schema.ts
export const parcelas = pgTable("parcelas", {
  // ... colunas existentes
}, (table) => ({
  statusIdx: index("parcelas_status_idx").on(table.status),
}));
```

```bash
npx drizzle-kit generate
# Migration gerada: CREATE INDEX "parcelas_status_idx" ON "parcelas" ("status");
npx drizzle-kit migrate
```

## Troubleshooting

### Migration Falhou Parcialmente

Se uma migration falhar no meio:

1. Identifique o erro nos logs
2. Corrija manualmente o banco se necessário
3. Crie uma nova migration para corrigir o estado
4. Nunca edite a migration que falhou

### Reverter uma Migration

Drizzle Kit não tem rollback automático. Para reverter:

1. Crie uma nova migration que desfaz a mudança
2. Exemplo: se adicionou uma coluna, crie migration que remove

```sql
-- migrations/0002_reverter_cep.sql
ALTER TABLE "imoveis" DROP COLUMN "cep";
```

### Conflito de Migrations

Se duas pessoas criarem migrations ao mesmo tempo:

1. Faça pull das mudanças
2. Se necessário, gere uma nova migration incremental
3. As migrations são aplicadas em ordem de timestamp

## Segurança em Produção

### Checklist Antes de Aplicar em Produção

- [ ] Migration testada em desenvolvimento
- [ ] SQL revisado e validado
- [ ] Backup do banco realizado
- [ ] Mudanças retrocompatíveis (se possível)
- [ ] Plano de rollback definido
- [ ] Notificação aos usuários (se downtime)

### Recomendações

- **Janelas de manutenção**: Agende migrations grandes fora do horário de pico
- **Migrations incrementais**: Prefira múltiplas migrations pequenas a uma grande
- **Teste de rollback**: Tenha um plano B testado
- **Monitoramento**: Observe logs e métricas após aplicar

## Integração com Deploy

O processo recomendado é:

1. **Desenvolvimento local**:
   ```bash
   # Alterar schema
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

2. **Commit e Push**:
   ```bash
   git add shared/schema.ts migrations/
   git commit -m "feat: nova funcionalidade X"
   git push
   ```

3. **Em Produção** (após deploy do código):
   ```bash
   npx drizzle-kit migrate
   ```

## Uso em CI/CD e Automação

### Modo Não-Interativo

Para uso em pipelines de CI/CD, onde não há interação do usuário:

```bash
# Em ambientes de automação, configure DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Aplicar migrations automaticamente (sem confirmação)
npx drizzle-kit migrate
```

### Pipeline de Deploy Exemplo

```yaml
# Exemplo: GitHub Actions / GitLab CI / Similar
deploy:
  steps:
    - name: Checkout código
      run: git checkout main
    
    - name: Instalar dependências
      run: npm ci
    
    - name: Aplicar migrations
      env:
        DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
      run: npx drizzle-kit migrate
    
    - name: Build aplicação
      run: npm run build
    
    - name: Deploy
      run: npm run deploy
```

### Script de Deploy Seguro

Crie um script `deploy-migrations.sh` para uso em produção:

```bash
#!/bin/bash
set -euo pipefail

# Validar ambiente
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERRO: DATABASE_URL não configurado"
  exit 1
fi

# Backup antes de migrations (recomendado)
echo "Criando backup..."
# pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Aplicar migrations
echo "Aplicando migrations..."
npx drizzle-kit migrate

echo "Migrations aplicadas com sucesso!"
```

### Validação Pré-Deploy

Antes de fazer deploy, valide as migrations:

```bash
# 1. Verificar que não há migrations pendentes locais não commitadas
git status migrations/

# 2. Gerar migration de teste para confirmar schema está sincronizado
npx drizzle-kit generate

# 3. Se não houver mudanças, o schema está sincronizado
# 4. Se houver mudanças não intencionais, revisar antes de prosseguir
```

### Configuração para Múltiplos Ambientes

```bash
# .env.development
DATABASE_URL=postgresql://dev_user:pass@localhost:5432/app_ipe_dev

# .env.staging
DATABASE_URL=postgresql://staging_user:pass@staging-host:5432/app_ipe_staging

# .env.production
DATABASE_URL=postgresql://prod_user:pass@prod-host:5432/app_ipe_prod
```

```bash
# Usar em CI/CD
source .env.production
npx drizzle-kit migrate
```

### Aplicar Migration em Novo Ambiente

Ao configurar um novo ambiente (staging, produção nova, etc):

```bash
# 1. Configurar DATABASE_URL
export DATABASE_URL="postgresql://user:pass@new-host:5432/new_db"

# 2. Aplicar TODAS as migrations desde o início
npx drizzle-kit migrate

# 3. Verificar que todas as tabelas foram criadas
npx drizzle-kit studio
```

## Referência Rápida

| Comando | Descrição | Quando Usar |
|---------|-----------|-------------|
| `npx drizzle-kit generate` | Gera migration a partir das mudanças no schema | Após alterar `shared/schema.ts` |
| `npx drizzle-kit migrate` | Aplica migrations pendentes | Em dev após gerar, e em produção após deploy |
| `npx drizzle-kit studio` | Abre interface visual do banco | Para explorar dados e estrutura |
| `npx drizzle-kit push` | Sincroniza schema diretamente (⚠️ APENAS DEV) | Prototipagem rápida em desenvolvimento |

## Arquivos Importantes

- `drizzle.config.ts`: Configuração do Drizzle Kit
- `shared/schema.ts`: Definição do schema (fonte da verdade)
- `migrations/`: Pasta com arquivos SQL de migration
- `migrations/meta/`: Metadados das migrations (gerado automaticamente)

## Suporte

Em caso de dúvidas:
1. Consulte a [documentação oficial do Drizzle ORM](https://orm.drizzle.team/docs/migrations)
2. Revise este guia
3. Peça ajuda ao time antes de aplicar em produção
