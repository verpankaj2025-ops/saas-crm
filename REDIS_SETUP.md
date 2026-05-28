# Redis Setup Guide for CRM SaaS

## Installation

### Ubuntu/Debian
```bash
# Install Redis
sudo apt update
sudo apt install -y redis-server

# Enable and start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify installation
redis-cli ping  # Should return PONG
```

### From Source (Latest Version)
```bash
# Install build dependencies
sudo apt install -y build-essential tcl

# Download and compile Redis
cd /tmp
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
make test
sudo make install

# Create Redis user and directories
sudo useradd -rs /bin/false redis
sudo mkdir /etc/redis /var/lib/redis
sudo cp src/redis-server /usr/local/bin/
sudo cp src/redis-cli /usr/local/bin/

# Set permissions
sudo chown redis:redis /var/lib/redis
sudo chmod 770 /var/lib/redis
```

## Configuration

### Production Configuration

Edit Redis configuration file:
```bash
sudo nano /etc/redis/redis.conf
```

### Recommended Settings

```conf
# Network
bind 127.0.0.1 ::1              # Only bind to localhost
port 6379
protected-mode yes             # Enable protected mode
tcp-backlog 511

# General
daemonize yes                   # Run as daemon
supervised systemd              # Use systemd supervision
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log

# Memory Management
maxmemory 512mb                # Set memory limit (adjust based on RAM)
maxmemory-policy allkeys-lru    # Eviction policy

# Persistence
save 900 1                     # Save after 900 sec if 1 key changed
save 300 10                    # Save after 300 sec if 10 keys changed
save 60 10000                  # Save after 60 sec if 10000 keys changed
stop-writes-on-bgsave-error yes

# Security
# requirepass your-redis-password    # Uncomment and set password (optional)
# rename-command FLUSHDB ""          # Disable dangerous commands (optional)
# rename-command FLUSHALL ""          # Disable dangerous commands (optional)

# Slow Log
slowlog-log-slower-than 10000    # Log commands slower than 10ms
slowlog-max-len 128              # Keep 128 slow log entries
```

### Apply Configuration
```bash
# Restart Redis
sudo systemctl restart redis-server

# Or if running from source
sudo systemctl restart redis
```

## Authentication (Optional but Recommended)

### Set Password
```bash
# Edit config
sudo nano /etc/redis/redis.conf

# Uncomment and set password
requirepass your-secure-password-here

# Restart Redis
sudo systemctl restart redis-server
```

### Connect with Password
```bash
# Using redis-cli
redis-cli -a your-secure-password-here

# Or using environment variable
export REDIS_PASSWORD=your-secure-password-here
redis-cli -a $REDIS_PASSWORD
```

### Update Application Config
```bash
# Update .env file
nano .env

# Update REDIS_URL
REDIS_URL=redis://:your-secure-password-here@localhost:6379
```

## Monitoring

### Check Redis Status
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Check Redis version
redis-cli --version

# Ping Redis
redis-cli ping

# Get server info
redis-cli info

# Get memory usage
redis-cli info memory

# Get statistics
redis-cli info stats
```

### Monitor in Real-time
```bash
# Monitor all commands
redis-cli monitor

# Monitor slow log
redis-cli slowlog get 10
```

### Check Connections
```bash
# Number of connected clients
redis-cli client list | wc -l

# Client details
redis-cli client list
```

## Performance Tuning

### Memory Optimization
```bash
# Check memory usage
redis-cli info memory | grep used_memory_human

# Check memory fragmentation
redis-cli info memory | grep mem_fragmentation_ratio

# If fragmentation > 1.5, consider:
redis-cli MEMORY DOCTOR
```

### Connection Limits
```conf
# In redis.conf
maxclients 10000               # Max concurrent connections
timeout 300                    # Close idle connections after 5 min
tcp-keepalive 300              # TCP keepalive
```

### Persistence Options

#### RDB (Snapshot)
```conf
save 900 1
save 300 10
save 60 10000
```

#### AOF (Append Only File) - More Durable
```conf
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec            # Sync every second (recommended)
no-appendfsync-on-rewrite no   # Enable AOF during rewrite
```

## Backup and Restore

### Backup RDB File
```bash
# Find RDB file location
redis-cli config get dir

