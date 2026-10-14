// ============================================
// SIDEBAR.JSX - Tactile Navigation Sidebar
// Covers Syllabus:
// - Point 32-33: Functional Component & Reusability
// - Point 34: Props & State
// - Point 38: Role-based Conditional Rendering & Lists
// - Point 41: React Router NavLink navigation
// ============================================

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import ChangePasswordModal from '../auth/ChangePasswordModal.jsx';

export default function Sidebar({ onCloseMobile }) {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Navigation Items by Role
  const commonNav = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/catalog', label: 'Browse Items', icon: '📚' },
    { to: '/timeline', label: 'Booking Timeline', icon: '📅' },
    { to: '/waitlist', label: 'Waitlist', icon: '⏳' },
    { to: '/fines', label: 'Fines', icon: '💰' },
  ];

  const adminNav = [
    ...commonNav,
    { to: '/admin', label: 'Analytics', icon: '📈' },
    { to: '/admin/items', label: 'Manage Items', icon: '⚙️' },
    { to: '/admin/users', label: 'Manage Users', icon: '👥' },
  ];

  const labManagerNav = [
    ...commonNav,
    { to: '/admin', label: 'Analytics', icon: '📈' },
    { to: '/admin/items', label: 'Manage Items', icon: '🔧' },
  ];

  let navItems = commonNav;
  if (role === 'admin') navItems = adminNav;
  else if (role === 'lab_manager') navItems = labManagerNav;

  const roleDisplay = {
    student: 'Student',
    faculty: 'Faculty',
    admin: 'Administrator',
    lab_manager: 'Lab Manager',
  }[role] || 'Student';

  const roleAccent = {
    student: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
    faculty: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
    admin: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
    lab_manager: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  }[role] || 'bg-indigo-50 text-indigo-600';

  const userName = user?.name || 'User';
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <aside className="w-64 h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.10)] flex flex-col overflow-hidden">
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4648d4] to-[#8127cf] flex items-center justify-center text-white text-xl shadow-[0_8px_18px_rgba(70,72,212,0.25)] select-none">
            📚
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#4648d4] to-[#8127cf] bg-clip-text text-transparent">
              ResourceHub
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider font-semibold">
              LIBRARY &amp; LAB
            </p>
          </div>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Role Badge */}
      <div className="px-4 pt-4">
        <div className={`px-4 py-3 rounded-2xl ${roleAccent} border border-black/5 dark:border-white/5 shadow-sm`}>
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold opacity-70">
            Logged in as
          </p>
          <p className="text-sm font-bold mt-0.5">
            {roleDisplay}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 select-none ${
                isActive
                  ? 'bg-gradient-to-r from-[#4648d4] to-[#8127cf] text-white shadow-lg shadow-indigo-500/25 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile & Controls */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {userName}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-sm transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span>🔐</span>
            <span>Password</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        isForced={false}
      />
    </aside>
  );
}
