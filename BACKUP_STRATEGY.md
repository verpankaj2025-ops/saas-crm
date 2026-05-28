# Backup Strategy for CRM SaaS

## Overview

This guide covers backup strategies for all components of the CRM SaaS:
- Supabase Database (PostgreSQL)
- Redis (BullMQ + Cache)
- Application Files
- Configuration Files

## Database Backups (Supabase)

### Supabase Built-in Backups

Supabase provides automated backups:
- **Point-in-time Recovery**: 7 days (free tier), up to 30 days (pro tier)
- **Daily Backups**: Automatic, stored for 30 days
- **Physical Backups**: Weekly, stored for 4 weeks

### Manual Database Backups

```bash
# Backup using pg_dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific tables
pg_dump $DATABASE_URL -t contacts -t conversations -t messages > selective_backup.sql

# Backup schema only
pg_dump $DATABASE_URL --schema-only > schema_backup.sql

# Backup data only
pg_dump $DATABASE_URL --data-only > data_backup.sql
```

### Restore from Backup

```bash
# Restore from SQL file
psql $DATABASE_URL < backup_20240101_120000.sql

# Restore from compressed backup
gunzip < backup_20240101_120000.sql.gz | psql $DATABASE_URL

# Restore specific tables
psql $DATABASE_URL < selective_backup.sql
```

### Backup Script

Create `/var/backups/crm/backup-database.sh`:
```bash
#!/bin/bash
# Database backup script for CRM SaaS

BACKUP_DIR="/var/backups/crm/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Remove old backups (older than RETENTION_DAYS)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log backup
echo "Database backup completed: backup_$DATE.sql.gz" >> /var/log/crm-backup.log
```

Make executable:
```bash
chmod +x /var/backups/crm/backup-database.sh
```

Add to crontab for daily backups:
```bash
crontab -e
# Add: 0 2 * * * /var/backups/crm/backup-database.sh
```

## Redis Backups

### RDB Snapshots

Redis automatically saves RDB snapshots based on configuration:
```conf
save 900 1
save 300 10
save 60 10000
```

### Manual Redis Backup

```bash
# Trigger manual save
redis-cli BGSAVE

# Wait for save to complete
redis-cli LASTSAVE

# Copy RDB file
sudo cp /var/lib/redis/dump.rdb /var/backups/redis/dump_$(date +%Y%m%d_%H%M%S).rdb
```

### Redis Backup Script

Create `/var/backups/crm/backup-redis.sh`:
```bash
#!/bin/bash
# Redis backup script for CRM SaaS

BACKUP_DIR="/var/backups/crm/redis"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Trigger save and wait
redis-cli BGSAVE
sleep 5

# Copy RDB file
sudo cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb

# Set permissions
sudo chown $USER:$USER $BACKUP_DIR/dump_$DATE.rdb
chmod 640 $BACKUP_DIR/dump_$DATE.rmb

# Remove old backups
find $BACKUP_DIR -name "dump_*.rdb" -mtime +$RETENTION_DAYS -delete

# Log backup
echo "Redis backup completed: dump_$DATE.rdb" >> /var/log/crm-backup.log
```

Add to crontab:
```bash
crontab -e
# Add: 0 */6 * * * /var/backups/crm/backup-redis.sh
```

## Application File Backups

### Backup Application Code

```bash
# Create application backup
cd /var/www
tar -czf /var/backups/crm/crm-backend_$(date +%Y%m%d_%H%M%S).tar.gz crm-backend

# Backup specific directories
tar -czf /var/backups/crm/crm-backend-config_$(date +%Y%m%d_%H%M%S).tar.gz \
  crm-backend/.env \
  crm-backend/ecosystem.config.js \
  crm-backend/nginx.conf
```

### Backup Script

