import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Contact = () => {
  const [contactInfo, setContactInfo] = useState({});

  useEffect(() => {
    fetchContactSettings();
  }, []);

  const fetchContactSettings = async () => {
    try {
      const { data } = await supabase.from('system_settings').select('*').in('setting_key', ['contact_email', 'contact_phone', 'contact_address']);
      if (data) {
        const settings = {};
        data.forEach(item => settings[item.setting_key] = item.setting_value);
        setContactInfo(settings);
      }
    } catch (e) { console.error("Contact load error:", e); }
  };

  const phones = contactInfo.contact_phone ? contactInfo.contact_phone.split(',').map(p => p.trim()) : ['+234 800 LUXE APT'];

  return (
    <div className="pt-24 min-h-screen bg-dark-900">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Get in Touch</h1>
        <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">We are here to assist you with any inquiries or special requests you may have.</p>

        <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="lg:w-1/3 space-y-8">
            <div className="bg-dark-800 p-8 border border-dark-700">
              <div className="w-12 h-12 bg-dark-900 border border-gold-500 text-gold-500 flex items-center justify-center mb-6">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-medium mb-2">Location</h3>
              <p className="text-gray-400 whitespace-pre-wrap">{contactInfo.contact_address || '123 Luxury Avenue,\nVictoria Island, Lagos, Nigeria'}</p>
            </div>
            
            <div className="bg-dark-800 p-8 border border-dark-700">
              <div className="w-12 h-12 bg-dark-900 border border-gold-500 text-gold-500 flex items-center justify-center mb-6">
                <Phone size={24} />
              </div>
              <h3 className="text-xl font-medium mb-2">Phone</h3>
              <div className="text-gray-400">
                {phones.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>

            <div className="bg-dark-800 p-8 border border-dark-700">
              <div className="w-12 h-12 bg-dark-900 border border-gold-500 text-gold-500 flex items-center justify-center mb-6">
                <Mail size={24} />
              </div>
              <h3 className="text-xl font-medium mb-2">Email</h3>
              <p className="text-gray-400">{contactInfo.contact_email || 'reservations@luxe.com'}</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:w-2/3 bg-dark-800 p-8 md:p-12 border border-dark-700">
            <h3 className="text-2xl font-medium mb-8">Send a Message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                  <input type="text" className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <input type="email" className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                <input type="text" className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                <textarea rows="6" className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors"></textarea>
              </div>
              <button type="submit" className="btn-primary w-full md:w-auto px-10 py-4">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
