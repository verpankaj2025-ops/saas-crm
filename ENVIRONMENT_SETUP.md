# Environment Setup Guide

## Quick Start

This guide helps you set up all required environments for the CRM SaaS production deployment.

## Prerequisites

### Required Accounts
- Supabase account (free tier available)
- VPS provider (DigitalOcean, Linode, AWS Lightsail, etc.)
- Domain name registrar (Namecheap, GoDaddy, etc.)
- Vercel account (free tier available)
- WhatsApp Business account (optional)
- OpenAI account (optional for AI suggestions)

### Required Tools
- SSH client
- Git
- Node.js 22.x (local for development)
- Text editor (VS Code, etc.)

## Step 1: Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose organization
5. Set project name: `crm-production`
6. Set database password (save securely)
7. Choose region (closest to your VPS)
8. Click "Create new project"

### Get Credentials
1. Navigate to Project Settings
2. Copy **Project URL** → Save as `SUPABASE_URL`
3. Copy **anon public key** → Not needed (using service role)
4. Copy **service_role key** → Save as `SUPABASE_SERVICE_ROLE_KEY`
5. Navigate to Database
6. Copy **Connection string** → Save as `DATABASE_URL`

### Run Migrations
```bash
# From backend directory
cd backend/database/migrations

# Run migrations in order
psql $DATABASE_URL -f 000_initial_schema.sql
psql $DATABASE_URL -f 001_contacts.sql
psql $DATABASE_URL -f 002_conversations.sql
psql $DATABASE_URL -f 003_messages.sql
psql $DATABASE_URL -f 004_followups.sql
psql $DATABASE_URL -f 005_templates.sql
psql $DATABASE_URL -f 006_automation.sql
psql $DATABASE_URL -f 007_ai_memory.sql
psql $DATABASE_URL -f 008_appointment_reminders.sql
psql $DATABASE_URL -f 009_crm_memory.sql
psql $DATABASE_URL -f 010_crm_memory.sql
```

### Configure RLS (Optional)
1. Navigate to Database → Authentication
2. Enable Row Level Security
3. Add policies for workspace isolation
4. Test policies with different user roles

## Step 2: VPS Setup

### Purchase VPS
Recommended providers:
- DigitalOcean: $5/month (2GB RAM, 1 vCPU)
- Linode: $5/month (2GB RAM, 1 vCPU)
- AWS Lightsail: $5/month (2GB RAM, 1 vCPU)

Choose:
- OS: Ubuntu 22.04 LTS
- Plan: 2GB RAM minimum, 4GB recommended
- Region: Same as Supabase region

### Access VPS
```bash
# SSH into VPS
ssh root@your-vps-ip

# Or use SSH key
ssh -i /path/to/key root@your-vps-ip
```

### Initial Setup
Follow the complete guide in `UBUNTU_SETUP.md`

Quick commands:
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

# Install PM2
sudo npm install -g pm2
```

## Step 3: Domain Setup

### Purchase Domain
- Use Namecheap, GoDaddy, or similar
- Purchase domain name (e.g., `your-crm.com`)

### Configure DNS
1. Go to domain registrar DNS settings
2. Add A record:
   - Type: A
   - Name: `api` (or `@` for root)
   - Value: Your VPS IP address
   - TTL: 300 (5 minutes)

### Verify DNS
```bash
# Check DNS propagation
dig api.your-domain.com

# Or use online tool: https://dnschecker.org
```

## Step 4: Generate Secrets

### JWT Secrets
```bash
# Generate access secret (32+ characters)
openssl rand -base64 32

# Generate refresh secret (32+ characters)
openssl rand -base64 32
```

Save these as:
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### Redis Password (Optional)
```bash
# Generate Redis password
openssl rand -base64 32
```

Save as: `REDIS_PASSWORD`

## Step 5: Backend Environment Setup

### Deploy Backend Code
```bash
# On VPS
cd /var/www
sudo mkdir crm-backend
sudo chown $USER:$USER crm-backend
cd crm-backend

# Upload files (git clone or scp)
git clone your-repo .
# Or: scp -r /local/path/* user@vps:/var/www/crm-backend/

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Create logs directory
mkdir -p logs
```

### Configure Environment
```bash
# Copy template
cp .env.production.example .env

# Edit environment file
nano .env
```

Set these values:
```env
NODE_ENV=production
PORT=4000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

JWT_ACCESS_SECRET=your-generated-access-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

REDIS_URL=redis://localhost:6379
# Or with password: redis://:password@localhost:6379

CORS_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com

# Optional
WHATSAPP_API_URL=https://graph.facebook.com/v19.0
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-webhook-verify-token
WHATSAPP_APP_SECRET=your-app-secret

OPENAI_API_KEY=your-openai-api-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Test Backend
```bash
# Start application
npm start

# Test health endpoint
curl http://localhost:4000/health

# Stop application (Ctrl+C)
```

## Step 6: Nginx Configuration

### Copy Configuration
```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/crm-backend

# Edit domain
sudo nano /etc/nginx/sites-available/crm-backend
# Change api.your-domain.com to your actual domain

# Test configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/

# Reload nginx
sudo systemctl reload nginx
```

