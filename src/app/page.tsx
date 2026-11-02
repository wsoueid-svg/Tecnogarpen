import { redirect } from "next/navigation";
import { getActor } from "../auth/current";
import { landingPath } from "../domain/access";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  redirect(landingPath(actor.role));
}
