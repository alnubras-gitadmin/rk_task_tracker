#!/usr/bin/env bash
set -euo pipefail

usage() { echo "Usage: $0 --ssl <domain> [--email you@domain.com]"; exit 1; }

DOMAIN=""
EMAIL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ssl) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    *) usage ;;
  esac
done

[[ -z "${DOMAIN}" ]] && usage

export APP_DOMAIN="${DOMAIN}"
export ACME_EMAIL="${EMAIL:-admin@${DOMAIN}}"

echo "Deploying for ${APP_DOMAIN} ..."
docker compose pull || true
docker compose build --no-cache
docker compose up -d
docker compose ps

