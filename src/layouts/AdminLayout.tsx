import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Pizza as PizzaIcon,
  FolderKanban,
  ShoppingBag,
  Users,
  Boxes,
  CreditCard,
  FileSpreadsheet,
  Database,
  LogOut,
  Store,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../hooks/useToast.tsx';
import { DatabaseStatusBanner } from '../components/DatabaseStatusModal.tsx';

export function AdminLayout() {
  const { user, login, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingInAdmin, setLoggingInAdmin] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/pizzas', label: 'Pizzas', icon: PizzaIcon },
    { path: '/admin/categories', label: 'Categories', icon: FolderKanban },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/admin/customers', label: 'Customers', icon: Users },
    { path: '/admin/inventory', label: 'Inventory', icon: Boxes },
    { path: '/admin/payments', label: 'Payments', icon: CreditCard },
    { path: '/admin/reports', label: 'Reports & CSV', icon: FileSpreadsheet },
    { path: '/admin/sql-lab', label: 'SQL & DBMS Lab', icon: Database },
  ];

  const handleQuickAdminLogin = async () => {
    setLoggingInAdmin(true);
    try {
      await login('admin@pizzahub.com', 'Admin@123');
      showToast('Authenticated as Administrator', 'success', 'Vikramaditya Kulkarni (Admin)');
    } catch (err: any) {
      showToast('Admin Login Failed', 'error', err?.message);
    } finally {
      setLoggingInAdmin(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out of Admin Console', 'info');
    navigate('/');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-stone-950 text-white">
        <DatabaseStatusBanner />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Console Authentication</h1>
            <p className="text-sm text-stone-400 mt-2 leading-relaxed">
              This section requires Administrator privileges (<code>users.role = 'admin'</code>).
              Click below to authenticate with the seeded Admin account from{' '}
              <code>database/seed.sql</code>.
            </p>

            <div className="mt-5 p-3.5 rounded-xl bg-stone-950 border border-stone-800 font-mono text-xs text-stone-300 space-y-1">
              <div>Email: admin@pizzahub.com</div>
              <div>Password: Admin@123</div>
              <div>Role: admin</div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={handleQuickAdminLogin}
                disabled={loggingInAdmin}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loggingInAdmin
                  ? 'Authenticating Admin JWT...'
                  : '1-Click Sign In as Administrator'}
              </button>
              <Link
                to="/auth"
                className="w-full py-2.5 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-medium text-center transition-colors"
              >
                Go to Standard Login Page
              </Link>
              <Link
                to="/"
                className="w-full py-2 text-stone-400 hover:text-white text-xs text-center transition-colors"
              >
                ← Back to Customer Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F2] text-stone-900">
      <DatabaseStatusBanner />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Navigation (260px width) */}
        <aside className="w-full lg:w-64 bg-stone-950 text-stone-300 flex flex-col justify-between shrink-0 border-b lg:border-b-0 lg:border-r border-stone-800">
          <div>
            <div className="px-6 py-5 border-b border-stone-800 flex items-center justify-between">
              <Link to="/admin" className="text-lg font-bold text-white font-display">
                Pizza<span className="text-orange-500">Hub</span>{' '}
                <span className="text-xs font-mono font-normal text-stone-400 ml-1">DBMS</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                Storefront
              </Link>
            </div>

            <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-orange-500 text-white font-semibold'
                        : 'text-stone-400 hover:text-white hover:bg-stone-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:block p-4 border-t border-stone-800">
            <div className="px-3 py-2 mb-2">
              <div className="text-xs font-semibold text-white truncate">{user.full_name}</div>
              <div className="text-[11px] font-mono text-stone-400 truncate">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header with Breadcrumbs */}
          <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between gap-4">
            <div className="text-xs text-stone-500 font-medium">
              <span>Admin Console</span>
              <span className="mx-2">/</span>
              <span className="text-stone-900 font-semibold">
                {navItems.find((i) =>
                  i.exact
                    ? location.pathname === i.path
                    : location.pathname.startsWith(i.path)
                )?.label || 'Overview'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/menu"
                className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-medium text-stone-700 whitespace-nowrap"
              >
                View Live Menu
              </Link>
              <button
                onClick={handleLogout}
                className="lg:hidden px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium"
              >
                Logout
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
