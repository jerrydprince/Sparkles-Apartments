import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { getCachedData, setCachedData } from '../utils/cache';

const Gallery = () => {
  const cachedRooms = getCachedData('rooms');
  const initialRooms = cachedRooms ? cachedRooms.filter(r => r.status === 'available') : [];
  
  const [rooms, setRooms] = useState(initialRooms);
  const [loading, setLoading] = useState(initialRooms.length === 0);

  useEffect(() => {
    fetchGalleryRooms();
  }, []);

  const fetchGalleryRooms = async () => {
    try {
      // Fetch rooms to display in the gallery and fully populate global cache
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, type, capacity, size_sqm, base_price_ngn, image_url, status, amenities')
        .order('name');
        
      if (error) throw error;
      if (data) {
        setCachedData('rooms', data);
        setRooms(data.filter(r => r.status === 'available'));
      }
    } catch (e) {
      console.error("Failed to load gallery:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-dark-900">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-white">Our Gallery</h1>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Explore the stunning interiors and exquisite details of our available luxury apartments. Click to view room details and reserve your stay.
        </p>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-gold-500" size={48} />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No rooms available to display at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Link 
                key={room.id} 
                to={`/room/${room.id}`}
                className="relative group overflow-hidden bg-dark-800 aspect-[4/3] block border border-dark-700 hover:border-gold-500 transition-colors"
              >
                <img 
                  src={room.image_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'} 
                  alt={room.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Solid Background Strip for Text Readability */}
                <div className="absolute inset-x-0 bottom-0 bg-dark-900/95 backdrop-blur-sm p-4 border-t border-gold-500/20 z-10">
                  <h3 className="text-gold-500 font-bold text-lg text-center uppercase tracking-wider">{room.name}</h3>
                </div>

                {/* Hover "View" Button Overlay */}
                <div className="absolute inset-x-0 top-0 bottom-[60px] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 backdrop-blur-[2px]">
                  <span className="text-white font-medium tracking-wider uppercase border border-white px-6 py-2 hover:bg-white hover:text-black transition-colors">
                    View Details
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
