# Monitoring Strategy for CRM SaaS

## Overview

This guide covers monitoring strategies for all components of the CRM SaaS:
- Application (Node.js + PM2)
- Database (Supabase PostgreSQL)
- Redis (BullMQ + Cache)
- Nginx (Reverse Proxy)
- System Resources (CPU, Memory, Disk)

## Built-in Monitoring

### PM2 Monitoring

```bash
# Interactive monitoring dashboard
pm2 monit

# View process status
pm2 status

# View logs
pm2 logs crm-backend

# View detailed info
pm2 show crm-backend
```

### PM2 Key Metrics

- **CPU Usage**: Percentage of CPU used by process
- **Memory Usage**: RAM consumption
- **Restart Count**: Number of process restarts
- **Uptime**: How long process has been running
- **Loop Delay**: Event loop delay (performance indicator)

### PM2 Log Monitoring

```bash
# Real-time log streaming
pm2 logs crm-backend --lines 100

# Error logs only
pm2 logs crm-backend --err

# With timestamps
pm2 logs crm-backend --timestamp

# Clear logs
pm2 flush
```

## System Monitoring

### CPU Monitoring

```bash
# Real-time CPU usage
top

# CPU stats
mpstat 1 5

# Per-core usage
mpstat -P ALL 1 5
```

### Memory Monitoring

```bash
# Memory usage
free -h

# Detailed memory info
vmstat -s

# Process memory usage
ps aux --sort=-%mem | head -10
```

### Disk Monitoring

```bash
# Disk usage
df -h

# Disk I/O
iostat -x 1 5

# Disk space by directory
du -sh /var/www/crm-backend/*
```

### Network Monitoring

```bash
# Network connections
netstat -tulpn

# Network statistics
iftop

# Bandwidth usage
nload
```

## Application Monitoring

### Health Check Endpoint

The CRM has a health check endpoint at `/health`:

```bash
# Check health
curl https://api.your-domain.com/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T12:00:00.000Z"}
```

### Custom Health Check Script

Create `/usr/local/bin/crm-health-check.sh`:
```bash
#!/bin/bash
# CRM health check script

HEALTH_URL="https://api.your-domain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✓ CRM is healthy"
    exit 0
else
    echo "✗ CRM is unhealthy (HTTP $RESPONSE)"
    # Send alert (email, Slack, etc.)
    exit 1
fi
```

Add to crontab for every 5 minutes:
```bash
crontab -e
# Add: */5 * * * * /usr/local/bin/crm-health-check.sh
```

## Database Monitoring (Supabase)

### Supabase Dashboard

Use Supabase dashboard for:
- Database size
- Connection count
- Query performance
- Replication lag (if using read replicas)

### Custom Database Monitoring

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Database Performance Queries

```sql
-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Long-running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

## Redis Monitoring

### Redis CLI Monitoring

```bash
# Check Redis status
redis-cli ping

# Get server info
redis-cli info

# Get memory info
redis-cli info memory

# Get stats
redis-cli info stats

# Get replication info
redis-cli info replication
```

### Key Metrics to Monitor

- **Memory Usage**: `used_memory_human`
- **Memory Fragmentation**: `mem_fragmentation_ratio`
- **Connected Clients**: `connected_clients`
- **Commands/sec**: `instantaneous_ops_per_sec`
- **Hit Rate**: `keyspace_hits / (keyspace_hits + keyspace_misses)`

### Redis Slow Log

```bash
# Check slow log
redis-cli slowlog get 10

# Configure slow log
redis-cli CONFIG SET slowlog-log-slower-than 10000
redis-cli CONFIG SET slowlog-max-len 128
```

### BullMQ Monitoring

BullMQ provides a web interface for monitoring queues:

```bash
# Install Bull Board
npm install @bull-board/express @bull-board/api

