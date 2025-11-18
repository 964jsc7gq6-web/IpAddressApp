# Pasta de Migrations

Esta pasta contém os arquivos SQL de migration gerados automaticamente pelo Drizzle Kit.

## Estrutura

- **`0000_*.sql`**: Arquivos SQL com as mudanças do schema
- **`meta/`**: Metadados das migrations (usado internamente pelo Drizzle)
- **`.gitkeep`**: Mantém a pasta no Git mesmo quando vazia

## Importante

- ✅ **SEMPRE** versione os arquivos `.sql` no Git
- ❌ **NUNCA** edite migrations já aplicadas
- ❌ **NUNCA** delete arquivos de migration do histórico
- ✅ **SEMPRE** revise o SQL gerado antes de aplicar

## Como Usar

Consulte o arquivo `MIGRATIONS.md` na raiz do projeto para o guia completo.

### Comandos Rápidos

```bash
# Gerar nova migration após alterar shared/schema.ts
npx drizzle-kit generate

# Aplicar migrations pendentes
npx drizzle-kit migrate

# Ou use o script auxiliar
./migrations.sh generate
./migrations.sh migrate
```

## Migration Inicial

O arquivo `0000_*.sql` é a migration inicial que representa o estado atual do banco de dados com todas as tabelas criadas.
