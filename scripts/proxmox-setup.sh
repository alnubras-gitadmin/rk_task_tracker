#!/usr/bin/env bash
set -euo pipefail

# RK Task Tracker - Proxmox VM Setup Script
# Run this script on your Proxmox VM after Ubuntu installation

echo "🚀 RK Task Tracker - Proxmox Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="rktaskbook.alnubras.co"
N8N_DOMAIN="n8n.rktaskbook.alnubras.co"
EMAIL="admin@alnubras.co"
APP_USER="rktask"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as regular user with sudo access."
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    nano \
    ufw \
    fail2ban

# Configure firewall
print_status "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5678/tcp  # N8N
sudo ufw --force enable

# Install Docker
print_status "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
print_status "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create application directory
print_status "Setting up application directory..."
mkdir -p /home/$APP_USER/apps
cd /home/$APP_USER/apps

# Clone repository
print_status "Cloning RK Task Tracker repository..."
if [ -d "rk_task_tracker" ]; then
    print_warning "Repository already exists, pulling latest changes..."
    cd rk_task_tracker
    git pull
else
    git clone https://github.com/alnubras-gitadmin/rk_task_tracker.git
    cd rk_task_tracker
fi

# Make scripts executable
chmod +x scripts/*.sh

# Generate secure passwords
print_status "Generating secure passwords..."
POSTGRES_PASSWORD=$(openssl rand -base64 32)
N8N_PASSWORD=$(openssl rand -base64 16)
N8N_DB_PASSWORD=$(openssl rand -base64 32)

# Create environment file
print_status "Creating environment configuration..."
cat > .env << EOF
# Domain Configuration
APP_DOMAIN=${DOMAIN}
N8N_DOMAIN=${N8N_DOMAIN}
ACME_EMAIL=${EMAIL}

# Database Configuration
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# N8N Configuration
N8N_PASSWORD=${N8N_PASSWORD}
N8N_DB_PASSWORD=${N8N_DB_PASSWORD}

# Application URLs
VITE_N8N_WEBHOOK_URL=https://${N8N_DOMAIN}/webhook/
VITE_N8N_API_URL=https://${N8N_DOMAIN}/api/v1/
VITE_APP_DOMAIN=${DOMAIN}

# Supabase Configuration (Update these after setting up Supabase)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration (Optional)
VITE_OPENAI_API_KEY=your-openai-key-here
EOF

print_success "Environment file created at .env"

# Create monitoring script
print_status "Setting up monitoring..."
cat > /home/$APP_USER/monitor.sh << 'EOF'
#!/bin/bash
cd /home/rktask/apps/rk_task_tracker

# Check if services are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "$(date): Services down, restarting..." >> /var/log/rktask-monitor.log
    docker-compose -f docker-compose.prod.yml up -d
fi

# Check disk space
df -h | grep -E "/$|/var" | awk '{if($5+0 > 80) print "$(date): Disk usage high: " $5 " on " $1}' >> /var/log/rktask-monitor.log

# Check memory usage
free -m | awk 'NR==2{printf "Memory Usage: %s/%sMB (%.2f%%)\n", $3,$2,$3*100/$2 }' >> /var/log/rktask-monitor.log
EOF

chmod +x /home/$APP_USER/monitor.sh

# Create backup script
print_status "Setting up backup system..."
mkdir -p /home/$APP_USER/backups

cat > /home/$APP_USER/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/rktask/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/rktask/apps/rk_task_tracker"

mkdir -p $BACKUP_DIR

echo "$(date): Starting backup..." >> /var/log/rktask-backup.log

# Backup database
docker exec $(docker-compose -f $APP_DIR/docker-compose.prod.yml ps -q postgres) pg_dump -U rktaskbook rktaskbook > $BACKUP_DIR/db_$DATE.sql

# Backup application data
tar -czf $BACKUP_DIR/app_$DATE.tar.gz $APP_DIR --exclude=$APP_DIR/node_modules

# Backup environment
cp $APP_DIR/.env $BACKUP_DIR/env_$DATE.backup

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "$(date): Backup completed" >> /var/log/rktask-backup.log
EOF

chmod +x /home/$APP_USER/backup.sh

# Setup cron jobs
print_status "Setting up scheduled tasks..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/$APP_USER/monitor.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$APP_USER/backup.sh") | crontab -

# Create systemd service for auto-start
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/rktask.service > /dev/null << EOF
[Unit]
Description=RK Task Tracker
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/$APP_USER/apps/rk_task_tracker
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
User=$APP_USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable rktask.service

# Install dependencies and build
print_status "Installing application dependencies..."
npm install

print_success "✅ Proxmox setup completed successfully!"
print_warning "⚠️  IMPORTANT NEXT STEPS:"
echo ""
echo "1. 🌐 Configure DNS records:"
echo "   ${DOMAIN}     A     $(curl -s ifconfig.me)"
echo "   ${N8N_DOMAIN} A     $(curl -s ifconfig.me)"
echo ""
echo "2. 🔐 Set up Supabase:"
echo "   - Create project at https://supabase.com"
echo "   - Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
echo ""
echo "3. 🚀 Deploy the application:"
echo "   cd /home/$APP_USER/apps/rk_task_tracker"
echo "   ./scripts/deploy-domain.sh"
echo ""
echo "4. 🔄 Access N8N workflows:"
echo "   https://${N8N_DOMAIN}"
echo "   Username: admin"
echo "   Password: ${N8N_PASSWORD}"
echo ""
echo "5. 📱 Access your application:"
echo "   https://${DOMAIN}"
echo ""
echo "📋 Configuration saved to:"
echo "   Environment: /home/$APP_USER/apps/rk_task_tracker/.env"
echo "   Passwords: (shown above - save them securely)"
echo ""
print_warning "🔄 Please logout and login again to apply Docker group membership!"
echo "   Then run: cd /home/$APP_USER/apps/rk_task_tracker && ./scripts/deploy-domain.sh"