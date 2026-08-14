"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      toggleRef.current?.focus();
    }
  }, [open]);

  // Focus trap + Escape handling
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const getFocusable = () =>
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-[60] focus:bg-accent focus:text-white focus:px-4 focus:py-3 focus:font-semibold"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border">
        <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <a
            href="#"
            className="font-extrabold text-lg text-brand tracking-tight"
          >
            {SITE.name}
          </a>

          {/* Desktop nav */}
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {SITE.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex items-center h-11 px-4 text-sm font-semibold text-brand rounded-md transition-colors hover:bg-brand/10"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hamburger toggle */}
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-brand transition-colors",
              "hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            )}
          >
            <svg
              aria-hidden="true"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile drawer */}
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal={open}
          aria-label="Main navigation"
          className={cn(
            "fixed inset-x-0 top-16 bottom-0 bg-surface z-50 md:hidden transition-transform duration-200 ease-in-out",
            open ? "translate-x-0" : "translate-x-full"
          )}
          hidden={!open}
        >
          <nav aria-label="Main" className="px-4 pt-6">
            <ul className="flex flex-col gap-1">
              {SITE.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={close}
                    className="block h-11 leading-[2.75rem] px-4 text-base font-semibold text-brand rounded-md transition-colors hover:bg-brand/10"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          aria-hidden="true"
          onClick={close}
          className="fixed inset-0 top-16 z-40 bg-ink/40 md:hidden"
        />
      )}
    </>
  );
}
