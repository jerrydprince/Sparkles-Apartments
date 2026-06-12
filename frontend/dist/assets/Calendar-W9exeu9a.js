import{r as l,z as d,j as t,a_ as h,a$ as g}from"./vendor-react-core-DDnbE9E2.js";import{h as n}from"./vendor-calendar-B-YVwB4U.js";import{s as b}from"./index-angyyPPr.js";import"./vendor-libs-B03gffdy.js";import"./vendor-date-fns-CBYIhgYW.js";import"./vendor-supabase-Bxf56Mno.js";const y=h.momentLocalizer(n),F=g.default||g,Y=F(h.Calendar),N=()=>{const[u,m]=l.useState([]),[E,x]=l.useState([]),[D,f]=l.useState(!0);l.useEffect(()=>{p()},[]);const p=async()=>{f(!0);const{data:o,error:r}=await b.from("rooms").select("id, name"),{data:a,error:c}=await b.from("bookings").select("*, profiles(first_name, last_name)");if(r||c)d.error("Failed to load calendar data");else{x(o);const s=(a||[]).filter(e=>!(e.booking_source==="online"&&e.payment_status==="unpaid")).map(e=>{const w=e.profiles?`${e.profiles.first_name} ${e.profiles.last_name}`:e.special_requests||"Walk-in";return{id:e.id,title:`${w} (${e.status})`,start:new Date(e.check_in_date),end:new Date(e.check_out_date),resourceId:e.room_id,status:e.status}});m(s)}f(!1)},k=async({event:o,start:r,end:a,resourceId:c})=>{const i=u.map(e=>e.id===o.id?{...e,start:r,end:a,resourceId:c}:e);m(i);const{error:s}=await b.from("bookings").update({check_in_date:n(r).format("YYYY-MM-DD"),check_out_date:n(a).format("YYYY-MM-DD"),room_id:c}).eq("id",o.id);s?(d.error("Failed to move booking"),p()):d.success("Booking updated successfully")},v=async({event:o,start:r,end:a})=>{const c=u.map(s=>s.id===o.id?{...s,start:r,end:a}:s);m(c);const{error:i}=await b.from("bookings").update({check_in_date:n(r).format("YYYY-MM-DD"),check_out_date:n(a).format("YYYY-MM-DD")}).eq("id",o.id);i?(d.error("Failed to resize booking"),p()):d.success("Booking dates updated")},_=o=>{let r="#3182ce";return o.status==="confirmed"&&(r="#38a169"),o.status==="checked_in"&&(r="#805ad5"),o.status==="cancelled"&&(r="#e53e3e"),{style:{backgroundColor:r,borderRadius:"4px",opacity:.9,color:"white",border:"0px",display:"block"}}};return t.jsxs("div",{className:"space-y-6 h-full flex flex-col",children:[t.jsx("style",{children:`
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
      `}),t.jsxs("div",{children:[t.jsx("h1",{className:"text-2xl font-bold text-white",children:"Visual Calendar"}),t.jsx("p",{className:"text-gray-400 mt-1",children:"Drag and drop bookings to change dates or assign rooms."})]}),t.jsx("div",{className:"bg-dark-800 border border-dark-700 shadow-sm p-4 rounded-lg flex-1 min-h-[700px]",children:D?t.jsx("div",{className:"h-full flex items-center justify-center text-gray-500",children:"Loading calendar data..."}):t.jsx(Y,{localizer:y,events:u,onEventDrop:k,onEventResize:v,resizable:!0,selectable:!0,startAccessor:"start",endAccessor:"end",eventPropGetter:_,style:{height:"100%"},views:["month","week","day","agenda"],defaultView:"month",popup:!0})})]})};export{N as default};
