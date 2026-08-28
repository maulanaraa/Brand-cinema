import dns from 'dns';
import https from 'https';
import { URL } from 'url';

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

export interface ExternalHttpResponse {
  status: number;
  body: string;
}

const resolveIPv4 = (hostname: string): Promise<string> =>
  new Promise((resolve, reject) => {
    resolver.resolve4(hostname, (error, addresses) => {
      if (error || !addresses.length) {
        reject(error || new Error(`Unable to resolve ${hostname}`));
        return;
      }
      resolve(addresses[0]);
    });
  });

export const externalHttpsRequest = (
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
    body?: string;
  } = {}
): Promise<ExternalHttpResponse> => {
  const parsed = new URL(url);
  const method = options.method || 'GET';
  const timeoutMs = options.timeoutMs ?? 15000;
  const body = options.body;

  return resolveIPv4(parsed.hostname).then(
    (address) =>
      new Promise<ExternalHttpResponse>((resolve, reject) => {
        const headers: Record<string, string> = {
          Host: parsed.hostname,
          ...options.headers,
        };

        if (body && !headers['Content-Length'] && !headers['content-length']) {
          headers['Content-Length'] = Buffer.byteLength(body).toString();
        }

        const request = https.request(
          {
            host: address,
            servername: parsed.hostname,
            port: 443,
            path: `${parsed.pathname}${parsed.search}`,
            method,
            headers,
            family: 4,
            timeout: timeoutMs,
          },
          (response) => {
            const chunks: Buffer[] = [];
            response.on('data', (chunk: Buffer) => chunks.push(chunk));
            response.on('end', () => {
              resolve({
                status: response.statusCode ?? 500,
                body: Buffer.concat(chunks).toString('utf-8'),
              });
            });
          }
        );

        request.on('timeout', () => {
          request.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
        });
        request.on('error', reject);

        if (body) {
          request.write(body);
        }
        request.end();
      })
  );
};

export const checkExternalHttps = async (url: string): Promise<boolean> => {
  try {
    const response = await externalHttpsRequest(url, { timeoutMs: 10000 });
    return response.status < 500;
  } catch {
    return false;
  }
};
