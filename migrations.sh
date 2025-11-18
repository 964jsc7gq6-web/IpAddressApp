#!/bin/bash

# Script auxiliar para gerenciar migrations do App Ipê
# Uso: ./migrations.sh [comando]

set -e

case "$1" in
  generate)
    echo "🔄 Gerando migration a partir das mudanças no schema..."
    npx drizzle-kit generate
    echo "✅ Migration gerada! Revise o arquivo SQL em migrations/"
    ;;
  
  migrate)
    echo "🚀 Aplicando migrations pendentes..."
    npx drizzle-kit migrate
    echo "✅ Migrations aplicadas com sucesso!"
    ;;
  
  studio)
    echo "🎨 Abrindo Drizzle Studio..."
    echo "Acesse: https://local.drizzle.studio"
    npx drizzle-kit studio
    ;;
  
  push)
    echo "⚠️  ATENÇÃO: db:push sincroniza diretamente com o banco"
    echo "   Use apenas em DESENVOLVIMENTO. Para produção, use migrations."
    read -p "Deseja continuar? (s/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
      npx drizzle-kit push
    else
      echo "Operação cancelada."
    fi
    ;;
  
  *)
    echo "App Ipê - Gerenciador de Migrations"
    echo ""
    echo "Uso: ./migrations.sh [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  generate  - Gera uma migration a partir das mudanças no schema"
    echo "  migrate   - Aplica migrations pendentes ao banco de dados"
    echo "  studio    - Abre a interface visual do Drizzle Studio"
    echo "  push      - Sincroniza schema diretamente (⚠️ APENAS DEV)"
    echo ""
    echo "Exemplos:"
    echo "  ./migrations.sh generate"
    echo "  ./migrations.sh migrate"
    echo ""
    echo "Para mais informações, consulte: MIGRATIONS.md"
    exit 1
    ;;
esac
