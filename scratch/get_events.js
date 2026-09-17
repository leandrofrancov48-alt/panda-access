const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.event.findMany({ select: { id: true, title: true, slug: true } })
  .then(events => console.log(JSON.stringify(events, null, 2)))
  .finally(() => p.$disconnect());
