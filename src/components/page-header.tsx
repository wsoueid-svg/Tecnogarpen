import Link from "next/link";

export function PageHeader({
  title,
  lede,
  actionHref,
  actionLabel,
}: {
  title: string;
  lede?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {lede ? <p>{lede}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link className="button" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </header>
  );
}

export function QueryAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="form-error" role="alert">
      {message.slice(0, 300)}
    </p>
  );
}
