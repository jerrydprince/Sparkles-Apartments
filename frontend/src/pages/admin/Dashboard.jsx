import React, { useState, useEffect } from 'react';
import { Users, CalendarDays, DollarSign, TrendingUp, MoreHorizontal, ArrowUpRight, Clock, LogIn, LogOut } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { getDefaultAdminRoute } from '../../utils/routes';

const StatCard = ({ title, value, icon, trend, delayClass, glowColor = "from-brand-500/25" }) => (
  <div 
    className={`glass-panel p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both border border-white/5 hover:border-brand-500/30 ${delayClass}`}
  >
    {/* Decorative Neon Blur Tag */}
    <div className={`absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br ${glowColor} to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-60`}></div>
    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
    
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 font-sans">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight font-sans bg-clip-text bg-gradient-to-r from-white to-gray-200">{value}</h3>
      </div>
      <div className="w-12 h-12 bg-dark-900/90 backdrop-blur border border-white/10 flex items-center justify-center text-brand-500 rounded-xl shadow-md group-hover:scale-110 group-hover:text-white group-hover:bg-brand-500 transition-all duration-300">
        {icon}
      </div>
    </div>
    
    <div className="mt-5 flex items-center text-xs relative z-10 font-sans">
      <span className="flex items-center text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
        <ArrowUpRight size={12} className="mr-0.5" />
        {trend}
      </span>
      <span className="text-gray-500 ml-2 font-medium">vs last month</span>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { profile, hasAccess } = useAuth();
  
  if (profile && !hasAccess('Dashboard') && profile.role !== 'super_admin') {
    return <Navigate to={getDefaultAdminRoute(profile.role)} replace />;
  }

  const safeFormatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, 'MMM dd');
    } catch (e) {
      return 'N/A';
    }
  };

  const [stats, setStats] = useState({
    revenue: 0,
    bookings: 0,
    occupancy: '0%',
    guests: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [pulse, setPulse] = useState({ arrivals: 0, departures: 0, cleaning: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time Postgres changes channel subscription for instant dashboard updates
  useEffect(() => {
    const channel = supabase
      .channel(`dashboard-realtime-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'housekeeping_tasks' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    let arrivalsCount = 0;
    let departuresCount = 0;
    let activeGuestsCount = 0;
    let totalBookings = 0;
    let totalRevenue = 0;
    let bookingsData = [];

    const maxRetries = 3;
    let success = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const [
          recentBookingsRes,
          totalCountRes,
          revenueDataRes,
          arrivalsCountRes,
          departuresCountRes,
          checkedInCountRes
        ] = await Promise.all([
          supabase.from('bookings').select('*, profiles(first_name, last_name), rooms(name)').order('created_at', { ascending: false }).limit(5),
          supabase.from('bookings').select('id', { count: 'exact', head: true }),
          supabase.from('bookings').select('amount_paid_ngn'),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('check_in_date', today).in('status', ['confirmed', 'pending']),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('check_out_date', today).eq('status', 'checked_in'),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'checked_in')
        ]);

        if (recentBookingsRes.error || totalCountRes.error || revenueDataRes.error) {
          throw new Error("Critical dashboard queries returned errors. The database might be sleeping.");
        }

        bookingsData = recentBookingsRes.data || [];
        totalBookings = totalCountRes.count || 0;
        arrivalsCount = arrivalsCountRes.count || 0;
        departuresCount = departuresCountRes.count || 0;
        activeGuestsCount = checkedInCountRes.count || 0;
        totalRevenue = (revenueDataRes.data || []).reduce((sum, b) => sum + Number(b.amount_paid_ngn || 0), 0);

        setStats(prev => ({
          ...prev,
          revenue: totalRevenue,
          bookings: totalBookings,
          guests: activeGuestsCount
        }));
        setRecentBookings(bookingsData);
        success = true;
        break;
      } catch (e) {
        console.warn(`Dashboard database connection attempt ${attempt} failed. Retrying...`, e);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.error("Failed to load dashboard data after maximum retries:", e);
        }
      }
    }

    // Dynamic Occupancy Rate
    const { data: roomsData } = await supabase.from('rooms').select('id, status');
    if (roomsData) {
      const totalRooms = roomsData.length;
      const occupiedRooms = roomsData.filter(r => r.status === 'occupied').length;
      const occupancyPercent = totalRooms > 0 ? `${Math.round((occupiedRooms / totalRooms) * 100)}%` : '0%';
      setStats(prev => ({ ...prev, occupancy: occupancyPercent }));
    }

    // Dynamic Housekeeping Cleaning count
    let cleaningCount = 0;
    try {
      const { count } = await supabase
        .from('housekeeping_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (count !== null) cleaningCount = count;
    } catch (e) {
      console.error(e);
    }

    setPulse({
      arrivals: arrivalsCount,
      departures: departuresCount,
      cleaning: cleaningCount
    });
    
    setLoading(false);
  };

  return (
    <div className="pb-12">
      <div className="mb-8 flex justify-between items-end animate-in fade-in slide-in-from-left-4 duration-700">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 font-sans bg-clip-text bg-gradient-to-r from-white to-gray-400">
            PMS Live Operations Overview
          </h1>
          <p className="text-gray-400 mt-1 font-medium font-sans">Welcome back. Here is what's happening at your property today.</p>
        </div>
        <button className="hidden md:flex items-center gap-2 bg-dark-800 border border-dark-700 hover:border-brand-500/50 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-sans font-semibold">
          <CalendarDays size={18} className="text-brand-500"/>
          <span>{format(new Date(), 'MMM dd, yyyy')}</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard delayClass="delay-100" title="Total Revenue" value={`₦${stats.revenue.toLocaleString()}`} icon={<DollarSign size={24} />} trend="12.5%" glowColor="from-brand-500/20" />
        <StatCard delayClass="delay-200" title="Total Bookings" value={stats.bookings} icon={<CalendarDays size={24} />} trend="8.2%" glowColor="from-blue-500/20" />
        <StatCard delayClass="delay-300" title="Occupancy Rate" value={stats.occupancy} icon={<TrendingUp size={24} />} trend="5.4%" glowColor="from-emerald-500/20" />
        <StatCard delayClass="delay-500" title="Active Guests" value={stats.guests} icon={<Users size={24} />} trend="1.2%" glowColor="from-purple-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Area */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
            <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"><MoreHorizontal size={20}/></button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-dark-700/50">
                  <th className="pb-3 font-semibold px-2">Guest</th>
                  <th className="pb-3 font-semibold px-2">Room</th>
                  <th className="pb-3 font-semibold px-2">Date</th>
                  <th className="pb-3 font-semibold px-2">Status</th>
                  <th className="pb-3 font-semibold px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        Loading data...
                      </div>
                    </td>
                  </tr>
                ) : (recentBookings || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500">No bookings yet.</td>
                  </tr>
                ) : (
                  (recentBookings || []).map((item, i) => {
                    if (!item) return null;
                    const guestName = item.profiles 
                      ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() 
                      : (item.guest_name || 'Walk-in Guest');
                    const amountPaid = item.total_amount_ngn ? Number(item.total_amount_ngn).toLocaleString() : '0';
                    return (
                      <tr 
                        key={item.id || i} 
                        className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors group animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both"
                        style={{ animationDelay: `${700 + (i * 100)}ms` }}
                      >
                        <td className="py-4 px-2">
                          <p className="font-bold text-white">{guestName}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{item.booking_reference || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-2 text-gray-300">{item.rooms?.name || 'Unknown Room'}</td>
                        <td className="py-4 px-2 text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-gray-500"/> 
                            {safeFormatDate(item.check_in_date)}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            item.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          }`}>
                            {item.status || 'unknown'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right font-bold text-white">₦{amountPaid}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Summary */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700 fill-mode-both">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Today's Pulse</h3>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
            </span>
          </div>
          
          <div className="space-y-8 flex-1">
            <div className="group">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400 font-medium flex items-center gap-2"><LogIn size={16}/> Expected Arrivals</span>
                <span className="font-bold text-white bg-dark-700 px-2 rounded">{pulse.arrivals}</span>
              </div>
              <div className="w-full bg-dark-900/50 h-2.5 rounded-full overflow-hidden border border-dark-700/50">
                <div 
                  className="bg-gradient-to-r from-brand-600 to-brand-400 h-full rounded-full group-hover:scale-y-110 transition-all duration-500"
                  style={{ width: `${pulse.arrivals > 0 ? Math.min(100, (pulse.arrivals / Math.max(10, pulse.arrivals, pulse.departures, pulse.cleaning)) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="group">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400 font-medium flex items-center gap-2"><LogOut size={16}/> Departures</span>
                <span className="font-bold text-white bg-dark-700 px-2 rounded">{pulse.departures}</span>
              </div>
              <div className="w-full bg-dark-900/50 h-2.5 rounded-full overflow-hidden border border-dark-700/50">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full group-hover:scale-y-110 transition-all duration-500"
                  style={{ width: `${pulse.departures > 0 ? Math.min(100, (pulse.departures / Math.max(10, pulse.arrivals, pulse.departures, pulse.cleaning)) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="group">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400 font-medium flex items-center gap-2"><Clock size={16}/> Pending Cleaning</span>
                <span className="font-bold text-white bg-dark-700 px-2 rounded">{pulse.cleaning}</span>
              </div>
              <div className="w-full bg-dark-900/50 h-2.5 rounded-full overflow-hidden border border-dark-700/50">
                <div 
                  className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full group-hover:scale-y-110 transition-all duration-500"
                  style={{ width: `${pulse.cleaning > 0 ? Math.min(100, (pulse.cleaning / Math.max(10, pulse.arrivals, pulse.departures, pulse.cleaning)) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-dark-700/50">
             <Link to="/admin/reports" className="w-full block text-center btn-outline border-dark-600 text-gray-300 hover:bg-dark-700 hover:border-dark-500 hover:text-white">View Full Report</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