# Copy RDB file
sudo cp /var/lib/redis/dump.rdb /var/backups/redis/dump_$(date +%Y%m%d_%H%M%S).rdb
```

### Manual Backup
```bash
# Trigger save
redis-cli BGSAVE

# Wait for save to complete
redis-cli LASTSAVE

# Copy file
sudo cp /var/lib/redis/dump.rdb /backup/location/
```

### Restore from Backup
```bash
# Stop Redis
sudo systemctl stop redis-server

# Copy backup file
sudo cp /backup/location/dump.rdb /var/lib/redis/dump.rdb

# Set permissions
sudo chown redis:redis /var/lib/redis/dump.rdb
sudo chmod 660 /var/lib/redis/dump.rdb

# Start Redis
sudo systemctl start redis-server
```

## Security Hardening

### Disable Dangerous Commands
```conf
# In redis.conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command DEBUG ""
```

### Network Security
```conf
# Only bind to localhost
bind 127.0.0.1

# Or bind to specific IP with firewall
bind 10.0.0.1
```

### Firewall Rules
```bash
# Allow only localhost
sudo ufw allow from 127.0.0.1 to any port 6379

# Or allow from specific IP
sudo ufw allow from 10.0.0.1 to any port 6379
```

## Troubleshooting

### Redis Won't Start
```bash
# Check logs
sudo journalctl -u redis-server -n 50

# Check config syntax
redis-server --test-memory

# Check if port is in use
sudo lsof -i :6379
```

### Out of Memory
```bash
# Check memory usage
redis-cli info memory

# Clear all data (CAUTION: deletes everything)
redis-cli FLUSHALL

# Or set maxmemory policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Connection Refused
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Check if listening on correct port
sudo netstat -tulpn | grep 6379

# Check firewall
sudo ufw status
```

### Slow Performance
```bash
# Check slow log
redis-cli slowlog get 10

# Check CPU usage
top -p $(pgrep redis-server)

# Check disk I/O
iostat -x 1
```

## Maintenance

### Daily Tasks
```bash
# Check Redis status
redis-cli ping

# Check memory usage
redis-cli info memory | grep used_memory_human

# Check slow log
redis-cli slowlog get 5
```

### Weekly Tasks
```bash
# Backup RDB file
sudo cp /var/lib/redis/dump.rdb /var/backups/redis/

# Check fragmentation
redis-cli info memory | grep mem_fragmentation_ratio

# If > 1.5, consider:
redis-cli BGREWRITEAOF
```

### Monthly Tasks
```bash
# Review slow log
redis-cli slowlog get 100

# Check connection patterns
redis-cli info stats

# Update Redis if security patches available
sudo apt update && sudo apt upgrade redis-server
```

## Integration with CRM

### Environment Variable
```bash
# In backend .env file
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:password@localhost:6379

# With remote Redis
REDIS_URL=redis://:password@remote-host:6379
```

### BullMQ Configuration
The CRM uses BullMQ for job queues. Redis must be running:
```bash
# Verify Redis is accessible
redis-cli ping

# Check BullMQ queues (requires BullMQ board or custom script)
# Queues: email, broadcast, automation, ai, whatsapp-outbound, followup-reminder, appointment-reminder
```

### Cache Keys
The CRM uses Redis for caching:
```bash
# View all keys
redis-cli KEYS "*"

# View workspace cache
redis-cli KEYS "workspace:*"

# View user cache
redis-cli KEYS "user:*"

# Clear specific cache
redis-cli DEL "workspace:abc123"
```

## Scaling Considerations

### When to Scale Redis
- Memory usage consistently > 80%
- High CPU usage
- Slow response times
- Connection limits reached

### Scaling Options
1. **Increase RAM** - Simple, first option
2. **Redis Cluster** - For > 10GB data
3. **Separate Redis Instance** - Offload from app server
4. **Managed Redis** - AWS ElastiCache, Redis Labs

### Monitoring Alerts
Set up alerts for:
- Memory usage > 80%
- CPU usage > 80%
- Connection count > 1000
- Slow log entries > 10/min
