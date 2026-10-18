import { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  RefreshCw, 
  Terminal, 
  Copy, 
  Check
} from 'lucide-react';
import type { DatabaseStatus } from '../types';
import { api } from '../services/api';

interface SettingsProps {
  dbStatus: DatabaseStatus | null;
  onRefreshDbStatus: () => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  dbStatus,
  onRefreshDbStatus,
  onShowToast,
}) => {
  const [formData, setFormData] = useState({
    host: dbStatus?.mysql_config.host || 'localhost',
    port: dbStatus?.mysql_config.port || 3306,
    user: dbStatus?.mysql_config.user || 'root',
    password: '',
    database: dbStatus?.mysql_config.database || 'fuel_db',
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTestAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testAndConnectMySQL(formData);
      setTestResult({ success: true, message: res.message });
      onShowToast('success', 'MySQL Connected', res.message);
      onRefreshDbStatus();
    } catch (err: any) {
      const msg = err.message || 'Failed to connect to MySQL';
      setTestResult({ success: false, message: msg });
      onShowToast('error', 'MySQL Connection Failed', msg);
    } finally {
      setTesting(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset database with clean sample fleet data (5 vehicles + multi-month fuel logs)?')) return;
    setResetting(true);
    try {
      await api.resetDemoData();
      onShowToast('success', 'Sample Data Reset', 'Demo database restored to 5 vehicles and realistic fuel logs.');
      onRefreshDbStatus();
    } catch (err: any) {
      onShowToast('error', 'Reset Failed', err.message);
    } finally {
      setResetting(false);
    }
  };

  const copySqlCli = () => {
    const script = `mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS fuel_db; source backend/schema.sql;"`;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600" />
          Database Connection & Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          The system dynamically detects MySQL connectivity. If MySQL is not configured or unavailable,
          it operates seamlessly in Demonstration Mode using an embedded SQLite database with preloaded sample data.
        </p>
      </div>

      {/* Active Engine Card */}
      <div className={`
        rounded-2xl border p-5 transition-all
        ${dbStatus?.mysql_connected 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
          : 'bg-amber-50/70 border-amber-200 text-amber-950'}
      `}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${dbStatus?.mysql_connected ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">
                  {dbStatus?.mysql_connected ? 'MySQL 8.0+ Database Active' : 'Demonstration Mode (SQLite Engine Active)'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dbStatus?.mysql_connected ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                  {dbStatus?.mysql_connected ? 'Live Production DB' : 'Embedded Sample DB'}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">
                {dbStatus?.status_message}
              </p>
              {dbStatus?.connection_error && !dbStatus.mysql_connected && (
                <div className="mt-2 text-[11px] font-mono bg-white/70 p-2 rounded border border-amber-300/80 text-rose-800">
                  Last connection attempt error: {dbStatus.connection_error}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reload Sample Data'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MySQL Configuration Form */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Connect to MySQL Server</h3>
            <p className="text-xs text-slate-500">
              Provide your local or remote MySQL connection credentials
            </p>
          </div>

          <form onSubmit={handleTestAndConnect} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Host / Server</label>
                <input
                  type="text"
                  required
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="localhost or 127.0.0.1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Port</label>
                <input
                  type="number"
                  required
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">User</label>
                <input
                  type="text"
                  required
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  placeholder="root"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter MySQL password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Database Name</label>
              <input
                type="text"
                required
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                placeholder="fuel_db"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">If the database does not exist, the backend will auto-create it with utf8mb4 encoding.</p>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={testing}
              className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-sm hover:from-teal-700 hover:to-blue-700 transition-all disabled:opacity-50"
            >
              {testing ? 'Testing MySQL Connection...' : 'Test & Connect MySQL'}
            </button>
          </form>
        </div>

        {/* Step-by-Step MySQL Setup Guide */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-teal-600" />
              MySQL Quick Setup Instructions
            </h3>
            <p className="text-xs text-slate-500">
              Run these commands to initialize MySQL on your machine
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">1. Start MySQL Server</span>
              <p className="text-[11px] text-slate-500 mb-1.5">Make sure MySQL Service (e.g., MySQL 8.0, XAMPP, or WAMP) is running on port 3306.</p>
              <code className="text-teal-700 font-mono text-[11px] block bg-white p-1.5 rounded border border-slate-200">
                net start MySQL80  # or via Windows Services
              </code>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">2. Execute SQL Schema Script</span>
                <button
                  onClick={copySqlCli}
                  className="inline-flex items-center gap-1 text-[11px] text-teal-600 font-semibold hover:underline"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy command'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mb-1.5">A complete DDL schema script with tables and sample records is provided in <code className="text-slate-700 font-mono">backend/schema.sql</code>.</p>
              <code className="text-slate-800 font-mono text-[11px] block bg-white p-2 rounded border border-slate-200 break-all">
                mysql -u root -p &lt; backend/schema.sql
              </code>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">3. Environment Variables (Optional)</span>
              <p className="text-[11px] text-slate-500 mb-1">You can also export environment variables before starting Flask:</p>
              <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[11px] text-slate-700 space-y-0.5">
                <div>$env:MYSQL_HOST="localhost"</div>
                <div>$env:MYSQL_USER="root"</div>
                <div>$env:MYSQL_PASSWORD="your_password"</div>
                <div>$env:MYSQL_DB="fuel_db"</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
