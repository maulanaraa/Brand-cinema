import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

interface GoogleWebCredentials {
  client_id: string;
  client_secret: string;
}

interface GoogleCredentialsFile {
  web: GoogleWebCredentials;
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  clientIds: string[];
}

const DEFAULT_CREDENTIALS_FILE =
  'client_secret_871322173018-6sgqe08lgm0ngmfug7tk67otadenmr9s.apps.googleusercontent.com.json';

const loadFromFile = (filePath: string): GoogleConfig | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as GoogleCredentialsFile;

  if (!raw.web?.client_id) {
    throw new Error(`Invalid Google credentials file: ${filePath}`);
  }

  return {
    clientId: raw.web.client_id,
    clientSecret: raw.web.client_secret || '',
    clientIds: [raw.web.client_id],
  };
};

const findCredentialsFileInRoot = (): string | null => {
  const root = process.cwd();

  let entries: string[];
  try {
    entries = fs.readdirSync(root);
  } catch {
    return null;
  }

  const matches = entries
    .filter((name) => name.startsWith('client_secret') && name.endsWith('.json'))
    .sort();

  if (matches.length === 0) {
    return null;
  }

  return path.join(root, matches[0]);
};

const resolveCredentialsPath = (): string => {
  const configuredPath = process.env.GOOGLE_CREDENTIALS_PATH;
  if (configuredPath) {
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);
  }

  const defaultPath = path.resolve(process.cwd(), DEFAULT_CREDENTIALS_FILE);
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }

  const discovered = findCredentialsFileInRoot();
  if (discovered) {
    return discovered;
  }

  return defaultPath;
};

const parseClientIds = (primary: string, extra?: string): string[] => {
  const ids = new Set<string>();

  if (primary) {
    ids.add(primary.trim());
  }

  (extra || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => ids.add(value));

  return Array.from(ids);
};

export const loadGoogleConfig = (): GoogleConfig => {
  const credentialsPath = resolveCredentialsPath();
  const fromFile = loadFromFile(credentialsPath);

  if (process.env.GOOGLE_CLIENT_ID) {
    const clientId = process.env.GOOGLE_CLIENT_ID.trim();
    return {
      clientId,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || fromFile?.clientSecret || '',
      clientIds: parseClientIds(clientId, process.env.GOOGLE_CLIENT_IDS),
    };
  }

  if (fromFile) {
    return {
      ...fromFile,
      clientIds: parseClientIds(fromFile.clientId, process.env.GOOGLE_CLIENT_IDS),
    };
  }

  return {
    clientId: '',
    clientSecret: '',
    clientIds: [],
  };
};

let cachedGoogleConfig: GoogleConfig | null = null;

export const getGoogleConfig = (): GoogleConfig => {
  if (!cachedGoogleConfig) {
    cachedGoogleConfig = loadGoogleConfig();
  }
  return cachedGoogleConfig;
};
