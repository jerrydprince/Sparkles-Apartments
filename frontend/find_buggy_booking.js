import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pjmdlifojfwoviyugjwq.supabase.co',
  'sb_publishable_Cd0GkjlGkIfFUJ0IR2etLA_IxImAYU9'
);

async function check() {
  let hasMore = true;
  let page = 0;
  let allBookings = [];
  while(hasMore) {
    const { data, error } = await supabase.from('bookings').select('id, amount_paid_ngn, total_amount_ngn, total_room_price_ngn, total_extras_price_ngn, status').range(page*1000, (page+1)*1000-1);
    if(error) { console.error(error); break; }
    if(data.length === 0) break;
    allBookings.push(...data);
    page++;
    if(data.length < 1000) hasMore = false;
  }

  let totalRevenue = 0;
  for(let b of allBookings) {
    if (b.status === 'cancelled') continue;
    const paid = Number(b.amount_paid_ngn || 0);
    const total = Number(b.total_amount_ngn || 1);
    const roomAndExtras = Number(b.total_room_price_ngn || 0) + Number(b.total_extras_price_ngn || 0);
    if (paid === 0) continue;
    const baseFraction = total > 0 ? (roomAndExtras / total) : 1;
    const rev = paid * baseFraction;
    totalRevenue += rev;
    if (rev < 0 || Math.abs(rev) > 1000000000) {
      console.log('SUSPICIOUS BOOKING:', b);
      console.log('Calculated rev:', rev);
    }
  }
  console.log('Total Revenue:', totalRevenue);
}
check();
