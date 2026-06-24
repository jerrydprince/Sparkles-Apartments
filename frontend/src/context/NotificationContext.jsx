import React, { createContext, useContext, useState } from 'react';

// NotificationContext provides counters for each service department and a tiny beep sound.

const NotificationContext = createContext();


const defaultCounters = {
  internalMessaging: 0,
  frontDesk: 0,
  housekeeping: 0,
  laundry: 0,
  maintenance: 0,
  stores: 0,
  restaurant: 0,
  servicePortals: 0,
  reservations: 0,
  schedule: 0,
  reminders: 0,
};

export const NotificationProvider = ({ children }) => {
  // Provide static zeroed counters; no persistence or side‑effects.
  const [counters] = useState({
    internalMessaging: 0,
    frontDesk: 0,
    housekeeping: 0,
    laundry: 0,
    maintenance: 0,
    stores: 0,
    restaurant: 0,
    servicePortals: 0,
    reservations: 0,
    schedule: 0,
    reminders: 0,
  });

  const increment = () => {};
  const reset = () => {};

  return (
    <NotificationContext.Provider value={{ counters, increment, reset }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
