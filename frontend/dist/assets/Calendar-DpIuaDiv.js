import{o as e}from"./rolldown-runtime-BM3Ffeng.js";import{Br as t,ei as n}from"./vendor-libs-CEgDwFcI.js";import{c as r,n as i,t as a}from"./vendor-react-core-NnLBLBqF.js";import{t as o}from"./supabase-BJfu8W_J.js";import{t as s}from"./vendor-calendar-BbrAqBNY.js";var c=e(n(),1),l=i(),u=e(a(),1),d=t(),f=(0,l.momentLocalizer)(s),p=(u.default.default||u.default)(l.Calendar),m=()=>{let[e,t]=(0,c.useState)([]),[n,i]=(0,c.useState)([]),[a,l]=(0,c.useState)(!0);(0,c.useEffect)(()=>{u()},[]);let u=async()=>{l(!0);let{data:e,error:n}=await o.from(`rooms`).select(`id, name`),{data:a,error:s}=await o.from(`bookings`).select(`*, profiles(first_name, last_name)`);n||s?r.error(`Failed to load calendar data`):(i(e),t((a||[]).filter(e=>!(e.booking_source===`online`&&e.payment_status===`unpaid`)).map(e=>{let t=e.profiles?`${e.profiles.first_name} ${e.profiles.last_name}`:e.special_requests||`Walk-in`;return{id:e.id,title:`${t} (${e.status})`,start:new Date(e.check_in_date),end:new Date(e.check_out_date),resourceId:e.room_id,status:e.status}}))),l(!1)};return(0,d.jsxs)(`div`,{className:`space-y-6 h-full flex flex-col`,children:[(0,d.jsx)(`style`,{children:`
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
      `}),(0,d.jsxs)(`div`,{children:[(0,d.jsx)(`h1`,{className:`text-2xl font-bold text-white`,children:`Visual Calendar`}),(0,d.jsx)(`p`,{className:`text-gray-400 mt-1`,children:`Drag and drop bookings to change dates or assign rooms.`})]}),(0,d.jsx)(`div`,{className:`bg-dark-800 border border-dark-700 shadow-sm p-4 rounded-lg flex-1 min-h-[700px]`,children:a?(0,d.jsx)(`div`,{className:`h-full flex items-center justify-center text-gray-500`,children:`Loading calendar data...`}):(0,d.jsx)(p,{localizer:f,events:e,onEventDrop:async({event:n,start:i,end:a,resourceId:c})=>{t(e.map(e=>e.id===n.id?{...e,start:i,end:a,resourceId:c}:e));let{error:l}=await o.from(`bookings`).update({check_in_date:s(i).format(`YYYY-MM-DD`),check_out_date:s(a).format(`YYYY-MM-DD`),room_id:c}).eq(`id`,n.id);l?(r.error(`Failed to move booking`),u()):r.success(`Booking updated successfully`)},onEventResize:async({event:n,start:i,end:a})=>{t(e.map(e=>e.id===n.id?{...e,start:i,end:a}:e));let{error:c}=await o.from(`bookings`).update({check_in_date:s(i).format(`YYYY-MM-DD`),check_out_date:s(a).format(`YYYY-MM-DD`)}).eq(`id`,n.id);c?(r.error(`Failed to resize booking`),u()):r.success(`Booking dates updated`)},resizable:!0,selectable:!0,startAccessor:`start`,endAccessor:`end`,eventPropGetter:e=>{let t=`#3182ce`;return e.status===`confirmed`&&(t=`#38a169`),e.status===`checked_in`&&(t=`#805ad5`),e.status===`cancelled`&&(t=`#e53e3e`),{style:{backgroundColor:t,borderRadius:`4px`,opacity:.9,color:`white`,border:`0px`,display:`block`}}},style:{height:`100%`},views:[`month`,`week`,`day`,`agenda`],defaultView:`month`,popup:!0})})]})};export{m as default};