require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBookings() {
  const { data, error } = await supabase.from('bookings').select('id, status, check_in_date, check_out_date, guest_name').order('created_at', { ascending: false }).limit(20);
  console.log('Recent bookings:', data);
}

checkBookings();
