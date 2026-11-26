import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container-page max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Page not found</h1>
        <p className="mt-4 text-lg text-muted">The page you are looking for does not exist or has moved.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn-primary">Back to home</Link>
          <Link href="/services" className="btn-secondary">Explore services</Link>
        </div>
      </div>
    </section>
  );
}
