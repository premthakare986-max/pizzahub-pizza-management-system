import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config();

export interface MySQLDiagnosticState {
  status: 'CONNECTED' | 'NOT CONNECTED';
  connected: boolean;
  configured: boolean;
  environment: 'cloud_preview' | 'local_development';
  serverVersion: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  checkedAt: string;
  configSummary: {
    host: string;
    port: number;
    user: string;
    database: string;
    hasPassword: boolean;
  };
}

let pool: Pool | null = null;
let localDaemonBootstrapped = false;

function isCloudPreviewEnvironment(): boolean {
  return Boolean(process.env.APP_URL?.includes('.run.app') || process.env.K_SERVICE);
}

function readEnvConfig() {
  const rawHost = (process.env.DB_HOST || '127.0.0.1').trim();
  const rawPort = Number(process.env.DB_PORT || 3306);
  const rawUser = (process.env.DB_USER || 'root').trim();
  const rawPassword = process.env.DB_PASSWORD || '';
  const rawDatabase = (process.env.DB_NAME || 'pizzahub_db').trim();

  return {
    host: rawHost,
    port: rawPort,
    user: rawUser,
    password: rawPassword,
    database: rawDatabase,
  };
}

let lastState: MySQLDiagnosticState = {
  status: 'NOT CONNECTED',
  connected: false,
  configured: true,
  environment: isCloudPreviewEnvironment() ? 'cloud_preview' : 'local_development',
  serverVersion: null,
  errorCode: 'INITIALIZING',
  errorMessage: 'Checking MySQL connection pool...',
  checkedAt: new Date().toISOString(),
  configSummary: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    database: 'pizzahub_db',
    hasPassword: false,
  },
};

export function getPool(): Pool | null {
  return pool;
}

export function getLastConnectionState(): MySQLDiagnosticState {
  return lastState;
}

/**
 * If a local MySQL/MariaDB binary is installed on the host and DB_HOST is 127.0.0.1/localhost,
 * ensures the daemon is running and pizzahub_db is initialized.
 */
async function ensureLocalMySQLDaemonIfAvailable(cfg: ReturnType<typeof readEnvConfig>) {
  if (localDaemonBootstrapped) return;
  const isLocal = cfg.host === '127.0.0.1' || cfg.host === 'localhost';
  if (!isLocal) return;

  try {
    const hasMariadbd = fs.existsSync('/usr/sbin/mariadbd') || fs.existsSync('/usr/bin/mariadbd');
    if (!hasMariadbd) return;

    // Check if mysqld socket or process is already running
    const sockExists = fs.existsSync('/run/mysqld/mysqld.sock');
    if (!sockExists) {
      execSync('mkdir -p /run/mysqld && chown -R mysql:mysql /run/mysqld /var/lib/mysql', {
        stdio: 'ignore',
      });
      const child = spawn(
        'mariadbd',
        ['--user=mysql', '--bind-address=127.0.0.1', `--port=${cfg.port}`],
        {
          detached: true,
          stdio: 'ignore',
        }
      );
      child.unref();
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    // Ensure root@127.0.0.1 privilege and pizzahub_db schema exist
    execSync(
      `mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD(''); CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED VIA mysql_native_password USING PASSWORD(''); GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;"`,
      { stdio: 'ignore' }
    );

    const dbCheck = execSync(
      `mysql -h 127.0.0.1 -P ${cfg.port} -u root -e "SHOW DATABASES LIKE '${cfg.database}';"`,
      { encoding: 'utf8' }
    );

    if (!dbCheck.includes(cfg.database)) {
      const dbDir = path.join(process.cwd(), 'database');
      for (const file of ['schema.sql', 'seed.sql', 'views.sql', 'procedures.sql', 'triggers.sql']) {
        const fullPath = path.join(dbDir, file);
        if (fs.existsSync(fullPath)) {
          const targetDb = file === 'schema.sql' ? '' : cfg.database;
          execSync(`mysql -h 127.0.0.1 -P ${cfg.port} -u root ${targetDb} < "${fullPath}"`, {
            stdio: 'ignore',
          });
        }
      }
    }

    localDaemonBootstrapped = true;
  } catch {
    // Non-fatal: verifyMySQLConnection will report exact connection state
  }
}

/**
 * Ensures seeded accounts in MySQL have valid bcrypt hashes for Admin@123 and Customer@123
 */
async function ensureSeededBcryptHashes(connection: PoolConnection) {
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT id, role, password_hash FROM users WHERE id <= 7'
    );
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const customerHash = await bcrypt.hash('Customer@123', 10);

    for (const row of rows) {
      const hashStr = String(row.password_hash || '');
      // Replace the static placeholder hash in seed.sql with a real verifiable bcrypt hash
      if (hashStr.includes('X7vG8tQ9z1W2eR3yU4iO5uP6aS7dF8gH9jK0lZ1xC2vB3nM4qW5eR')) {
        const validHash = row.role === 'admin' ? adminHash : customerHash;
        await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
          validHash,
          row.id,
        ]);
      }
    }
  } catch {
    // ignore if users table not yet created
  }
}

export async function verifyMySQLConnection(
  forceRecheck: boolean = false
): Promise<MySQLDiagnosticState> {
  const cfg = readEnvConfig();
  const inCloud = isCloudPreviewEnvironment();

  await ensureLocalMySQLDaemonIfAvailable(cfg);

  const configSummary = {
    host: cfg.host || '(not set)',
    port: cfg.port,
    user: cfg.user || '(not set)',
    database: cfg.database,
    hasPassword: Boolean(cfg.password),
  };

  try {
    if (!pool || forceRecheck) {
      if (pool) {
        try {
          await pool.end();
        } catch {
          // ignore cleanup error
        }
      }
      pool = mysql.createPool({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 4000,
        decimalNumbers: true,
      });
    }

    const connection: PoolConnection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>('SELECT VERSION() AS version');
      const version = rows?.[0]?.version || '8.0';
      await ensureSeededBcryptHashes(connection);

      lastState = {
        status: 'CONNECTED',
        connected: true,
        configured: true,
        environment: inCloud ? 'cloud_preview' : 'local_development',
        serverVersion: String(version),
        errorCode: null,
        errorMessage: null,
        checkedAt: new Date().toISOString(),
        configSummary,
      };
    } finally {
      connection.release();
    }
  } catch (err: any) {
    const rawCode = err?.code || 'MYSQL_CONNECTION_FAILED';

    lastState = {
      status: 'NOT CONNECTED',
      connected: false,
      configured: Boolean(cfg.host && cfg.user),
      environment: inCloud ? 'cloud_preview' : 'local_development',
      serverVersion: null,
      errorCode: rawCode,
      errorMessage:
        err?.message ||
        `Failed to connect to MySQL server at ${cfg.host}:${cfg.port}/${cfg.database}.`,
      checkedAt: new Date().toISOString(),
      configSummary,
    };
  }

  return lastState;
}

export type { RowDataPacket, ResultSetHeader, PoolConnection };
export default pool;
