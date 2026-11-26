import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container section text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-2 text-4xl font-extrabold">We couldn&apos;t find that page</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-navy-600">The link may be out of date. Try the homepage or send a service request.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn-secondary">
          Go to homepage
        </Link>
        <Link href="/request" className="btn-primary">
          Request service
        </Link>
      </div>
    </section>
  );
}
