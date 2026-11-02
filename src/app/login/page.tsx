import { redirect } from "next/navigation";
import { loginAs } from "../../auth/actions";
import { getActor } from "../../auth/current";
import { entraStatus } from "../../auth/entra";
import { landingPath } from "../../domain/access";
import { DIRECTORY_USERS, companyName } from "../../domain/directory";
import { roleLabel } from "../../domain/labels";

export const dynamic = "force-dynamic";

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
        <p>Centro de control · Incremento A</p>
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
            <p>Directorio de demostración. Elige una persona; no hay contraseña en este incremento.</p>
            <ul className="roster">
              {DIRECTORY_USERS.map((user) => (
                <li key={user.id}>
                  <form action={loginAs}>
                    <div>
                      <h3>{user.displayName}</h3>
                      <p>
                        {roleLabel(user.role)} · {user.companyIds.map((id) => companyName(id)).join(", ")}
                      </p>
                    </div>
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit">Entrar</button>
                  </form>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
