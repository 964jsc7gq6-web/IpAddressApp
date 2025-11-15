# Guia de Deploy - App Ipê na AWS

Este guia fornece instruções completas para fazer deploy do App Ipê (sistema de gestão imobiliária) em uma instância AWS EC2.

## Sumário

- [Arquitetura de Deploy](#arquitetura-de-deploy)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Banco de Dados (Neon PostgreSQL)](#configuração-do-banco-de-dados-neon-postgresql)
- [Configuração da Instância EC2](#configuração-da-instância-ec2)
- [Deploy da Aplicação](#deploy-da-aplicação)
- [Configuração do Nginx](#configuração-do-nginx)
- [Configuração SSL/HTTPS](#configuração-sslhttps)
- [Manutenção e Atualizações](#manutenção-e-atualizações)
- [Troubleshooting](#troubleshooting)

---

## Arquitetura de Deploy

```
Internet
    ↓
AWS Route 53 (DNS - opcional)
    ↓
EC2 Security Group
    ↓
Nginx Reverse Proxy (:80/:443)
    ↓
PM2 Process Manager
    ↓
Node.js/Express Backend (:5000)
    ↓ SSL/TLS
Neon PostgreSQL (Serverless)
```

---

## Pré-requisitos

### Conta AWS
- Conta AWS ativa
- Acesso ao console AWS
- Par de chaves SSH criado (arquivo `.pem`)

### Banco de Dados
- Conta Neon (https://neon.tech) - Tier gratuito disponível
- Database PostgreSQL criado
- Connection string com pooling habilitado

### Domínio (Opcional)
- Domínio registrado para SSL/HTTPS
- Acesso ao painel de DNS do domínio

---

## Configuração do Banco de Dados (Neon PostgreSQL)

### 1. Criar Projeto no Neon

1. Acesse https://console.neon.tech
2. Clique em **New Project**
3. Configure:
   - **Project Name**: `app-ipe-production`
   - **Region**: Escolha a região mais próxima da sua EC2 (ex: `us-east-2` para Ohio)
   - **PostgreSQL Version**: 16 (recomendado)

### 2. Obter Connection String

1. No dashboard do projeto, clique em **Connect**
2. Ative **Connection pooling** (toggle ON)
3. Copie a connection string que contém `-pooler`:

```bash
postgresql://usuario:senha@ep-xxxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. Executar Migrations

Do seu ambiente local, configure a variável de ambiente e execute:

```bash
export DATABASE_URL="postgresql://usuario:senha@ep-xxxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
npm run db:push
```

---

## Configuração da Instância EC2

### 1. Lançar Instância EC2

1. Acesse o **AWS Console** → **EC2 Dashboard**
2. Clique em **Launch Instance**
3. Configure:

| Parâmetro | Valor |
|-----------|-------|
| **Name** | `app-ipe-production` |
| **AMI** | Ubuntu Server 22.04 LTS |
| **Instance Type** | `t2.small` (2GB RAM recomendado) ou `t3.small` |
| **Storage** | 20 GB GP3 SSD |
| **Key Pair** | Selecione ou crie um novo |

### 2. Configurar Security Group

Crie um Security Group com as seguintes regras de entrada:

| Type | Protocol | Port | Source | Descrição |
|------|----------|------|--------|-----------|
| SSH | TCP | 22 | Seu IP | Acesso SSH |
| HTTP | TCP | 80 | 0.0.0.0/0 | Tráfego web HTTP |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Tráfego web HTTPS |

**Importante**: Configure o SSH apenas para seu IP por segurança.

### 3. Conectar à Instância

```bash
# Ajustar permissões da chave
chmod 400 sua-chave.pem

# Conectar via SSH
ssh -i sua-chave.pem ubuntu@<IP-PUBLICO-EC2>
```

### 4. Atualizar Sistema e Instalar Dependências

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar utilitários essenciais
sudo apt install -y git curl wget build-essential
```

### 5. Instalar Node.js via NVM

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Carregar NVM
source ~/.bashrc

# Instalar Node.js LTS
nvm install --lts

# Verificar instalação
node -v   # Deve mostrar v20.x ou superior
npm -v
```

### 6. Instalar PM2 (Process Manager)

```bash
npm install -g pm2

# Configurar PM2 para iniciar automaticamente
pm2 startup
# Execute o comando que o PM2 sugerir
```

---

## Deploy da Aplicação

### 1. Clonar Repositório

```bash
# Navegar para o diretório home
cd ~

# Clonar o repositório
git clone https://github.com/seu-usuario/app-ipe.git
cd app-ipe
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
nano .env
```

Adicione as seguintes variáveis:

```bash
# Ambiente
NODE_ENV=production

# Database (Neon PostgreSQL com pooling)
DATABASE_URL=postgresql://usuario:senha@ep-xxxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Configurações do Banco de Dados
PGHOST=ep-xxxxx-pooler.us-east-2.aws.neon.tech
PGDATABASE=neondb
PGUSER=usuario
PGPASSWORD=senha
PGPORT=5432

# Session Secret (gere uma string aleatória forte)
SESSION_SECRET=sua-chave-secreta-super-segura-aqui-min-32-caracteres

# Servidor
PORT=5000
HOST=0.0.0.0
```

**Importante**: Gere um `SESSION_SECRET` forte:

```bash
# Gerar secret aleatório
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ajuste as permissões do arquivo:

```bash
chmod 600 .env
```

### 3. Instalar Dependências e Build

```bash
# Instalar dependências
npm install --production

# Build do frontend (Vite)
npm run build

# Verificar se o build foi criado
ls -la dist/
```

### 4. Iniciar com PM2

```bash
# Iniciar a aplicação
pm2 start npm --name "app-ipe" -- start

# Verificar status
pm2 status

# Ver logs
pm2 logs app-ipe

# Salvar configuração do PM2
pm2 save
```

### 5. Testar a Aplicação

```bash
# Testar localmente na EC2
curl http://localhost:5000

# Testar do seu navegador (temporariamente)
# http://<IP-PUBLICO-EC2>:5000
```

---

## Configuração do Nginx

### 1. Instalar Nginx

```bash
sudo apt install nginx -y

# Iniciar e habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### 2. Configurar Nginx como Reverse Proxy

Crie um arquivo de configuração:

```bash
sudo nano /etc/nginx/sites-available/app-ipe
```

Adicione a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Logs
    access_log /var/log/nginx/app-ipe-access.log;
    error_log /var/log/nginx/app-ipe-error.log;

    # Tamanho máximo de upload (para arquivos)
    client_max_body_size 10M;

    # Proxy para o backend
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # Headers importantes
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Se usar apenas IP (sem domínio)**, substitua a linha `server_name`:

```nginx
server_name <SEU-IP-PUBLICO-EC2>;
```

### 3. Ativar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/app-ipe /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 4. Testar

Acesse no navegador:
- `http://<IP-PUBLICO-EC2>` ou
- `http://seu-dominio.com`

---

## Configuração SSL/HTTPS

### 1. Apontar Domínio para EC2

No painel de DNS do seu domínio, crie um registro **A**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | <IP-PUBLICO-EC2> | 3600 |
| A | www | <IP-PUBLICO-EC2> | 3600 |

Aguarde a propagação DNS (pode levar até 24h, geralmente 5-30 minutos).

### 2. Instalar Certbot (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 3. Obter Certificado SSL

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

Siga as instruções:
1. Digite seu email
2. Aceite os termos de serviço
3. Escolha se deseja compartilhar email (opcional)
4. Certbot configurará automaticamente o Nginx para HTTPS

### 4. Configurar Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Certificados serão renovados automaticamente via cron
```

### 5. Verificar HTTPS

Acesse: `https://seu-dominio.com`

O certificado deve estar ativo e o navegador deve mostrar o cadeado de segurança.

---

## Manutenção e Atualizações

### Atualizar a Aplicação

```bash
# Conectar via SSH
ssh -i sua-chave.pem ubuntu@<IP-PUBLICO-EC2>

# Navegar para o diretório
cd ~/app-ipe

# Fazer backup do .env (se necessário)
cp .env .env.backup

# Atualizar código
git pull origin main

# Instalar novas dependências
npm install --production

# Rebuild do frontend
npm run build

# Executar migrations (se houver)
npm run db:push

# Reiniciar aplicação
pm2 restart app-ipe

# Verificar logs
pm2 logs app-ipe --lines 50
```

### Script de Deploy Automatizado

Crie um arquivo `deploy.sh` no servidor:

```bash
nano ~/deploy.sh
```

Adicione:

```bash
#!/bin/bash
set -e

echo "🚀 Iniciando deploy do App Ipê..."

cd ~/app-ipe

echo "📥 Baixando atualizações..."
git pull origin main

echo "📦 Instalando dependências..."
npm install --production

echo "🏗️  Building frontend..."
npm run build

echo "🔄 Reiniciando aplicação..."
pm2 restart app-ipe

echo "✅ Deploy concluído!"
echo "📊 Status da aplicação:"
pm2 status

echo "📋 Últimos logs:"
pm2 logs app-ipe --lines 20 --nostream
```

Tornar executável:

```bash
chmod +x ~/deploy.sh
```

Para atualizar, basta executar:

```bash
./deploy.sh
```

### Monitoramento

```bash
# Status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs app-ipe

# Monitoramento detalhado
pm2 monit

# Uso de recursos
pm2 show app-ipe

# Verificar uso de memória/CPU da EC2
htop  # ou: top
```

### Backup do Banco de Dados

O Neon PostgreSQL faz backups automáticos, mas você pode fazer backups manuais:

```bash
# Instalar cliente PostgreSQL
sudo apt install postgresql-client -y

# Fazer backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restaurar backup (se necessário)
psql $DATABASE_URL < backup-20250115.sql
```

---

## Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs do PM2
pm2 logs app-ipe

# Verificar se a porta 5000 está em uso
sudo lsof -i :5000

# Reiniciar completamente
pm2 delete app-ipe
pm2 start npm --name "app-ipe" -- start
```

### Erro de conexão com banco de dados

```bash
# Testar conexão com Neon
psql "$DATABASE_URL" -c "SELECT NOW();"

# Verificar variáveis de ambiente
cat .env | grep DATABASE_URL

# Verificar se SSL está habilitado na connection string
# Deve ter: ?sslmode=require
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar se a aplicação está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar se o proxy_pass está correto
sudo nginx -t
```

### Erro de upload de arquivos

```bash
# Aumentar limite no Nginx
sudo nano /etc/nginx/sites-available/app-ipe

# Adicionar/modificar:
client_max_body_size 20M;

# Recarregar Nginx
sudo systemctl reload nginx
```

### SSL não funciona

```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Verificar configuração HTTPS do Nginx
sudo nano /etc/nginx/sites-available/app-ipe
```

### Alta utilização de memória

```bash
# Verificar uso de recursos
htop

# Configurar PM2 para reiniciar se memória ultrapassar limite
pm2 restart app-ipe --max-memory-restart 500M

# Salvar configuração
pm2 save
```

---

## Checklist de Segurança

- [ ] Security Group permite SSH apenas do seu IP
- [ ] Arquivo `.env` tem permissões restritas (`chmod 600`)
- [ ] SESSION_SECRET é forte e único
- [ ] HTTPS/SSL configurado (Let's Encrypt)
- [ ] Firewall UFW ativado (opcional):
  ```bash
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw enable
  ```
- [ ] Backups automáticos do banco de dados configurados
- [ ] PM2 configurado para reiniciar automaticamente
- [ ] Logs sendo monitorados regularmente
- [ ] Senha do usuário ubuntu alterada (opcional)

---

## Recursos Adicionais

### Documentação Oficial
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Neon PostgreSQL Docs](https://neon.tech/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

### Custos Estimados (AWS)

| Recurso | Configuração | Custo Mensal (USD) |
|---------|-------------|-------------------|
| EC2 t2.small | 2GB RAM, 1 vCPU | ~$17 |
| EC2 t3.small | 2GB RAM, 2 vCPU | ~$15 |
| Storage (20GB) | GP3 SSD | ~$2 |
| Elastic IP | IP público fixo | Grátis (se anexado) |
| Neon PostgreSQL | Tier gratuito | $0 (até 500MB) |
| **TOTAL** | | **~$17-19/mês** |

**Dica**: Use Reserved Instances para economizar até 72% se comprometer por 1-3 anos.

---

## Suporte

Para problemas específicos do App Ipê:
- Verifique os logs: `pm2 logs app-ipe`
- Consulte a documentação do projeto
- Revise as configurações do `.env`

Para problemas da infraestrutura AWS:
- [AWS Support](https://console.aws.amazon.com/support/)
- [AWS Forums](https://forums.aws.amazon.com/)

---

**Última atualização**: 2025
**Versão do App Ipê**: 1.0.0
