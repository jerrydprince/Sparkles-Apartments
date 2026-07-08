import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Printer, Trash, FileText, Search, CreditCard, Banknote, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const AdHocInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [contactInfo, setContactInfo] = useState({
    address: 'Plot 572 Iduwa Ogenyi Street Mabushi, Off Ahmadu Bello Way, Abuja',
    phone: '08033214684, 08062332639, 08171278657',
    email: 'info@sparklesapartments.ng',
    logo: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchInvoices();
    fetchContactSettings();
  }, []);

  const fetchContactSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['contact_address', 'contact_phone', 'contact_email', 'hotel_logo_url']);
        
      if (!error && data) {
        const settingsMap = data.reduce((acc, curr) => {
          acc[curr.setting_key] = curr.setting_value;
          return acc;
        }, {});
        
        setContactInfo(prev => ({
          address: settingsMap.contact_address || prev.address,
          phone: settingsMap.contact_phone || prev.phone,
          email: settingsMap.contact_email || prev.email,
          logo: settingsMap.hotel_logo_url || prev.logo
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_hoc_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!customerName || !amount) {
      toast.error('Name and Amount are required.');
      return;
    }

    const toastId = toast.loading('Creating invoice...');
    try {
      const { data, error } = await supabase
        .from('ad_hoc_invoices')
        .insert([{
          customer_name: customerName,
          total_amount_ngn: parseFloat(amount),
          items: [{ notes: notes, payment_method: paymentMethod }],
          created_by: user?.email
        }])
        .select();

      if (error) throw error;
      
      setInvoices([data[0], ...invoices]);
      setShowModal(false);
      
      // Reset form
      setCustomerName('');
      setAmount('');
      setNotes('');
      setPaymentMethod('cash');

      toast.success('Invoice generated successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to create invoice.', { id: toastId });
    }
  };

  const handlePrint = (inv) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error("Popup blocked! Please allow popups to print.");
      return;
    }
    
    const html = `
      <html>
        <head>
          <title>General Invoice - ${inv.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111827; }
            .header { border-bottom: 2px solid #374151; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .header h1 { margin: 0; font-size: 28px; color: #111827; letter-spacing: 0.05em; font-weight: 800; }
            .meta { font-size: 14px; color: #4B5563; }
            .customer-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .amount-box { margin-top: 40px; padding: 20px; border-top: 2px solid #e5e7eb; font-size: 24px; font-weight: bold; text-align: right; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${contactInfo.logo ? `<img src="${contactInfo.logo}" alt="Sparkles Apartments" style="max-height: 50px; object-fit: contain; margin-bottom: 8px; border-radius: 4px;" />` : ''}
              <h1>SPARKLES APARTMENTS</h1>
              <div style="font-size: 11px; color: #DF6853; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold; margin-bottom: 15px;">Premium Luxury Shortlets</div>
              <div class="meta" style="font-size: 18px; font-weight: bold; color: #111827;">GENERAL INVOICE</div>
              <div class="meta">Invoice Ref: ${inv.id}</div>
            </div>
            <div style="text-align: right; font-size: 13px;">
              <div><strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString()}</div>
              <div><strong>Generated By:</strong> ${inv.created_by || 'Staff'}</div>
              <div style="margin-top: 15px; color: #6B7280;">
                ${contactInfo.address}<br/>
                ${contactInfo.phone}<br/>
                ${contactInfo.email}
              </div>
            </div>
          </div>
          
          <div class="customer-box">
            <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: bold; margin-bottom: 8px;">Billed To</div>
            <div style="font-size: 18px; font-weight: bold;">${inv.customer_name}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px; text-align: left; font-size: 14px; background-color: #f9fafb; font-weight: bold; color: #374151;">Description</th>
                <th style="padding: 12px; text-align: right; font-size: 14px; background-color: #f9fafb; font-weight: bold; color: #374151;">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb;">
                  <div style="font-weight: bold; color: #111827;">General Payment / Services</div>
                  <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${inv.items?.[0]?.notes || 'N/A'}</div>
                </td>
                <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
                  ${Number(inv.total_amount_ngn).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="amount-box">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">Total Paid via ${(inv.items?.[0]?.payment_method || 'cash').replace('_', ' ').toUpperCase()}</div>
            TOTAL: ₦${Number(inv.total_amount_ngn).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div class="footer">
            <p style="margin: 0 0 5px 0; font-weight: bold;">Authorized and confirmed by Sparkles Apartments Finance Department.</p>
            <p style="margin: 0;">Thank you for your patronage.</p>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.customer_name.toLowerCase().includes(search.toLowerCase()) || 
    inv.id.toLowerCase().includes(search.toLowerCase()) ||
    (inv.items?.[0]?.notes && inv.items?.[0]?.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 bg-dark-900 border border-dark-700 p-6 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <FileText className="text-brand-500" size={32} /> Ad-Hoc Invoices
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-2xl">
            Generate and manage general invoices without a room booking. Ideal for walk-in services, events, or direct payments.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-brand-500 text-dark-900 font-bold px-6 py-3 rounded-lg hover:bg-brand-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-center gap-2 relative z-10 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={20} /> Generate Invoice
        </button>
      </div>

      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden shadow-xl mb-8">
        <div className="p-4 border-b border-dark-700 bg-dark-950 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by customer name, ref, or notes..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-dark-950 text-gray-400 border-b border-dark-700">
              <tr>
                <th className="px-6 py-4">Date / Ref</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Amount (₦)</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading invoices...
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-dark-700" />
                      <p>No invoices found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-dark-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{format(new Date(inv.created_at), 'MMM dd, yyyy HH:mm')}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1" title={inv.id}>{inv.id.split('-')[0]}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand-300">{inv.customer_name}</div>
                      {inv.items?.[0]?.notes && <div className="text-xs text-gray-400 mt-1 truncate max-w-xs" title={inv.items?.[0]?.notes}>{inv.items?.[0]?.notes}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-500">
                      ₦{Number(inv.total_amount_ngn).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-dark-700 text-gray-300 border border-dark-600 inline-flex items-center gap-1.5">
                        {(inv.items?.[0]?.payment_method || 'cash') === 'cash' ? <Banknote size={12}/> : <CreditCard size={12}/>}
                        {(inv.items?.[0]?.payment_method || 'cash').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handlePrint(inv)} 
                        className="bg-dark-700 hover:bg-dark-600 text-white p-2 rounded transition-colors inline-flex"
                        title="Print Invoice"
                      >
                        <Printer size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 w-full max-w-md rounded-xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col">
            <div className="bg-dark-900 p-5 border-b border-dark-700 flex justify-between items-center">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <FileText className="text-brand-500" /> Generate Invoice
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5">Customer / Entity Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. John Doe, ABC Corp"
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  className="w-full bg-dark-900 border border-dark-700 rounded p-2.5 text-white outline-none focus:border-brand-500 transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5">Total Amount (₦) *</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="w-full bg-dark-900 border border-dark-700 rounded p-2.5 text-white outline-none focus:border-brand-500 transition-colors font-mono font-bold" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5">Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)} 
                  className="w-full bg-dark-900 border border-dark-700 rounded p-2.5 text-white outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="pos">POS Terminal</option>
                  <option value="card">Card (Online)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5">Description / Notes</label>
                <textarea 
                  rows="3"
                  placeholder="What is this invoice for?"
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="w-full bg-dark-900 border border-dark-700 rounded p-2.5 text-white outline-none focus:border-brand-500 transition-colors resize-none" 
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-bold py-3 rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-brand-500 hover:bg-brand-400 text-dark-900 font-bold py-3 rounded transition-colors shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdHocInvoices;
