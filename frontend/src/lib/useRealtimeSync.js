import { useEffect } from 'react';
import { supabase } from './supabase';

/**
 * useRealtimeSync
 * Custom React hook that subscribes to Supabase Realtime postgres_changes
 * events for the specified tables and triggers a callback when updates occur.
 * 
 * @param {Array<string>} tables - List of tables to listen to (e.g. ['rooms', 'bookings'])
 * @param {Function} callback - Callback function triggered on event, called with (table, payload)
 */
export const useRealtimeSync = (tables, callback) => {
  useEffect(() => {
    if (!tables || tables.length === 0) return;

    // Create a unique channel name based on tables
    const channelName = `realtime-sync-${tables.join('-')}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase.channel(channelName);

    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => {
          console.log(`[Realtime Sync] Change detected on table "${table}":`, payload);
          if (callback) {
            callback(table, payload);
          }
        }
      );
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime Sync] Subscribed to tables: ${tables.join(', ')}`);
      }
    });

    return () => {
      console.log(`[Realtime Sync] Unsubscribing from tables: ${tables.join(', ')}`);
      supabase.removeChannel(channel);
    };
  }, [JSON.stringify(tables), callback]);
};
