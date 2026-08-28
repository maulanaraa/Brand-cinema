const fs = require('fs');
const https = require('https');
const path = require('path');

const CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs';
const OUTPUT = path.resolve(__dirname, '../config/google-oauth-certs.json');

https
  .get(CERTS_URL, { family: 4, timeout: 10000 }, (response) => {
    if ((response.statusCode ?? 0) >= 400) {
      console.error(`Failed to fetch Google certs: HTTP ${response.statusCode}`);
      process.exit(1);
    }

    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf-8');
      fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
      fs.writeFileSync(OUTPUT, `${JSON.stringify(JSON.parse(body), null, 2)}\n`);
      console.log(`Saved Google OAuth certs to ${OUTPUT}`);
    });
  })
  .on('error', (error) => {
    console.error('Failed to fetch Google certs:', error.message);
    process.exit(1);
  });
