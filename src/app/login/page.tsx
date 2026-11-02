import { redirect } from "next/navigation";
import { loginAs } from "../../auth/actions";
import { getActor } from "../../auth/current";
import { entraStatus } from "../../auth/entra";
import { landingPath } from "../../domain/access";
import { ResetDemo } from "../../components/reset-demo";
import { DIRECTORY_USERS, companyName, type DirectoryUser } from "../../domain/directory";

export const dynamic = "force-dynamic";

function persona(user: DirectoryUser): { kicker: string; lands: string; kind: "oficina" | "campo" } {
  if (user.role === "operario") {
    return { kicker: "Operario", lands: "Entra a Mi día", kind: "campo" };
  }
  if (user.role === "jefe") {
    return { kicker: "Jefe · oficina", lands: "Entra al panel", kind: "oficina" };
  }
  return { kicker: "Oficina", lands: "Entrar", kind: "oficina" };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await getActor();
  if (actor) redirect(landingPath(actor.role));
  const status = entraStatus();
  const query = await searchParams;
  const error =
    query.error === "entra"
      ? "El modo Entra no abre sesión en este incremento."
      : query.error === "usuario"
        ? "Ese usuario no está en el directorio de demostración."
        : null;

  return (
    <main className="gate">
      <section className="gate-brand">
        <p className="mark">TG</p>
        <h1>Tecno Garpen</h1>
        <p>Demo Adri · sin contraseña</p>
      </section>
      <section className="gate-roster">
        <h2>Entrar</h2>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {status.mode === "entra" ? (
          <>
            <p>
              AUTH_MODE=entra reserva Microsoft Entra. El directorio local está apagado y el flujo de
              Microsoft se conectará en un incremento posterior.
            </p>
            <ul className="checks">
              <li>Tenant: {status.tenantConfigured ? "indicado" : "pendiente"}</li>
              <li>Client id: {status.clientConfigured ? "indicado" : "pendiente"}</li>
              <li>Client secret: {status.secretConfigured ? "indicado" : "pendiente"}</li>
            </ul>
          </>
        ) : (
          <>
            <p>No hay contraseña. Elige quién entra: Marta abre la oficina, Pol abre el día de campo.</p>
            <ul className="roster">
              {DIRECTORY_USERS.map((user) => {
                const card = persona(user);
                return (
                  <li key={user.id} className={`persona-${card.kind}`}>
                    <form action={loginAs}>
                      <div>
                        <p className="persona-kicker">{card.kicker}</p>
                        <h3>{user.displayName}</h3>
                        <p>{user.companyIds.map((id) => companyName(id)).join(" · ")}</p>
                      </div>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit">{card.lands}</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <ResetDemo next="/login" />
      </section>
    </main>
  );
}
