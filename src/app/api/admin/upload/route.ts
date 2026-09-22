import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no soportado. Usá JPG, PNG, WebP o GIF." },
        { status: 400 }
      );
    }

    // Validate file size (max 4.5MB for Vercel Blob free tier)
    const maxSize = 4.5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "La imagen es demasiado grande. Máximo 4.5MB." },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .substring(0, 50);
    const filename = `events/${safeName}-${timestamp}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen. Verificá que Vercel Blob esté configurado." },
      { status: 500 }
    );
  }
}
