import Link from "next/link";
import { Container, buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="bg-tan-light py-20">
      <Container>
        <h1 className="font-heading text-4xl font-extrabold text-pine-ink">Page not found</h1>
        <p className="mt-4 text-lg text-muted">Sorry, we couldn&apos;t find that page.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className={buttonClass("primary")}>
            Go to home
          </Link>
          <Link href="/request" className={buttonClass("secondary")}>
            Request lawn service
          </Link>
        </div>
      </Container>
    </div>
  );
}
