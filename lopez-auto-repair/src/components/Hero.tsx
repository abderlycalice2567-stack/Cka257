import Link from "next/link";
import { Illustration } from "./Illustration";

export function Hero() {
  return (
    <section className="bg-navy-50">
      <div className="container grid items-center gap-10 py-14 md:grid-cols-12 md:py-24">
        <div className="md:col-span-6">
          <p className="eyebrow">Auto repair</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">Dependable auto care, made simple</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-600">
            Explore our services and tell us what you need. Start with a simple request.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/request" className="btn-primary">
              Request service
            </Link>
            <Link href="/services" className="btn-secondary">
              Explore services
            </Link>
          </div>
        </div>
        <div className="md:col-span-6">
          <Illustration art="inspect" alt="Illustration of a mechanic looking under the open hood of a car" priority />
        </div>
      </div>
    </section>
  );
}
