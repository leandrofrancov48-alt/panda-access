import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import EditEventForm from "@/components/EditEventForm";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: EditPageProps) {
  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    include: {
      tiers: {
        orderBy: { price: "asc" },
      },
    },
  });

  if (!event) {
    notFound();
  }

  return <EditEventForm event={event} />;
}
