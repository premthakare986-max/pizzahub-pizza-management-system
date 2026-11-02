import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../hooks/useToast.tsx';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('400050');

  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedInUser = await login(loginEmail, loginPassword);
      showToast(`Welcome back, ${loggedInUser.full_name}!`, 'success');
      if (loggedInUser.role === 'admin' && redirectPath === '/') {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err: any) {
      showToast('Authentication Failed', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFullName = fullName.trim();
    const cleanMobile = mobileNumber.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanAddress = streetAddress.trim();

    if (!cleanFullName) {
      showToast('Validation Error', 'error', 'Full Name is required.');
      return;
    }
    if (!cleanMobile) {
      showToast('Validation Error', 'error', 'Mobile Number is required.');
      return;
    }
    if (!cleanEmail) {
      showToast('Validation Error', 'error', 'Email Address is required.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      showToast('Validation Error', 'error', 'Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const createdUser = await register({
        full_name: cleanFullName,
        mobile_number: cleanMobile,
        phone: cleanMobile,
        email: cleanEmail,
        password: regPassword,
        address: cleanAddress || undefined,
        street_address: cleanAddress || undefined,
        city: cleanAddress ? city.trim() : undefined,
        state: cleanAddress ? state.trim() : undefined,
        postal_code: cleanAddress ? postalCode.trim() : undefined,
      });

      showToast(
        `Account created for ${createdUser.full_name}`,
        'success',
        cleanAddress
          ? 'Saved customer and default address to MySQL.'
          : 'Saved customer account to MySQL users table.'
      );
      navigate(redirectPath);
    } catch (err: any) {
      showToast('Registration Failed', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (email: string, pass: string, target: string) => {
    setSubmitting(true);
    try {
      const u = await login(email, pass);
      showToast(`Signed in as ${u.full_name}`, 'success');
      navigate(target);
    } catch (err: any) {
      showToast('Demo Login Failed', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Container */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Customer / Admin Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'register'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Create Customer Account
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Sign In to PizzaHub</h1>
                <p className="text-xs text-stone-500 mt-1">
                  Authenticated via bcrypt password verification and JWT Bearer tokens.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="aarav@example.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{submitting ? 'Verifying Credentials...' : 'Sign In'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Register Customer Account</h1>
                <p className="text-xs text-stone-500 mt-1">
                  Creates a new record in the MySQL <code>users</code> and <code>addresses</code>{' '}
                  tables inside an ACID transaction.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Riya Kapoor"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile_number"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91-9876501234"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address (UNIQUE) *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="riya.kapoor@example.com"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Password (min 6 chars) *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <div className="text-xs font-semibold text-stone-700 mb-2">
                  Default Delivery Address (Optional — saved to <code>addresses</code> table)
                </div>
                <input
                  type="text"
                  name="address"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Flat / Building / Street Name (Optional)"
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-orange-500 mb-3"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    name="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                  <input
                    type="text"
                    name="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                  <input
                    type="text"
                    name="postal_code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="PIN Code"
                    className="px-3 py-2 text-xs border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Creating Account...' : 'Create Customer Account'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Seeded Credentials Helper Panel */}
        <div className="lg:col-span-5 bg-stone-950 text-white rounded-2xl p-6 sm:p-7 border border-stone-800 space-y-5">
          <div className="flex items-center gap-2.5 text-orange-400">
            <KeyRound className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Seeded DBMS Test Accounts
            </span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Use these pre-populated accounts from <code>database/seed.sql</code> to test customer
            ordering, address management, or the Administrator dashboard:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-stone-900 border border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Customer Account</span>
                <span className="text-[11px] font-mono text-emerald-400">role: customer</span>
              </div>
              <div className="text-xs font-mono text-stone-400 mt-1.5 space-y-0.5">
                <div>Email: aarav@example.com</div>
                <div>Pass: Customer@123</div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin('aarav@example.com', 'Customer@123', redirectPath)
                }
                className="mt-3 w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-orange-500 text-white text-xs font-semibold transition-colors"
              >
                1-Click Login as Customer (Aarav)
              </button>
            </div>

            <div className="p-4 rounded-xl bg-stone-900 border border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Administrator Account</span>
                <span className="text-[11px] font-mono text-orange-400">role: admin</span>
              </div>
              <div className="text-xs font-mono text-stone-400 mt-1.5 space-y-0.5">
                <div>Email: admin@pizzahub.com</div>
                <div>Pass: Admin@123</div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@pizzahub.com', 'Admin@123', '/admin')}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
              >
                1-Click Login as Admin & Open Dashboard
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-800 flex items-start gap-2.5 text-[11px] text-stone-400">
            <Lock className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            <span>
              Passwords are stored as 60-character <code>bcrypt</code> hashes in{' '}
              <code>users.password_hash</code> and verified on the Express server.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
