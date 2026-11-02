import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { DatabaseStatusBanner } from '../components/DatabaseStatusModal.tsx';

export function CustomerLayout() {
  const { user } = useAuth();
  const { totalItemsCount, finalAmount } = useCart();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <DatabaseStatusBanner />

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-4">
          {/* Zone 1: Single text element wordmark */}
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-stone-950 whitespace-nowrap shrink-0 font-display"
          >
            Pizza<span className="text-orange-500">Hub</span>
          </Link>

          {/* Zone 2: 5 single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <Link
              to="/"
              className={`hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/') ? 'text-orange-600 font-semibold underline underline-offset-8' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/menu"
              className={`hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/menu') ? 'text-orange-600 font-semibold underline underline-offset-8' : ''
              }`}
            >
              Menu
            </Link>
            <Link
              to="/orders"
              className={`hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/orders')
                  ? 'text-orange-600 font-semibold underline underline-offset-8'
                  : ''
              }`}
            >
              My Orders
            </Link>
            <Link
              to={user ? '/profile' : '/auth'}
              className={`hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/profile') || isActive('/auth')
                  ? 'text-orange-600 font-semibold underline underline-offset-8'
                  : ''
              }`}
            >
              {user ? user.full_name.split(' ')[0] : 'Sign In'}
            </Link>
            <Link
              to="/admin"
              className="hover:text-orange-600 transition-colors whitespace-nowrap shrink-0"
            >
              Admin Console
            </Link>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/cart"
              className="inline-flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart ({totalItemsCount})</span>
              {totalItemsCount > 0 && (
                <span className="font-mono">· ₹{finalAmount.toFixed(0)}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Secondary Nav */}
        <div className="flex md:hidden items-center justify-around border-t border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 bg-white">
          <Link to="/" className={isActive('/') ? 'text-orange-600 font-semibold' : ''}>
            Home
          </Link>
          <Link to="/menu" className={isActive('/menu') ? 'text-orange-600 font-semibold' : ''}>
            Menu
          </Link>
          <Link to="/orders" className={isActive('/orders') ? 'text-orange-600 font-semibold' : ''}>
            My Orders
          </Link>
          <Link
            to={user ? '/profile' : '/auth'}
            className={isActive('/profile') ? 'text-orange-600 font-semibold' : ''}
          >
            {user ? 'Profile' : 'Login'}
          </Link>
          <Link to="/admin" className="text-stone-900 font-semibold">
            Admin
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Restaurant Footer */}
      <footer className="bg-stone-950 text-stone-400 border-t border-stone-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="text-xl font-bold text-white font-display">
                Pizza<span className="text-orange-500">Hub</span>
              </div>
              <p className="text-sm text-stone-300 mt-1 font-medium">
                Fresh Pizza. Happy Moments.
              </p>
              <p className="text-xs text-stone-400 mt-3 max-w-md leading-relaxed">
                Artisanal wood-fired Neapolitan & gourmet pizzas crafted with Caputo Tipo 00 flour,
                San Marzano tomatoes, and fresh fior di latte mozzarella. Powered by a 14-table
                MySQL 8+ relational database management system.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-white tracking-wider uppercase mb-3">
                Customer Links
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/menu" className="hover:text-white transition-colors">
                    Explore Full Menu
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-white transition-colors">
                    Shopping Cart & Coupons
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-white transition-colors">
                    Track My Orders
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-white transition-colors">
                    Customer Profile & Addresses
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-white tracking-wider uppercase mb-3">
                DBMS Administration
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/admin" className="hover:text-white transition-colors">
                    Admin Analytics Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/admin/orders" className="hover:text-white transition-colors">
                    Order Status Workflow
                  </Link>
                </li>
                <li>
                  <Link to="/admin/inventory" className="hover:text-white transition-colors">
                    Kitchen Inventory & Triggers
                  </Link>
                </li>
                <li>
                  <Link to="/admin/reports" className="hover:text-white transition-colors">
                    Sales Reports & CSV Export
                  </Link>
                </li>
                <li>
                  <Link to="/admin/sql-lab" className="hover:text-orange-400 transition-colors">
                    SQL Queries, Procedures & Views Lab
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <p>© 2026 PizzaHub – Pizza Management System (College DBMS Mini Project).</p>
            <p className="font-mono">
              Database: pizzahub_db · 14 Tables · 5 Procedures · 2 Views · 2 Triggers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
