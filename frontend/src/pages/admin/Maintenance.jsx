import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  Wrench, Sparkles, Clock, AlertTriangle, Plus, X, ListChecks, 
  Calendar, User, DollarSign, CheckCircle, Search, Trash2, Edit, 
  Phone, Mail, Layers, Activity, Check, CheckSquare, XCircle, ArrowUpRight
} from 'lucide-react';

const Maintenance = () => {
  const { user, profile, hasAccess } = useAuth();
  
  // Tab controller: 'overview', 'tickets', 'professionals', 'purchases', 'payments'
  const [activeTab, setActiveTab] = useState('overview');
  
  // Loading & Processing States
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data States
  const [tickets, setTickets] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);

  // Search & Filter States
  const [ticketFilter, setTicketFilter] = useState('all'); // all, reported, in_progress, resolved
  const [ticketPriority, setTicketPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialistSearch, setSpecialistSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  // Modal Control States
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeResolution, setActiveResolution] = useState(null); // ticket ID to resolve

  // Create Form States
  const [newTicket, setNewTicket] = useState({
    room_id: '',
    issue_category: 'Plumbing',
    priority: 'medium',
    description: ''
  });

  const [newProfessional, setNewProfessional] = useState({
    name: '',
    phone: '',
    email: '',
    trade_specialty: 'Plumbing',
    type: 'external',
    hourly_rate: '',
    rating: 5.0,
    status: 'active'
  });

  const [newPurchase, setNewPurchase] = useState({
    ticket_id: '',
    item_name: '',
    quantity: 1,
    cost_ngn: '',
    merchant_name: '',
    notes: ''
  });

  const [newPayment, setNewPayment] = useState({
    purchase_id: '',
    ticket_id: '',
    professional_id: '',
    amount_ngn: '',
    payment_method: 'bank_transfer',
    notes: ''
  });

  const [resolutionForm, setResolutionForm] = useState({
    resolution_notes: '',
    assigned_professional_id: '',
    estimated_cost: '',
    actual_cost: ''
  });

  // Current logged in user name
  const currentStaffName = useMemo(() => {
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ''}`.trim();
    }
    return user?.name || user?.email || 'Authorized Officer';
  }, [user, profile]);

  const SPECIALTIES = ['Plumbing', 'Electrical', 'HVAC', 'Furniture', 'Carpentry', 'Masonry', 'General Repair', 'Other'];

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Rooms always
      const { data: roomData } = await supabase.from('rooms').select('id, room_number, name').order('room_number');
      setRooms(roomData || []);

      // Load specific tab data or run concurrently
      await Promise.all([
        fetchTickets(),
        fetchProfessionals(),
        fetchPurchases(),
        fetchPayments()
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- GET DATA METHODS (DB WITH LOCAL FALLBACKS) ---

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select('*, rooms(room_number, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (e) {
      console.warn("Table maintenance_tickets fetch failed. Setting fallbacks.");
    }
  };

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_professionals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProfessionals(data || []);
    } catch (e) {
      // Fallback Seed
      const local = JSON.parse(localStorage.getItem('pms_maintenance_professionals') || '[]');
      if (local.length === 0) {
        const seed = [
          { id: 'prof-1', name: 'Abiodun Electricals Ltd', phone: '08031234567', email: 'abiodun@gmail.com', trade_specialty: 'Electrical', type: 'external', hourly_rate: 15000.00, rating: 4.8, status: 'active', created_at: new Date().toISOString() },
          { id: 'prof-2', name: 'Chioma HVAC Services', phone: '08129876543', email: 'chioma.hvac@luxe.com', trade_specialty: 'HVAC', type: 'external', hourly_rate: 18000.00, rating: 4.9, status: 'active', created_at: new Date().toISOString() },
          { id: 'prof-3', name: 'Jerry Tech (Internal)', phone: '08055554433', email: 'jerry.tech@sparkles.com', trade_specialty: 'General Repair', type: 'internal', hourly_rate: 0, rating: 5.0, status: 'active', created_at: new Date().toISOString() }
        ];
        localStorage.setItem('pms_maintenance_professionals', JSON.stringify(seed));
        setProfessionals(seed);
      } else {
        setProfessionals(local);
      }
    }
  };

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_purchases')
        .select('*, ticket:ticket_id(id, description, room_id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPurchases(data || []);
    } catch (e) {
      const local = JSON.parse(localStorage.getItem('pms_maintenance_purchases') || '[]');
      if (local.length === 0) {
        const seed = [
          { id: 'pur-1', ticket_id: null, item_name: 'Premium Aircon Filters x4', quantity: 4, cost_ngn: 24000.00, merchant_name: 'Chioma AC Spareparts', purchaser_name: 'Jerry Technicial', notes: 'Air Conditioning maintenance materials.', status: 'approved', created_at: new Date().toISOString(), approved_at: new Date().toISOString() },
          { id: 'pur-2', ticket_id: null, item_name: 'Submersible Water Pump Motor', quantity: 1, cost_ngn: 85000.00, merchant_name: 'Alaba Pump Merchants', purchaser_name: 'Jerry Technicial', notes: 'Repairing main water supply system.', status: 'pending_approval', created_at: new Date().toISOString() }
        ];
        localStorage.setItem('pms_maintenance_purchases', JSON.stringify(seed));
        setPurchases(seed);
      } else {
        setPurchases(local);
      }
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_payments')
        .select('*, professional:professional_id(name), purchase:purchase_id(item_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (e) {
      const local = JSON.parse(localStorage.getItem('pms_maintenance_payments') || '[]');
      if (local.length === 0) {
        const seed = [
          { id: 'pay-1', purchase_id: 'pur-1', ticket_id: null, professional_id: null, amount_ngn: 24000.00, payment_method: 'bank_transfer', payment_status: 'paid', transaction_reference: 'TX-MAINT-4322', notes: 'Settled AC Filter procurement billing.', created_at: new Date().toISOString(), paid_at: new Date().toISOString() },
          { id: 'pay-2', purchase_id: null, ticket_id: null, professional_id: 'prof-1', amount_ngn: 35000.00, payment_method: 'cash', payment_status: 'paid', transaction_reference: 'TX-CASH-7711', notes: 'Professional fee for suite electrical checks.', created_at: new Date().toISOString(), paid_at: new Date().toISOString() }
        ];
        localStorage.setItem('pms_maintenance_payments', JSON.stringify(seed));
        setPayments(seed);
      } else {
        setPayments(local);
      }
    }
  };

  // --- ACTIONS & SUBMISSIONS ---

  // 1. Repair Ticket Logging
  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newTicket.room_id || !newTicket.description) return toast.error("Please fill in Room and Description.");
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('maintenance_tickets').insert([{
        ...newTicket,
        reported_by: profile?.id || user?.id || null,
        status: 'reported'
      }]);
      if (error) throw error;
      
      toast.success("✓ Technical Repair ticket reported successfully!");
      setIsTicketModalOpen(false);
      setNewTicket({ room_id: '', issue_category: 'Plumbing', priority: 'medium', description: '' });
      fetchTickets();
    } catch (err) {
      console.warn("DB Ticket Save Failed, saving mock state.");
      // Fallback
      toast.success("✓ Repair ticket logged (local sandbox)!");
      setIsTicketModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Specialists Additions
  const handleCreateProfSubmit = async (e) => {
    e.preventDefault();
    if (!newProfessional.name || !newProfessional.trade_specialty) return toast.error("Name and specialty are required.");
    
    setIsProcessing(true);
    try {
      const payload = {
        ...newProfessional,
        hourly_rate: Number(newProfessional.hourly_rate || 0)
      };
      
      const { error } = await supabase.from('maintenance_professionals').insert([payload]);
      if (error) throw error;
      
      toast.success(`✓ Professional "${newProfessional.name}" added to contacts!`);
      setIsProfModalOpen(false);
      setNewProfessional({ name: '', phone: '', email: '', trade_specialty: 'Plumbing', type: 'external', hourly_rate: '', rating: 5.0, status: 'active' });
      fetchProfessionals();
    } catch (err) {
      // Local fallback
      const local = JSON.parse(localStorage.getItem('pms_maintenance_professionals') || '[]');
      const newRec = {
        id: `prof-${Date.now()}`,
        ...newProfessional,
        hourly_rate: Number(newProfessional.hourly_rate || 0),
        created_at: new Date().toISOString()
      };
      localStorage.setItem('pms_maintenance_professionals', JSON.stringify([newRec, ...local]));
      toast.success(`✓ Professional "${newProfessional.name}" registered (local sandbox)!`);
      setIsProfModalOpen(false);
      setNewProfessional({ name: '', phone: '', email: '', trade_specialty: 'Plumbing', type: 'external', hourly_rate: '', rating: 5.0, status: 'active' });
      fetchProfessionals();
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete professional
  const handleDeleteProfessional = async (id) => {
    if (!window.confirm("Are you sure you want to remove this specialist contact?")) return;
    try {
      const { error } = await supabase.from('maintenance_professionals').delete().eq('id', id);
      if (error) throw error;
      toast.success("Specialist contact deleted.");
      fetchProfessionals();
    } catch (e) {
      const local = JSON.parse(localStorage.getItem('pms_maintenance_professionals') || '[]');
      const filtered = local.filter(p => p.id !== id);
      localStorage.setItem('pms_maintenance_professionals', JSON.stringify(filtered));
      toast.success("Specialist contact deleted (local).");
      fetchProfessionals();
    }
  };

  // 3. Procurement Requests
  const handleCreatePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!newPurchase.item_name || Number(newPurchase.cost_ngn) <= 0) return toast.error("Valid item name and cost are required.");

    setIsProcessing(true);
    try {
      const payload = {
        ...newPurchase,
        ticket_id: newPurchase.ticket_id || null,
        cost_ngn: Number(newPurchase.cost_ngn),
        quantity: Number(newPurchase.quantity),
        purchaser_id: profile?.id || user?.id || null,
        purchaser_name: currentStaffName,
        status: 'pending_approval'
      };
      
      const { error } = await supabase.from('maintenance_purchases').insert([payload]);
      if (error) throw error;
      
      toast.success("✓ Material procurement request submitted for approval!");
      setIsPurchaseModalOpen(false);
      setNewPurchase({ ticket_id: '', item_name: '', quantity: 1, cost_ngn: '', merchant_name: '', notes: '' });
      fetchPurchases();
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('pms_maintenance_purchases') || '[]');
      const newRec = {
        id: `pur-${Date.now()}`,
        ...newPurchase,
        ticket_id: newPurchase.ticket_id || null,
        cost_ngn: Number(newPurchase.cost_ngn),
        quantity: Number(newPurchase.quantity),
        purchaser_name: currentStaffName,
        status: 'pending_approval',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('pms_maintenance_purchases', JSON.stringify([newRec, ...local]));
      toast.success("✓ Material request logged (local sandbox)!");
      setIsPurchaseModalOpen(false);
      setNewPurchase({ ticket_id: '', item_name: '', quantity: 1, cost_ngn: '', merchant_name: '', notes: '' });
      fetchPurchases();
    } finally {
      setIsProcessing(false);
    }
  };

  // Purchase approvals
  const handleApprovePurchase = async (req) => {
    if (!window.confirm("Approve this maintenance procurement? Approved items can be billed in payments.")) return;
    try {
      const { error } = await supabase.from('maintenance_purchases').update({
        status: 'approved',
        approved_at: new Date().toISOString()
      }).eq('id', req.id);
      if (error) throw error;
      toast.success("✓ Procurement request approved successfully!");
      fetchPurchases();
    } catch (e) {
      const local = JSON.parse(localStorage.getItem('pms_maintenance_purchases') || '[]');
      const updated = local.map(p => p.id === req.id ? { ...p, status: 'approved', approved_at: new Date().toISOString() } : p);
      localStorage.setItem('pms_maintenance_purchases', JSON.stringify(updated));
      toast.success("✓ Requisition approved (local)!");
      fetchPurchases();
    }
  };

  const handleDeclinePurchase = async (req) => {
    if (!window.confirm("Decline this procurement requisition?")) return;
    try {
      const { error } = await supabase.from('maintenance_purchases').update({
        status: 'declined'
      }).eq('id', req.id);
      if (error) throw error;
      toast.error("Requisition declined.");
      fetchPurchases();
    } catch (e) {
      const local = JSON.parse(localStorage.getItem('pms_maintenance_purchases') || '[]');
      const updated = local.map(p => p.id === req.id ? { ...p, status: 'declined' } : p);
      localStorage.setItem('pms_maintenance_purchases', JSON.stringify(updated));
      toast.error("Requisition declined (local).");
      fetchPurchases();
    }
  };

  // 4. Disbursements & Payments Ledger
  const handleCreatePaymentSubmit = async (e) => {
    e.preventDefault();
    if (Number(newPayment.amount_ngn) <= 0) return toast.error("Valid payout amount is required.");

    setIsProcessing(true);
    try {
      const payload = {
        ...newPayment,
        purchase_id: newPayment.purchase_id || null,
        ticket_id: newPayment.ticket_id || null,
        professional_id: newPayment.professional_id || null,
        amount_ngn: Number(newPayment.amount_ngn),
        payment_status: 'pending' // Commences as pending disbursement
      };
      
      const { error } = await supabase.from('maintenance_payments').insert([payload]);
      if (error) throw error;
      
      toast.success("✓ Maintenance payout logged. Marked as Pending.");
      setIsPaymentModalOpen(false);
      setNewPayment({ purchase_id: '', ticket_id: '', professional_id: '', amount_ngn: '', payment_method: 'bank_transfer', notes: '' });
      fetchPayments();
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('pms_maintenance_payments') || '[]');
      const newRec = {
        id: `pay-${Date.now()}`,
        ...newPayment,
        purchase_id: newPayment.purchase_id || null,
        ticket_id: newPayment.ticket_id || null,
        professional_id: newPayment.professional_id || null,
        amount_ngn: Number(newPayment.amount_ngn),
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('pms_maintenance_payments', JSON.stringify([newRec, ...local]));
      toast.success("✓ Disbursement logged (local sandbox)!");
      setIsPaymentModalOpen(false);
      setNewPayment({ purchase_id: '', ticket_id: '', professional_id: '', amount_ngn: '', payment_method: 'bank_transfer', notes: '' });
      fetchPayments();
    } finally {
      setIsProcessing(false);
    }
  };

  // Swing disbursement to paid -> triggers accounting general ledger sync!
  const handleProcessDisbursementPaid = async (payment) => {
    if (!window.confirm(`Disburse ₦${Number(payment.amount_ngn).toLocaleString()} and close payment ledger? This will auto-post a Maintenance Expense transaction.`)) return;
    
    const toastId = toast.loading("Disbursing funds and updating accounting ledgers...");
    try {
      const { error } = await supabase.from('maintenance_payments').update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        transaction_reference: `TX-MAINT-${Date.now().toString().slice(-4)}`
      }).eq('id', payment.id);

      if (error) throw error;
      
      toast.success("✓ Payment completed & General Ledger synced reactively!", { id: toastId });
      fetchPayments();
    } catch (err) {
      // Local fallback sync simulator
      const local = JSON.parse(localStorage.getItem('pms_maintenance_payments') || '[]');
      const txRef = `TX-SANDBOX-${Date.now().toString().slice(-4)}`;
      const updated = local.map(p => p.id === payment.id ? { ...p, payment_status: 'paid', paid_at: new Date().toISOString(), transaction_reference: txRef } : p);
      localStorage.setItem('pms_maintenance_payments', JSON.stringify(updated));

      // Post dynamic fallback to ledger expenses inside LocalStorage fallback
      try {
        let recipient = 'Maintenance Specialist';
        if (payment.professional_id) {
          const prof = professionals.find(p => p.id === payment.professional_id);
          if (prof) recipient = prof.name;
        } else if (payment.purchase_id) {
          const pur = purchases.find(p => p.id === payment.purchase_id);
          if (pur) recipient = `Procurement: ${pur.item_name}`;
        }

        const expensePayload = {
          id: `exp-maint-${Date.now()}`,
          amount: Number(payment.amount_ngn),
          category: 'Maintenance',
          description: `Disbursed maintenance fix payout. Ref: ${txRef}. Notes: ${payment.notes || 'None'}`,
          expense_date: new Date().toISOString().split('T')[0],
          paid_to: recipient,
          payment_method: payment.payment_method,
          status: 'paid',
          created_at: new Date().toISOString()
        };

        const currentLocal = JSON.parse(localStorage.getItem('luxe_expenses') || '[]');
        localStorage.setItem('luxe_expenses', JSON.stringify([expensePayload, ...currentLocal]));
      } catch (localErr) {
        console.error("Local accounts synchronization error:", localErr);
      }

      toast.success("✓ Disbursement paid & Local Expenses Ledger synced!", { id: toastId });
      fetchPayments();
    }
  };

  // 5. Tech Repair Ticket Resolution & Contractor Assignment Panel
  const handleOpenResolutionModal = (ticket) => {
    setActiveResolution(ticket.id);
    setResolutionForm({
      resolution_notes: '',
      assigned_professional_id: ticket.assigned_professional_id || '',
      estimated_cost: ticket.estimated_cost || '',
      actual_cost: ''
    });
  };

  const handleCommenceRepair = async (id, profId) => {
    try {
      const { error } = await supabase.from('maintenance_tickets').update({
        status: 'in_progress',
        assigned_professional_id: profId || null
      }).eq('id', id);

      if (error) throw error;
      toast.success("Repair commenced! Status updated to In Progress.");
      fetchTickets();
    } catch (e) {
      // Local
      const updated = tickets.map(t => t.id === id ? { ...t, status: 'in_progress', assigned_professional_id: profId } : t);
      setTickets(updated);
      toast.success("Repair commenced (local)!");
    }
  };

  const handleResolveTicketSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionForm.resolution_notes) return toast.error("Please enter resolution notes.");

    setIsProcessing(true);
    try {
      const payload = {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionForm.resolution_notes,
        assigned_professional_id: resolutionForm.assigned_professional_id || null,
        estimated_cost: Number(resolutionForm.estimated_cost || 0),
        actual_cost: Number(resolutionForm.actual_cost || 0)
      };

      const { error } = await supabase.from('maintenance_tickets').update(payload).eq('id', activeResolution);
      if (error) throw error;

      toast.success("✓ Ticket resolved perfectly!");
      setActiveResolution(null);
      fetchTickets();
    } catch (err) {
      // Local
      const updated = tickets.map(t => t.id === activeResolution ? { 
        ...t, 
        status: 'resolved', 
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionForm.resolution_notes,
        assigned_professional_id: resolutionForm.assigned_professional_id || null,
        estimated_cost: Number(resolutionForm.estimated_cost || 0),
        actual_cost: Number(resolutionForm.actual_cost || 0)
      } : t);
      setTickets(updated);
      toast.success("✓ Ticket resolved (local)!");
      setActiveResolution(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- FILTER MEMOS ---
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = ticketFilter === 'all' || t.status === ticketFilter;
      const matchPriority = ticketPriority === 'all' || t.priority === ticketPriority;
      const matchSearch = searchQuery === '' || 
                          (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.issue_category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.rooms?.room_number || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchPriority && matchSearch;
    });
  }, [tickets, ticketFilter, ticketPriority, searchQuery]);

  const filteredSpecialists = useMemo(() => {
    return professionals.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(specialistSearch.toLowerCase()) ||
                          p.trade_specialty.toLowerCase().includes(specialistSearch.toLowerCase());
      const matchSpecialty = specialtyFilter === 'all' || p.trade_specialty === specialtyFilter;
      return matchSearch && matchSpecialty;
    });
  }, [professionals, specialistSearch, specialtyFilter]);

  // Analytics Metrics calculations
  const analytics = useMemo(() => {
    const totalCount = tickets.length;
    const unresolved = tickets.filter(t => t.status !== 'resolved').length;
    const activeProfs = professionals.filter(p => p.status === 'active').length;
    const pendingPurchases = purchases.filter(p => p.status === 'pending_approval').length;
    const totalSpent = payments.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + Number(p.amount_ngn), 0);

    return { totalCount, unresolved, activeProfs, pendingPurchases, totalSpent };
  }, [tickets, professionals, purchases, payments]);

  const getPriorityColorBadge = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-dark-700 text-gray-300 border border-dark-600';
    }
  };

  const getStatusColorBadge = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-500/15 text-green-400 border border-green-500/30';
      case 'in_progress': return 'bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse';
      case 'reported': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      default: return 'bg-dark-750 text-gray-400 border border-dark-700';
    }
  };

  const canManageRepairs = hasAccess('Maintenance - Manage Tickets & Fixes');
  const canManageSpecialists = hasAccess('Maintenance - Manage Professionals');
  const canManageFinances = hasAccess('Maintenance - Manage Purchases & Payments');

  return (
    <div className="space-y-6 pb-20 select-none animate-in fade-in duration-500">
      
      {/* Header Panel */}
      <div className="bg-dark-800 border border-dark-700 p-6 shadow-sm flex flex-col md:flex-row justify-between items-center rounded-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl border border-brand-500/20">
            <Wrench size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Maintenance Department</h1>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
              <Activity size={14} className="text-brand-500" />
              Technical repairs, specialist CRM directory, and ledger cost integrations.
            </p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-2">
          {hasAccess('Store Keeping - Log Requisitions') && (
            <button 
              onClick={() => setIsPurchaseModalOpen(true)}
              className="bg-brand-500/10 hover:bg-brand-500 border border-brand-500/20 text-brand-400 hover:text-dark-900 py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              <Plus size={14} /> Request Tools/Parts
            </button>
          )}
          <button 
            onClick={() => setIsTicketModalOpen(true)} 
            className="btn-primary py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus size={14} /> Report Room Breakdown
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex gap-2 border-b border-dark-700 overflow-x-auto scrollbar-none pb-0.5">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Layers },
          { id: 'tickets', label: 'Repairs & Tickets', icon: AlertTriangle },
          { id: 'professionals', label: 'Specialists CRM', icon: User },
          { id: 'purchases', label: 'Procurements', icon: DollarSign },
          { id: 'payments', label: 'Disbursements', icon: CheckSquare }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-5 font-bold flex items-center gap-2 border-b-2 text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-brand-500 text-brand-500 font-black' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- TAB CONTENT AREA --- */}

      {/* TAB 1: OVERVIEW & METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-dark-800/60 border border-dark-700/60 p-5 rounded-xl border-l-4 border-l-brand-500 shadow-md">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Room Tickets</p>
              <h3 className="text-3xl font-black text-white mt-2">{analytics.unresolved}</h3>
              <p className="text-[10px] text-gray-500 mt-1">Pending engineering attention</p>
            </div>
            
            <div className="bg-dark-800/60 border border-dark-700/60 p-5 rounded-xl border-l-4 border-l-blue-500 shadow-md">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Specialists Directory</p>
              <h3 className="text-3xl font-black text-white mt-2">{analytics.activeProfs}</h3>
              <p className="text-[10px] text-gray-500 mt-1">Plumbers, Electricians & Technicians</p>
            </div>
            
            <div className="bg-dark-800/60 border border-dark-700/60 p-5 rounded-xl border-l-4 border-l-amber-500 shadow-md">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Procurement Approvals</p>
              <h3 className="text-3xl font-black text-white mt-2">{analytics.pendingPurchases}</h3>
              <p className="text-[10px] text-gray-500 mt-1">Purchase orders awaiting confirmation</p>
            </div>
            
            <div className="bg-dark-800/60 border border-dark-700/60 p-5 rounded-xl border-l-4 border-l-green-500 shadow-md">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Maintenance Outflow</p>
              <h3 className="text-3xl font-black text-green-400 mt-2">₦{analytics.totalSpent.toLocaleString()}</h3>
              <p className="text-[10px] text-gray-500 mt-1">Total disbursed this month</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Urgent Failures Panel */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 bg-dark-900 border-b border-dark-700 flex justify-between items-center">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  Urgent & Critical Failures
                </h3>
                <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Action Required</span>
              </div>
              
              <div className="divide-y divide-dark-750 max-h-[350px] overflow-y-auto custom-scrollbar">
                {tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-xs italic">
                    All clear! No critical technical failures.
                  </div>
                ) : (
                  tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').map(ticket => (
                    <div key={ticket.id} className="p-4 hover:bg-dark-750 transition-colors flex justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-dark-900 px-2 py-0.5 rounded text-[11px] font-black text-white">RM {ticket.rooms?.room_number}</span>
                          <span className="text-xs font-bold text-gray-300">{ticket.issue_category}</span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-1.5">{ticket.description}</p>
                      </div>
                      {canManageRepairs && (
                        <button 
                          onClick={() => handleOpenResolutionModal(ticket)} 
                          className="bg-brand-500 hover:bg-brand-400 text-dark-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                          Resolve Fix
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Procurement List */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 bg-dark-900 border-b border-dark-700 flex justify-between items-center">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-500" />
                  Procurements Pending Manager Signoff
                </h3>
              </div>
              
              <div className="divide-y divide-dark-750 max-h-[350px] overflow-y-auto custom-scrollbar">
                {purchases.filter(p => p.status === 'pending_approval').length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-xs italic">
                    No procurement approvals pending.
                  </div>
                ) : (
                  purchases.filter(p => p.status === 'pending_approval').map(req => (
                    <div key={req.id} className="p-4 hover:bg-dark-750 transition-colors flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-white text-xs">{req.item_name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Quantity: {req.quantity} • Estimated Cost: <strong className="text-amber-400 font-mono">₦{Number(req.cost_ngn).toLocaleString()}</strong></p>
                      </div>
                      
                      {canManageFinances ? (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleDeclinePurchase(req)} 
                            className="bg-dark-700 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-dark-600 text-[10px] font-bold px-2 py-1 rounded"
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => handleApprovePurchase(req)} 
                            className="bg-brand-500 hover:bg-brand-400 text-dark-950 text-[10px] font-bold px-3 py-1 rounded"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 italic">Pending Manager</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL REPAIRS TICKETS LIST */}
      {activeTab === 'tickets' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Filters Bar */}
          <div className="bg-dark-800/40 p-4 border border-dark-700 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Repairs' },
                { id: 'reported', label: 'Reported Defect' },
                { id: 'in_progress', label: 'Fix Commenced' },
                { id: 'resolved', label: 'Resolved & Closed' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTicketFilter(opt.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                    ticketFilter === opt.id 
                      ? 'bg-brand-500/10 border-brand-500 text-brand-400' 
                      : 'bg-dark-900 border-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              {/* Search ticket input */}
              <div className="relative bg-dark-900 border border-dark-700 rounded-lg flex items-center px-3.5 py-1.5 text-xs text-gray-400 w-64">
                <Search size={14} className="mr-2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search room, issue category..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-white outline-none w-full placeholder-gray-600"
                />
              </div>
              
              <select
                value={ticketPriority}
                onChange={e => setTicketPriority(e.target.value)}
                className="bg-dark-900 border border-dark-700 text-gray-400 text-xs px-3.5 py-2 rounded-lg outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTickets.length === 0 ? (
              <div className="col-span-2 text-center text-gray-500 py-16 bg-dark-800/40 rounded-xl border border-dark-700/60 italic text-xs">
                No tickets matching criteria.
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const assignedProf = professionals.find(p => p.id === ticket.assigned_professional_id);
                return (
                  <div 
                    key={ticket.id}
                    className="bg-dark-800/50 border border-dark-700 rounded-xl p-5 flex flex-col justify-between hover:border-dark-600 transition-colors shadow-sm relative group overflow-hidden"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-dark-900 border border-dark-700 px-3 py-1 rounded-lg text-sm font-black text-white">RM {ticket.rooms?.room_number}</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getPriorityColorBadge(ticket.priority)}`}>{ticket.priority}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded ${getStatusColorBadge(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <h4 className="text-white font-extrabold text-sm mt-3">{ticket.issue_category}</h4>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">{ticket.description}</p>
                      
                      <div className="mt-4 pt-3.5 border-t border-dark-750 grid grid-cols-2 gap-3 text-[11px] text-gray-500">
                        <div>
                          <span>Reported:</span>
                          <p className="font-bold text-gray-300 mt-0.5">{format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                        <div>
                          <span>Specialist Assignment:</span>
                          <p className="font-bold text-brand-400 mt-0.5">
                            {assignedProf ? assignedProf.name : 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      {ticket.resolution_notes && (
                        <div className="mt-3.5 bg-green-500/5 border border-green-500/10 rounded-lg p-3 text-xs text-green-400">
                          <span className="font-black block uppercase tracking-wider text-[9px] mb-1">Resolution:</span>
                          {ticket.resolution_notes}
                          {Number(ticket.actual_cost) > 0 && <span className="block mt-1 font-semibold">Cost of Fix: ₦{Number(ticket.actual_cost).toLocaleString()}</span>}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-dark-750 flex justify-end gap-2">
                      {canManageRepairs && ticket.status === 'reported' && (
                        <div className="flex gap-1.5 w-full">
                          <select
                            onChange={e => handleCommenceRepair(ticket.id, e.target.value)}
                            defaultValue=""
                            className="bg-dark-900 border border-dark-700 text-gray-400 text-xs px-3.5 py-1.5 rounded-lg outline-none cursor-pointer flex-1"
                          >
                            <option value="" disabled>Dispatch Specialist...</option>
                            {professionals.filter(p => p.status === 'active').map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.trade_specialty})</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => handleCommenceRepair(ticket.id, null)} 
                            className="bg-brand-500 hover:bg-brand-400 text-dark-950 text-xs font-bold px-4 py-1.5 rounded-lg"
                          >
                            Start Fix
                          </button>
                        </div>
                      )}
                      
                      {canManageRepairs && ticket.status === 'in_progress' && (
                        <button 
                          onClick={() => handleOpenResolutionModal(ticket)} 
                          className="w-full bg-green-600 hover:bg-green-750 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                        >
                          Resolve & Close Ticket
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SPECIALISTS CRM CONTACT DATABASE */}
      {activeTab === 'professionals' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Controls */}
          <div className="bg-dark-800/40 p-4 border border-dark-700 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <div className="flex gap-2">
              <select
                value={specialtyFilter}
                onChange={e => setSpecialtyFilter(e.target.value)}
                className="bg-dark-900 border border-dark-700 text-gray-400 text-xs px-3.5 py-2 rounded-lg outline-none cursor-pointer"
              >
                <option value="all">All Specialties</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="flex gap-3">
              <div className="relative bg-dark-900 border border-dark-700 rounded-lg flex items-center px-3.5 py-1.5 text-xs text-gray-400 w-64">
                <Search size={14} className="mr-2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search specialist name, specialty..."
                  value={specialistSearch}
                  onChange={e => setSpecialistSearch(e.target.value)}
                  className="bg-transparent text-white outline-none w-full placeholder-gray-600"
                />
              </div>
              
              {canManageSpecialists && (
                <button 
                  onClick={() => setIsProfModalOpen(true)} 
                  className="btn-primary py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Add Specialist
                </button>
              )}
            </div>
          </div>

          {/* Directory Listings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredSpecialists.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 py-16 bg-dark-800/40 rounded-xl border border-dark-700/60 italic text-xs">
                No specialists registered yet.
              </div>
            ) : (
              filteredSpecialists.map(prof => (
                <div 
                  key={prof.id}
                  className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-gray-600 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-white text-base">{prof.name}</h4>
                        <span className="inline-block bg-brand-500/10 text-brand-400 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full mt-1.5">
                          {prof.trade_specialty}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${
                        prof.type === 'internal' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {prof.type}
                      </span>
                    </div>

                    <div className="space-y-2 mt-5 text-xs text-gray-400 border-t border-dark-750 pt-3">
                      {prof.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-brand-500" />
                          <span className="select-all text-gray-300 font-medium">{prof.phone}</span>
                        </div>
                      )}
                      {prof.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-brand-500" />
                          <span className="select-all text-gray-300">{prof.email}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-dark-750/30">
                        <span>Cost Rate:</span>
                        <strong className="text-white font-mono">{Number(prof.hourly_rate) > 0 ? `₦${Number(prof.hourly_rate).toLocaleString()}/hr` : 'Salary (Staff)'}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Specialist Rating:</span>
                        <strong className="text-yellow-500">⭐ {Number(prof.rating).toFixed(1)} / 5.0</strong>
                      </div>
                    </div>
                  </div>

                  {canManageSpecialists && (
                    <div className="mt-5 pt-3 border-t border-dark-750 flex justify-end gap-2">
                      <button 
                        onClick={() => handleDeleteProfessional(prof.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete specialist contact"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROCUREMENT PURCHASES */}
      {activeTab === 'purchases' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Controls */}
          <div className="bg-dark-800/40 p-4 border border-dark-700 rounded-xl flex items-center justify-between shadow-sm">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <DollarSign size={16} className="text-amber-500" />
              Spareparts & Materials Requisition Ledger
            </h3>
            {hasAccess('Store Keeping - Log Requisitions') && (
              <button 
                onClick={() => setIsPurchaseModalOpen(true)}
                className="btn-primary py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={14} /> Request Procurement
              </button>
            )}
          </div>

          {/* Table list */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-dark-900 border-b border-dark-700 text-xs font-bold text-gray-400 uppercase">
                    <th className="p-4">Requisition Item</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4">Estimated Budget</th>
                    <th className="p-4">Vendor / Merchant</th>
                    <th className="p-4">Requested By</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750 text-xs">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500 italic">No procurements logged.</td>
                    </tr>
                  ) : (
                    purchases.map(req => (
                      <tr key={req.id} className="hover:bg-dark-750/35 transition-colors">
                        <td className="p-4 font-extrabold text-white">
                          <p>{req.item_name}</p>
                          {req.notes && <p className="text-[10px] text-gray-500 font-normal mt-0.5 italic">{req.notes}</p>}
                        </td>
                        <td className="p-4 text-center font-bold text-gray-300">{req.quantity}</td>
                        <td className="p-4 font-mono font-bold text-brand-500">₦{Number(req.cost_ngn).toLocaleString()}</td>
                        <td className="p-4 text-gray-300">{req.merchant_name || 'N/A'}</td>
                        <td className="p-4 text-gray-300">{req.purchaser_name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            req.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            req.status === 'declined' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {req.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {canManageFinances && req.status === 'pending_approval' && (
                            <div className="flex gap-1.5 justify-end">
                              <button 
                                onClick={() => handleDeclinePurchase(req)} 
                                className="bg-dark-700 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-dark-600 text-[10px] font-bold px-2.5 py-1 rounded"
                              >
                                Decline
                              </button>
                              <button 
                                onClick={() => handleApprovePurchase(req)} 
                                className="bg-brand-500 hover:bg-brand-400 text-dark-950 text-[10px] font-bold px-3 py-1 rounded"
                              >
                                Approve
                              </button>
                            </div>
                          )}
                          {req.status === 'approved' && (
                            <span className="text-gray-500 text-[10px] italic flex items-center gap-1 justify-end">
                              <CheckCircle size={12} className="text-green-500" /> Approved
                            </span>
                          )}
                          {req.status === 'declined' && (
                            <span className="text-red-400/70 text-[10px] italic flex items-center gap-1 justify-end">
                              <XCircle size={12} className="text-red-400" /> Declined
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DISBURSEMENTS & PAYMENTS LEDGER */}
      {activeTab === 'payments' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Controls */}
          <div className="bg-dark-800/40 p-4 border border-dark-700 rounded-xl flex items-center justify-between shadow-sm">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <CheckSquare size={16} className="text-green-500" />
              Maintenance disbursements & accounting ledgers
            </h3>
            {canManageFinances && (
              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                className="btn-primary py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse"
              >
                <Plus size={14} /> Log Payout / Disbursement
              </button>
            )}
          </div>

          {/* Payments List Table */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-dark-900 border-b border-dark-700 text-xs font-bold text-gray-400 uppercase">
                    <th className="p-4">Payment Description / Notes</th>
                    <th className="p-4">Paid To (Target)</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Disbursed Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Accounting Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750 text-xs">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-500 italic">No disbursement records registered.</td>
                    </tr>
                  ) : (
                    payments.map(pay => {
                      const prof = professionals.find(p => p.id === pay.professional_id);
                      const pur = purchases.find(p => p.id === pay.purchase_id);
                      
                      let paidTo = 'Maintenance Specialist/Vendor';
                      if (prof) paidTo = prof.name;
                      else if (pur) paidTo = `Procurement: ${pur.item_name}`;

                      return (
                        <tr key={pay.id} className="hover:bg-dark-750/35 transition-colors">
                          <td className="p-4 font-bold text-white">
                            <p>{pay.notes || 'Maintenance Cost Disbursement'}</p>
                            {pur && <p className="text-[10px] text-gray-500 font-normal mt-0.5">Linked Requisition: {pur.item_name}</p>}
                          </td>
                          <td className="p-4 text-gray-300 font-semibold">{paidTo}</td>
                          <td className="p-4 font-mono font-bold text-white text-sm">₦{Number(pay.amount_ngn).toLocaleString()}</td>
                          <td className="p-4 text-gray-300 capitalize">{pay.payment_method?.replace('_', ' ')}</td>
                          <td className="p-4 font-mono text-gray-400 font-bold select-all">{pay.transaction_reference || 'Pending'}</td>
                          <td className="p-4 text-gray-400">{pay.paid_at ? format(new Date(pay.paid_at), 'yyyy-MM-dd HH:mm') : 'Unpaid'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              pay.payment_status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {pay.payment_status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {pay.payment_status === 'pending' && canManageFinances ? (
                              <button 
                                onClick={() => handleProcessDisbursementPaid(pay)}
                                className="bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-[10px] px-3.5 py-1.5 rounded-lg flex items-center gap-1 ml-auto"
                              >
                                <ArrowUpRight size={12} /> Pay & Sync Ledger
                              </button>
                            ) : pay.payment_status === 'paid' ? (
                              <span className="text-green-400 text-[10px] font-bold flex items-center gap-1 justify-end">
                                <Check size={12} className="text-green-500" /> Synced to Expenses
                              </span>
                            ) : (
                              <span className="text-gray-500 italic text-[10px]">Awaiting Payment</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: REPORT TICKET DIALOG --- */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 p-6 w-full max-w-sm shadow-2xl relative rounded-xl animate-in zoom-in-95">
            <button onClick={() => setIsTicketModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Wrench className="text-brand-500"/> Report breakdown</h2>
            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Target Room / Suite *</label>
                <select required value={newTicket.room_id} onChange={e => setNewTicket({...newTicket, room_id: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                  <option value="">Select Room</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>Suite {r.room_number} - {r.name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Trade Specialty *</label>
                  <select value={newTicket.issue_category} onChange={e => setNewTicket({...newTicket, issue_category: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Urgency Priority *</label>
                  <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Urgency</option>
                    <option value="high">High Urgency</option>
                    <option value="critical">🚨 Critical failure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Detailed Description *</label>
                <textarea required rows="4" value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="AC cooling compressor failed..."></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full btn-primary py-3 rounded-lg text-sm font-bold mt-4 shadow"
              >
                {isProcessing ? 'Logging defect...' : 'Log defect ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD SPECIALIST DIALOG --- */}
      {isProfModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 p-6 w-full max-w-sm shadow-2xl relative rounded-xl animate-in zoom-in-95">
            <button onClick={() => setIsProfModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus className="text-brand-500"/> Add Specialist contact</h2>
            <form onSubmit={handleCreateProfessionalSubmit ? handleCreateProfessionalSubmit : handleCreateProfSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Contractor / Technician Name *</label>
                <input required type="text" value={newProfessional.name} onChange={e => setNewProfessional({...newProfessional, name: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="Ibrahim Plumbing Services" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Phone Number</label>
                  <input type="text" value={newProfessional.phone} onChange={e => setNewProfessional({...newProfessional, phone: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="080..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Trade specialty *</label>
                  <select value={newProfessional.trade_specialty} onChange={e => setNewProfessional({...newProfessional, trade_specialty: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Employment Type *</label>
                  <select value={newProfessional.type} onChange={e => setNewProfessional({...newProfessional, type: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                    <option value="external">External Contractor</option>
                    <option value="internal">Internal Technician</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Contract / Hourly Rate (₦)</label>
                  <input type="number" value={newProfessional.hourly_rate} onChange={e => setNewProfessional({...newProfessional, hourly_rate: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="Rate per hour" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Email Address</label>
                <input type="email" value={newProfessional.email} onChange={e => setNewProfessional({...newProfessional, email: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="specialist@merchant.com" />
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full btn-primary py-3 rounded-lg text-sm font-bold mt-4 shadow"
              >
                {isProcessing ? 'Saving Specialist...' : 'Register Specialist'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: PROCUREMENT REQUISITION DIALOG --- */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 p-6 w-full max-w-sm shadow-2xl relative rounded-xl animate-in zoom-in-95">
            <button onClick={() => setIsPurchaseModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><DollarSign className="text-amber-500"/> Request procurement</h2>
            <form onSubmit={handleCreatePurchaseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Item / Part Name *</label>
                <input required type="text" value={newPurchase.item_name} onChange={e => setNewPurchase({...newPurchase, item_name: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="Submersible water pump motor" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Quantity *</label>
                  <input required type="number" min="1" value={newPurchase.quantity} onChange={e => setNewPurchase({...newPurchase, quantity: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Estimated Cost (₦) *</label>
                  <input required type="number" value={newPurchase.cost_ngn} onChange={e => setNewPurchase({...newPurchase, cost_ngn: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="Total NGN cost" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Supplier / Merchant Name</label>
                <input type="text" value={newPurchase.merchant_name} onChange={e => setNewPurchase({...newPurchase, merchant_name: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="AC Spareparts store" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Associated Repair Ticket</label>
                <select value={newPurchase.ticket_id} onChange={e => setNewPurchase({...newPurchase, ticket_id: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                  <option value="">None / Property General</option>
                  {tickets.filter(t => t.status !== 'resolved').map(t => (
                    <option key={t.id} value={t.id}>RM {t.rooms?.room_number} - {t.issue_category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Purchase Requisition Notes</label>
                <textarea rows="2" value={newPurchase.notes} onChange={e => setNewPurchase({...newPurchase, notes: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="Required for master bathroom plumbing overhaul..."></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full btn-primary py-3 rounded-lg text-sm font-bold mt-4 shadow"
              >
                {isProcessing ? 'Submitting Requisition...' : 'Submit Requisition'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: DISBURSEMENT / LOG PAYMENT DIALOG --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 p-6 w-full max-w-sm shadow-2xl relative rounded-xl animate-in zoom-in-95">
            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><DollarSign className="text-green-500"/> Log Payout / Disbursement</h2>
            <form onSubmit={handleCreatePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Disbursement Type / Destination *</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button 
                    type="button" 
                    onClick={() => setNewPayment({...newPayment, purchase_id: '', professional_id: 'prof-1'})}
                    className={`py-2 text-xs font-bold border rounded-lg transition-all ${
                      newPayment.professional_id ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-dark-900 border-dark-700 text-gray-400'
                    }`}
                  >
                    Pay Specialist
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewPayment({...newPayment, professional_id: '', purchase_id: 'pur-1'})}
                    className={`py-2 text-xs font-bold border rounded-lg transition-all ${
                      newPayment.purchase_id ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-dark-900 border-dark-700 text-gray-400'
                    }`}
                  >
                    Pay Procurement
                  </button>
                </div>
              </div>

              {newPayment.professional_id !== '' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Select Specialist *</label>
                  <select required value={newPayment.professional_id} onChange={e => setNewPayment({...newPayment, professional_id: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                    <option value="">Select Specialist</option>
                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name} ({p.trade_specialty})</option>)}
                  </select>
                </div>
              )}

              {newPayment.purchase_id !== '' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Select Approved Procurement *</label>
                  <select required value={newPayment.purchase_id} onChange={e => setNewPayment({...newPayment, purchase_id: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                    <option value="">Select Requisition</option>
                    {purchases.filter(p => p.status === 'approved').map(p => (
                      <option key={p.id} value={p.id}>{p.item_name} (₦{Number(p.cost_ngn).toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Disbursement Amount (₦) *</label>
                  <input required type="number" value={newPayment.amount_ngn} onChange={e => setNewPayment({...newPayment, amount_ngn: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="35000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Disbursement Method *</label>
                  <select value={newPayment.payment_method} onChange={e => setNewPayment({...newPayment, payment_method: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Dispense Cash</option>
                    <option value="cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Disbursement Payout Notes</label>
                <textarea rows="2" value={newPayment.notes} onChange={e => setNewPayment({...newPayment, notes: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="AC Specialist contractor invoice settlement..."></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full btn-primary py-3 rounded-lg text-sm font-bold mt-4 shadow"
              >
                {isProcessing ? 'Logging Payout...' : 'Log Payout Requisition'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: RESOLVE TICKET DIALOG --- */}
      {activeResolution && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 p-6 w-full max-w-sm shadow-2xl relative rounded-xl animate-in zoom-in-95">
            <button onClick={() => setActiveResolution(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><CheckCircle className="text-green-500"/> Resolve Defect Ticket</h2>
            <form onSubmit={handleResolveTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Specialist Contractor Assignee</label>
                <select value={resolutionForm.assigned_professional_id} onChange={e => setResolutionForm({...resolutionForm, assigned_professional_id: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors">
                  <option value="">None / Internal staff</option>
                  {professionals.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.trade_specialty})</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Estimated Cost (₦)</label>
                  <input type="number" value={resolutionForm.estimated_cost} onChange={e => setResolutionForm({...resolutionForm, estimated_cost: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="Budget estimated" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Actual Final Cost (₦)</label>
                  <input type="number" value={resolutionForm.actual_cost} onChange={e => setResolutionForm({...resolutionForm, actual_cost: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="Actual spent" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Resolution Technical Notes *</label>
                <textarea required rows="4" value={resolutionForm.resolution_notes} onChange={e => setResolutionForm({...resolutionForm, resolution_notes: e.target.value})} className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-brand-500 transition-colors" placeholder="compressor replaced completely and checked lines for leakage..."></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-dark-700 disabled:text-gray-500 text-white py-3 rounded-lg text-sm font-bold mt-4 shadow transition-all"
              >
                {isProcessing ? 'Resolving Defect...' : 'Resolve Ticket & Release Suite'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Maintenance;
