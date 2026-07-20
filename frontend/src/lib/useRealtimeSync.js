import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

// Singleton manager for realtime subscriptions to prevent too many channel joins
const RealtimeManager = {
  globalChannel: null,
  activeTables: new Set(),
  callbacks: new Set(),
  
  init() {
    if (this.globalChannel) return;

    this.globalChannel = supabase.channel('system_global_sync');
    
    // Listen for broadcast fallbacks
    this.globalChannel.on('broadcast', { event: '*' }, (payload) => {
      const eventName = payload.event;
      if (eventName && eventName.startsWith('refresh_')) {
        const table = eventName.replace('refresh_', '');
        console.log(`[Broadcast Sync] Force refresh on table "${table}"`);
        this.callbacks.forEach(cb => cb(table, payload));
      }
    });

    this.globalChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime Sync] Global channel connected.');
      }
    });
  },

  updateSubscriptions() {
    if (!this.globalChannel) this.init();

    // In a highly optimized setup, you could dynamically add/remove postgres_changes bindings.
    // However, Supabase channels are immutable regarding bindings once subscribed.
    // To prevent channel churn, we just listen to public schema changes for the active tables.
    // It's more efficient to just have one global channel listening to the tables we care about.
  },

  register(tables, callback) {
    this.init();
    this.callbacks.add(callback);
    
    let needsResub = false;
    tables.forEach(t => {
      if (!this.activeTables.has(t)) {
        this.activeTables.add(t);
        needsResub = true;
      }
    });

    // If new tables are added, we must recreate the channel bindings.
    if (needsResub) {
      supabase.removeChannel(this.globalChannel);
      this.globalChannel = supabase.channel('system_global_sync');
      
      this.activeTables.forEach(table => {
        this.globalChannel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: table },
          (payload) => {
            console.log(`[Realtime Sync] Change detected on table "${table}":`, payload);
            this.callbacks.forEach(cb => cb(table, payload));
          }
        );
      });

      this.globalChannel.on('broadcast', { event: '*' }, (payload) => {
        const eventName = payload.event;
        if (eventName && eventName.startsWith('refresh_')) {
          const table = eventName.replace('refresh_', '');
          this.callbacks.forEach(cb => cb(table, payload));
        }
      });

      this.globalChannel.subscribe();
    }

    return () => {
      this.callbacks.delete(callback);
      // We intentionally do NOT remove the channel when a component unmounts 
      // to prevent churn, unless all callbacks are gone.
      if (this.callbacks.size === 0) {
        supabase.removeChannel(this.globalChannel);
        this.globalChannel = null;
        this.activeTables.clear();
      }
    };
  }
};

/**
 * Custom React hook that subscribes to Supabase Realtime postgres_changes
 * events for the specified tables and triggers a callback when updates occur.
 */
export const useRealtimeSync = (tables, callback) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!tables || tables.length === 0) return;

    // Use a stable wrapper to route to the latest callback ref
    const handleSync = (table, payload) => {
      if (tables.includes(table) && callbackRef.current) {
        callbackRef.current(table, payload);
      }
    };

    const cleanup = RealtimeManager.register(tables, handleSync);
    
    return cleanup;
  }, [JSON.stringify(tables)]);
};

export const forceTableRefresh = (table) => {
  const channel = supabase.channel(`temp_broadcast_${Date.now()}`);
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event: `refresh_${table}`,
        payload: { source: 'client_broadcast' }
      });
      setTimeout(() => supabase.removeChannel(channel), 500);
    }
  });
};

