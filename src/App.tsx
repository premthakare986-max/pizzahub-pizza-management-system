/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ToastProvider } from './hooks/useToast.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { CustomerLayout } from './layouts/CustomerLayout.tsx';
import { AdminLayout } from './layouts/AdminLayout.tsx';

// Customer Pages
import { HomePage } from './pages/HomePage.tsx';
import { MenuPage } from './pages/MenuPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { MyOrdersPage } from './pages/MyOrdersPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx';
import { AdminPizzasPage } from './pages/admin/AdminPizzasPage.tsx';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage.tsx';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage.tsx';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage.tsx';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage.tsx';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage.tsx';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.tsx';
import { AdminSqlLabPage } from './pages/admin/AdminSqlLabPage.tsx';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                {/* Customer Storefront Routes */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<MyOrdersPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>

                {/* Admin Dashboard Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="pizzas" element={<AdminPizzasPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="inventory" element={<AdminInventoryPage />} />
                  <Route path="payments" element={<AdminPaymentsPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="sql-lab" element={<AdminSqlLabPage />} />
                </Route>

                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
