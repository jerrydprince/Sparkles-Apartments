import React, { useState, useEffect } from 'react';
import { Wifi, Coffee, Car, Shield, Tv, Wind, Waves, Dumbbell, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCachedData, setCachedData } from '../utils/cache';

const defaultAmenitiesList = [
  { title: 'High-Speed WiFi', desc: 'Uninterrupted internet access throughout the property.' },
  { title: '24/7 Security', desc: 'Advanced security systems and round-the-clock personnel.' },
  { title: 'Private Parking', desc: 'Secure, dedicated parking spaces for residents and guests.' },
  { title: 'Gourmet Kitchen', desc: 'Fully equipped kitchens with top-tier appliances.' },
  { title: 'Smart Entertainment', desc: 'Large smart TVs with premium streaming services.' },
  { title: 'Climate Control', desc: 'Centralized air conditioning for ultimate comfort.' },
  { title: 'Swimming Pool', desc: 'Access to a pristine, temperature-controlled pool.' },
  { title: 'Fitness Center', desc: 'State-of-the-art gym equipment available 24/7.' }
];

const getIconForTitle = (title) => {
  const t = title.toLowerCase();
  if (t.includes('wifi') || t.includes('internet')) return <Wifi size={40} />;
  if (t.includes('secur') || t.includes('safe')) return <Shield size={40} />;
  if (t.includes('park') || t.includes('car')) return <Car size={40} />;
  if (t.includes('kitchen') || t.includes('coffee') || t.includes('food')) return <Coffee size={40} />;
  if (t.includes('tv') || t.includes('smart') || t.includes('entertainment')) return <Tv size={40} />;
  if (t.includes('air') || t.includes('climate') || t.includes('cool')) return <Wind size={40} />;
  if (t.includes('pool') || t.includes('swim')) return <Waves size={40} />;
  if (t.includes('fit') || t.includes('gym')) return <Dumbbell size={40} />;
  return <CheckCircle size={40} />;
};

const Amenities = () => {
  const cachedCmsContent = getCachedData('cmsContent');
  
  const getInitialAmenities = () => {
    if (cachedCmsContent && cachedCmsContent.cms_amenities_list) {
      try {
        const parsed = JSON.parse(cachedCmsContent.cms_amenities_list);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultAmenitiesList;
  };

  const [amenities, setAmenities] = useState(getInitialAmenities());

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const { data } = await supabase.from('system_settings').select('setting_value').eq('setting_key', 'cms_amenities_list').single();
      if (data && data.setting_value) {
        const parsed = JSON.parse(data.setting_value);
        if (parsed && parsed.length > 0) {
          setAmenities(parsed);
          
          const currentCms = getCachedData('cmsContent') || {};
          currentCms.cms_amenities_list = data.setting_value;
          setCachedData('cmsContent', currentCms);
          return;
        }
      }
    } catch (e) { console.error("CMS amenities load error:", e); }
  };

  return (
    <div className="pt-24 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Premium Amenities</h1>
        <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">Experience a new standard of living with our carefully curated facilities designed to cater to your every need.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {amenities.map((amenity, idx) => (
            <div key={idx} className="bg-dark-800 p-8 border border-dark-700 hover:border-gold-500 transition-colors duration-300 text-center group">
              <div className="text-gold-500 mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
                {getIconForTitle(amenity.title)}
              </div>
              <h3 className="text-xl font-semibold mb-4">{amenity.title}</h3>
              <p className="text-gray-400">{amenity.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Amenities;
