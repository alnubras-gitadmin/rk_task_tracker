# RK Task Tracker - Proxmox Deployment Guide

## 🚀 Complete Deployment to rktaskbook.alnubras.co

### Prerequisites
- Proxmox VE server
- Domain: `alnubras.co` with DNS access
- Server with public IP address

---

## 📋 Step 1: Create Proxmox VM

### VM Specifications
```bash
# Recommended VM specs
CPU: 4 cores
RAM: 8GB
Storage: 50GB SSD
Network: Bridge to public interface
OS: Ubuntu 22.04 LTS
```

### Create VM in Proxmox
1. **Download Ubuntu ISO**
   ```bash
   # In Proxmox shell
   cd /var/lib/vz/template/iso
   wget https://releases.ubuntu.com/22.04/ubuntu-22.04.3-live-server-amd64.iso
   ```

2. **Create VM via Proxmox Web UI**
   - VM ID: 100 (or available ID)
   - Name: `rk-task-tracker`
   - OS: Linux 6.x - 2.6 Kernel
   - ISO: ubuntu-22.04.3-live-server-amd64.iso
   - System: Default (UEFI if available)
   - Disks: 50GB, VirtIO SCSI
   - CPU: 4 cores, host type
   - Memory: 8192MB
   - Network: VirtIO, Bridge=vmbr0

3. **Install Ubuntu**
   - Start VM and follow Ubuntu installation
   - Create user: `rktask`
   - Enable SSH server during installation

---

## 🌐 Step 2: DNS Configuration

### Add DNS Records to alnubras.co
```dns
# A Records (replace YOUR_SERVER_IP with actual IP)
rktaskbook.alnubras.co     A     YOUR_SERVER_IP
n8n.rktaskbook.alnubras.co A     YOUR_SERVER_IP
api.rktaskbook.alnubras.co A     YOUR_SERVER_IP

# Optional CNAME if using subdomain
www.rktaskbook.alnubras.co CNAME rktaskbook.alnubras.co
```

### Verify DNS Propagation
```bash
# Test DNS resolution
nslookup rktaskbook.alnubras.co
nslookup n8n.rktaskbook.alnubras.co
```

---

## 🔧 Step 3: Server Setup

### Connect to VM
```bash
# SSH to your VM
ssh rktask@YOUR_SERVER_IP
```

### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip software-properties-common

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for local development)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Logout and login to apply docker group
exit
ssh rktask@YOUR_SERVER_IP
```

---

## 📦 Step 4: Deploy Application

### Clone Repository
```bash
# Clone your repository
git clone https://github.com/alnubras-gitadmin/rk_task_tracker.git
cd rk_task_tracker

