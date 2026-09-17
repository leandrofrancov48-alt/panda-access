import { db } from "../src/lib/db";
import { sendTicketConfirmationEmail } from "../src/lib/email";
import dotenv from "dotenv";
dotenv.config();

async function createRealTestOrder() {
  console.log("🎟️ Creando orden y ticket REAL en la base de datos local...");

  const event = await db.event.findFirst({
    include: { tiers: true },
  });

  if (!event) throw new Error("No event found!");
  const tier = event.tiers[0];

  const orderNumber = `CT-LEAN-${Date.now().toString().slice(-4)}`;
  const ticketCode = `CT-TKT-LEAN-${Date.now().toString().slice(-4)}`;

  // Create real order & ticket in DB
  const order = await db.order.create({
    data: {
      orderNumber,
      eventId: event.id,
      buyerName: "Leandro",
      buyerLastName: "Franco",
      buyerEmail: "leandrofrancov48@gmail.com",
      buyerPhone: "1155443322",
      buyerDni: "38920112",
      subtotal: tier.price,
      serviceFee: tier.serviceFee,
      total: tier.price + tier.serviceFee,
      status: "PAID",
      paymentMethod: "SIMULATED",
      tickets: {
        create: [
          {
            ticketCode,
            tierId: tier.id,
            attendeeName: "Leandro",
            attendeeLastName: "Franco",
            attendeeDni: "38920112",
            attendeeEmail: "leandrofrancov48@gmail.com",
            price: tier.price,
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

  console.log(`✅ Orden creada en base de datos: #${order.orderNumber}`);
  console.log(`✅ Ticket creado en base de datos: ${ticketCode}`);

  // Send real email with CID QR
  const emailRes = await sendTicketConfirmationEmail({
    orderNumber: order.orderNumber,
    buyerName: "Leandro Franco",
    buyerEmail: "leandrofrancov48@gmail.com",
    eventName: event.title,
    eventDate: new Date(event.date).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    eventVenue: event.venue,
    eventAddress: event.address,
    doorsOpenTime: event.doorsOpenTime || "22:00",
    total: order.total,
    tickets: [
      {
        ticketCode,
        tierName: tier.name,
        attendeeName: "Leandro Franco",
        attendeeDni: "38920112",
        ticketUrl: `http://localhost:3000/tickets/${ticketCode}`,
      },
    ],
  });

  if (emailRes.success) {
    console.log(`🎉 ¡Correo con QR enviado a leandrofrancov48@gmail.com!`);
    console.log(`🔗 Link directo funcional: http://localhost:3000/tickets/${ticketCode}`);
  } else {
    console.error("❌ Error enviando mail");
  }
}

createRealTestOrder()
  .catch(console.error)
  .finally(() => db.$disconnect());
