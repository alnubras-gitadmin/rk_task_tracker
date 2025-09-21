# 🚀 RK Task Tracker - Quick Start Guide

## Proxmox Deployment in 15 Minutes

### 📋 Prerequisites
- Proxmox VE server
- Ubuntu 22.04 VM created
- Domain `alnubras.co` with DNS access
- Public IP address

---

## ⚡ Quick Deployment Steps

### 1. **Create VM in Proxmox**
```bash
# VM Specs (minimum)
CPU: 2 cores
RAM: 4GB  
Storage: 30GB
OS: Ubuntu 22.04 LTS
Network: Bridge to public interface
```

### 2. **SSH to VM and Run Setup**
```bash
# SSH to your VM
ssh your-user@YOUR_SERVER_IP

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/alnubras-gitadmin/rk_task_tracker/main/scripts/proxmox-setup.sh | bash

# Logout and login to apply Docker group
exit
ssh your-user@YOUR_SERVER_IP
```

### 3. **Configure DNS Records**
Add these records to your DNS provider for `alnubras.co`:
```dns
rktaskbook.alnubras.co     A     YOUR_SERVER_IP
n8n.rktaskbook.alnubras.co A     YOUR_SERVER_IP
```

### 4. **Deploy Application**
```bash
cd /home/$(whoami)/apps/rk_task_tracker
./scripts/deploy-domain.sh
```

### 5. **Setup Supabase** (5 minutes)
1. Go to [supabase.com](https://supabase.com) → Create Project
2. Copy Project URL and Anon Key
3. Update `.env` file:
   ```bash
   nano .env
   # Update these lines:
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Run database setup in Supabase SQL Editor:
   ```sql
   -- Copy and paste the schema from PROXMOX-DEPLOYMENT.md
   ```

### 6. **Restart Services**
```bash
docker-compose -f docker-compose.prod.yml restart
```

---

## 🎉 You're Done!

### Access Your Applications:
- **Main App**: https://rktaskbook.alnubras.co
- **N8N Workflows**: https://n8n.rktaskbook.alnubras.co
- **N8N Login**: admin / (password from setup output)

### Next Steps:
1. Register your first user account
2. Create a project and tasks
3. Set up N8N workflows for automation
4. Add OpenAI API key for AI features (optional)

---

## 🔧 Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update application
git pull && docker-compose -f docker-compose.prod.yml up -d --build

# Backup data
/home/$(whoami)/backup.sh

# Monitor services
/home/$(whoami)/monitor.sh
```

---

## 🆘 Troubleshooting

### SSL Certificate Issues
```bash
# Check certificate status
docker-compose -f docker-compose.prod.yml logs web

# Force renewal
docker-compose -f docker-compose.prod.yml restart web
```

### Database Issues
```bash
# Check database
docker-compose -f docker-compose.prod.yml logs postgres

# Reset if needed
docker-compose -f docker-compose.prod.yml down
docker volume prune
docker-compose -f docker-compose.prod.yml up -d
```

### DNS Issues
```bash
# Test DNS resolution
nslookup rktaskbook.alnubras.co
nslookup n8n.rktaskbook.alnubras.co

# Check if accessible
curl -I https://rktaskbook.alnubras.co
```

---

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify DNS settings
3. Ensure firewall allows ports 80, 443, 5678
4. Check that all environment variables are set

**Total deployment time: ~15 minutes** ⏱️