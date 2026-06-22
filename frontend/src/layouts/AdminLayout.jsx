import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, BedDouble, FileText, Globe, Bell, TrendingUp, Sparkles, Network, MessageSquare, ShieldCheck, Zap, ShieldAlert, Menu, X, Sun, Moon, Package, Wallet, ShoppingCart, Archive, Shirt, ClipboardList, SearchCheck, CalendarClock, MailOpen, Award, Wrench, ChefHat, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopbarAttendanceClock from '../components/TopbarAttendanceClock';
import { supabase } from '../lib/supabase';
import { getDefaultAdminRoute } from '../utils/routes';

const ROUTE_PERMISSIONS = {
  '/admin/frontdesk': 'Front Desk',
  '/admin/reservations': 'Reservations',
  '/admin/crm': 'CRM & Guests',
  '/admin/lost-found': 'Lost & Found',
  '/admin/housekeeping': 'Housekeeping',
  '/admin/laundry': 'Laundry',
  '/admin/maintenance': 'Maintenance',
  '/admin/store': 'Store Keeping',
  '/admin/restaurant': ['Restaurant Desk', 'Kitchen Desk', 'Order History'],
  '/admin/pos': 'POS',
  '/admin/billing': 'Finance & Billing',
  '/admin/accounting': 'Accounting',
  '/admin/rooms': 'Rooms',
  '/admin/channel-manager': 'Channel Manager',
  '/admin/staff': ['Staff & Roles', 'Leave & Absences - Request Leave of Absence', 'Leave & Absences - Review Leave Applications'],
  '/admin/cms': 'Website CMS',
  '/admin/settings': 'Settings',
  '/admin/duty-reports': 'Duty Logs',
  '/admin/reminders': 'Reminders',
  '/admin/messages': 'Internal Messaging',
  '/admin/monthly-reports': 'Monthly Reports',
  '/admin/services': 'Guest Services',
  '/admin/services-portal': 'Service Portals',
  '/admin/automations': 'Automations & Alerts',
  '/admin/security': 'Security & Privacy',
  '/admin/calendar': 'Reservations',
};

const MODULE_SUBPERMISSIONS = {
  'Dashboard': [
    'Dashboard - View Room Grid Matrix',
    'Dashboard - View Operations Statistics'
  ],
  'Reservations': [
    'Reservations - Manage Bookings',
    'Reservations - Handle Room Assignments'
  ],
  'Front Desk': [
    'Front Desk - Create Booking & Check-in',
    'Front Desk - Override Room Rates & Invoicing'
  ],
  'Housekeeping': [
    'Housekeeping - Perform Room Cleaning',
    'Housekeeping - Assign Tasks to Staff',
    'Housekeeping - Inspect & Approve Clean Rooms'
  ],
  'CRM & Guests': [
    'CRM & Guests - Manage Profiles',
    'CRM & Guests - View Guest History'
  ],
  'Finance & Billing': [
    'Finance - Manage General Ledgers & Payroll',
    'Finance - Process Refunds & Adjustments'
  ],
  'Accounting': [
    'Accounting - Settle Ledger',
    'Accounting - View General Ledger Logs'
  ],
  'Channel Manager': [
    'Channel Manager - Sync Channels',
    'Channel Manager - Adjust External Rates'
  ],
  'Reports & Analytics': [
    'Reports & Analytics - View Revenue Reports',
    'Reports & Analytics - Export Financial Sheets'
  ],
  'Staff & Roles': [
    'Staff & Roles - Onboard Staff',
    'Staff & Roles - Modify Access Policies'
  ],
  'Website CMS': [
    'Website CMS - Edit General Pages',
    'Website CMS - Update Banner Announcements'
  ],
  'Settings': [
    'Settings - Update System Profile',
    'Automations & Alerts',
    'Security & Privacy'
  ],
  'Store Keeping': [
    'Store Keeping - Log Requisitions',
    'Store Keeping - Register & Restock Items',
    'Store Keeping - Approve Outgoing Material Releases'
  ],
  'POS': [
    'POS - Process Sales & Suite Charging',
    'POS - Manage Menu Items & Custom Pricing'
  ],
  'Guest Services': [
    'Guest Services - Request Amenities',
    'Guest Services - Verify Active Orders'
  ],
  'Laundry': [
    'Laundry - Process Laundry Orders',
    'Laundry - Post Folio Charges',
    'Laundry - Register Walk-in Sales'
  ],
  'Leave & Absences': [
    'Leave & Absences - Request Leave of Absence',
    'Leave & Absences - Review Leave Applications'
  ],
  'Duty Logs': [
    'Duty Logs - Submit Shift Handover',
    'Duty Logs - Review Historical Logs'
  ],
  'Lost & Found': [
    'Lost & Found - Register Found Items',
    'Lost & Found - Notify Guest & Settle Claims',
    'Lost & Found - Dispose Items'
  ],
  'Reminders': [
    'Reminders - Create & Edit Schedules',
    'Reminders - Settle Payments & Sync Ledger'
  ],
  'Internal Messaging': [
    'Internal Messaging - Broadcast Announcements',
    'Internal Messaging - Send Direct Messages'
  ],
  'Monthly Reports': [
    'Monthly Reports - Submit Departmental Report',
    'Monthly Reports - View Performance Analytics'
  ],
  'Maintenance': [
    'Maintenance - Manage Tickets & Fixes',
    'Maintenance - Manage Professionals',
    'Maintenance - Manage Purchases & Payments'
  ],
  'Service Portals': [
    'Service Portals - Airport Pickup Service',
    'Service Portals - Spa & Massage',
    'Service Portals - Swimming Pool',
    'Service Portals - Walk-in Direct Register',
    'Service Portals - Close of Day Compiler'
  ],
};

