# CRM SaaS Production Deployment Guide

## Architecture Overview

```
┌─────────────────┐
│   Vercel (Frontend)   │
│   Next.js 16.2.6      │
└────────┬────────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Nginx (Reverse Proxy) │
│   SSL Termination      │
└────────┬────────────┘
         │ localhost:4000
         ▼
┌─────────────────┐
│   PM2 (Process Manager) │
│   Node.js Backend       │
└────────┬────────────┘
         │
         ├─► Supabase (PostgreSQL)
         ├─► Redis (BullMQ + Cache)
         └─► Socket.io (Realtime)
```

## Prerequisites

- Ubuntu 22.04 LTS VPS (2GB RAM minimum, 4GB recommended)
- Node.js 22.x
- Redis server
- Nginx
- SSL certificate (Let's Encrypt recommended)
- Supabase project
- WhatsApp Business API (optional)
- OpenAI API key (optional for AI suggestions)

## Backend Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Deploy Backend Code

```bash
# Clone repository (or upload files)
cd /var/www
sudo mkdir crm-backend
sudo chown $USER:$USER crm-backend
cd crm-backend

# Upload backend files (git clone or scp)
# git clone your-repo .

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Create logs directory
mkdir -p logs
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.production.example .env

# Edit with your values
nano .env
```

Required environment variables:
- `NODE_ENV=production`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET` (generate with: openssl rand -base64 32)
- `JWT_REFRESH_SECRET` (generate with: openssl rand -base64 32)
- `REDIS_URL` (redis://localhost:6379 for local Redis)
- `CORS_ORIGINS` (your Vercel frontend URL)

Optional:
- WhatsApp API credentials
- OpenAI API key

### 4. Configure Nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/crm-backend

# Update domain name
sudo nano /etc/nginx/sites-available/crm-backend
# Change api.your-domain.com to your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.your-domain.com

# Auto-renewal is configured automatically
```

### 6. Start with PM2

```bash
# Start application
npm run pm2:start

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the command output to enable startup on boot
```

### 7. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
npm run pm2:logs

# Check health endpoint
curl https://api.your-domain.com/health
```

## Frontend Deployment (Vercel)

### 1. Configure Environment Variables

In Vercel dashboard, add:
- `NEXT_PUBLIC_BACKEND_URL=https://api.your-domain.com`

### 2. Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd ../frontend
vercel --prod
```

Or connect GitHub repository to Vercel for automatic deployments.

## Database Setup

### Run Migrations

```bash
# From backend directory
cd /var/www/crm-backend

# Run all migrations in order
psql $DATABASE_URL -f database/migrations/000_initial_schema.sql
psql $DATABASE_URL -f database/migrations/001_contacts.sql
psql $DATABASE_URL -f database/migrations/002_conversations.sql
psql $DATABASE_URL -f database/migrations/003_messages.sql
psql $DATABASE_URL -f database/migrations/004_followups.sql
psql $DATABASE_URL -f database/migrations/005_templates.sql
psql $DATABASE_URL -f database/migrations/006_automation.sql
psql $DATABASE_URL -f database/migrations/007_ai_memory.sql
psql $DATABASE_URL -f database/migrations/008_appointment_reminders.sql
psql $DATABASE_URL -f database/migrations/009_crm_memory.sql
psql $DATABASE_URL -f database/migrations/010_crm_memory.sql
```

## WhatsApp Webhook Configuration

1. In Meta Business Suite, configure webhook:
   - Webhook URL: `https://api.your-domain.com/webhooks/whatsapp`
   - Verify Token: Use `WHATSAPP_VERIFY_TOKEN` from .env
   - Subscribe to: `messages`, `message_status`

2. Test webhook verification via GET request

## Monitoring & Maintenance

### PM2 Commands

```bash
pm2 status              # View process status
pm2 logs crm-backend    # View logs
pm2 restart crm-backend # Restart application
pm2 stop crm-backend    # Stop application
pm2 monit               # Live monitoring
```

### Log Files

- Application logs: `/var/www/crm-backend/logs/pm2-*.log`
- Nginx access logs: `/var/log/nginx/crm-backend-access.log`
- Nginx error logs: `/var/log/nginx/crm-backend-error.log`

### Redis Monitoring

```bash
redis-cli ping          # Check Redis is running
redis-cli info          # Get Redis stats
redis-cli monitor       # Monitor Redis commands
```

### Database Backups

Configure automated backups in Supabase dashboard or use pg_dump:

```bash
pg_dump $DATABASE_URL > backup.sql
```

## Troubleshooting

### Application won't start

```bash
# Check Node.js version
node --version  # Should be 22.x

# Check Redis connection
redis-cli ping

# Check environment variables
cat .env

# Check PM2 logs
pm2 logs crm-backend --lines 100
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Socket.io connection issues

- Ensure nginx WebSocket proxy is configured
- Check CORS origins match frontend URL
- Verify JWT token is valid

### WhatsApp webhook not working

- Verify webhook URL is publicly accessible
- Check verify token matches
- Ensure SSL certificate is valid (Meta requires HTTPS)

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Use strong database passwords
- [ ] Enable Redis authentication
- [ ] Configure firewall (ufw)
- [ ] Enable automatic security updates
- [ ] Regularly update dependencies
- [ ] Monitor logs for suspicious activity
- [ ] Backup database regularly

## Scaling Considerations

Current setup supports:
- ~100 concurrent users on 2GB RAM
- ~1000 messages/day
- ~100 follow-ups/day

To scale:
- Increase VPS RAM/CPU
- Add Redis clustering
- Use load balancer with multiple backend instances
- Consider separate Redis instance