## Step 7: SSL Setup

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain Certificate
```bash
sudo certbot --nginx -d api.your-domain.com
```

Follow prompts:
- Enter email for renewal notices
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

### Verify SSL
```bash
# Test HTTPS
curl https://api.your-domain.com/health

# Check certificate
sudo certbot certificates
```

### Auto-renewal is configured automatically

## Step 8: PM2 Setup

### Start Application
```bash
# Start with PM2
npm run pm2:start

# Check status
pm2 status

# View logs
pm2 logs crm-backend
```

### Configure Startup
```bash
# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup

# Follow the command output to enable startup on boot
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

## Step 9: Frontend Environment Setup

### Vercel Setup
1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Environment Variables
Add in Vercel project settings:
- `NEXT_PUBLIC_BACKEND_URL`: `https://api.your-domain.com`

### Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Vercel will provide a URL (e.g., `your-project.vercel.app`)
4. Test the deployment

### Custom Domain (Optional)
1. In Vercel project settings
2. Add custom domain
3. Configure DNS CNAME record
4. Wait for SSL certificate
5. Test custom domain

## Step 10: WhatsApp Setup (Optional)

### Meta Business Setup
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create app
3. Add WhatsApp product
4. Get WhatsApp API credentials

### Configure Webhook
1. In Meta dashboard, configure webhook:
   - Webhook URL: `https://api.your-domain.com/webhooks/whatsapp`
   - Verify Token: Use `WHATSAPP_VERIFY_TOKEN` from .env
2. Click "Verify"
3. Subscribe to events: `messages`, `message_status`

### Test Webhook
```bash
# Test verification
curl "https://api.your-domain.com/webhooks/whatsapp?hub.verify_token=YOUR_TOKEN&hub.challenge=123"
```

## Step 11: OpenAI Setup (Optional)

### OpenAI Account
1. Go to [openai.com](https://openai.com)
2. Sign up or log in
3. Navigate to API keys
4. Create new API key
5. Save as `OPENAI_API_KEY`

### Configure in Backend
```bash
# Edit .env
nano .env

# Add
OPENAI_API_KEY=your-openai-api-key
```

### Restart Backend
```bash
pm2 restart crm-backend
```

## Step 12: Verification

### Backend Verification
```bash
# Check health
curl https://api.your-domain.com/health

# Check PM2 status
pm2 status

# Check logs
pm2 logs crm-backend --lines 20

# Check Redis
redis-cli ping

# Check database
psql $DATABASE_URL -c "SELECT 1;"
```

### Frontend Verification
1. Open frontend URL in browser
2. Test login flow
3. Test dashboard
4. Test inbox
5. Test Socket.io connection (check network tab)

### Integration Testing
1. Create a test user
2. Create a test contact
3. Send a test message
4. Verify real-time updates
5. Test template usage
6. Test follow-up creation

## Step 13: Monitoring Setup

### PM2 Monitoring
```bash
# Install PM2 Plus (optional)
pm2 plus

# Or use built-in monitoring
pm2 monit
```

### Log Rotation
```bash
# Install pm2-logrotate
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Health Check Script
Create `/usr/local/bin/crm-health-check.sh`:
```bash
#!/bin/bash
HEALTH_URL="https://api.your-domain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✓ CRM is healthy"
    exit 0
else
    echo "✗ CRM is unhealthy (HTTP $RESPONSE)"
    exit 1
fi
```

Add to crontab:
```bash
crontab -e
# Add: */5 * * * * /usr/local/bin/crm-health-check.sh
```

## Step 14: Backup Setup

### Database Backup
Configure in Supabase dashboard or use script from `BACKUP_STRATEGY.md`

### Redis Backup
Set up automated backup script from `BACKUP_STRATEGY.md`

### Application Backup
Set up code and configuration backup from `BACKUP_STRATEGY.md`

## Environment Variables Summary

### Backend (.env)
- `NODE_ENV` - production
- `PORT` - 4000
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Generated secret (32+ chars)
- `JWT_REFRESH_SECRET` - Generated secret (32+ chars)
- `REDIS_URL` - Redis connection string
- `CORS_ORIGINS` - Frontend URLs (comma-separated)
- `WHATSAPP_*` - Optional WhatsApp credentials
- `OPENAI_API_KEY` - Optional OpenAI key

### Frontend (Vercel)
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs crm-backend --lines 50

# Check environment variables
cat .env

# Check Node.js version
node --version

# Check Redis
redis-cli ping
```

### Nginx 502 Error
```bash
# Check if backend is running
pm2 status

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Frontend Can't Connect to Backend
```bash
# Check CORS origins
cat .env | grep CORS_ORIGINS

# Check backend is accessible
curl https://api.your-domain.com/health

# Check Vercel env var
# In Vercel dashboard → Settings → Environment Variables
```

### Socket.io Connection Issues
- Check WebSocket proxy in nginx config
- Verify CORS origins match
- Check JWT token is valid
- Check backend logs for Socket.io errors

## Next Steps

After environment setup:
1. Run full deployment checklist (DEPLOYMENT_CHECKLIST.md)
2. Perform user acceptance testing
3. Set up monitoring alerts
4. Configure automated backups
5. Launch to production
