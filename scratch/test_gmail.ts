import { sendTicketConfirmationEmail } from "../src/lib/email";
import dotenv from "dotenv";
dotenv.config();

async function testGmail() {
  console.log("📤 Probando envío de mail real con Gmail SMTP...");
  console.log("Usuario:", process.env.SMTP_USER);

  const res = await sendTicketConfirmationEmail({
    orderNumber: "CT-DEMO-991",
    buyerName: "Leandro Franco",
    buyerEmail: "leandrofrancov48@gmail.com",
    eventName: "CUMBIA FEST 2026: La Fiesta Nacional",
    eventDate: "Sábado 24 de Octubre de 2026",
    eventVenue: "Estadio Obras al Aire Libre",
    eventAddress: "Av. del Libertador 7395, CABA",
    doorsOpenTime: "21:00",
    total: 13200,
    tickets: [
      {
        ticketCode: "CT-TKT-LEANDRO-1",
        tierName: "General - Fase 1 (Anticipadas)",
        attendeeName: "Leandro Franco",
        attendeeDni: "38920112",
        ticketUrl: "http://localhost:3000/tickets/CT-TKT-LEANDRO-1",
      },
    ],
  });

  if (res.success) {
    console.log("✅ ¡EMAIL ENVIADO EXITOSAMENTE A leandrofrancov48@gmail.com!");
  } else {
    console.error("❌ Falló el envío del email.");
  }
}

testGmail();