const AdminLayout = () => {
  const { user, hasRole, hasAccess, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const theme = localStorage.getItem('system_theme') || 'theme-luxe-gold';
    return theme === 'theme-slate-dark';
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const [brandLogo, setBrandLogo] = useState(() => localStorage.getItem('contact_logo') || '');

  const hasAnyAccess = (permissionName) => {
    if (!permissionName) return false;
    if (Array.isArray(permissionName)) {
      return permissionName.some(p => hasAnyAccess(p));
    }
    if (hasAccess(permissionName)) return true;
    const subs = MODULE_SUBPERMISSIONS[permissionName];
    if (subs) {
      return subs.some(sub => hasAccess(sub));
    }
    return false;
  };

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
          localStorage.setItem('contact_logo', data.setting_value);
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

  // If visiting the base /admin path and doesn't have Dashboard access, redirect to first allowed route
  if ((location.pathname === '/admin' || location.pathname === '/admin/') && !hasAnyAccess('Dashboard') && user.role !== 'super_admin' && user.role !== 'hotel_owner') {
    const fallbackPath = getDefaultAdminRoute(user.role, hasAnyAccess);
    if (fallbackPath && fallbackPath !== '/admin' && fallbackPath !== '/admin/') {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Centered Permission Route Guard
  const currentPath = location.pathname.replace(/\/$/, ''); // Remove trailing slash
  let requiredPermission = ROUTE_PERMISSIONS[currentPath];
  
  if (!requiredPermission) {
    // Check dynamic routes / prefixes
    const matchingKey = Object.keys(ROUTE_PERMISSIONS).find(key => currentPath.startsWith(key + '/'));
    if (matchingKey) {
      requiredPermission = ROUTE_PERMISSIONS[matchingKey];
    }
  }

  let isRouteForbidden = false;
  if (requiredPermission && user.role !== 'super_admin' && user.role !== 'hotel_owner') {
    isRouteForbidden = !hasAnyAccess(requiredPermission);
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
              <img src={brandLogo} alt="Logo" className="h-12 max-w-[180px] w-full object-contain" />
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
          {(hasAnyAccess('Dashboard') || hasAnyAccess('Internal Messaging') || hasAnyAccess('Reminders') || hasAnyAccess('Reports & Analytics') || hasAnyAccess('Duty Logs') || hasAnyAccess('Monthly Reports')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">Overview & Comms</h4>
              <div className="space-y-0.5">
                {hasAnyAccess('Dashboard') && (
                  <Link to="/admin" className={linkClass('/admin')}>
                    <LayoutDashboard size={16} />
                    <span className="text-xs font-semibold">Live Dashboard</span>
                  </Link>
                )}
                {hasAnyAccess('Internal Messaging') && (
                  <Link to="/admin/messages" className={linkClass('/admin/messages')}>
                    <MessageSquare size={16} />
                    <span className="text-xs font-semibold">Internal Messaging</span>
                  </Link>
                )}
                {hasAnyAccess('Reminders') && (
                  <Link to="/admin/reminders" className={linkClass('/admin/reminders')}>
                    <CalendarClock size={16} />
                    <span className="text-xs font-semibold">Schedules & Reminders</span>
                  </Link>
                )}
                {hasAnyAccess('Reports & Analytics') && (
                  <Link to="/admin/reports" className={linkClass('/admin/reports')}>
                    <TrendingUp size={16} />
                    <span className="text-xs font-semibold">Reports & Analytics</span>
                  </Link>
                )}
                {hasAnyAccess('Duty Logs') && (
                  <Link to="/admin/duty-reports" className={linkClass('/admin/duty-reports')}>
                    <ClipboardList size={16} />
                    <span className="text-xs font-semibold">Duty Manager Logs</span>
                  </Link>
                )}
                {hasAnyAccess('Monthly Reports') && (
                  <Link to="/admin/monthly-reports" className={linkClass('/admin/monthly-reports')}>
                    <MailOpen size={16} />
                    <span className="text-xs font-semibold">Monthly Reports Dispatch</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 2: FRONT OFFICE */}
          {(hasAnyAccess('Front Desk') || hasAnyAccess('CRM & Guests') || hasAnyAccess('Lost & Found') || hasAnyAccess('Reservations')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">Front Office</h4>
              <div className="space-y-0.5">
                {hasAnyAccess('Front Desk') && (
                  <Link to="/admin/frontdesk" className={linkClass('/admin/frontdesk')}>
                    <Bell size={16} />
                    <span className="text-xs font-semibold">Front Desk Reception</span>
                  </Link>
                )}
                {hasAnyAccess('Reservations') && (
                  <Link to="/admin/reservations" className={linkClass('/admin/reservations')}>
                    <CalendarDays size={16} />
                    <span className="text-xs font-semibold">Suite Bookings (Reservations)</span>
                  </Link>
                )}
                {hasAnyAccess('CRM & Guests') && (
                  <Link to="/admin/crm" className={linkClass('/admin/crm')}>
                    <Users size={16} />
                    <span className="text-xs font-semibold">CRM Guest Directory</span>
                  </Link>
                )}
                {hasAnyAccess('Lost & Found') && (
                  <Link to="/admin/lost-found" className={linkClass('/admin/lost-found')}>
                    <SearchCheck size={16} />
                    <span className="text-xs font-semibold">Lost & Found Registry</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 3: HOTEL OPERATIONS */}
          {(hasAnyAccess('Housekeeping') || hasAnyAccess('Laundry') || hasAnyAccess('Store Keeping') || hasAnyAccess('Maintenance') || hasAnyAccess('Restaurant Desk') || hasAnyAccess('Kitchen Desk') || hasAnyAccess('Order History') || hasAnyAccess('Guest Services')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">Hotel Operations</h4>
              <div className="space-y-0.5">
                {hasAnyAccess('Housekeeping') && (
                  <Link to="/admin/housekeeping" className={linkClass('/admin/housekeeping')}>
                    <Sparkles size={16} />
                    <span className="text-xs font-semibold">Housekeeping Cleaning</span>
                  </Link>
                )}
                {hasAnyAccess('Laundry') && (
                  <Link to="/admin/laundry" className={linkClass('/admin/laundry')}>
                    <Shirt size={16} />
                    <span className="text-xs font-semibold">Laundry Department</span>
                  </Link>
                )}
                {hasAnyAccess('Maintenance') && (
                  <Link to="/admin/maintenance" className={linkClass('/admin/maintenance')}>
                    <Wrench size={16} />
                    <span className="text-xs font-semibold">Maintenance Department</span>
                  </Link>
                )}
                {(hasAnyAccess('Store Keeping') || user?.role === 'super_admin') && (
                  <Link to="/admin/store" className={linkClass('/admin/store')}>
                    <Archive size={16} />
                    <span className="text-xs font-semibold">Stores & Warehouses</span>
                  </Link>
                )}
                {(hasAnyAccess('Restaurant Desk') || hasAnyAccess('Kitchen Desk') || hasAnyAccess('Order History') || user?.role === 'super_admin') && (
                  <Link to="/admin/restaurant" className={linkClass('/admin/restaurant')}>
                    <ChefHat size={16} />
                    <span className="text-xs font-semibold">Restaurant & Kitchen</span>
                  </Link>
                )}
                {(hasAnyAccess('Service Portals') || user?.role === 'super_admin') && (
                  <Link to="/admin/services-portal" className={linkClass('/admin/services-portal')}>
                    <Compass size={16} />
                    <span className="text-xs font-semibold">🛎️ Service Portals</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 4: POINT OF SALE */}
          {(hasAnyAccess('POS') || user?.role === 'super_admin') && (
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
          {(hasAnyAccess('Finance & Billing') || hasAnyAccess('Accounting')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">Finance & Auditing</h4>
              <div className="space-y-0.5">
                {hasAnyAccess('Finance & Billing') && (
                  <Link to="/admin/billing" className={linkClass('/admin/billing')}>
                    <FileText size={16} />
                    <span className="text-xs font-semibold">Folios & Billings</span>
                  </Link>
                )}
                {hasAnyAccess('Accounting') && (
                  <Link to="/admin/accounting" className={linkClass('/admin/accounting')}>
                    <Wallet size={16} />
                    <span className="text-xs font-semibold">General Ledger & Accounts</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 6: SYSTEM CONTROL */}
          {(hasAnyAccess('Rooms') || user?.role === 'super_admin' || hasAnyAccess('Channel Manager') || hasAnyAccess('Staff & Roles') || hasAnyAccess('Leave & Absences') || hasAnyAccess('Website CMS') || hasAnyAccess('Settings')) && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-brand-500/85 uppercase tracking-widest px-3 pt-2 pb-1">System Control</h4>
              <div className="space-y-0.5">
                {(hasAnyAccess('Rooms') || user?.role === 'super_admin') && (
                  <Link to="/admin/rooms" className={linkClass('/admin/rooms')}>
                    <BedDouble size={16} />
                    <span className="text-xs font-semibold">Rooms, Halls & Inventory</span>
                  </Link>
                )}
                {hasAnyAccess('Channel Manager') && (
                  <Link to="/admin/channel-manager" className={linkClass('/admin/channel-manager')}>
                    <Network size={16} />
                    <span className="text-xs font-semibold">Channel Manager Sync</span>
                  </Link>
                )}
                {(hasAnyAccess('Staff & Roles') || hasAccess('Leave & Absences - Request Leave of Absence') || hasAccess('Leave & Absences - Review Leave Applications')) && (
                  <Link to="/admin/staff" className={linkClass('/admin/staff')}>
                    <ShieldCheck size={16} />
                    <span className="text-xs font-semibold">Staff & Security Matrix</span>
                  </Link>
                )}
                {hasAnyAccess('Website CMS') && (
                  <Link to="/admin/cms" className={linkClass('/admin/cms')}>
                    <Globe size={16} />
                    <span className="text-xs font-semibold">Website CMS Manager</span>
                  </Link>
                )}
                {hasAnyAccess('Settings') && (
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
            {hasAnyAccess('Internal Messaging') && (
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
        <div className="p-4 md:p-8 flex-1 flex flex-col min-w-0">
          {isRouteForbidden ? (
            <div className="m-auto glass-panel text-center p-8 rounded-2xl max-w-md w-full border border-dark-700 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-6 font-medium">
                Your role does not have permission to view the <strong>{Array.isArray(requiredPermission) ? requiredPermission.join(' / ') : requiredPermission}</strong> module.
              </p>
              <p className="text-gray-500 text-xs mb-8">
                Please contact the hotel administrator to adjust your dynamic security permissions matrix.
              </p>
              <button 
                type="button"
                onClick={() => {
                  window.location.href = getDefaultAdminRoute(user.role, hasAccess);
                }}
                className="bg-brand-500 hover:bg-brand-600 text-dark-950 font-bold px-6 py-3 rounded-xl transition-all"
              >
                Go to my Department Home
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
