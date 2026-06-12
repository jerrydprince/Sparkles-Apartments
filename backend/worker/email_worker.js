import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
  console.error("Missing required environment variables. Please check your .env file.");
  console.error(`URL: ${!!SUPABASE_URL}, ServiceKey: ${!!SUPABASE_SERVICE_KEY}, ResendKey: ${!!RESEND_API_KEY}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);

console.log("🚀 Starting Luxe PMS Background Worker...");
console.log("✉️ Listening for new confirmed bookings to send confirmation emails...");

// Listen to Postgres Changes on the bookings table
supabase
  .channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'bookings' },
    async (payload) => {
      const { new: newRecord, old: oldRecord } = payload;
      
      // Trigger only when a booking goes from pending -> confirmed
      if (oldRecord.status !== 'confirmed' && newRecord.status === 'confirmed') {
        console.log(`[EVENT] Booking ${newRecord.booking_reference} confirmed! Preparing email...`);
        await sendBookingConfirmation(newRecord);
      }
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Successfully connected to Supabase Realtime');
    }
  });

async function sendBookingConfirmation(booking) {
  try {
    // Fetch room details
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('name')
      .eq('id', booking.room_id)
      .single();

    if (roomError) throw roomError;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-bottom: 3px solid #d4af37;">
          <h1 style="color: #fff; margin: 0;">Luxe Apartments</h1>
          <p style="color: #d4af37; letter-spacing: 2px; font-size: 12px; text-transform: uppercase;">Premium Hospitality</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #f9f9f9;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Booking Confirmed!</h2>
          <p>Dear ${booking.guest_name},</p>
          <p>Thank you for choosing Luxe Apartments. Your reservation is confirmed and we are looking forward to hosting you.</p>
          
          <div style="background-color: #fff; padding: 25px; border-radius: 8px; border: 1px solid #eaeaea; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #d4af37; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">Reservation Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Reference:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${booking.booking_reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Room:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${room.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Check-in:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${booking.check_in_date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Check-out:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${booking.check_out_date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; border-top: 1px solid #eaeaea;">Total Paid:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; border-top: 1px solid #eaeaea; color: #1a1a1a;">₦${booking.amount_paid_ngn.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <p>If you have any special requests or need to modify your booking, please reply to this email or call our front desk.</p>
          <p>Safe travels!</p>
          
          <p style="margin-top: 30px; font-weight: bold;">
            Warm regards,<br>
            The Luxe Team
          </p>
        </div>
        
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Luxe Apartments. All rights reserved.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Luxe Reservations <onboarding@resend.dev>', // Use verified domain in production
      to: [booking.guest_email],
      subject: `Booking Confirmed: ${booking.booking_reference} at Luxe Apartments`,
      html: htmlContent
    });

    if (error) {
      console.error(`[ERROR] Failed to send email to ${booking.guest_email}:`, error);
    } else {
      console.log(`[SUCCESS] Email sent successfully to ${booking.guest_email}! ID: ${data.id}`);
    }

  } catch (error) {
    console.error(`[ERROR] Processing booking ${booking.id} failed:`, error);
  }
}