# Add to app.ts (optional for advanced monitoring)
```

## Nginx Monitoring

### Nginx Status Module

Enable status module in nginx config:

```nginx
server {
    listen 127.0.0.1:8080;
    server_name localhost;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

Check status:
```bash
curl http://localhost:8080/nginx_status
```

### Nginx Log Monitoring

```bash
# Real-time access log
tail -f /var/log/nginx/crm-backend-access.log

# Real-time error log
tail -f /var/log/nginx/crm-backend-error.log

# Count 4xx errors
grep " 4[0-9][0-9] " /var/log/nginx/crm-backend-access.log | wc -l

# Count 5xx errors
grep " 5[0-9][0-9] " /var/log/nginx/crm-backend-error.log | wc -l
```

### Nginx Performance Metrics

```bash
# Response time analysis
awk '{print $NF}' /var/log/nginx/crm-backend-access.log | sort -n | tail -10

# Top 10 slowest requests
awk '{print $NF, $7}' /var/log/nginx/crm-backend-access.log | sort -n -r | head -10

# Requests per minute
awk '{print $4}' /var/log/nginx/crm-backend-access.log | cut -d: -f2 | sort | uniq -c
```

## Log Aggregation

### Centralized Logging with Winston

The application uses Winston for logging. Logs are stored in:
- Application logs: `/var/www/crm-backend/logs/pm2-*.log`
- Nginx logs: `/var/log/nginx/crm-backend-*.log`

### Log Rotation

Install pm2-logrotate:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Nginx Log Rotation

Nginx automatically rotates logs via logrotate:
```bash
# Check logrotate config
cat /etc/logrotate.d/nginx
```

## Alerting

### Email Alerts

Create `/usr/local/bin/crm-alert.sh`:
```bash
#!/bin/bash
# CRM alerting script

CPU_THRESHOLD=80
MEM_THRESHOLD=80
DISK_THRESHOLD=90

# Check CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > $CPU_THRESHOLD" | bc -l) )); then
    echo "CPU usage is ${CPU_USAGE}%" | mail -s "CRM Alert: High CPU" admin@your-domain.com
fi

# Check Memory
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f"), $3/$2 * 100.0}')
if (( $(echo "$MEM_USAGE > $MEM_THRESHOLD" | bc -l) )); then
    echo "Memory usage is ${MEM_USAGE}%" | mail -s "CRM Alert: High Memory" admin@your-domain.com
fi

# Check Disk
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
if [ $DISK_USAGE -gt $DISK_THRESHOLD ]; then
    echo "Disk usage is ${DISK_USAGE}%" | mail -s "CRM Alert: High Disk Usage" admin@your-domain.com
fi
```

Add to crontab:
```bash
crontab -e
# Add: */10 * * * * /usr/local/bin/crm-alert.sh
```

### Slack Alerts (Optional)

Install Slack webhook:
```bash
npm install node-slack-webhook
```

Create alert script:
```bash
#!/bin/bash
# Slack alert script

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
MESSAGE="CRM Alert: $1"

curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"$MESSAGE\"}" \
    $WEBHOOK_URL
```

## External Monitoring Services

### Uptime Monitoring

Use services like:
- **UptimeRobot**: Free tier available
- **Pingdom**: Paid but comprehensive
- **StatusCake**: Free tier available

Monitor endpoints:
- `https://api.your-domain.com/health`
- `https://api.your-domain.com/api/v1/auth/me`
- `https://your-frontend-domain.vercel.app`

### APM (Application Performance Monitoring)

For advanced monitoring, consider:
- **New Relic**: Full APM solution
- **Datadog**: Comprehensive monitoring
- **Sentry**: Error tracking and performance

### Log Management

For centralized log management:
- **Logtail**: Simple log aggregation
- **Papertrail**: Log management
- **Loggly**: Cloud-based log analysis

## Monitoring Dashboard

### Simple Dashboard with PM2 Plus

```bash
# Install PM2 Plus
pm2 plus

# This provides web-based monitoring
```

### Custom Dashboard (Optional)

Create a simple monitoring page in the application to show:
- System stats (CPU, Memory, Disk)
- Application metrics (active users, messages sent)
- Database stats (connection count, query performance)
- Redis stats (memory usage, hit rate)

## Daily Monitoring Checklist

### Morning Check
- [ ] Check PM2 status: `pm2 status`
- [ ] Check application logs: `pm2 logs crm-backend --lines 50`
- [ ] Check health endpoint: `curl https://api.your-domain.com/health`
- [ ] Check system resources: `free -h`, `df -h`
- [ ] Check Redis: `redis-cli ping`

### Weekly Review
- [ ] Review error logs for patterns
- [ ] Check database size and growth
- [ ] Review Redis memory usage
- [ ] Check Nginx access logs for unusual traffic
- [ ] Review backup logs

### Monthly Review
- [ ] Analyze performance trends
- [ ] Review alert thresholds
- [ ] Check for security vulnerabilities
- [ ] Review and update monitoring setup
- [ ] Test backup and restore procedures

## Performance Baselines

### Expected Performance

- **API Response Time**: < 200ms (p95)
- **Health Check**: < 50ms
- **Socket.io Latency**: < 100ms
- **Database Query**: < 100ms (p95)
- **Redis Operation**: < 10ms (p95)

### Resource Usage Baselines

- **CPU Usage**: < 50% (normal), < 80% (peak)
- **Memory Usage**: < 2GB (2GB RAM server)
- **Disk Usage**: < 70%
- **Network**: < 100 Mbps
- **Redis Memory**: < 512MB

## Troubleshooting Common Issues

### High CPU Usage

```bash
# Check process using CPU
top

# Check Node.js process
pm2 monit

# Check for memory leaks
pm2 show crm-backend

# Restart if needed
pm2 restart crm-backend
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Check process memory
ps aux --sort=-%mem | head -10

# Check Redis memory
redis-cli info memory

# Restart application
pm2 restart crm-backend
```

### Database Connection Issues

```bash
# Check connection count
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"

# Restart application if needed
pm2 restart crm-backend
```

### Redis Issues

```bash
# Check Redis status
redis-cli ping

# Check memory usage
redis-cli info memory

# Check slow log
redis-cli slowlog get 10

# Restart Redis if needed
sudo systemctl restart redis-server
```

## Security Monitoring

### Monitor for Suspicious Activity

- Failed login attempts
- Unusual API usage patterns
- SQL injection attempts
- Rate limit violations
- Unauthorized access attempts

### Log Security Events

```bash
# Monitor failed auth attempts
grep "Unauthorized" /var/www/crm-backend/logs/pm2-error.log

# Monitor rate limit hits
grep "TOO_MANY_REQUESTS" /var/log/nginx/crm-backend-access.log

# Monitor suspicious SQL patterns
grep "DROP\|DELETE\|UPDATE" /var/log/nginx/crm-backend-access.log
```

## Monitoring Tools Summary

| Tool | Purpose | Cost |
|------|---------|------|
| PM2 | Process monitoring | Free |
| htop | System monitoring | Free |
| redis-cli | Redis monitoring | Free |
| Supabase Dashboard | Database monitoring | Free tier |
| UptimeRobot | Uptime monitoring | Free tier |
| New Relic | APM | Paid |
| Sentry | Error tracking | Free tier |
| Logtail | Log aggregation | Free tier |