Create `/var/backups/crm/backup-app.sh`:
```bash
#!/bin/bash
# Application backup script for CRM SaaS

BACKUP_DIR="/var/backups/crm/app"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=14

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application code
tar -czf $BACKUP_DIR/crm-backend_$DATE.tar.gz /var/www/crm-backend

# Backup configuration
tar -czf $BACKUP_DIR/crm-config_$DATE.tar.gz \
  /var/www/crm-backend/.env \
  /var/www/crm-backend/ecosystem.config.js \
  /etc/nginx/sites-available/crm-backend

# Remove old backups
find $BACKUP_DIR -name "crm-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Log backup
echo "Application backup completed: crm-backend_$DATE.tar.gz" >> /var/log/crm-backup.log
```

Add to crontab:
```bash
crontab -e
# Add: 0 3 * * * /var/backups/crm/backup-app.sh
```

## Nginx Configuration Backups

```bash
# Backup Nginx config
sudo cp /etc/nginx/sites-available/crm-backend /var/backups/crm/nginx/crm-backend_$(date +%Y%m%d_%H%M%S)

# Backup entire Nginx config
sudo tar -czf /var/backups/crm/nginx-full_$(date +%Y%m%d_%H%M%S).tar.gz /etc/nginx
```

## PM2 Configuration Backups

```bash
# Save PM2 process list
pm2 save

# Backup PM2 dump
cp ~/.pm2/dump.pm2 /var/backups/crm/pm2/dump_$(date +%Y%m%d_%H%M%S).pm2

# Backup ecosystem config
cp /var/www/crm-backend/ecosystem.config.js /var/backups/crm/pm2/ecosystem_$(date +%Y%m%d_%H%M%S).js
```

## Offsite Backup Strategy

### Backup to Cloud Storage

#### AWS S3
```bash
# Install AWS CLI
sudo apt install -y awscli

# Configure AWS credentials
aws configure

# Upload backups to S3
aws s3 sync /var/backups/crm s3://your-bucket/crm-backups
```

#### Google Cloud Storage
```bash
# Install gsutil
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Upload backups
gsutil -m rsync -r /var/backups/crm gs://your-bucket/crm-backups
```

#### Backblaze B2
```bash
# Install B2 CLI
pip install b2

# Authorize account
b2 authorize-account

# Upload backups
b2 sync /var/backups/crm b2://your-bucket/crm-backups
```

### Automated Offsite Backup Script

Create `/var/backups/crm/backup-offsite.sh`:
```bash
#!/bin/bash
# Offsite backup script for CRM SaaS

LOCAL_DIR="/var/backups/crm"
REMOTE_BUCKET="s3://your-bucket/crm-backups"
DATE=$(date +%Y%m%d)

# Sync to S3
aws s3 sync $LOCAL_DIR $REMOTE_BUCKET --delete --exclude "*.tmp"

# Log
echo "Offsite backup completed: $DATE" >> /var/log/crm-backup.log
```

Add to crontab:
```bash
crontab -e
# Add: 0 4 * * * /var/backups/crm/backup-offsite.sh
```

## Backup Schedule

### Recommended Schedule

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Database | Daily (2 AM) | 30 days | Local + Offsite |
| Redis | Every 6 hours | 7 days | Local |
| Application | Daily (3 AM) | 14 days | Local + Offsite |
| Nginx Config | Weekly | 4 weeks | Local |
| PM2 Config | On change | 4 weeks | Local |

### Cron Job Summary

```bash
# Database backup - daily at 2 AM
0 2 * * * /var/backups/crm/backup-database.sh

# Redis backup - every 6 hours
0 */6 * * * /var/backups/crm/backup-redis.sh

# Application backup - daily at 3 AM
0 3 * * * /var/backups/crm/backup-app.sh

# Offsite backup - daily at 4 AM
0 4 * * * /var/backups/crm/backup-offsite.sh
```

## Restore Procedures

### Database Restore
```bash
# Stop application
pm2 stop crm-backend

# Restore database
gunzip < /var/backups/crm/database/backup_20240101_120000.sql.gz | psql $DATABASE_URL

# Start application
pm2 start crm-backend
```

