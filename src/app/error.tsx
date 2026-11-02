"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="field-desk">
      <h1>No se ha podido abrir esta pantalla</h1>
      <p>Reintenta la carga. Si el almacén de datos está mal configurado, revisa el README.</p>
      <button type="button" onClick={() => reset()}>
        Reintentar
      </button>
    </main>
  );
}
