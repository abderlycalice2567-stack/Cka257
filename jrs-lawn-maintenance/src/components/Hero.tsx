import { IllustrativeImage } from "./IllustrativeImage";
import { ButtonLink, Container } from "./ui";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="bg-tan-light">
      <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h1 id="hero-title" className="font-heading text-4xl font-extrabold leading-tight text-pine-ink sm:text-5xl">
            Keep your lawn looking its best
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">Explore our services and tell us what you need. Start with a simple request.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/request">Request lawn service</ButtonLink>
            <ButtonLink href="/services" variant="secondary">
              Explore services
            </ButtonLink>
          </div>
        </div>
        <div className="lg:col-span-6">
          <IllustrativeImage src="/images/hero.svg" alt="Illustration of a neatly mowed front lawn with a house and trees" width={800} height={600} priority />
        </div>
      </Container>
    </section>
  );
}
