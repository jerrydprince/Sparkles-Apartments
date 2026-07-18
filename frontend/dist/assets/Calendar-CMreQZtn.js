import{r as i,ae as b,af as e}from"./vendor-core-lne3KDNv.js";import{h as u,l as P,w as q}from"./vendor-calendar-CyR6cabZ.js";import{s as m}from"./index-BgD1TSmq.js";import"./vendor-router-CUAOhG6d.js";import"./vendor-supabase-BERtuxkp.js";import"./vendor-icons-KglBhotM.js";const V=P.momentLocalizer(u),W=q.default||q,K=W(P.Calendar),te=()=>{const[R,D]=i.useState([]),[H,L]=i.useState([]),[$,F]=i.useState(!0),[t,y]=i.useState(null),[p,h]=i.useState(!1),[x,S]=i.useState(""),[f,C]=i.useState(""),[g,E]=i.useState(""),[_,Y]=i.useState([]),[w,M]=i.useState(!1),[j,N]=i.useState(!1);i.useEffect(()=>{k()},[]);const k=async()=>{F(!0);const{data:o,error:s}=await m.from("rooms").select("id, name"),{data:r,error:d}=await m.from("bookings").select("*, profiles(first_name, last_name), rooms(id, room_number, name, base_price_ngn)");if(s||d)b.error("Failed to load calendar data");else{L(o);const n=(r||[]).filter(a=>!(a.booking_source==="online"&&a.payment_status==="unpaid")).map(a=>{const c=a.profiles?`${a.profiles.first_name} ${a.profiles.last_name}`:a.special_requests||"Walk-in";return{id:a.id,title:`${c} (${a.status})`,start:new Date(a.check_in_date),end:new Date(a.check_out_date),resourceId:a.room_id,status:a.status,booking:a}});D(n)}F(!1)},z=async(o,s)=>{if(!(!o||!s)){M(!0);try{const{data:r}=await m.from("rooms").select("id, name, room_number, base_price_ngn");if(!r)return Y([]);const{data:d,error:l}=await m.rpc("get_booked_room_ids",{req_start_date:o,req_end_date:s});l&&console.error("Availability check error:",l);const n=new Set((d||[]).map(c=>typeof c=="string"?c:c.booked_room_id||c.room_id||c.id||Object.values(c)[0])),a=r.filter(c=>!n.has(c.id));Y(a)}catch(r){console.error("Rebooking check failed:",r)}finally{M(!1)}}};i.useEffect(()=>{p&&x&&f&&z(x,f)},[x,f,p]),i.useEffect(()=>{if(t&&p){const o=u().format("YYYY-MM-DD"),s=u().add(1,"days").format("YYYY-MM-DD");S(o),C(s),E(t.booking.room_id||"")}else S(""),C(""),E(""),Y([])},[t,p]);const O=async o=>{if(o.preventDefault(),!g){b.error("Please select an available room.");return}N(!0);const s=b.loading("Processing guest rebooking...");try{const r=_.find(v=>v.id===g);if(!r)throw new Error("Selected room is invalid or unavailable.");const d=Math.max(1,u(f).diff(u(x),"days")),l=Number(r.base_price_ngn)*d,n=l+(t.booking.total_extras_price_ngn||0),a=Number(t.booking.amount_paid_ngn||0),c=a>=n?"paid":a>0?"partial":"unpaid";if(t.booking.room_id){const{error:v}=await m.from("rooms").update({status:"available"}).eq("id",t.booking.room_id);if(v)throw v}const{error:A}=await m.from("bookings").update({check_in_date:x,check_out_date:f,room_id:g,total_room_price_ngn:l,total_amount_ngn:n,payment_status:c,status:"confirmed"}).eq("id",t.booking.id);if(A)throw A;const{error:B}=await m.from("payments").insert([{booking_id:t.booking.id,amount:0,currency:"NGN",method:"rebook",status:"completed",is_refund:!1,transaction_ref:`REBOOK-${Math.random().toString(36).substring(2,8).toUpperCase()}-${Date.now()}`,notes:"Rebook"}]);B&&console.warn("Failed to log rebooking payment ledger entry:",B),b.success("Guest successfully rebooked for the new dates!",{id:s}),y(null),h(!1),k()}catch(r){console.error(r),b.error(`Rebooking failed: ${r.message||"Error occurred"}`,{id:s})}finally{N(!1)}},I=async o=>{N(!0);const s=b.loading("Marking reservation as No-Show...");try{const{error:r}=await m.from("bookings").update({status:"no_show"}).eq("id",o.id);if(r)throw r;if(o.room_id){const{error:d}=await m.from("rooms").update({status:"available"}).eq("id",o.room_id);if(d)throw d}b.success("Reservation status updated to No-Show & room released.",{id:s}),y(null),h(!1),k()}catch(r){console.error(r),b.error(`Operation failed: ${r.message||"Error occurred"}`,{id:s})}finally{N(!1)}},G=async({event:o,start:s,end:r,resourceId:d})=>{const l=R.map(a=>a.id===o.id?{...a,start:s,end:r,resourceId:d,...a.status==="no_show"?{status:"confirmed"}:{}}:a);D(l);const{error:n}=await m.from("bookings").update({check_in_date:u(s).format("YYYY-MM-DD"),check_out_date:u(r).format("YYYY-MM-DD"),room_id:d,...o.status==="no_show"?{status:"confirmed"}:{}}).eq("id",o.id);n?(b.error("Failed to move booking"),k()):b.success("Booking updated successfully")},T=async({event:o,start:s,end:r})=>{const d=R.map(n=>n.id===o.id?{...n,start:s,end:r,...n.status==="no_show"?{status:"confirmed"}:{}}:n);D(d);const{error:l}=await m.from("bookings").update({check_in_date:u(s).format("YYYY-MM-DD"),check_out_date:u(r).format("YYYY-MM-DD"),...o.status==="no_show"?{status:"confirmed"}:{}}).eq("id",o.id);l?(b.error("Failed to resize booking"),k()):b.success("Booking dates updated")},U=o=>{let s="#3182ce";return o.status==="confirmed"&&(s="#38a169"),o.status==="checked_in"&&(s="#805ad5"),o.status==="cancelled"&&(s="#e53e3e"),o.status==="no_show"&&(s="#dd6b20"),{style:{backgroundColor:s,borderRadius:"4px",opacity:.9,color:"white",border:"0px",display:"block"}}};return e.jsxs("div",{className:"space-y-6 h-full flex flex-col",children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-white",children:"Visual Calendar"}),e.jsx("p",{className:"text-gray-400 mt-1",children:"Drag and drop bookings to change dates or assign rooms."})]}),e.jsx("div",{className:"bg-dark-800 border border-dark-700 shadow-sm p-4 rounded-lg flex-1 min-h-[700px]",children:$?e.jsx("div",{className:"h-full flex items-center justify-center text-gray-500",children:"Loading calendar data..."}):e.jsx(K,{localizer:V,events:R,onEventDrop:G,onEventResize:T,onSelectEvent:o=>{y(o),h(o.status==="no_show")},resizable:!0,selectable:!0,startAccessor:"start",endAccessor:"end",eventPropGetter:U,style:{height:"100%"},views:["month","week","day","agenda"],defaultView:"month",popup:!0})}),t&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",children:e.jsxs("div",{className:"bg-dark-800 border border-dark-700 w-full max-w-lg rounded-xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"flex justify-between items-center border-b border-dark-700 pb-3 mb-4",children:[e.jsx("h3",{className:"text-lg font-bold",children:"Booking Details"}),e.jsx("button",{onClick:()=>{y(null),h(!1)},className:"text-gray-400 hover:text-white",children:"✕"})]}),e.jsxs("div",{className:"space-y-3 mb-6",children:[e.jsxs("div",{className:"flex justify-between py-1 border-b border-dark-700/50",children:[e.jsx("span",{className:"text-gray-400",children:"Guest Name:"}),e.jsx("span",{className:"font-semibold text-white",children:t.booking.profiles?`${t.booking.profiles.first_name} ${t.booking.profiles.last_name}`:t.booking.special_requests||"Walk-in"})]}),e.jsxs("div",{className:"flex justify-between py-1 border-b border-dark-700/50",children:[e.jsx("span",{className:"text-gray-400",children:"Reference:"}),e.jsx("span",{className:"font-mono text-gold-500 font-semibold",children:t.booking.booking_reference})]}),t.booking.unlocked_bedrooms&&e.jsxs("div",{className:"flex justify-between py-1 border-b border-dark-700/50",children:[e.jsx("span",{className:"text-gray-400",children:"Subset Booking:"}),e.jsxs("span",{className:"font-semibold text-brand-400",children:[t.booking.unlocked_bedrooms," Bedroom(s) Unlocked"]})]}),e.jsxs("div",{className:"flex justify-between py-1 border-b border-dark-700/50",children:[e.jsx("span",{className:"text-gray-400",children:"Room:"}),e.jsxs("span",{className:"font-semibold text-white",children:["Room ",t.booking.rooms?.room_number," (",t.booking.rooms?.name,")"]})]}),e.jsxs("div",{className:"flex justify-between py-1 border-b border-dark-700/50",children:[e.jsx("span",{className:"text-gray-400",children:"Dates:"}),e.jsxs("span",{className:"font-semibold text-white",children:[t.booking.check_in_date," to ",t.booking.check_out_date]})]}),e.jsxs("div",{className:"flex justify-between py-1 border-b border-dark-700/50",children:[e.jsx("span",{className:"text-gray-400",children:"Status:"}),e.jsx("span",{className:`px-2 py-0.5 rounded text-xs font-semibold uppercase ${t.status==="confirmed"?"bg-green-500/20 text-green-400 border border-green-500/30":t.status==="checked_in"?"bg-purple-500/20 text-purple-400 border border-purple-500/30":t.status==="no_show"?"bg-amber-500/20 text-amber-400 border border-amber-500/30":t.status==="cancelled"?"bg-red-500/20 text-red-400 border border-red-500/30":"bg-blue-500/20 text-blue-400 border border-blue-500/30"}`,children:t.status})]}),e.jsxs("div",{className:"flex justify-between py-1 border-b border-dark-700/50",children:[e.jsx("span",{className:"text-gray-400",children:"Amount Paid:"}),e.jsxs("span",{className:"font-semibold text-green-400 font-mono",children:["₦",Number(t.booking.amount_paid_ngn||0).toLocaleString()]})]}),e.jsxs("div",{className:"flex justify-between py-1",children:[e.jsx("span",{className:"text-gray-400",children:"Total Bill:"}),e.jsxs("span",{className:"font-semibold text-white font-mono",children:["₦",Number(t.booking.total_amount_ngn||0).toLocaleString()]})]})]}),e.jsxs("div",{className:"space-y-4 pt-2 border-t border-dark-700",children:[!p&&t.status!=="cancelled"&&t.status!=="checked_out"&&e.jsxs("div",{className:"flex flex-col sm:flex-row gap-3",children:[e.jsx("button",{disabled:j,onClick:()=>I(t.booking),className:"flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm",children:"Mark as No-Show Only"}),e.jsx("button",{disabled:j,onClick:()=>h(!0),className:"flex-1 px-4 py-2.5 bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm",children:"Mark as No-Show & Rebook"})]}),p&&e.jsxs("form",{onSubmit:O,className:"space-y-4",children:[e.jsxs("div",{className:"bg-dark-900 border border-dark-700 p-4 rounded-lg space-y-4",children:[e.jsx("h4",{className:"font-bold text-gold-500 text-sm tracking-wider uppercase",children:"Rebook Guest"}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsxs("div",{className:"flex flex-col space-y-1",children:[e.jsx("label",{className:"text-xs text-gray-400 font-semibold",children:"New Check-In"}),e.jsx("input",{type:"date",required:!0,value:x,onChange:o=>S(o.target.value),className:"bg-dark-800 border border-dark-700 rounded p-2 text-sm text-white focus:outline-none focus:border-gold-500"})]}),e.jsxs("div",{className:"flex flex-col space-y-1",children:[e.jsx("label",{className:"text-xs text-gray-400 font-semibold",children:"New Check-Out"}),e.jsx("input",{type:"date",required:!0,value:f,onChange:o=>C(o.target.value),className:"bg-dark-800 border border-dark-700 rounded p-2 text-sm text-white focus:outline-none focus:border-gold-500"})]})]}),e.jsxs("div",{className:"flex flex-col space-y-1",children:[e.jsx("label",{className:"text-xs text-gray-400 font-semibold",children:"Select Room"}),e.jsxs("select",{required:!0,value:g,onChange:o=>E(o.target.value),className:"bg-dark-800 border border-dark-700 rounded p-2 text-sm text-white focus:outline-none focus:border-gold-500",disabled:w,children:[e.jsx("option",{value:"",children:"-- Choose a Room --"}),_.map(o=>e.jsxs("option",{value:o.id,children:["Room ",o.room_number," - ",o.name," (₦",Number(o.base_price_ngn).toLocaleString(),"/night)"]},o.id))]}),w&&e.jsx("span",{className:"text-xs text-gray-400 animate-pulse",children:"Checking available inventory..."}),!w&&_.length===0&&x&&f&&e.jsx("span",{className:"text-xs text-red-400",children:"No rooms available for the selected dates."})]})]}),x&&f&&g&&(()=>{const o=_.find(a=>a.id===g);if(!o)return null;const s=Math.max(1,u(f).diff(u(x),"days")),r=Number(t.booking.amount_paid_ngn||0),l=Number(o.base_price_ngn)*s+(t.booking.total_extras_price_ngn||0),n=l-r;return e.jsxs("div",{className:"bg-dark-900/50 border border-dark-700/50 p-4 rounded-lg space-y-2 text-sm font-sans",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-gray-400",children:"Nights:"}),e.jsxs("span",{children:[s," night(s)"]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-gray-400",children:"New Total Cost:"}),e.jsxs("span",{className:"font-semibold text-white font-mono",children:["₦",l.toLocaleString()]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-gray-400",children:"Carried Balance Paid:"}),e.jsxs("span",{className:"font-semibold text-green-400 font-mono",children:["₦",r.toLocaleString()]})]}),e.jsxs("div",{className:"flex justify-between border-t border-dark-700/50 pt-2 font-bold",children:[e.jsx("span",{className:"text-gray-300",children:n>0?"Pending Balance:":"Overpaid Balance:"}),e.jsxs("span",{className:n>0?"text-amber-500 font-mono":"text-green-400 font-mono",children:["₦",Math.abs(n).toLocaleString()]})]}),e.jsx("p",{className:"text-[10px] text-gray-500 leading-normal",children:"* Confirming this rebooking updates the booking dates and assigns the selected room. A payment ledger entry of ₦0 with description 'rebook' is recorded."})]})})(),e.jsxs("div",{className:"flex gap-3",children:[e.jsx("button",{type:"button",onClick:()=>{h(!1)},className:"flex-1 px-4 py-2.5 bg-dark-900 border border-dark-700 hover:bg-dark-950 text-gray-300 font-semibold rounded-lg transition-colors text-sm",children:"Cancel"}),e.jsx("button",{type:"submit",disabled:j||w||!g,className:"flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm",children:j?"Confirming...":"Confirm Rebooking"})]})]})]})]})})]})};export{te as default};
