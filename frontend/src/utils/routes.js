export const getDefaultAdminRoute = (role) => {
  switch (role) {
    case 'receptionist': 
      return '/admin/frontdesk';
    case 'housekeeping': 
    case 'head_housekeeper': 
    case 'maintenance':
      return '/admin/housekeeping';
    case 'accountant': 
      return '/admin/billing';
    case 'customer_support': 
      return '/admin/crm';
    case 'super_admin':
    case 'hotel_owner':
    case 'hotel_manager':
    default:
      return '/admin';
  }
};
