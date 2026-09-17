const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("--- TEST CRUD EVENTOS ---");

  // 1. Crear evento de prueba temporal
  console.log("1. Creando evento temporal para test...");
  const createRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Evento Test Para Borrar",
      subtitle: "Subtítulo de prueba",
      description: "Descripción de prueba",
      date: new Date(Date.now() + 86400000 * 10).toISOString(),
      venue: "Club Tropical Test",
      address: "Av. Siempre Viva 123",
      city: "Buenos Aires",
      coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
      tiers: [
        { name: "General Test", price: 5000, capacity: 50 }
      ]
    })
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error("Fallo al crear: " + JSON.stringify(createData));
  }
  const eventId = createData.event.id;
  console.log(`✅ Evento creado con ID: ${eventId}`);

  // 2. Probar GET /api/admin/events/[id]
  console.log("2. Probando GET /api/admin/events/[id]...");
  const getRes = await fetch(`${BASE_URL}/api/admin/events/${eventId}`);
  const getData = await getRes.json();
  if (!getRes.ok || !getData.success || getData.event.id !== eventId) {
    throw new Error("Fallo GET: " + JSON.stringify(getData));
  }
  console.log(`✅ GET exitoso: ${getData.event.title}, Tandas: ${getData.event.tiers.length}`);

  // 3. Probar PUT /api/admin/events/[id]
  console.log("3. Probando PUT /api/admin/events/[id]...");
  const updateRes = await fetch(`${BASE_URL}/api/admin/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Evento Test MODIFICADO",
      subtitle: "Subtítulo editado con éxito",
      description: "Descripción editada",
      date: getData.event.date,
      venue: "Estadio Modificado",
      address: "Calle Falsa 456",
      city: "Rosario",
      coverImage: getData.event.coverImage,
      tiers: [
        { id: getData.event.tiers[0].id, name: "General Test Modificada", price: 6500, capacity: 75 },
        { name: "VIP Nueva Tanda", price: 12000, capacity: 30 }
      ]
    })
  });
  const updateData = await updateRes.json();
  if (!updateRes.ok || !updateData.success || updateData.event.title !== "Evento Test MODIFICADO") {
    throw new Error("Fallo PUT: " + JSON.stringify(updateData));
  }
  console.log(`✅ PUT exitoso: Título nuevo '${updateData.event.title}', Tandas: ${updateData.event.tiers.length}`);

  // 4. Probar DELETE /api/admin/events/[id]
  console.log("4. Probando DELETE /api/admin/events/[id]...");
  const deleteRes = await fetch(`${BASE_URL}/api/admin/events/${eventId}`, {
    method: "DELETE"
  });
  const deleteData = await deleteRes.json();
  if (!deleteRes.ok || !deleteData.success) {
    throw new Error("Fallo DELETE: " + JSON.stringify(deleteData));
  }
  console.log(`✅ DELETE exitoso: ${deleteData.message}`);

  // 5. Verificar que ya no existe (404)
  console.log("5. Verificando que GET devuelva 404...");
  const verifyRes = await fetch(`${BASE_URL}/api/admin/events/${eventId}`);
  if (verifyRes.status === 404) {
    console.log("✅ 404 confirmado: el evento ya no existe en la base de datos.");
  } else {
    throw new Error("El evento todavía existe después de DELETE.");
  }

  console.log("\n🎉 ¡TODOS LOS TESTS DE CRUD PASARON EXITOSAMENTE!");
}

runTests().catch(err => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
