import React from 'react';
import { useNotification } from '../context/NotificationContext';

const departments = [
  { key: 'internalMessaging', label: 'Internal Messaging' },
  { key: 'frontDesk', label: 'Front Desk' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'stores', label: 'Stores & Warehouses' },
  { key: 'restaurant', label: 'Restaurant & Kitchen' },
  { key: 'servicePortals', label: 'Service Portals' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'reminders', label: 'Reminders' },
];

const NotificationBar = () => {
  const { counters } = useNotification();

  return (
    <div className="flex gap-4 overflow-x-auto p-2 bg-dark-800 border-b border-dark-700">
      {departments.map((dept) => (
        <div key={dept.key} className="flex flex-col items-center">
          <span className="text-xs text-gray-400 mb-1">{dept.label}</span>
          <div className="relative">
            <span className="bg-brand-500 text-dark-900 px-2 py-0.5 rounded-full font-medium">
              {counters[dept.key] ?? 0}
            </span>
            {/* a tiny red dot when count > 0 */}
            {counters[dept.key] > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-dark-800"></span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationBar;
