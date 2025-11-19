# Guia de Deploy em Produção - App Ipê

## Visão Geral

Este documento descreve como fazer deploy e atualizar a aplicação App Ipê em produção de forma segura e confiável.

## Pré-requisitos

### Servidor de Produção

- Node.js 20+ instalado
- PostgreSQL 14+ disponível
- pnpm instalado globalmente (`npm install -g pnpm`)
- Git configurado com acesso ao repositório
- Acesso SSH ao servidor

### Variáveis de Ambiente

O arquivo `.env` de produção deve conter:

```bash
# ======================
# BANCO DE DADOS
# ======================
# URL de conexão com PostgreSQL (OBRIGATÓRIO)
# Formato: postgresql://usuario:senha@host:porta/database
DATABASE_URL=postgresql://usuario:senha@host:porta/database

# ======================
# SEGURANÇA
# ======================
# Segredo para sessões (OBRIGATÓRIO, mínimo 32 caracteres)
# Gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=sua-chave-secreta-aqui-minimo-32-caracteres

# Segredo para tokens JWT (OBRIGATÓRIO, mínimo 32 caracteres)
# Gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=sua-chave-jwt-secreta-aqui-minimo-32-caracteres

# ======================
# SERVIDOR
# ======================
# Ambiente de execução (OBRIGATÓRIO)
NODE_ENV=production

# Porta do servidor (opcional, padrão: 5000)
PORT=5000

# Host de bind (opcional, padrão: 0.0.0.0)
HOST=0.0.0.0

# ======================
# ARMAZENAMENTO
# ======================
# Diretório para armazenar arquivos enviados (opcional, padrão: uploads)
UPLOADS_DIR=uploads
```

**⚠️ ATENÇÃO**: Em produção:
- `JWT_SECRET` é **obrigatório** - a aplicação não iniciará sem ele
- Use senhas fortes e únicas para `SESSION_SECRET` e `JWT_SECRET`
- Nunca compartilhe ou versione o arquivo `.env`
- Mantenha o `DATABASE_URL` seguro

## Configuração Inicial do Servidor

### 1. Preparar o Servidor

```bash
# Conectar ao servidor
ssh usuario@servidor-producao

# Criar diretório da aplicação
mkdir -p /var/www/app-ipe
cd /var/www/app-ipe

# Instalar pnpm (se ainda não estiver instalado)
npm install -g pnpm
```

### 2. Clonar o Repositório

```bash
# Clonar o código
git clone https://github.com/seu-usuario/app-ipe.git .

# Ou se já existe:
git pull origin main
```

### 3. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano .env
```

Cole o conteúdo das variáveis de ambiente (veja seção acima).

**IMPORTANTE**: 
- Use senhas fortes e únicas para SESSION_SECRET e JWT_SECRET
- Nunca compartilhe ou versione o arquivo .env
- Mantenha o DATABASE_URL seguro

### 4. Instalar Dependências

```bash
# Instalar todas as dependências
pnpm install --frozen-lockfile
```

O parâmetro `--frozen-lockfile` garante que as versões exatas serão instaladas.

### 5. Aplicar Migrations do Banco de Dados

```bash
# Carregar variáveis de ambiente do arquivo .env
set -a
source .env
set +a

# Aplicar todas as migrations
pnpm drizzle-kit migrate
```

Isso criará todas as tabelas necessárias no banco de dados.

**Nota:** O comando `set -a; source .env; set +a` carrega todas as variáveis do arquivo `.env` e as exporta para o ambiente, permitindo que o Drizzle acesse o `DATABASE_URL`.

### 6. Build da Aplicação

```bash
# Compilar frontend e backend
pnpm run build
```

Isso gera:
- Frontend compilado em `dist/public/`
- Backend compilado em `dist/`

### 7. Iniciar a Aplicação

```bash
# Iniciar em modo produção
pnpm start
```

A aplicação estará rodando em `http://localhost:5000`

## Processo de Atualização em Produção

Siga estes passos sempre que houver uma nova versão para deploy:

### Passo 1: Backup do Banco de Dados

**SEMPRE** faça backup antes de qualquer atualização:

