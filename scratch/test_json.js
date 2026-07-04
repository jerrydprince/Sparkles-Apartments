const data = require('./parsed_data.json');
const booking = data.find(b => b._mphb_booking_price_breakdown);
if (booking) {
    console.log("Original String:");
    console.log(booking._mphb_booking_price_breakdown);
    try {
        const p1 = JSON.parse(booking._mphb_booking_price_breakdown);
        console.log("Parsed normally:", typeof p1);
    } catch(e) { console.log("Normal parse failed", e.message); }
    try {
        const p2 = JSON.parse(booking._mphb_booking_price_breakdown.replace(/\\"/g, '"'));
        console.log("Parsed with single replace:", typeof p2);
    } catch(e) { console.log("Single replace parse failed", e.message); }
    try {
        const p3 = JSON.parse(booking._mphb_booking_price_breakdown.replace(/\\\\"/g, '"'));
        console.log("Parsed with double replace:", typeof p3);
    } catch(e) { console.log("Double replace parse failed", e.message); }
}
