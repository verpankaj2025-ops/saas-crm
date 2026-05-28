# Ubuntu Server Setup Guide for CRM SaaS

## Initial Server Setup

### 1. System Update

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Remove unnecessary packages
sudo apt autoremove -y
```

### 2. Create Deploy User

```bash
# Create new user for deployment
sudo adduser deploy

# Add to sudo group
sudo usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

### 3. Configure SSH

```bash
# Create SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your SSH public key
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Disable password authentication (optional but recommended)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 4. Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### 5. Install Node.js 22.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v22.x.x
npm --version   # Should be 10.x.x
```

### 6. Install Redis Server

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf

# Recommended settings:
# bind 127.0.0.1 ::1  # Only bind to localhost
# supervised systemd   # Enable systemd supervision
# maxmemory 512mb      # Set memory limit
# maxmemory-policy allkeys-lru  # Eviction policy

# Enable and start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping  # Should return PONG
```

### 7. Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### 8. Install PM2 Globally

```bash
# Install PM2
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 9. Install Git (for deployment)

```bash
# Install Git
sudo apt install -y git

# Configure Git (optional)
git config --global user.name "Deploy User"
git config --global user.email "deploy@your-domain.com"
```

### 10. Configure System Limits

```bash
# Edit limits.conf
sudo nano /etc/security/limits.conf

# Add these lines:
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536

# Edit sysctl.conf
sudo nano /etc/sysctl.conf

# Add these lines:
fs.file-max = 2097152
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# Apply changes
sudo sysctl -p
```

### 11. Configure Swap (if low RAM)

```bash
# Check if swap exists
free -h

# Create 2GB swap file (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Adjust swappiness (optional)
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### 12. Set Timezone

```bash
# Set timezone
sudo timedatectl set-timezone UTC

# Or interactive
sudo dpkg-reconfigure tzdata
```

### 13. Configure Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades

# Edit configuration
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Recommended settings:
# Unattended-Upgrade::AutoFixInterruptedDpkg "true";
# Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
# Unattended-Upgrade::Remove-Unused-Dependencies "true";
# Unattended-Upgrade::Automatic-Reboot "false";
```

## Directory Structure

```bash
# Create application directory
sudo mkdir -p /var/www/crm-backend
sudo chown deploy:deploy /var/www/crm-backend

# Create logs directory
mkdir -p /var/www/crm-backend/logs

# Create backup directory
sudo mkdir -p /var/backups/crm
sudo chown deploy:deploy /var/backups/crm
```

## Verification

After completing setup, verify all services:

```bash
# Check Node.js
node --version
npm --version

# Check Redis
redis-cli ping
redis-cli info

# Check Nginx
sudo systemctl status nginx
curl localhost

# Check PM2
pm2 --version

# Check firewall
sudo ufw status

# Check disk space
df -h

# Check memory
free -h

# Check CPU
nproc
```

## Security Hardening

### 1. Fail2Ban (Optional)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Enable SSH protection
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Disable Root SSH Login

```bash
sudo nano /etc/ssh/sshd_config

# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Configure SSH Key Only

```bash
sudo nano /etc/ssh/sshd_config

# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

## Monitoring Setup

### Install htop for monitoring

```bash
sudo apt install -y htop
```

### Install iotop for I/O monitoring

```bash
sudo apt install -y iotop
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using a port
sudo lsof -i :4000
sudo netstat -tulpn | grep :4000
```

### Permission Issues

```bash
# Fix file permissions
sudo chown -R deploy:deploy /var/www/crm-backend
chmod -R 755 /var/www/crm-backend
```

### Service Won't Start

```bash
# Check service logs
sudo journalctl -u nginx -n 50
sudo journalctl -u redis-server -n 50
```

## Next Steps

After server setup is complete:
1. Deploy backend code to `/var/www/crm-backend`
2. Configure environment variables
3. Setup SSL certificate
4. Configure Nginx
5. Start application with PM2
6. Deploy frontend to Vercel
