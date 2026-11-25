import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-3xl font-bold">Page not found · Page introuvable · Paj la pa egziste</h1>
      <Link href="/" className="btn-gold mt-8">The Kingdom Sound Radio</Link>
    </div>
  );
}
