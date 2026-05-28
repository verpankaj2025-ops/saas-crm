# Production Deployment Checklist

## Pre-Deployment

### Infrastructure
- [ ] Purchase VPS (Ubuntu 22.04 LTS, 2GB RAM minimum)
- [ ] Purchase domain name
- [ ] Configure DNS A record to VPS IP
- [ ] Create Supabase project
- [ ] Note Supabase credentials (URL, service role key, database URL)
- [ ] Generate JWT secrets (32+ characters each)
- [ ] Decide on WhatsApp Business API usage
- [ ] Decide on OpenAI API usage

### Security
- [ ] Generate secure JWT access secret
- [ ] Generate secure JWT refresh secret
- [ ] Generate Redis password (optional but recommended)
- [ ] Configure SSH key access to VPS
- [ ] Disable password authentication on VPS
- [ ] Configure firewall (UFW) rules
- [ ] Plan SSL certificate (Let's Encrypt)

## Server Setup

### Initial Configuration
- [ ] Update system: `sudo apt update && sudo apt upgrade -y`
- [ ] Install Node.js 22.x
- [ ] Install Redis server
- [ ] Install Nginx
- [ ] Install PM2 globally
- [ ] Install Git
- [ ] Create deploy user
- [ ] Configure system limits
- [ ] Set timezone to UTC
- [ ] Configure swap (if low RAM)

### Security Hardening
- [ ] Configure UFW firewall
- [ ] Install Fail2Ban (optional)
- [ ] Disable root SSH login
- [ ] Configure SSH key-only access
- [ ] Install automatic security updates

### Application Setup
- [ ] Create `/var/www/crm-backend` directory
- [ ] Upload backend code to VPS
- [ ] Install dependencies: `npm install --production`
- [ ] Build TypeScript: `npm run build`
- [ ] Create logs directory
- [ ] Copy `.env.production.example` to `.env`
- [ ] Configure environment variables in `.env`

### Database Setup
- [ ] Run all database migrations in order
- [ ] Verify database schema
- [ ] Test database connection
- [ ] Configure Supabase RLS policies (if needed)

### Redis Setup
- [ ] Configure Redis for production
- [ ] Set memory limit (512MB recommended)
- [ ] Configure persistence (RDB snapshots)
- [ ] Set eviction policy (allkeys-lru)
- [ ] Enable slow log
- [ ] Test Redis connection

### Nginx Setup
- [ ] Copy nginx.conf to `/etc/nginx/sites-available/crm-backend`
- [ ] Update domain name in nginx config
- [ ] Enable site: `sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/`
- [ ] Test nginx config: `sudo nginx -t`
- [ ] Reload nginx: `sudo systemctl reload nginx`

### SSL Setup
- [ ] Install Certbot: `sudo apt install -y certbot python3-certbot-nginx`
- [ ] Obtain SSL certificate: `sudo certbot --nginx -d api.your-domain.com`
- [ ] Verify SSL certificate
- [ ] Test HTTPS access
- [ ] Verify auto-renewal is configured

### PM2 Setup
- [ ] Start application: `npm run pm2:start`
- [ ] Verify PM2 status: `pm2 status`
- [ ] Save PM2 configuration: `pm2 save`
- [ ] Setup PM2 startup script: `pm2 startup`
- [ ] Verify startup on reboot

## Frontend Deployment

### Vercel Setup
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variable: `NEXT_PUBLIC_BACKEND_URL`
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.next`
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Configure custom domain (optional)

### Frontend Verification
- [ ] Test frontend loads in browser
- [ ] Test API connectivity
- [ ] Test Socket.io connection
- [ ] Test authentication flow
- [ ] Test mobile responsiveness

## Application Verification

### Backend Health
- [ ] Check health endpoint: `curl https://api.your-domain.com/health`
- [ ] Check PM2 status: `pm2 status`
- [ ] Check application logs: `pm2 logs crm-backend --lines 50`
- [ ] Check Redis connection: `redis-cli ping`
- [ ] Check database connection

### Functionality Testing
- [ ] Test user registration
- [ ] Test user login
- [ ] Test token refresh
- [ ] Test contact creation
- [ ] Test conversation creation
- [ ] Test message sending
- [ ] Test Socket.io real-time updates
- [ ] Test template usage
- [ ] Test follow-up creation
- [ ] Test AI suggestions (if configured)

### WhatsApp Integration (Optional)
- [ ] Configure WhatsApp webhook URL in Meta
- [ ] Set verify token
- [ ] Test webhook verification
- [ ] Subscribe to message events
- [ ] Test inbound message processing
- [ ] Test outbound message delivery

## Monitoring Setup

### Application Monitoring
- [ ] Configure PM2 log rotation
- [ ] Set up health check cron job
- [ ] Configure log aggregation (optional)
- [ ] Set up uptime monitoring (UptimeRobot, etc.)
- [ ] Configure error tracking (Sentry, optional)

### System Monitoring
- [ ] Install monitoring tools (htop, iotop)
- [ ] Configure resource alerting
- [ ] Set up disk space monitoring
- [ ] Configure backup verification

## Backup Setup

### Database Backups
- [ ] Configure Supabase automatic backups
- [ ] Set up manual backup script
- [ ] Configure backup retention policy
- [ ] Test backup restoration
- [ ] Set up offsite backup (optional)

### Redis Backups
- [ ] Configure RDB snapshot frequency
- [ ] Set up backup script
- [ ] Configure backup retention
- [ ] Test backup restoration

### Application Backups
- [ ] Backup application code
- [ ] Backup configuration files
- [ ] Backup PM2 configuration
- [ ] Backup Nginx configuration

## Final Verification

### Security Check
- [ ] Verify SSL certificate is valid
- [ ] Verify CORS origins are correct
- [ ] Verify rate limiting is active
- [ ] Verify JWT secrets are secure
- [ ] Verify database credentials are secure
- [ ] Verify Redis authentication (if configured)
- [ ] Verify firewall rules are correct

### Performance Check
- [ ] Test API response times
- [ ] Test Socket.io latency
- [ ] Check memory usage
- [ ] Check CPU usage
- [ ] Check disk space
- [ ] Check database query performance

### Documentation
- [ ] Document all credentials securely
- [ ] Document backup procedures
- [ ] Document monitoring setup
- [ ] Document recovery procedures
- [ ] Document contact information

## Post-Deployment

### Monitoring
- [ ] Monitor application logs for 24 hours
- [ ] Monitor error rates
- [ ] Monitor resource usage
- [ ] Monitor backup completion
- [ ] Monitor uptime

### User Acceptance Testing
- [ ] Test all user flows
- [ ] Test mobile devices
- [ ] Test different browsers
- [ ] Test with multiple users
- [ ] Gather feedback

### Optimization
- [ ] Review performance metrics
- [ ] Optimize slow queries
- [ ] Adjust rate limits if needed
- [ ] Scale resources if needed

## Rollback Plan

### Rollback Procedures
- [ ] Document rollback steps
- [ ] Test rollback procedures
- [ ] Keep previous deployment backup
- [ ] Document rollback triggers

### Rollback Triggers
- [ ] Critical errors
- > 50% error rate
- [ ] Security breach
- [ ] Data corruption
- [ ] Performance degradation beyond acceptable limits

## Sign-off

### Deployment Approval
- [ ] Technical lead approval
- [ ] Security review approval
- [ ] Stakeholder approval
- [ ] Deployment date scheduled
- [ ] Communication sent to users

### Launch
- [ ] Execute deployment
- [ ] Verify all systems operational
- [ ] Send launch notification
- [ ] Monitor for 24 hours
- [ ] Document any issues
- [ ] Create post-launch report
