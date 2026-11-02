import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Play,
  Server,
  Terminal,
  ShieldAlert,
  Laptop,
  Cloud,
} from 'lucide-react';
import { DBHealthResponse } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useToast } from '../hooks/useToast.tsx';

export function DatabaseStatusBanner() {
  const [health, setHealth] = useState<DBHealthResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const { showToast } = useToast();

  const fetchHealth = useCallback(async () => {
    try {
      const res = await apiRequest<DBHealthResponse>('/api/health');
      setHealth(res);
    } catch {
      // Do not crash frontend if backend health check fails
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleRetryConnection = async () => {
    setRetrying(true);
    try {
      const res = await apiRequest<DBHealthResponse & { success: boolean }>('/api/health/retry', {
        method: 'POST',
      });
      setHealth(res);
      if (res.mysql.connected) {
        showToast(
          `MySQL 8 CONNECTED (${res.mysql.server_version})`,
          'success',
          `Connected to ${res.mysql.config.host}:${res.mysql.config.port}/${res.mysql.config.database}`
        );
      } else {
        showToast(
          'MySQL 8 NOT CONNECTED',
          'error',
          res.mysql.error_message || 'Connection test did not succeed. Check diagnostic panel.'
        );
      }
    } catch (err: any) {
      showToast('Retry Connection Failed', 'error', err?.message);
    } finally {
      setRetrying(false);
    }
  };

  const handleBootstrap = async () => {
    setBootstrapping(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/api/db/bootstrap', {
        method: 'POST',
      });
      await fetchHealth();
      showToast('MySQL Schema Initialized', 'success', res.message);
    } catch (err: any) {
      showToast('Bootstrap Failed', 'error', err?.message);
    } finally {
      setBootstrapping(false);
    }
  };

  if (!health) return null;

  const isConnected = health.mysql.connected === true && health.mysql.status === 'CONNECTED';
  const statusLabel = isConnected ? 'CONNECTED' : 'NOT CONNECTED';

  return (
    <>
      {!dismissed && (
        <div
          className={`border-b text-xs px-4 sm:px-6 py-2.5 transition-colors ${
            isConnected
              ? 'bg-emerald-950 text-emerald-100 border-emerald-800/70'
              : 'bg-stone-900 text-stone-200 border-stone-800'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}

              <span
                className={`font-mono font-bold tracking-wide shrink-0 ${
                  isConnected ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                MySQL 8: {statusLabel}
              </span>

              <span className="text-stone-500 hidden sm:inline">·</span>

              <span className="font-mono truncate text-stone-300">
                {isConnected ? (
                  <>
                    Server v{health.mysql.server_version} ({health.mysql.config.host}:
                    {health.mysql.config.port}/{health.mysql.config.database}) · 14 Relational
                    Tables Active
                  </>
                ) : (
                  <>
                    {health.mysql.error_code || 'DB_SETUP_REQUIRED'} —{' '}
                    {health.mysql.environment === 'cloud_preview' && !health.mysql.configured
                      ? 'Cloud Preview detected (configure remote DB_HOST in backend .env or run locally on macOS)'
                      : `${health.mysql.config.host}:${health.mysql.config.port}/${health.mysql.config.database} unreachable`}
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleRetryConnection}
                disabled={retrying}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold transition-colors whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Checking...' : 'Retry Connection'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors whitespace-nowrap"
              >
                Diagnostics & Setup Guide
              </button>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-stone-400 hover:text-white p-0.5"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900">
                      MySQL 8.0+ Connection Diagnostics
                    </h2>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isConnected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    GET /api/health · mysql2/promise Connection Pool · Backend-Only Credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Connection Status & Exact Error Diagnostic Panel */}
            <div className="mt-4 p-4 rounded-xl bg-stone-950 text-stone-100 border border-stone-800">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold tracking-wide text-white">
                    DEVELOPER DIAGNOSTIC PANEL
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-stone-400">
                    Env:{' '}
                    <strong className="text-stone-200">
                      {health.mysql.environment === 'cloud_preview'
                        ? 'Google AI Studio Cloud Preview'
                        : 'Local Development'}
                    </strong>
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    STATUS: {statusLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs font-mono border-b border-stone-800">
                <div>
                  <span className="text-stone-500 block">DB_HOST : DB_PORT</span>
                  <span className="text-stone-200">
                    {health.mysql.config.host}:{health.mysql.config.port}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">DB_NAME</span>
                  <span className="text-stone-200">{health.mysql.config.database}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">DB_USER</span>
                  <span className="text-stone-200">{health.mysql.config.user}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Checked At</span>
                  <span className="text-stone-200">
                    {new Date(health.mysql.checked_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {isConnected ? (
                <div className="mt-3 text-xs text-emerald-300 font-mono flex items-center justify-between">
                  <span>
                    ✓ Connected to MySQL Server {health.mysql.server_version}. All CRUD & ACID
                    transactions are persisted directly to {health.mysql.config.database}.
                  </span>
                </div>
              ) : (
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="text-amber-400 font-semibold">
                    Diagnostic Code: {health.mysql.error_code || 'NOT_CONNECTED'}
                  </div>
                  <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 leading-relaxed break-words">
                    {health.mysql.error_message ||
                      'MySQL 8 connection is not active. Configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME in your backend .env file.'}
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-stone-400 font-sans pt-1">
                    <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Honest Persistence Notice:</strong> While MySQL 8 is{' '}
                      <code>NOT CONNECTED</code>, the PizzaHub menu catalog and Ultra-HD photography
                      remain accessible for inspection, but new orders and customer registrations
                      will not falsely claim to be saved to MySQL.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRetryConnection}
                  disabled={retrying}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                  <span>{retrying ? 'Testing MySQL 8 Pool...' : 'Retry Connection'}</span>
                </button>

                {isConnected && (
                  <button
                    type="button"
                    onClick={handleBootstrap}
                    disabled={bootstrapping}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {bootstrapping
                        ? 'Executing schema.sql & seed.sql...'
                        : 'Initialize schema.sql + seed.sql'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Setup Guides: Local macOS vs. Cloud Preview */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                  <Laptop className="w-4 h-4 text-orange-600" />
                  <span>Option A: Local Development on macOS</span>
                </div>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  When running on your MacBook, <code>127.0.0.1:3306</code> connects directly to
                  your local MySQL 8 server:
                </p>
                <pre className="mt-2.5 p-2.5 rounded-lg bg-stone-900 text-stone-200 text-[11px] font-mono overflow-x-auto leading-relaxed">
{`# 1. Start MySQL 8 on macOS
brew services start mysql

# 2. Load 14-table schema & seed data
mysql -u root -p < database/schema.sql
mysql -u root -p pizzahub_db < database/seed.sql
mysql -u root -p pizzahub_db < database/views.sql
mysql -u root -p pizzahub_db < database/procedures.sql
mysql -u root -p pizzahub_db < database/triggers.sql`}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                  <Cloud className="w-4 h-4 text-orange-600" />
                  <span>Option B: Google AI Studio Cloud Preview</span>
                </div>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Cloud Preview runs inside a remote container whose <code>127.0.0.1</code> is not
                  your MacBook. Set backend environment variables to a remotely accessible MySQL 8
                  host (Aiven, Railway, PlanetScale, AWS RDS, or Cloud SQL):
                </p>
                <pre className="mt-2.5 p-2.5 rounded-lg bg-stone-900 text-stone-200 text-[11px] font-mono overflow-x-auto leading-relaxed">
{`DB_HOST=your-remote-mysql8.host.com
DB_PORT=3306
DB_USER=pizzahub_admin
DB_PASSWORD=your_secure_password
DB_NAME=pizzahub_db
JWT_SECRET=pizzahub_jwt_secret`}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-200 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-stone-400" />
                Credentials are stored strictly on the backend (.env)
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
