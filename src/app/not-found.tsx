import Link from "next/link";

export default function NotFound() {
  return (
    <main className="field-desk">
      <h1>Página no encontrada</h1>
      <p>
        <Link href="/">Volver al inicio</Link>
      </p>
    </main>
  );
}
