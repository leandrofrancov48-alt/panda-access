import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SCANNER_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SCANNER_COOKIE);
  return NextResponse.json({ success: true });
}
