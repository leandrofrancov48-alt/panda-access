import nodemailer from "nodemailer";
import { generateQrDataUrl } from "./qr";
import { PANDA_ACCESS_EMAIL_LOGO_BASE64 } from "./emailLogo";

export interface TicketEmailData {
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventAddress: string;
  doorsOpenTime: string;
  total: number;
  tickets: Array<{
    ticketCode: string;
    tierName: string;
    attendeeName: string;
    attendeeDni: string;
    ticketUrl: string;
  }>;
}

function escapeHtml(str: unknown): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendTicketConfirmationEmail(data: TicketEmailData): Promise<{ success: boolean; previewUrl?: string }> {
  try {
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    // Escape dynamic strings to prevent HTML injection
    const safeEventName = escapeHtml(data.eventName);
    const safeEventVenue = escapeHtml(data.eventVenue);
    const safeEventAddress = escapeHtml(data.eventAddress);
    const safeDoorsOpenTime = escapeHtml(data.doorsOpenTime);
    const safeBuyerName = escapeHtml(data.buyerName);
    const safeOrderNumber = escapeHtml(data.orderNumber);
    const safeEventDate = escapeHtml(data.eventDate);

    // Generate QR for each ticket to embed as CID attachment
    const ticketsWithQr = await Promise.all(
      data.tickets.map(async (t, index) => {
        const qrDataUrl = await generateQrDataUrl(t.ticketUrl || t.ticketCode);
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
        const cid = `qr_${index}_${t.ticketCode.replace(/[^a-zA-Z0-9]/g, "")}`;
        return {
          ...t,
          safeTicketCode: escapeHtml(t.ticketCode),
          safeTierName: escapeHtml(t.tierName),
          safeAttendeeName: escapeHtml(t.attendeeName),
          safeAttendeeDni: escapeHtml(t.attendeeDni),
          safeTicketUrl: encodeURI(t.ticketUrl),
          qrDataUrl,
          base64Data,
          cid,
        };
      })
    );

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tus Entradas - ${safeEventName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <!--[if !mso]><!-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  </style>
  <!--<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #07080C; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <div style="padding: 20px 10px; background-color: #07080C;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #0F121C; border: 1px solid #23293F; border-radius: 16px; overflow: hidden;">
      
      <!-- Header with Yellow Balloon Brand Logo -->
      <div style="background-color: #141828; padding: 26px 20px 22px; text-align: center; border-bottom: 3px solid #F59E0B;">
        <img src="cid:brand_header_logo" alt="PANDA ACCESS" width="240" height="48" style="display: block; width: 240px; max-width: 100%; height: auto; margin: 0 auto; border: 0;" />
        <p style="margin: 10px 0 0; color: #94A3B8; font-size: 13px; font-weight: 600; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          ¡${data.total === 0 ? "Registro confirmado" : "Compra confirmada"}! Orden #${safeOrderNumber}
        </p>
      </div>

      <!-- Main Body -->
      <div style="padding: 28px 20px;">
        <div style="display: inline-block; background-color: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', sans-serif;">
          ${data.total === 0 ? "Registro Gratuito Confirmado" : "Entradas Confirmadas"}
        </div>

        <h2 style="font-size: 24px; font-weight: 900; margin: 16px 0 8px; color: #FFFFFF; line-height: 1.2; font-family: 'Montserrat', sans-serif;">
          ${safeEventName}
        </h2>

        <!-- Event Metadata Box -->
        <div style="background-color: #141828; border: 1px solid #21273C; border-radius: 12px; padding: 16px; margin: 16px 0 24px; font-size: 13px; color: #CBD5E1; line-height: 1.8; font-family: 'Montserrat', sans-serif;">
          <div>📅 <strong>Fecha:</strong> ${safeEventDate}</div>
          <div>📍 <strong>Lugar:</strong> ${safeEventVenue} (${safeEventAddress})</div>
          <div>🚪 <strong>Apertura de puertas:</strong> ${safeDoorsOpenTime} hs</div>
          <div>👤 <strong>Titular:</strong> ${safeBuyerName} • <strong>Total:</strong> ${data.total === 0 ? "GRATIS (Acceso Libre)" : "$" + data.total.toLocaleString("es-AR")}</div>
        </div>

        <h3 style="color: #F59E0B; font-size: 15px; font-weight: 800; margin: 24px 0 14px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', sans-serif;">
          Tus Entradas Oficiales (${ticketsWithQr.length})
        </h3>

        <!-- Tickets Cards -->
        ${ticketsWithQr
          .map(
            (t) => `
          <div style="background-color: #161A2B; border: 2px dashed #2E3752; border-radius: 16px; padding: 22px 16px; margin-bottom: 22px; text-align: center; font-family: 'Montserrat', sans-serif;">
            <div style="display: inline-block; font-size: 11px; font-weight: 800; color: #38BDF8; background-color: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 3px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', sans-serif;">
              ${t.safeTierName}
            </div>

            <div style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin: 10px 0 2px; font-family: 'Montserrat', sans-serif;">
              ${t.safeAttendeeName}
            </div>
            <div style="font-size: 13px; color: #94A3B8; font-family: monospace; margin-bottom: 16px;">
              DNI: ${t.safeAttendeeDni}
            </div>

            <!-- QR Code Box -->
            <div style="background-color: #FFFFFF; padding: 14px; border-radius: 14px; display: inline-block; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
              <img src="cid:${t.cid}" alt="QR Ticket ${t.safeTicketCode}" width="180" height="180" style="display: block; width: 180px; height: 180px; margin: 0 auto; border: 0;" />
            </div>

            <div style="font-family: monospace; font-size: 12px; font-weight: bold; color: #F59E0B; margin-top: 12px; letter-spacing: 1px;">
              ${t.safeTicketCode}
            </div>

            <!-- Action Button -->
            <div style="margin-top: 16px;">
              <a href="${t.safeTicketUrl}" target="_blank" style="display: inline-block; background-color: #F59E0B; color: #000000; font-weight: 900; font-size: 13px; padding: 12px 24px; border-radius: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Montserrat', sans-serif;">
                Abrir Entrada Digital
              </a>
            </div>
          </div>
        `
          )
          .join("")}

        <!-- Warning Notice -->
        <div style="background-color: #261118; border: 1px solid #FF2E4C; border-radius: 12px; padding: 16px; margin-top: 24px; font-size: 12px; color: #FFA1AF; line-height: 1.6; font-family: 'Montserrat', sans-serif;">
          <strong style="color: #FF2E4C; text-transform: uppercase;">⚠️ Información importante para el ingreso:</strong><br>
          • Presentá el código QR en la pantalla de tu celular al llegar a la puerta del show.<br>
          • Es obligatorio concurrir con DNI físico o digital para validar tu identidad.<br>
          • Cada entrada es válida para un único acceso. No compartas capturas de pantalla.
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 20px; color: #64748B; font-size: 11px; border-top: 1px solid #1C2236; background-color: #0A0C14; font-family: 'Montserrat', sans-serif;">
        <p style="margin: 0 0 4px;">Panda Access • Plataforma Oficial de Entradas</p>
        <p style="margin: 0;">Por consultas sobre tu compra respondé a este correo.</p>
      </div>

    </div>
  </div>
</body>
</html>
    `;

    if (hasSmtp) {
      const isGmail = process.env.SMTP_HOST?.includes("gmail");
      const transporter = isGmail
        ? nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS?.replace(/\s+/g, ""),
            },
          })
        : nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS?.replace(/\s+/g, ""),
            },
          });

      // Prepare CID attachments with explicit inline contentDisposition
      const attachments = [
        {
          filename: "panda-access-logo.png",
          content: Buffer.from(PANDA_ACCESS_EMAIL_LOGO_BASE64, "base64"),
          cid: "brand_header_logo",
          contentType: "image/png",
          contentDisposition: "inline" as const,
        },
        ...ticketsWithQr.map((t) => ({
          filename: `qr-${t.ticketCode}.png`,
          content: Buffer.from(t.base64Data, "base64"),
          cid: t.cid,
          contentType: "image/png",
          contentDisposition: "inline" as const,
        })),
      ];

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Panda Access" <leandrofrancov48@gmail.com>`,
        to: data.buyerEmail,
        subject: `🎟️ Tus entradas para ${data.eventName} (Orden #${data.orderNumber})`,
        html: emailHtml,
        attachments,
      });

      console.log(`[EMAIL] Sent real confirmation email with CID QR attachments to ${data.buyerEmail}`);
      return { success: true };
    } else {
      console.log(`\n======================================================`);
      console.log(`[EMAIL SIMULADO] Confirmación enviada a: ${data.buyerEmail}`);
      console.log(`Evento: ${data.eventName}`);
      console.log(`Orden: #${data.orderNumber} | Entradas: ${data.tickets.length}`);
      data.tickets.forEach((t, i) => {
        console.log(`  Entrada #${i + 1}: ${t.attendeeName} (${t.tierName}) -> Link: ${t.ticketUrl}`);
      });
      console.log(`======================================================\n`);
      return { success: true };
    }
  } catch (error) {
    console.error("[EMAIL ERROR]", error);
    return { success: false };
  }
}
