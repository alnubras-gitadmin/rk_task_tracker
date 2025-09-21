#!/usr/bin/env bash
set -euo pipefail

# Deploy RK TaskBook to rktaskbook.alnubras.co
DOMAIN="rktaskbook.alnubras.co"
N8N_DOMAIN="n8n.rktaskbook.alnubras.co"
EMAIL="admin@alnubras.co"

echo "🚀 Deploying RK TaskBook to ${DOMAIN}..."

# Set environment variables
export APP_DOMAIN="${DOMAIN}"
export N8N_DOMAIN="${N8N_DOMAIN}"
export ACME_EMAIL="${EMAIL}"

# Generate secure passwords if not set
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 32)}"
export N8N_PASSWORD="${N8N_PASSWORD:-$(openssl rand -base64 16)}"
export N8N_DB_PASSWORD="${N8N_DB_PASSWORD:-$(openssl rand -base64 32)}"

echo "📋 Configuration:"
echo "  Main Domain: ${DOMAIN}"
echo "  N8N Domain: ${N8N_DOMAIN}"
echo "  Email: ${EMAIL}"
echo ""

# Create .env file
cat > .env << EOF
# Domain Configuration
APP_DOMAIN=${DOMAIN}
N8N_DOMAIN=${N8N_DOMAIN}
ACME_EMAIL=${EMAIL}

# Database
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# N8N Configuration
N8N_PASSWORD=${N8N_PASSWORD}
N8N_DB_PASSWORD=${N8N_DB_PASSWORD}

# Application URLs
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_N8N_WEBHOOK_URL=https://${N8N_DOMAIN}/webhook/
VITE_N8N_API_URL=https://${N8N_DOMAIN}/api/v1/
VITE_APP_DOMAIN=${DOMAIN}
EOF

echo "✅ Environment file created"

# Pull latest images
echo "📦 Pulling Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Build application
echo "🔨 Building application..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Show status
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📱 Access your applications:"
echo "  Main App: https://${DOMAIN}"
echo "  N8N Workflows: https://${N8N_DOMAIN}"
echo "  N8N Login: admin / ${N8N_PASSWORD}"
echo ""
echo "🔧 Next Steps:"
echo "1. Configure Supabase project and update .env"
echo "2. Set up N8N workflows at https://${N8N_DOMAIN}"
echo "3. Configure DNS records (see DNS-SETUP.md)"
echo "4. Test the application functionality"
echo ""
echo "📝 Important Files:"
echo "  Environment: .env"
echo "  Logs: docker-compose -f docker-compose.prod.yml logs"
echo "  Backup: ./scripts/backup.sh"