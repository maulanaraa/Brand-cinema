import dns from 'dns';
import { LookupFunction } from 'net';

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if not permitted
}

/**
 * Custom lookup for MongoDB Atlas only.
 */
export const atlasLookup: LookupFunction = (hostname, options, callback) => {
  const cb =
    typeof options === 'function'
      ? options
      : (callback as (err: NodeJS.ErrnoException | null, address: string, family: number) => void);

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    cb(null, '127.0.0.1', 4);
    return;
  }
  if (hostname === '::1') {
    cb(null, '::1', 6);
    return;
  }

  resolver.resolve4(hostname, (err, addresses) => {
    if (err || !addresses.length) {
      resolver.resolve6(hostname, (err6, addresses6) => {
        if (err6 || !addresses6.length) {
          cb(err || err6 || new Error(`Unable to resolve ${hostname}`), '', 4);
          return;
        }
        cb(null, addresses6[0], 6);
      });
      return;
    }
    cb(null, addresses[0], 4);
  });
};
