import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, BedDouble, FileText, Globe, Bell, TrendingUp, Sparkles, Network, MessageSquare, ShieldCheck, Zap, ShieldAlert, Menu, X, Sun, Moon, Package, Wallet, ShoppingCart, Archive, Shirt, ClipboardList, SearchCheck, CalendarClock, MailOpen, Award, Wrench, ChefHat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopbarAttendanceClock from '../components/TopbarAttendanceClock';
import { supabase } from '../lib/supabase';

const AdminLayout = () => {
  const { user, hasRole, hasAccess, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const theme = localStorage.getItem('system_theme') || 'theme-luxe-gold';
    return theme === 'theme-slate-dark';
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const [brandLogo, setBrandLogo] = useState('');

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'contact_logo')
          .single();
        if (data && data.setting_value) {
          setBrandLogo(data.setting_value);
        }
      } catch (e) {}
    };
    fetchLogo();
  }, []);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

  // Fetch real-time unread messages count matching direct recipient or group broadcast roles
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select('id, sender_id, recipient_id, recipient_role, is_read, priority')
        .eq('is_read', false);

      if (error) throw error;

      // Client-side filtering for security and DM/group message role isolation
      const unread = (data || []).filter(m => {
        if (m.recipient_id === user.id) {
          return true; // Peer-to-peer DM directly to me
        }
        if (m.recipient_role && m.sender_id !== user.id) {
          const isMyRole = m.recipient_role === 'all' || m.recipient_role === user.role;
          // Count channel alerts if high/urgent priority (same logic as getChannelUnreadCount)
          return isMyRole && m.priority !== 'normal';
        }
        return false;
      });

      setUnreadCount(unread.length);
    } catch (err) {
      console.warn("Failed to fetch unread count:", err.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchUnreadCount();

    // Supabase Postgres Changes real-time event listener channel
    const channel = supabase
      .channel('internal_messages_topbar_sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'internal_messages' 
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    // Fail-safe background fallback polling interval (throttled to 2 minutes as real-time WS is active)
    const interval = setInterval(fetchUnreadCount, 120000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const isActive = (path) => location.pathname === path;
  const linkClass = (path) => `flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 ${isActive(path) ? 'bg-gradient-to-r from-brand-900/35 to-brand-850/10 border-l-4 border-brand-500 text-brand-400 font-bold shadow-md' : 'text-gray-400 border-l-4 border-transparent hover:text-white hover:bg-dark-700/35 hover:translate-x-1.5'}`;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show access denied only if they are logged in but lack permissions
  if (user.role === 'guest') {
    return (
      <div className="h-screen bg-dark-900 flex flex-col items-center justify-center text-white">
        <h2 className="text-3xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-8">You do not have permission to view the admin dashboard.</p>
        <Link to="/" className="bg-brand-500 text-white px-6 py-2 rounded">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center border-b border-dark-700/50">
          <Link to="/" className="flex items-center gap-2">
            {brandLogo ? (
              <img src={brandLogo} alt="Logo" className="h-8 max-w-[150px] object-contain" />
            ) : (
              <>
                <svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 10 L10 90 L35 90 L60 40 Z" fill="#DF6853"/>
                  <path d="M40 90 L90 90 L75 60 L50 90 Z" fill="#DF6853"/>
                  <path d="M25 15 L28 25 L38 28 L28 31 L25 41 L22 31 L12 28 L22 25 Z" fill="#DF6853"/>
                </svg>
                <div className="flex flex-col justify-center">
                  <span className="text-[16px] font-sans font-extrabold text-gray-900 dark:text-white leading-none tracking-wide">SPARKLES</span>
                  <span className="text-[8px] font-sans text-gray-500 dark:text-gray-400 leading-tight tracking-[0.25em] mt-1">APARTMENTS</span>
                </div>
              </>
            )}
          </Link>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={closeMobileMenu}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-4.5 overflow-y-auto custom-scrollbar select-none">
          
          {/* CATEGORY 1: OVERVIEW & COMMS */}
          {(hasAccess('Dashboard') || hasAccess('Internal Messaging') || hasAccess('Reminders') || hasAccess('Reports & Analytics') || hasAccess('Duty Logs') || hasAccess('Monthly Reports')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">Overview & Comms</h4>
              <div className="space-y-0.5">
                {hasAccess('Dashboard') && (
                  <Link to="/admin" className={linkClass('/admin')}>
                    <LayoutDashboard size={16} />
                    <span className="text-xs font-semibold">Live Dashboard</span>
                  </Link>
                )}
                {hasAccess('Internal Messaging') && (
                  <Link to="/admin/messages" className={linkClass('/admin/messages')}>
                    <MessageSquare size={16} />
                    <span className="text-xs font-semibold">Internal Messaging</span>
                  </Link>
                )}
                {hasAccess('Reminders') && (
                  <Link to="/admin/reminders" className={linkClass('/admin/reminders')}>
                    <CalendarClock size={16} />
                    <span className="text-xs font-semibold">Schedules & Reminders</span>
                  </Link>
                )}
                {hasAccess('Reports & Analytics') && (
                  <Link to="/admin/reports" className={linkClass('/admin/reports')}>
                    <TrendingUp size={16} />
                    <span className="text-xs font-semibold">Reports & Analytics</span>
                  </Link>
                )}
                {hasAccess('Duty Logs') && (
                  <Link to="/admin/duty-reports" className={linkClass('/admin/duty-reports')}>
                    <ClipboardList size={16} />
                    <span className="text-xs font-semibold">Duty Manager Logs</span>
                  </Link>
                )}
                {hasAccess('Monthly Reports') && (
                  <Link to="/admin/monthly-reports" className={linkClass('/admin/monthly-reports')}>
                    <MailOpen size={16} />
                    <span className="text-xs font-semibold">Monthly Reports Dispatch</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 2: FRONT OFFICE */}
          {(hasAccess('Front Desk') || hasAccess('CRM & Guests') || hasAccess('Lost & Found') || hasAccess('Reservations')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">Front Office</h4>
              <div className="space-y-0.5">
                {hasAccess('Front Desk') && (
                  <Link to="/admin/frontdesk" className={linkClass('/admin/frontdesk')}>
                    <Bell size={16} />
                    <span className="text-xs font-semibold">Front Desk Reception</span>
                  </Link>
                )}
                {hasAccess('Reservations') && (
                  <Link to="/admin/reservations" className={linkClass('/admin/reservations')}>
                    <CalendarDays size={16} />
                    <span className="text-xs font-semibold">Suite Bookings (Reservations)</span>
                  </Link>
                )}
                {hasAccess('CRM & Guests') && (
                  <Link to="/admin/crm" className={linkClass('/admin/crm')}>
                    <Users size={16} />
                    <span className="text-xs font-semibold">CRM Guest Directory</span>
                  </Link>
                )}
                {hasAccess('Lost & Found') && (
                  <Link to="/admin/lost-found" className={linkClass('/admin/lost-found')}>
                    <SearchCheck size={16} />
                    <span className="text-xs font-semibold">Lost & Found Registry</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 3: HOTEL OPERATIONS */}
          {(hasAccess('Housekeeping') || hasAccess('Laundry') || hasAccess('Store Keeping') || hasAccess('Maintenance')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">Hotel Operations</h4>
              <div className="space-y-0.5">
                {hasAccess('Housekeeping') && (
                  <Link to="/admin/housekeeping" className={linkClass('/admin/housekeeping')}>
                    <Sparkles size={16} />
                    <span className="text-xs font-semibold">Housekeeping Cleaning</span>
                  </Link>
                )}
                {hasAccess('Laundry') && (
                  <Link to="/admin/laundry" className={linkClass('/admin/laundry')}>
                    <Shirt size={16} />
                    <span className="text-xs font-semibold">Laundry Department</span>
                  </Link>
                )}
                {hasAccess('Maintenance') && (
                  <Link to="/admin/maintenance" className={linkClass('/admin/maintenance')}>
                    <Wrench size={16} />
                    <span className="text-xs font-semibold">Maintenance Department</span>
                  </Link>
                )}
                {(hasAccess('Store Keeping') || user?.role === 'super_admin') && (
                  <Link to="/admin/store" className={linkClass('/admin/store')}>
                    <Archive size={16} />
                    <span className="text-xs font-semibold">Stores & Warehouses</span>
                  </Link>
                )}
                {(hasAccess('Restaurant Desk') || hasAccess('Kitchen Desk') || hasAccess('Order History') || user?.role === 'super_admin') && (
                  <Link to="/admin/restaurant" className={linkClass('/admin/restaurant')}>
                    <ChefHat size={16} />
                    <span className="text-xs font-semibold">Restaurant & Kitchen</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 4: POINT OF SALE */}
          {(hasAccess('POS') || user?.role === 'super_admin') && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">Point of Sale</h4>
              <div className="space-y-0.5">
                <Link to="/admin/pos" className={linkClass('/admin/pos')}>
                  <ShoppingCart size={16} />
                  <span className="text-xs font-semibold">POS Checkouts Terminal</span>
                </Link>
              </div>
            </div>
          )}

          {/* CATEGORY 5: FINANCE & AUDITS */}
          {(hasAccess('Finance & Billing') || hasAccess('Accounting')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">Finance & Auditing</h4>
              <div className="space-y-0.5">
                {hasAccess('Finance & Billing') && (
                  <Link to="/admin/billing" className={linkClass('/admin/billing')}>
                    <FileText size={16} />
                    <span className="text-xs font-semibold">Folios & Billings</span>
                  </Link>
                )}
                {hasAccess('Accounting') && (
                  <Link to="/admin/accounting" className={linkClass('/admin/accounting')}>
                    <Wallet size={16} />
                    <span className="text-xs font-semibold">General Ledger & Accounts</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 6: SYSTEM CONTROL */}
          {(hasAccess('Rooms') || user?.role === 'super_admin' || hasAccess('Channel Manager') || hasAccess('Staff & Roles') || hasAccess('Website CMS') || hasAccess('Settings')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">System Control</h4>
              <div className="space-y-0.5">
                {(hasAccess('Rooms') || user?.role === 'super_admin') && (
                  <Link to="/admin/rooms" className={linkClass('/admin/rooms')}>
                    <BedDouble size={16} />
                    <span className="text-xs font-semibold">Rooms & Inventory</span>
                  </Link>
                )}
                {hasAccess('Channel Manager') && (
                  <Link to="/admin/channel-manager" className={linkClass('/admin/channel-manager')}>
                    <Network size={16} />
                    <span className="text-xs font-semibold">Channel Manager Sync</span>
                  </Link>
                )}
                {hasAccess('Staff & Roles') && (
                  <Link to="/admin/staff" className={linkClass('/admin/staff')}>
                    <ShieldCheck size={16} />
                    <span className="text-xs font-semibold">Staff & Security Matrix</span>
                  </Link>
                )}
                {hasAccess('Website CMS') && (
                  <Link to="/admin/cms" className={linkClass('/admin/cms')}>
                    <Globe size={16} />
                    <span className="text-xs font-semibold">Website CMS Manager</span>
                  </Link>
                )}
                {hasAccess('Settings') && (
                  <Link to="/admin/settings" className={linkClass('/admin/settings')}>
                    <Settings size={16} />
                    <span className="text-xs font-semibold">System Settings</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-dark-700/50">
          <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 w-full text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300">
            <LogOut size={20} />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-dark-900 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="glass-panel sticky top-0 z-30 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleMobileMenu}
              className="p-1 -ml-1 md:hidden text-gray-400 hover:text-white rounded-md hover:bg-dark-700 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-medium hidden sm:block">Property Management System</h2>
            <h2 className="text-xl font-medium sm:hidden">PMS</h2>
            <span className="bg-brand-500/20 text-brand-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider hidden sm:inline-block">
              {user?.role.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <TopbarAttendanceClock />
            
            {/* Topbar Operations Chat Notification Hub */}
            {hasAccess('Internal Messaging') && (
              <Link 
                to="/admin/messages" 
                className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-dark-700 transition-all duration-300 active:scale-95 group"
                title="Operations Chat Terminal"
              >
                <MessageSquare size={20} className="group-hover:rotate-[10deg] transition-transform duration-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black tracking-tighter px-1 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-dark-700 transition-colors">
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="text-right mr-2 hidden md:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-full flex items-center justify-center text-white shadow-lg font-bold">
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
