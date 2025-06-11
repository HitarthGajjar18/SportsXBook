import jsPDF from "jspdf";

export const generateReceipt = (booking) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Booking Receipt", 80, 20);

  doc.setFontSize(12);
  doc.text(`Booking ID: ${booking._id}`, 20, 40);
  doc.text(`Sport: ${booking.sportId?.name}`, 20, 50);
  doc.text(`Facility: ${booking.facility?.name}`, 20, 60);
  doc.text(`Address: ${booking.facility?.address}`, 20, 70);
  doc.text(`Date: ${booking.date}`, 20, 80);
  doc.text(`Time Slot: ${booking.timeSlot}`, 20, 90);
  doc.text(`Duration: ${booking.duration} hour(s)`, 20, 100);
  doc.text(`Resources: ${booking.numberOfResources}`, 20, 110);
  doc.text(`People: ${booking.numberOfPeople}`, 20, 120);
  doc.text(`Payment Mode: ${booking.paymentMode}`, 20, 130);
  doc.text(`Total Price: ₹${booking.totalPrice}`, 20, 140);
  doc.text(`Status: ${booking.status}`, 20, 150);
  doc.text(`Date of Booking: ${new Date(booking.createdAt).toLocaleString()}`, 20, 160);

  doc.save(`Booking_Receipt_${booking._id}.pdf`);
};
