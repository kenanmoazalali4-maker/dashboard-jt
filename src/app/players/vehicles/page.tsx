import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getVehicles } from "@/lib/prisma";
import VehiclesClient from "./VehiclesClient";

export default async function VehiclesPage() {
  const session = await auth();
  if (!(session as any)?.staff) redirect("/login");

  let vehicles: any[] = [];
  try {
    vehicles = (await getVehicles(500)).map((v: any) => ({
      id: v.id, citizenid: v.citizenid, vehicle: v.vehicle, plate: v.plate,
      garage: v.garage, fuel: v.fuel, engine: v.engine, body: v.body,
      state: v.state, ownerName: v.ownerName || "غير معروف",
    }));
  } catch (e) {
    console.error("Error fetching vehicles:", e);
  }

  return <VehiclesClient vehicles={vehicles} staff={(session as any).staff} />;
}
