import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar/lib/index.js';
import withDragAndDropModule from 'react-big-calendar/lib/addons/dragAndDrop/index.js';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const localizer = momentLocalizer(moment);
const withDragAndDrop = withDragAndDropModule.default || withDragAndDropModule;
const DragAndDropCalendar = withDragAndDrop(Calendar);

const AdminCalendar = () => {
  const [events, setEvents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch rooms to be used as resources
    const { data: roomData, error: roomError } = await supabase.from('rooms').select('id, name');
    
    // Fetch bookings
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*, profiles(first_name, last_name)');

    if (roomError || bookingError) {
      toast.error('Failed to load calendar data');
    } else {
      setRooms(roomData);
      
      // Filter out online checkouts that are unpaid (abandoned checkout flow)
      const activeBookings = (bookingData || []).filter(
        b => !(b.booking_source === 'online' && b.payment_status === 'unpaid')
      );
      
      const calendarEvents = activeBookings.map(booking => {
        const guestName = booking.profiles ? `${booking.profiles.first_name} ${booking.profiles.last_name}` : (booking.special_requests || 'Walk-in');
        return {
          id: booking.id,
          title: `${guestName} (${booking.status})`,
          start: new Date(booking.check_in_date),
          end: new Date(booking.check_out_date),
          resourceId: booking.room_id,
          status: booking.status
        };
      });
      setEvents(calendarEvents);
    }
    setLoading(false);
  };

  const moveEvent = async ({ event, start, end, resourceId }) => {
    // Optimistic UI update
    const updatedEvents = events.map(e => 
      e.id === event.id ? { ...e, start, end, resourceId } : e
    );
    setEvents(updatedEvents);

    const { error } = await supabase
      .from('bookings')
      .update({
        check_in_date: moment(start).format('YYYY-MM-DD'),
        check_out_date: moment(end).format('YYYY-MM-DD'),
        room_id: resourceId
      })
      .eq('id', event.id);

    if (error) {
      toast.error('Failed to move booking');
      fetchData(); // Revert
    } else {
      toast.success('Booking updated successfully');
    }
  };

  const resizeEvent = async ({ event, start, end }) => {
    const updatedEvents = events.map(e => 
      e.id === event.id ? { ...e, start, end } : e
    );
    setEvents(updatedEvents);

    const { error } = await supabase
      .from('bookings')
      .update({
        check_in_date: moment(start).format('YYYY-MM-DD'),
        check_out_date: moment(end).format('YYYY-MM-DD')
      })
      .eq('id', event.id);

    if (error) {
      toast.error('Failed to resize booking');
      fetchData();
    } else {
      toast.success('Booking dates updated');
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3182ce'; // blue for pending
    
    if (event.status === 'confirmed') backgroundColor = '#38a169'; // green
    if (event.status === 'checked_in') backgroundColor = '#805ad5'; // purple
    if (event.status === 'cancelled') backgroundColor = '#e53e3e'; // red

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <style>{`
        /* Dark Mode overrides for react-big-calendar */
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          border-bottom: 1px solid #374151 !important;
          border-left: 1px solid #374151 !important;
          background: #111827;
          color: #9CA3AF;
          padding: 10px 0;
          font-weight: 600;
        }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
          border: 1px solid #374151;
          border-radius: 0.5rem;
          background-color: #1F2937;
        }
        .rbc-day-bg {
          border-left: 1px solid #374151 !important;
        }
        .rbc-month-row {
          border-top: 1px solid #374151 !important;
        }
        .rbc-off-range-bg {
          background-color: #111827;
        }
        .rbc-today {
          background-color: rgba(223, 104, 83, 0.1);
        }
        .rbc-date-cell {
          padding-right: 5px;
          color: #D1D5DB;
        }
        .rbc-off-range {
          color: #4B5563;
        }
        .rbc-time-content {
          border-top: 1px solid #374151;
        }
        .rbc-time-header-content {
          border-left: 1px solid #374151;
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid #374151;
        }
        .rbc-time-gutter .rbc-timeslot-group {
          background: #1F2937;
          color: #9CA3AF;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid rgba(55, 65, 81, 0.5);
        }
        .rbc-btn-group button {
          color: #D1D5DB;
          border: 1px solid #374151;
          background: #1F2937;
        }
        .rbc-btn-group button:hover {
          background: #374151;
          color: #FFF;
        }
        .rbc-btn-group button.rbc-active {
          background: #DF6853;
          border-color: #DF6853;
          color: #FFF;
          box-shadow: none;
        }
        .rbc-toolbar button:active, .rbc-toolbar button.rbc-active:hover {
          background: #c55b48;
        }
        .rbc-toolbar-label {
          color: #FFF;
          font-weight: bold;
          font-size: 1.25rem;
        }
        .rbc-event {
          border-radius: 4px;
        }
      `}</style>
      <div>
        <h1 className="text-2xl font-bold text-white">Visual Calendar</h1>
        <p className="text-gray-400 mt-1">Drag and drop bookings to change dates or assign rooms.</p>
      </div>

      <div className="bg-dark-800 border border-dark-700 shadow-sm p-4 rounded-lg flex-1 min-h-[700px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">Loading calendar data...</div>
        ) : (
          <DragAndDropCalendar
            localizer={localizer}
            events={events}
            onEventDrop={moveEvent}
            onEventResize={resizeEvent}
            resizable
            selectable
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventStyleGetter}
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
            defaultView="month"
            popup
          />
        )}
      </div>
    </div>
  );
};

export default AdminCalendar;