# Make scripts executable
chmod +x scripts/*.sh
```

### Configure Environment
```bash
# Create production environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### Environment Configuration (.env)
```env
# Domain Configuration
APP_DOMAIN=rktaskbook.alnubras.co
N8N_DOMAIN=n8n.rktaskbook.alnubras.co
ACME_EMAIL=admin@alnubras.co

# Generate secure passwords
POSTGRES_PASSWORD=your_secure_postgres_password_here
N8N_PASSWORD=your_secure_n8n_password_here
N8N_DB_PASSWORD=your_secure_n8n_db_password_here

# Supabase Configuration (set up later)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# N8N Integration
VITE_N8N_WEBHOOK_URL=https://n8n.rktaskbook.alnubras.co/webhook/
VITE_N8N_API_URL=https://n8n.rktaskbook.alnubras.co/api/v1/

# OpenAI (optional)
VITE_OPENAI_API_KEY=your-openai-key-here
```

### Deploy with SSL
```bash
# Deploy using the domain script
./scripts/deploy-domain.sh

# Or deploy manually
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔐 Step 5: Supabase Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project: `rk-task-tracker`
3. Note down:
   - Project URL
   - Anon public key
   - Service role key

### Database Schema
```sql
-- Run in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table (using threads from your schema)
CREATE TABLE threads (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread members
CREATE TABLE thread_members (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'member'
);

-- Messages (tasks)
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  attachments JSONB,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add more policies as needed...
```

### Update Environment
```bash
# Update .env with Supabase credentials
nano .env

# Add:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔄 Step 6: N8N Workflow Setup

### Access N8N
1. Open: `https://n8n.rktaskbook.alnubras.co`
2. Login: `admin` / `your_n8n_password`

### Create Webhooks
1. **Task Creation Webhook**
   - URL: `https://n8n.rktaskbook.alnubras.co/webhook/task-created`
   - Method: POST
   - Response: JSON

2. **Task Status Change Webhook**
   - URL: `https://n8n.rktaskbook.alnubras.co/webhook/task-status-changed`
   - Method: POST

3. **Project Creation Webhook**
   - URL: `https://n8n.rktaskbook.alnubras.co/webhook/project-created`
   - Method: POST

### Sample N8N Workflows

#### Task Notification Workflow
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "task-created",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "to": "team@alnubras.co",
        "subject": "New Task Created: {{$json.data.title}}",
        "text": "A new task has been created in project {{$json.data.projectId}}"
      }
    }
  ]
}
```

---

## 🚀 Step 7: Final Deployment

### Restart Services
```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Verify Deployment
```bash
# Check if services are running
curl -I https://rktaskbook.alnubras.co
curl -I https://n8n.rktaskbook.alnubras.co

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🔧 Step 8: Monitoring & Maintenance

### Setup Monitoring
```bash
# Create monitoring script
cat > /home/rktask/monitor.sh << 'EOF'
#!/bin/bash
cd /home/rktask/rk_task_tracker

# Check if services are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "Services down, restarting..."
    docker-compose -f docker-compose.prod.yml up -d
fi

# Check disk space
df -h | grep -E "/$|/var" | awk '{if($5+0 > 80) print "Disk usage high: " $5 " on " $1}'
EOF

chmod +x /home/rktask/monitor.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/rktask/monitor.sh") | crontab -
```

### Backup Script
```bash
# Create backup script
cat > /home/rktask/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/rktask/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec rk_task_tracker_postgres_1 pg_dump -U rktaskbook rktaskbook > $BACKUP_DIR/db_$DATE.sql

# Backup application data
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/rktask/rk_task_tracker

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /home/rktask/backup.sh

# Daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/rktask/backup.sh") | crontab -
```

---

## 🎉 Step 9: Access Your Application

### URLs
- **Main Application**: https://rktaskbook.alnubras.co
- **N8N Workflows**: https://n8n.rktaskbook.alnubras.co
- **API Endpoint**: https://api.rktaskbook.alnubras.co (if configured)

### Default Credentials
- **N8N**: admin / your_n8n_password
- **Application**: Register new account via UI

---

## 🔍 Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   docker-compose -f docker-compose.prod.yml logs web
   
   # Force certificate renewal
   docker-compose -f docker-compose.prod.yml restart web
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Reset database
   docker-compose -f docker-compose.prod.yml down
   docker volume rm rk_task_tracker_postgres_data
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **N8N Not Accessible**
   ```bash
   # Check N8N logs
   docker-compose -f docker-compose.prod.yml logs n8n
   
   # Restart N8N
   docker-compose -f docker-compose.prod.yml restart n8n
   ```

### Log Locations
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs web

# Database logs
docker-compose -f docker-compose.prod.yml logs postgres

# N8N logs
docker-compose -f docker-compose.prod.yml logs n8n

# System logs
sudo journalctl -u docker
```

---

## 📞 Support

For issues or questions:
- Check logs first
- Verify DNS settings
- Ensure all environment variables are set
- Check firewall settings (ports 80, 443, 5678)

Your RK Task Tracker is now deployed at **https://rktaskbook.alnubras.co**! 🎉