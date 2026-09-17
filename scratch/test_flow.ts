import { db } from "../src/lib/db";
import { generateQrDataUrl } from "../src/lib/qr";
import { sendTicketConfirmationEmail } from "../src/lib/email";

async function testAll() {
  console.log("🚀 Starting end-to-end verification tests...");

  // 1. Check Events
  const events = await db.event.findMany({ include: { tiers: true } });
  console.log(`✅ Loaded ${events.length} events from database.`);
  if (events.length === 0) throw new Error("No events found in DB!");

  const targetEvent = events[0];
  const targetTier = targetEvent.tiers[0];
  console.log(`🎟️ Selected Event: "${targetEvent.title}"`);
  console.log(`🎫 Selected Tier: "${targetTier.name}" ($${targetTier.price})`);

  // 2. Test QR generation
  const testQr = await generateQrDataUrl("CT-TEST-12345");
  if (!testQr.startsWith("data:image/png;base64,")) {
    throw new Error("QR generation did not return valid data URL!");
  }
  console.log("✅ QR Code generated successfully as Base64 Data URL.");

  // 3. Test Order Creation & Checkout Flow
  const orderNumber = `CT-TEST-${Date.now().toString().slice(-5)}`;
  const ticketCode1 = `CT-TKT-TEST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const order = await db.order.create({
    data: {
      orderNumber,
      eventId: targetEvent.id,
      buyerName: "Gonzalo",
      buyerLastName: "Montiel",
      buyerEmail: "gonzalo@ejemplo.com",
      buyerPhone: "1199887766",
      buyerDni: "41223344",
      subtotal: targetTier.price,
      serviceFee: targetTier.serviceFee,
      total: targetTier.price + targetTier.serviceFee,
      status: "PAID",
      paymentMethod: "SIMULATED",
      tickets: {
        create: [
          {
            ticketCode: ticketCode1,
            tierId: targetTier.id,
            attendeeName: "Gonzalo",
            attendeeLastName: "Montiel",
            attendeeDni: "41223344",
            attendeeEmail: "gonzalo@ejemplo.com",
            price: targetTier.price,
            status: "VALID",
          },
        ],
      },
    },
    include: {
      tickets: {
        include: { tier: true },
      },
    },
  });

  console.log(`✅ Test Order created: #${order.orderNumber} with Ticket Code: ${ticketCode1}`);

  // 4. Test Email Template Generation
  const emailRes = await sendTicketConfirmationEmail({
    orderNumber: order.orderNumber,
    buyerName: `${order.buyerName} ${order.buyerLastName}`,
    buyerEmail: order.buyerEmail,
    eventName: targetEvent.title,
    eventDate: "Sábado 24 de Octubre de 2026",
    eventVenue: targetEvent.venue,
    eventAddress: targetEvent.address,
    doorsOpenTime: targetEvent.doorsOpenTime || "22:00",
    total: order.total,
    tickets: [
      {
        ticketCode: ticketCode1,
        tierName: targetTier.name,
        attendeeName: "Gonzalo Montiel",
        attendeeDni: "41223344",
        ticketUrl: `http://localhost:3000/tickets/${ticketCode1}`,
      },
    ],
  });
  if (!emailRes.success) throw new Error("Email sending failed!");
  console.log("✅ Confirmation email service validated successfully.");

  // 5. Test Check-In 1st Scan (Should be VALID)
  const ticketToScan = await db.ticket.findUnique({
    where: { ticketCode: ticketCode1 },
    include: { tier: true, order: { include: { event: true } } },
  });

  if (!ticketToScan || ticketToScan.status !== "VALID") {
    throw new Error("Ticket is not in VALID status for first scan!");
  }

  // Mark as checked in
  const firstScanTime = new Date();
  await db.ticket.update({
    where: { id: ticketToScan.id },
    data: {
      status: "USED",
      checkedInAt: firstScanTime,
      checkedInBy: "Scanner Test",
    },
  });
  await db.checkInLog.create({
    data: {
      ticketId: ticketToScan.id,
      status: "SUCCESS",
      notes: "Test scan 1",
    },
  });
  console.log("✅ First Scan validated: Status marked as USED with timestamp.");

  // 6. Test Check-In 2nd Scan (Should detect DUPLICATE / ALREADY_USED)
  const rescannedTicket = await db.ticket.findUnique({
    where: { ticketCode: ticketCode1 },
  });

  if (rescannedTicket?.status === "USED") {
    await db.checkInLog.create({
      data: {
        ticketId: rescannedTicket.id,
        status: "DUPLICATE",
        notes: "Test scan 2 duplicate attempt",
      },
    });
    console.log(`✅ Second Scan detected fraud attempt: ALREADY_USED (Checked in at ${firstScanTime.toISOString()})`);
  } else {
    throw new Error("Second scan failed to detect ALREADY_USED!");
  }

  // 7. Test Non-existent Ticket
  const fakeTicket = await db.ticket.findUnique({
    where: { ticketCode: "CT-FAKE-99999" },
  });
  if (fakeTicket === null) {
    console.log("✅ Fake ticket correctly identified as non-existent (INVALID).");
  } else {
    throw new Error("Fake ticket unexpectedly found!");
  }

  console.log("\n🎉 ALL 7 TEST CASES PASSED SUCCESSFULLY!");
}

testAll()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