```bash
# Criar backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

Guarde este arquivo em local seguro. Você pode restaurá-lo com:

```bash
# Restaurar backup (se necessário)
psql $DATABASE_URL < backup-20250115-143000.sql
```

### Passo 2: Parar a Aplicação

```bash
# Se estiver usando PM2
pm2 stop app-ipe

# Se estiver usando systemd
sudo systemctl stop app-ipe

# Se rodando manualmente (Ctrl+C no terminal)
```

### Passo 3: Atualizar o Código

```bash
# Ir para o diretório da aplicação
cd /var/www/app-ipe

# Obter última versão
git pull origin main
```

### Passo 4: Instalar Novas Dependências

```bash
# Atualizar dependências (se houver mudanças no package.json)
pnpm install --frozen-lockfile
```

### Passo 5: Aplicar Migrations do Banco

**SE** houver alterações no schema do banco:

```bash
# Aplicar migrations pendentes
pnpm drizzle-kit migrate
```

**IMPORTANTE**: 
- As migrations são incrementais e seguras
- Elas preservam os dados existentes
- Verifique os logs para confirmar sucesso

### Passo 6: Rebuild da Aplicação

```bash
# Compilar nova versão
pnpm run build
```

### Passo 7: Reiniciar a Aplicação

```bash
# Se estiver usando PM2
pm2 restart app-ipe

# Se estiver usando systemd
sudo systemctl restart app-ipe

# Se rodando manualmente
pnpm start
```

### Passo 8: Verificar a Aplicação

```bash
# Verificar logs
pm2 logs app-ipe

# Ou se usando systemd
sudo journalctl -u app-ipe -f

# Testar acesso
curl http://localhost:5000
```

Acesse a aplicação no navegador e verifique que está funcionando.

## Gerenciamento com PM2 (Recomendado)

PM2 mantém a aplicação rodando e reinicia automaticamente se houver erros.

### Configuração Inicial do PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Criar arquivo de configuração
nano ecosystem.config.js
```

Conteúdo do `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'app-ipe',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '.env',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
```

### Comandos do PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Parar aplicação
pm2 stop app-ipe

# Reiniciar aplicação
pm2 restart app-ipe

# Ver logs
pm2 logs app-ipe

# Ver status
pm2 status

# Configurar para iniciar com o sistema
pm2 startup
pm2 save
```

## Gerenciamento com Systemd

Alternativa ao PM2, usando systemd (Linux).

### Criar Service File

```bash
# Criar arquivo de serviço
sudo nano /etc/systemd/system/app-ipe.service
```

Conteúdo do arquivo:

```ini
[Unit]
Description=App Ipe - Real Estate Management
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/app-ipe
Environment=NODE_ENV=production
EnvironmentFile=/var/www/app-ipe/.env
ExecStart=/usr/bin/node /var/www/app-ipe/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=app-ipe

[Install]
WantedBy=multi-user.target
```

### Comandos do Systemd

```bash
# Recarregar configurações
sudo systemctl daemon-reload

# Iniciar serviço
sudo systemctl start app-ipe

# Parar serviço
sudo systemctl stop app-ipe

# Reiniciar serviço
sudo systemctl restart app-ipe

# Ver status
sudo systemctl status app-ipe

# Ver logs
sudo journalctl -u app-ipe -f

