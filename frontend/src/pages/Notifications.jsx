import React from 'react';
import { useNotification } from '../context/NotificationContext';

const departments = [
  'internalMessaging',
  'frontDesk',
  'housekeeping',
  'laundry',
  'maintenance',
  'stores',
  'restaurant',
  'servicePortals',
  'schedule',
  'reminders',
];

const Notifications = () => {
  const { counters, increment } = useNotification();

  return (
    <div className="p-8 bg-dark-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Notification Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <div key={dept} className="flex items-center justify-between p-4 border border-dark-700 rounded-lg bg-dark-800">
            <span className="capitalize text-lg">{dept.replace(/([A-Z])/g, ' $1')}</span>
            <div className="flex items-center gap-4">
              <span className="bg-brand-500 text-dark-900 px-3 py-1 rounded-full font-medium">
                {counters[dept] ?? 0}
              </span>
              <button
                onClick={() => increment(dept)}
                className="bg-amber-500 hover:bg-amber-400 text-dark-950 font-bold py-1 px-3 rounded"
              >
                +1
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
