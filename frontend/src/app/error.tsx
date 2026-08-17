"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center px-4 sm:px-6 lg:px-8">
      <div
        className="text-center"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <p className="text-base font-semibold text-accent">Error</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mt-4 text-lg text-muted">
          We encountered an unexpected issue. Please try again or return home.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-accent text-white font-semibold text-lg transition-colors hover:bg-accent-strong"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg border-2 border-brand text-brand font-semibold text-lg transition-colors hover:bg-brand hover:text-white"
          >
            Go back home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-sm text-muted">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
    </main>
  );
}