# Habilitar início automático
sudo systemctl enable app-ipe
```

## Configuração de Proxy Reverso (Nginx)

Para expor a aplicação na porta 80/443:

```nginx
# /etc/nginx/sites-available/app-ipe
server {
    listen 80;
    server_name seudominio.com.br;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/app-ipe /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar nginx
sudo systemctl reload nginx
```

## Checklist de Deploy

Use este checklist a cada deploy:

- [ ] Backup do banco de dados realizado
- [ ] Código atualizado via git pull
- [ ] Dependências atualizadas (pnpm install)
- [ ] Migrations aplicadas (pnpm drizzle-kit migrate)
- [ ] Build executado (pnpm run build)
- [ ] Aplicação reiniciada
- [ ] Logs verificados (sem erros)
- [ ] Acesso testado no navegador
- [ ] Funcionalidades principais testadas

## Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs app-ipe --lines 100

# Verificar se porta está em uso
lsof -i :5000

# Verificar variáveis de ambiente
cat .env

# Testar conexão com banco
psql $DATABASE_URL -c "SELECT 1"
```

### Erro de Migration

Se uma migration falhar:

1. Verifique os logs de erro
2. Restaure o backup se necessário
3. Corrija o problema no código
4. Crie uma nova migration para corrigir

### Aplicação lenta

```bash
# Ver uso de recursos
pm2 monit

# Verificar logs de erro
pm2 logs app-ipe --err

# Verificar conexões do banco
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity"
```

### Upload de arquivos falhando

```bash
# Verificar permissões da pasta uploads
ls -la uploads/
chmod 755 uploads/

# Verificar limite do nginx
# client_max_body_size em /etc/nginx/sites-available/app-ipe
```

## Segurança em Produção

### Boas Práticas

1. **Firewall**: Abra apenas as portas necessárias (80, 443, SSH)
2. **HTTPS**: Use Let's Encrypt para SSL/TLS
3. **Backups automáticos**: Configure backups diários do banco
4. **Monitoramento**: Configure alertas para erros
5. **Logs**: Rotacione logs para não encher o disco
6. **Atualizações**: Mantenha Node.js e PostgreSQL atualizados
7. **Senha forte**: Use senhas fortes em SESSION_SECRET e JWT_SECRET

### Configurar SSL com Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.com.br

# Renovação automática (já configurado pelo certbot)
sudo certbot renew --dry-run
```

## Script de Deploy Automatizado

Crie um script `deploy.sh` para automatizar o processo:

```bash
#!/bin/bash
set -euo pipefail

echo "=== Deploy App Ipe ==="

# Configurações
APP_DIR="/var/www/app-ipe"
BACKUP_DIR="/var/backups/app-ipe"
DATE=$(date +%Y%m%d-%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# 1. Backup do banco
echo "1. Criando backup do banco..."
pg_dump $DATABASE_URL > $BACKUP_DIR/backup-$DATE.sql

# 2. Parar aplicação
echo "2. Parando aplicação..."
pm2 stop app-ipe || true

# 3. Atualizar código
echo "3. Atualizando código..."
cd $APP_DIR
git pull origin main

# 4. Instalar dependências
echo "4. Instalando dependências..."
pnpm install --frozen-lockfile

# 5. Aplicar migrations
echo "5. Aplicando migrations..."
pnpm drizzle-kit migrate

# 6. Build
echo "6. Compilando aplicação..."
pnpm run build

# 7. Reiniciar
echo "7. Reiniciando aplicação..."
pm2 restart app-ipe

# 8. Verificar
echo "8. Verificando status..."
sleep 3
pm2 status app-ipe

echo "=== Deploy concluído com sucesso! ==="
echo "Backup salvo em: $BACKUP_DIR/backup-$DATE.sql"
```

Tornar executável e usar:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Monitoramento

### Configurar Alertas

Use ferramentas como:
- **UptimeRobot**: Monitorar disponibilidade
- **Sentry**: Capturar erros em tempo real
- **PM2 Plus**: Monitoramento avançado do PM2

### Logs

```bash
# Ver logs em tempo real
pm2 logs app-ipe --lines 100

# Buscar por erros
pm2 logs app-ipe --err | grep "ERROR"

# Configurar rotação de logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Resumo do Fluxo de Deploy

1. **Backup** do banco de dados
2. **Parar** a aplicação
3. **Atualizar** código (git pull)
4. **Instalar** dependências (pnpm install)
5. **Migrar** banco (pnpm drizzle-kit migrate)
6. **Compilar** (pnpm run build)
7. **Reiniciar** aplicação
8. **Verificar** funcionamento

**IMPORTANTE**: Nunca pule o backup do banco de dados!

## Suporte

Em caso de dúvidas:
1. Consulte este guia
2. Revise `MIGRATIONS.md` para questões de banco de dados
3. Verifique os logs da aplicação
4. Consulte a documentação do PM2 ou systemd
