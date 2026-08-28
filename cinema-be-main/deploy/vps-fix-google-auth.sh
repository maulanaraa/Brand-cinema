#!/usr/bin/env bash
set -euo pipefail

# Run this ON THE VPS inside the backend project root.
#
# Usage:
#   cd ~/apps/cinema-be
#   bash deploy/vps-fix-google-auth.sh

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

CLIENT_SECRET_FILE="client_secret_871322173018-6sgqe08lgm0ngmfug7tk67otadenmr9s.apps.googleusercontent.com.json"
ENV_FILE=".env"
PM2_APP="${PM2_APP_NAME:-kada-be}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE in $APP_DIR" >&2
  exit 1
fi

upsert_env() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

if [[ -f "$CLIENT_SECRET_FILE" ]]; then
  CLIENT_ID="$(node -e "const f=require('./$CLIENT_SECRET_FILE'); process.stdout.write(f.web.client_id)")"
  CLIENT_SECRET="$(node -e "const f=require('./$CLIENT_SECRET_FILE'); process.stdout.write(f.web.client_secret)")"

  echo "Found $CLIENT_SECRET_FILE"
  upsert_env "GOOGLE_CLIENT_ID" "$CLIENT_ID"
  upsert_env "GOOGLE_CLIENT_SECRET" "$CLIENT_SECRET"
  upsert_env "GOOGLE_CREDENTIALS_PATH" "$CLIENT_SECRET_FILE"
  upsert_env "APP_URL" "https://www.brand-cinemas.online"
else
  echo "Credentials file not found: $CLIENT_SECRET_FILE" >&2
  exit 1
fi

echo ""
echo "Google OAuth env updated:"
grep '^GOOGLE_' "$ENV_FILE"

echo ""
echo "Building..."
npm run build

echo ""
echo "Verifying Google config from dist..."
node -e "require('dotenv').config(); const { getGoogleConfig } = require('./dist/config/google'); const c = getGoogleConfig(); console.log('clientId:', c.clientId); console.log('clientIds:', c.clientIds.join(', '));"

echo ""
echo "Checking bundled Google OAuth certificates..."
if [[ -f config/google-oauth-certs.json ]]; then
  node -e "const c=require('./config/google-oauth-certs.json'); console.log('Cached cert keys:', Object.keys(c).length)"
else
  echo "WARNING: config/google-oauth-certs.json missing"
  echo "Run on dev machine: npm run fetch:google-certs && git add config/google-oauth-certs.json"
fi

echo ""
echo "Testing outbound access to Google OAuth certs..."
if curl -sf --max-time 10 https://www.googleapis.com/oauth2/v1/certs >/dev/null; then
  echo "Google certs endpoint: OK"
else
  echo "WARNING: VPS cannot reach https://www.googleapis.com/oauth2/v1/certs"
  echo "Open outbound HTTPS (port 443) to www.googleapis.com in VPS firewall."
fi

if curl -sf --max-time 10 "https://api.themoviedb.org/3/configuration" >/dev/null; then
  echo "TMDB API endpoint: OK"
else
  echo "WARNING: VPS cannot reach https://api.themoviedb.org"
  echo "Open outbound HTTPS (port 443) to api.themoviedb.org in VPS firewall."
fi

if command -v pm2 >/dev/null 2>&1; then
  echo ""
  echo "Restarting PM2 app: $PM2_APP"
  pm2 restart "$PM2_APP" --update-env || pm2 restart all --update-env
  sleep 2

  echo ""
  echo "PM2 process info:"
  pm2 describe "$PM2_APP" | sed -n '1,20p' || pm2 list

  echo ""
  echo "Recent app logs:"
  pm2 logs "$PM2_APP" --lines 25 --nostream || pm2 logs --lines 25 --nostream

  echo ""
  echo "Look for this line in output above:"
  echo "  Google OAuth: enabled (clientId: 871322173018-...)"
else
  echo "pm2 not found. Restart your Node process manually."
fi

echo ""
echo "Done."
