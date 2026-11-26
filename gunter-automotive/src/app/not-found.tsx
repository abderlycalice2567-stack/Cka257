import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container max-w-xl text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-4xl font-extrabold">Page not found</h1>
        <p className="mt-4 text-ink-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn-secondary">
            Go home
          </Link>
          <Link href="/request" className="btn-primary">
            Schedule a service request
          </Link>
        </div>
      </div>
    </section>
  );
}
