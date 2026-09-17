import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with cumbia events...");

  // Clean existing data
  await prisma.checkInLog.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.ticketTier.deleteMany({});
  await prisma.event.deleteMany({});

  // Event 1: CUMBIA FEST 2026
  const event1 = await prisma.event.create({
    data: {
      slug: "cumbia-fest-2026-la-fiesta-nacional",
      title: "CUMBIA FEST 2026: La Fiesta Nacional",
      subtitle: "La noche más grande del año al aire libre",
      description: "¡Llega la edición definitiva del Cumbia Fest! Una noche inolvidable con las bandas más grandes de la cumbia argentina en vivo, sonido de última generación, food trucks y la mejor fiesta tropical.",
      date: new Date("2026-10-24T22:00:00.000Z"),
      doorsOpenTime: "21:00",
      venue: "Estadio Obras al Aire Libre",
      address: "Av. del Libertador 7395, CABA",
      city: "Buenos Aires",
      coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop",
      bannerImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop",
      ageRestriction: "+18 años",
      status: "PUBLISHED",
      featured: true,
      lineup: JSON.stringify([
        { name: "Damas Gratis", time: "02:30", highlight: true },
        { name: "Ke Personajes", time: "01:00", highlight: true },
        { name: "La Delio Valdez", time: "23:30", highlight: false },
        { name: "Los Palmeras", time: "22:00", highlight: false },
        { name: "DJ Pablito Mix", time: "Toda la noche", highlight: false },
      ]),
      tiers: {
        create: [
          {
            name: "General - Fase 1 (Anticipadas)",
            description: "Acceso al campo general. Stock ultra limitado a precio promocional.",
            price: 12000,
            serviceFee: 1200,
            capacity: 500,
            sold: 215,
            maxPerOrder: 6,
            status: "AVAILABLE",
          },
          {
            name: "Campo VIP (Frente al escenario)",
            description: "Sector exclusivo con vista preferencial al escenario, barra propia sin filas y 1 trago de bienvenida.",
            price: 25000,
            serviceFee: 2500,
            capacity: 250,
            sold: 98,
            maxPerOrder: 4,
            status: "AVAILABLE",
          },
          {
            name: "Mesa Cumbia VIP (Para 4 Personas)",
            description: "Mesa en tarima elevada, 4 precintos VIP, 1 botella de champagne o vodka + 4 energizantes + atención de mozo.",
            price: 90000,
            serviceFee: 9000,
            capacity: 20,
            sold: 11,
            maxPerOrder: 1,
            status: "AVAILABLE",
          },
        ],
      },
    },
  });

  // Event 2: ALTO RITMO & GÜIRO NIGHT
  const event2 = await prisma.event.create({
    data: {
      slug: "alto-ritmo-guiro-night",
      title: "ALTO RITMO: Güiro & Cumbia Colombiana",
      subtitle: "Noche de clásicos tropicales, ritmo santafesino y fiesta",
      description: "Para los amantes del ritmo puro, güiro sonando fuerte y acordeones hasta el amanecer. Vení a bailar los clásicos de siempre en el templo de Palermo.",
      date: new Date("2026-11-07T23:30:00.000Z"),
      doorsOpenTime: "23:00",
      venue: "Groove",
      address: "Av. Santa Fe 4389, Palermo",
      city: "Buenos Aires",
      coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
      bannerImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop",
      ageRestriction: "+18 años",
      status: "PUBLISHED",
      featured: true,
      lineup: JSON.stringify([
        { name: "El Polaco", time: "03:00", highlight: true },
        { name: "Mario Luis", time: "01:30", highlight: true },
        { name: "Banda Sorpresa", time: "00:30", highlight: false },
        { name: "DJ Residente Tropical", time: "Warm Up", highlight: false },
      ]),
      tiers: {
        create: [
          {
            name: "Entrada General (Acceso hasta 02:00 AM)",
            description: "Ingreso al salón general antes de las 02:00 AM.",
            price: 8500,
            serviceFee: 850,
            capacity: 400,
            sold: 140,
            maxPerOrder: 6,
            status: "AVAILABLE",
          },
          {
            name: "Entrada General (Toda la noche)",
            description: "Ingreso sin límite horario toda la noche.",
            price: 11000,
            serviceFee: 1100,
            capacity: 300,
            sold: 45,
            maxPerOrder: 6,
            status: "AVAILABLE",
          },
          {
            name: "Entrada VIP + Consumición",
            description: "Acceso al entrepiso VIP con barra preferencial y 1 trago.",
            price: 18000,
            serviceFee: 1800,
            capacity: 100,
            sold: 30,
            maxPerOrder: 4,
            status: "AVAILABLE",
          },
        ],
      },
    },
  });

  // Event 3: NOCHE CLANDESTINA: RKT & CUMBIA 420
  const event3 = await prisma.event.create({
    data: {
      slug: "noche-clandestina-rkt-cumbia",
      title: "NOCHE CLANDESTINA: Cumbia 420 & RKT",
      subtitle: "Bajos potentes, perreo y cumbia de barrio",
      description: "La fiesta más descontrolada de la ciudad. Los referentes del sonido urbano y la nueva ola de cumbia argentina reunidos en un solo lugar.",
      date: new Date("2026-11-21T23:59:00.000Z"),
      doorsOpenTime: "23:30",
      venue: "Complejo C Art Media",
      address: "Av. Corrientes 6271, Chacarita",
      city: "Buenos Aires",
      coverImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop",
      bannerImage: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1600&auto=format&fit=crop",
      ageRestriction: "+18 años",
      status: "PUBLISHED",
      featured: false,
      lineup: JSON.stringify([
        { name: "L-Gante", time: "03:30", highlight: true },
        { name: "BM", time: "02:00", highlight: true },
        { name: "DJ Tao (Turreo Sessions)", time: "01:00", highlight: true },
        { name: "DJ Kaleb Di Masi", time: "04:30", highlight: false },
      ]),
      tiers: {
        create: [
          {
            name: "Early Bird (Primeras 200)",
            description: "Precio exclusivo primeras entradas.",
            price: 9000,
            serviceFee: 900,
            capacity: 200,
            sold: 200,
            maxPerOrder: 4,
            status: "SOLD_OUT",
          },
          {
            name: "General - Lote 2",
            description: "Acceso general para vivir la fiesta en pista.",
            price: 13500,
            serviceFee: 1350,
            capacity: 600,
            sold: 120,
            maxPerOrder: 6,
            status: "AVAILABLE",
          },
        ],
      },
    },
  });

  // Event 4: FESTIVAL CUMBIA LIBRE (GRATIS)
  const event4 = await prisma.event.create({
    data: {
      slug: "festival-cumbia-libre-parque-centenario",
      title: "FESTIVAL CUMBIA LIBRE: En Vivo en el Parque",
      subtitle: "Acceso 100% gratuito con registro previo",
      description: "Festival cultural al aire libre con grandes bandas de cumbia, feria gastronómica y baile popular. Entrada libre y gratuita con registro previo para control de capacidad.",
      date: new Date("2026-11-28T18:00:00.000Z"),
      doorsOpenTime: "17:00",
      venue: "Anfiteatro Parque Centenario",
      address: "Av. Díaz Vélez y Leopoldo Marechal",
      city: "Buenos Aires",
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
      bannerImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop",
      ageRestriction: "Apto para todo público",
      status: "PUBLISHED",
      featured: true,
      lineup: JSON.stringify([
        { name: "Mala Fama", time: "21:30", highlight: true },
        { name: "La Sonora Tropical", time: "20:00", highlight: true },
        { name: "Tambores del Sur", time: "18:30", highlight: false },
        { name: "DJ Cumbia al Paso", time: "Toda la tarde", highlight: false },
      ]),
      tiers: {
        create: [
          {
            name: "Entrada General (Acceso Gratuito)",
            description: "Registro de acceso libre hasta agotar capacidad del anfiteatro.",
            price: 0,
            serviceFee: 0,
            capacity: 800,
            sold: 230,
            maxPerOrder: 4,
            status: "AVAILABLE",
          },
        ],
      },
    },
  });

  // Create an initial sample order with 2 tickets so the scanner and admin panel already have live test data
  const generalTier = await prisma.ticketTier.findFirst({
    where: { eventId: event1.id, name: { contains: "General" } },
  });

  if (generalTier) {
    const sampleOrder = await prisma.order.create({
      data: {
        orderNumber: "CT-78219",
        eventId: event1.id,
        buyerName: "Martín",
        buyerLastName: "González",
        buyerEmail: "martin.gonzalez@ejemplo.com",
        buyerPhone: "1155443322",
        buyerDni: "38920112",
        subtotal: 24000,
        serviceFee: 2400,
        total: 26400,
        status: "PAID",
        paymentMethod: "SIMULATED",
        tickets: {
          create: [
            {
              ticketCode: "CT-TKT-A892B4",
              tierId: generalTier.id,
              attendeeName: "Martín",
              attendeeLastName: "González",
              attendeeDni: "38920112",
              price: 12000,
              status: "VALID",
            },
            {
              ticketCode: "CT-TKT-C731F9",
              tierId: generalTier.id,
              attendeeName: "Lucía",
              attendeeLastName: "Fernández",
              attendeeDni: "40112934",
              price: 12000,
              status: "VALID",
            },
          ],
        },
      },
      include: {
        tickets: true,
      },
    });

    console.log(`✅ Sample order created: #${sampleOrder.orderNumber}`);
    console.log(`🎟️ Sample Ticket 1: ${sampleOrder.tickets[0].ticketCode} (${sampleOrder.tickets[0].attendeeName})`);
    console.log(`🎟️ Sample Ticket 2: ${sampleOrder.tickets[1].ticketCode} (${sampleOrder.tickets[1].attendeeName})`);
  }

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