### Redis Restore
```bash
# Stop Redis
sudo systemctl stop redis-server

# Restore RDB file
sudo cp /var/backups/redis/dump_20240101_120000.rdb /var/lib/redis/dump.rdb

# Start Redis
sudo systemctl start redis-server
```

### Application Restore
```bash
# Stop application
pm2 stop crm-backend

# Restore application
cd /var/www
rm -rf crm-backend
tar -xzf /var/backups/crm/app/crm-backend_20240101_120000.tar.gz

# Restore configuration
tar -xzf /var/backups/crm/app/crm-config_20240101_120000.tar.gz -C /

# Start application
cd crm-backend
npm install
npm run build
pm2 start ecosystem.config.js
```

## Disaster Recovery

### Complete System Recovery

1. **Provision new VPS** with same specifications
2. **Install dependencies** (follow UBUNTU_SETUP.md)
3. **Restore application files**
4. **Restore configuration**
5. **Restore Redis**
6. **Restore database**
7. **Configure DNS** to point to new server
8. **Verify SSL certificate**
9. **Test all functionality**

### Recovery Time Objective (RTO)

- **Database restore**: 15-30 minutes
- **Redis restore**: 5-10 minutes
- **Application restore**: 10-20 minutes
- **Total RTO**: 30-60 minutes

### Recovery Point Objective (RPO)

- **Database**: 24 hours (daily backup)
- **Redis**: 6 hours (every 6 hours)
- **Application**: 24 hours (daily backup)

## Testing Backups

### Monthly Backup Test

```bash
# Test database restore
createdb test_restore
pg_dump $DATABASE_URL | psql test_restore
dropdb test_restore

# Test Redis restore
redis-cli BGSAVE
sudo cp /var/lib/redis/dump.rdb /tmp/test_dump.rdb
# Verify file is valid

# Test application backup
tar -tzf /var/backups/crm/app/crm-backend_latest.tar.gz | head -20
```

### Backup Verification Script

Create `/var/backups/crm/verify-backups.sh`:
```bash
#!/bin/bash
# Verify backup integrity

echo "=== Backup Verification ===" >> /var/log/crm-backup.log
echo "Date: $(date)" >> /var/log/crm-backup.log

# Check latest database backup
LATEST_DB=$(ls -t /var/backups/crm/database/*.sql.gz | head -1)
if [ -f "$LATEST_DB" ]; then
    echo "✓ Database backup exists: $LATEST_DB" >> /var/log/crm-backup.log
else
    echo "✗ Database backup missing!" >> /var/log/crm-backup.log
fi

# Check latest Redis backup
LATEST_REDIS=$(ls -t /var/backups/crm/redis/*.rdb | head -1)
if [ -f "$LATEST_REDIS" ]; then
    echo "✓ Redis backup exists: $LATEST_REDIS" >> /var/log/crm-backup.log
else
    echo "✗ Redis backup missing!" >> /var/log/crm-backup.log
fi

# Check latest application backup
LATEST_APP=$(ls -t /var/backups/crm/app/*.tar.gz | head -1)
if [ -f "$LATEST_APP" ]; then
    echo "✓ Application backup exists: $LATEST_APP" >> /var/log/crm-backup.log
else
    echo "✗ Application backup missing!" >> /var/log/crm-backup.log
fi

echo "=== End Verification ===" >> /var/log/crm-backup.log
```

Add to crontab:
```bash
crontab -e
# Add: 0 6 * * 0 /var/backups/crm/verify-backups.sh
```

## Best Practices

1. **3-2-1 Rule**: 3 copies, 2 different media, 1 offsite
2. **Encrypt backups** for sensitive data
3. **Test restores monthly**
4. **Monitor backup logs** for failures
5. **Document restore procedures**
6. **Keep backups secure** (proper permissions)
7. **Version control configuration** files
8. **Automate backup verification**
