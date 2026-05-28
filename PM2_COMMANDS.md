# PM2 Commands Reference for CRM Backend

## Basic Commands

### Start Application
```bash
# Start using ecosystem config
pm2 start ecosystem.config.js

# Or using npm script
npm run pm2:start

# Start with specific environment
pm2 start ecosystem.config.js --env production
```

### Stop Application
```bash
# Stop using ecosystem config
pm2 stop ecosystem.config.js

# Or using npm script
npm run pm2:stop

# Stop specific app
pm2 stop crm-backend
```

### Restart Application
```bash
# Restart using ecosystem config
pm2 restart ecosystem.config.js

# Or using npm script
npm run pm2:restart

# Restart specific app
pm2 restart crm-backend

# Restart with zero-downtime (reload)
pm2 reload crm-backend
```

### Delete Application
```bash
# Stop and remove from PM2 list
pm2 delete crm-backend

# Delete all
pm2 delete all
```

## Monitoring

### View Status
```bash
# List all processes
pm2 status

# Or
pm2 list
```

### View Logs
```bash
# View logs for specific app
pm2 logs crm-backend

# Or using npm script
npm run pm2:logs

# View logs for all apps
pm2 logs

# View last 100 lines
pm2 logs crm-backend --lines 100

# View logs with timestamps
pm2 logs crm-backend --timestamp

# Clear logs
pm2 flush
```

### Live Monitoring
```bash
# Interactive monitoring dashboard
pm2 monit

# Or using npm script
npm run pm2:monit
```

### View Process Info
```bash
# Show detailed information
pm2 show crm-backend

# Show process info in JSON
pm2 show crm-backend --json
```

## Process Management

### Reload (Zero-Downtime)
```bash
# Graceful reload (for cluster mode)
pm2 reload crm-backend

# Reload with specific environment
pm2 reload crm-backend --env production
```

### Reset Metrics
```bash
# Reset restart count and metrics
pm2 reset crm-backend
```

### Update Application
```bash
# Pull latest code and restart
cd /var/www/crm-backend
git pull
npm install
npm run build
pm2 restart crm-backend
```

## Startup and Persistence

### Save Process List
```bash
# Save current process list
pm2 save

# This saves the process list to ~/.pm2/dump.pm2
```

### Startup Script
```bash
# Generate startup script
pm2 startup

# Follow the output to enable startup on boot
# Example output:
# [PM2] Init System found: systemd
# [PM2] To setup the Startup Script, copy/paste the following command:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

### Disable Startup
```bash
# Disable startup script
pm2 unstartup systemd
```

## Log Management

### Log Rotation
```bash
# Install pm2-logrotate
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Log File Locations
```
Application logs: /var/www/crm-backend/logs/
- pm2-error.log
- pm2-out.log

PM2 logs: ~/.pm2/logs/
- crm-backend-error.log
- crm-backend-out.log
```

## Cluster Mode

The CRM backend is configured in cluster mode with 1 instance. To scale:

```bash
# Scale to 2 instances
pm2 scale crm-backend 2

# Scale to 4 instances (recommended for production)
pm2 scale crm-backend 4

# Scale down to 1 instance
pm2 scale crm-backend 1
```

## Environment Variables

### Update Environment
```bash
# Edit ecosystem.config.js to update environment variables
nano ecosystem.config.js

# Restart to apply changes
pm2 restart crm-backend
```

### View Environment
```bash
# Show environment variables for process
pm2 show crm-backend | grep env
```

## Troubleshooting

### Application Not Starting
```bash
# Check logs
pm2 logs crm-backend --lines 50

# Check error details
pm2 show crm-backend

# Check if port is in use
sudo lsof -i :4000
```

### High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart to free memory
pm2 restart crm-backend

# PM2 will auto-restart if memory exceeds max_memory_restart (1G)
```

### Frequent Restarts
```bash
# Check restart count
pm2 show crm-backend

# Check logs for errors
pm2 logs crm-backend --err --lines 100

# Check system resources
free -h
df -h
```

## Advanced Commands

### Dump Process List
```bash
# Export process list to file
pm2 dump

# This saves to ~/.pm2/dump.pm2
```

### Resurrect from Dump
```bash
# Restore processes from dump file
pm2 resurrect
```

### Send Signals
```bash
# Send SIGTERM (graceful shutdown)
pm2 send crm-backend sigterm

# Send SIGUSR2 (for cluster reload)
pm2 send crm-backend sigusr2
```

### Custom Metrics
```bash
# List all metrics
pm2 show crm-backend

# Monitor specific metric
pm2 monit
```

## Common Workflows

### Deploy New Version
```bash
cd /var/www/crm-backend
git pull
npm install
npm run build
pm2 reload crm-backend
pm2 logs crm-backend --lines 20
```

### Emergency Rollback
```bash
cd /var/www/crm-backend
git checkout previous-commit
npm install
npm run build
pm2 restart crm-backend
```

### Clear All and Restart
```bash
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### Backup PM2 Configuration
```bash
# Backup ecosystem config
cp ecosystem.config.js ecosystem.config.backup

# Backup dump file
cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.backup
```

## Best Practices

1. **Always use `pm2 reload` for zero-downtime updates** (cluster mode)
2. **Save process list after starting**: `pm2 save`
3. **Monitor logs regularly**: `pm2 logs`
4. **Set up log rotation**: `pm2 install pm2-logrotate`
5. **Use startup script for auto-restart on boot**
6. **Monitor memory usage**: `pm2 monit`
7. **Keep ecosystem config in version control**
8. **Test changes in staging before production**
