// ============================================
// APPLAYOUT.JSX - Master Application Layout
// Covers Syllabus:
// - Point 42: Route Parameters & Nested Routes (Outlet)
// - Point 32-33: Functional Component & Layout Composition
// - Point 35: useState for Mobile Menu State
// - Point 46: Forced Password Change UI Guard
// ============================================

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import ChangePasswordModal from '../components/auth/ChangePasswordModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mustChangePassword } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      {/* Mobile Top Navbar */}
      <Navbar onOpenMobile={() => setMobileOpen(true)} />

      {/* Desktop Sidebar (Fixed Left) */}
      <div className="hidden md:block fixed top-4 bottom-4 left-4 z-30">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 p-4 max-w-xs w-full">
            <Sidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <main className="flex-1 md:pl-72 p-4 md:p-8 min-h-screen overflow-x-hidden">
        <div className="max-w-7xl mx-auto pb-12">
          <Outlet />
        </div>
      </main>

      {/* Forced Password Change Modal */}
      {mustChangePassword && <ChangePasswordModal isOpen={true} isForced={true} />}
    </div>
  );
}
