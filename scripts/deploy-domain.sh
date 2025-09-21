#!/usr/bin/env bash
set -euo pipefail

# Deploy RK Task Tracker to rktaskbook.alnubras.co
DOMAIN="rktaskbook.alnubras.co"
N8N_DOMAIN="n8n.rktaskbook.alnubras.co"
EMAIL="admin@alnubras.co"

echo "🚀 Deploying RK Task Tracker to ${DOMAIN}..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found! Please run setup first."
    exit 1
fi

# Load existing environment
source .env

# Set environment variables
export APP_DOMAIN="${DOMAIN}"
export N8N_DOMAIN="${N8N_DOMAIN}"
export ACME_EMAIL="${EMAIL}"

# Generate secure passwords if not set
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 32)}"
export N8N_PASSWORD="${N8N_PASSWORD:-$(openssl rand -base64 16)}"
export N8N_DB_PASSWORD="${N8N_DB_PASSWORD:-$(openssl rand -base64 32)}"

print_status "📋 Configuration:"
echo "  Main Domain: ${DOMAIN}"
echo "  N8N Domain: ${N8N_DOMAIN}"
echo "  Email: ${EMAIL}"
echo "  Server IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to detect')"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running or accessible. Please check Docker installation."
    exit 1
fi

# Check if user is in docker group
if ! groups | grep -q docker; then
    print_warning "User not in docker group. You may need to logout/login or run with sudo."
fi

# Pull latest images
print_status "📦 Pulling Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Build application
print_status "🔨 Building application..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing services
print_status "🛑 Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

# Start services
print_status "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "⏳ Waiting for services to start..."
sleep 45

# Health check
print_status "🔍 Performing health checks..."

# Check if containers are running
RUNNING_CONTAINERS=$(docker-compose -f docker-compose.prod.yml ps --services --filter "status=running" | wc -l)
TOTAL_CONTAINERS=$(docker-compose -f docker-compose.prod.yml ps --services | wc -l)

if [ "$RUNNING_CONTAINERS" -eq "$TOTAL_CONTAINERS" ]; then
    print_success "All containers are running ($RUNNING_CONTAINERS/$TOTAL_CONTAINERS)"
else
    print_warning "Some containers may not be running ($RUNNING_CONTAINERS/$TOTAL_CONTAINERS)"
fi

# Test HTTP endpoints
print_status "🌐 Testing endpoints..."

# Test main domain (allow for SSL setup time)
for i in {1..5}; do
    if curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" | grep -q "200\|301\|302"; then
        print_success "Main application accessible at https://${DOMAIN}"
        break
    elif [ $i -eq 5 ]; then
        print_warning "Main application may not be ready yet at https://${DOMAIN}"
        print_warning "This is normal during first deployment while SSL certificates are being generated"
    else
        sleep 10
    fi
done

# Test N8N domain
for i in {1..3}; do
    if curl -s -o /dev/null -w "%{http_code}" "https://${N8N_DOMAIN}" | grep -q "200\|301\|302\|401"; then
        print_success "N8N accessible at https://${N8N_DOMAIN}"
        break
    elif [ $i -eq 3 ]; then
        print_warning "N8N may not be ready yet at https://${N8N_DOMAIN}"
    else
        sleep 10
    fi
done

# Show status
print_status "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
print_success "🎉 Deployment Complete!"
echo ""
print_success "📱 Access your applications:"
echo "  Main App: https://${DOMAIN}"
echo "  N8N Workflows: https://${N8N_DOMAIN}"
echo "  N8N Login: admin / ${N8N_PASSWORD}"
echo ""
print_warning "🔧 Next Steps:"
echo "1. 🌐 Verify DNS records are configured:"
echo "   ${DOMAIN}     A     $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "   ${N8N_DOMAIN} A     $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""
echo "2. 🔐 Configure Supabase project:"
echo "   - Create project at https://supabase.com"
echo "   - Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
echo "   - Run database migrations"
echo ""
echo "3. 🔄 Set up N8N workflows:"
echo "   - Access: https://${N8N_DOMAIN}"
echo "   - Login: admin / ${N8N_PASSWORD}"
echo "   - Create webhooks for task automation"
echo ""
echo "4. 🤖 Configure OpenAI (optional):"
echo "   - Add VITE_OPENAI_API_KEY to .env"
echo "   - Restart services: docker-compose -f docker-compose.prod.yml restart"
echo ""
print_status "📝 Important Files:"
echo "  Environment: .env"
echo "  View Logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Backup: ./scripts/backup.sh"
echo "  Monitor: /home/$(whoami)/monitor.sh"
echo ""
print_status "🔧 Useful Commands:"
echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f [service]"
echo "  Update app: git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo "  Backup data: /home/$(whoami)/backup.sh"