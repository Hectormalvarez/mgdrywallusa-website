import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-accent">404</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 text-lg text-muted">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-accent text-white font-semibold text-lg transition-colors hover:bg-accent-strong"
          >
            Go back home
          </Link>
        </div>
      </div>
    </main>
  );
}
