#!/bin/bash

# Script auxiliar para gerenciar migrations do App Ipê
# Uso: ./migrations.sh [comando]
#
# Requer DATABASE_URL configurado no ambiente
# Para produção: export DATABASE_URL=postgresql://...
# Para desenvolvimento: usa a variável do Replit automaticamente

set -euo pipefail

# Validar que DATABASE_URL está configurado
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERRO: DATABASE_URL não está configurado"
  echo "Configure a variável de ambiente antes de executar:"
  echo "  export DATABASE_URL=postgresql://user:pass@host:port/dbname"
  exit 1
fi

# Mostrar ambiente atual (sem expor credenciais)
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's#.*@([^:/]+).*#\1#')
echo "Conectando ao banco em: $DB_HOST"
echo ""

case "$1" in
  generate)
    echo "Gerando migration a partir das mudancas no schema..."
    npx drizzle-kit generate
    echo ""
    echo "Migration gerada! Revise o arquivo SQL em migrations/"
    echo "IMPORTANTE: Verifique o SQL antes de aplicar em qualquer ambiente"
    ;;
  
  migrate)
    echo "ATENCAO: Esta operacao ira modificar o banco de dados"
    echo "Ambiente: $DB_HOST"
    echo ""
    read -p "Deseja continuar? (s/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
      echo "Aplicando migrations pendentes..."
      npx drizzle-kit migrate
      echo ""
      echo "Migrations aplicadas com sucesso!"
    else
      echo "Operacao cancelada."
      exit 0
    fi
    ;;
  
  studio)
    echo "Abrindo Drizzle Studio..."
    echo "Acesse: https://local.drizzle.studio"
    npx drizzle-kit studio
    ;;
  
  push)
    echo "ATENCAO: db:push sincroniza diretamente com o banco"
    echo "Use APENAS em DESENVOLVIMENTO. Para producao, use migrations."
    echo "Ambiente: $DB_HOST"
    echo ""
    read -p "Deseja continuar? (s/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
      npx drizzle-kit push
    else
      echo "Operacao cancelada."
      exit 0
    fi
    ;;
  
  *)
    echo "App Ipe - Gerenciador de Migrations"
    echo ""
    echo "Uso: ./migrations.sh [comando]"
    echo ""
    echo "Comandos disponiveis:"
    echo "  generate  - Gera uma migration a partir das mudancas no schema"
    echo "  migrate   - Aplica migrations pendentes ao banco de dados"
    echo "  studio    - Abre a interface visual do Drizzle Studio"
    echo "  push      - Sincroniza schema diretamente (ATENCAO: APENAS DEV)"
    echo ""
    echo "Exemplos:"
    echo "  ./migrations.sh generate"
    echo "  ./migrations.sh migrate"
    echo ""
    echo "Variaveis de ambiente necessarias:"
    echo "  DATABASE_URL - String de conexao PostgreSQL"
    echo ""
    echo "Para mais informacoes, consulte: MIGRATIONS.md"
    exit 1
    ;;
esac
