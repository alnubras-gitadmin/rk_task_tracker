# DNS Setup for rktaskbook.alnubras.co

## Required DNS Records

Add these DNS records to your domain registrar or DNS provider:

### A Records
```
rktaskbook.alnubras.co     A     YOUR_SERVER_IP
n8n.rktaskbook.alnubras.co A     YOUR_SERVER_IP
```

### CNAME Records (Alternative)
```
rktaskbook.alnubras.co     CNAME  your-server.example.com
n8n.rktaskbook.alnubras.co CNAME  your-server.example.com
```

## DNS Provider Examples

### Cloudflare
1. Login to Cloudflare Dashboard
2. Select your domain `alnubras.co`
3. Go to DNS > Records
4. Add records:
   - Type: A, Name: rktaskbook, Content: YOUR_SERVER_IP
   - Type: A, Name: n8n.rktaskbook, Content: YOUR_SERVER_IP

### GoDaddy
1. Login to GoDaddy Domain Manager
2. Select your domain `alnubras.co`
3. Go to DNS Management
4. Add records:
   - Type: A, Host: rktaskbook, Points to: YOUR_SERVER_IP
   - Type: A, Host: n8n.rktaskbook, Points to: YOUR_SERVER_IP

### Namecheap
1. Login to Namecheap Account
2. Go to Domain List > Manage
3. Advanced DNS tab
4. Add records:
   - Type: A Record, Host: rktaskbook, Value: YOUR_SERVER_IP
   - Type: A Record, Host: n8n.rktaskbook, Value: YOUR_SERVER_IP

## SSL Certificate Setup

The deployment script will automatically handle SSL certificates using Let's Encrypt.

## Verification

After DNS propagation (usually 5-60 minutes), verify:

```bash
# Check DNS resolution
nslookup rktaskbook.alnubras.co
nslookup n8n.rktaskbook.alnubras.co

# Check if sites are accessible
curl -I https://rktaskbook.alnubras.co
curl -I https://n8n.rktaskbook.alnubras.co
```

## Deployment Commands

```bash
# Deploy with SSL
./scripts/deploy.sh --ssl rktaskbook.alnubras.co --email admin@alnubras.co

# Or using docker-compose directly
docker-compose -f docker-compose.prod.yml up -d
```