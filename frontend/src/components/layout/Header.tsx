"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import type { SiteSettingsData } from "@/types/settings";

interface HeaderProps {
  settings: SiteSettingsData;
}

export default function Header({ settings }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    } else {
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
            className="flex items-center gap-2 font-extrabold text-lg text-brand tracking-tight"
          >
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.site_name}
                className="h-10 w-auto"
              />
            ) : (
              settings.site_name
            )}
          </a>

          {/* Desktop nav */}
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {settings.nav.map((item) => (
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
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          aria-hidden="true"
          onClick={close}
          className="fixed inset-0 top-0 z-40 bg-ink/50 md:hidden"
        />
      )}

      {/* Mobile drawer — slide-in panel from right */}
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-sm md:hidden transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col bg-surface shadow-2xl">
          {/* Drawer header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
            <span className="font-extrabold text-lg text-brand tracking-tight">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.site_name}
                  className="h-8 w-auto"
                />
              ) : (
                settings.site_name
              )}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="inline-flex items-center justify-center w-11 h-11 rounded-md text-brand transition-colors hover:bg-brand/10"
            >
              <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav aria-label="Main mobile" className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="flex flex-col gap-1">
              {settings.nav.map((item, i) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={close}
                    className="group flex items-center gap-3 rounded-lg px-4 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-brand/5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand/10 text-sm font-bold text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                      {i + 1}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Drawer footer */}
          <div className="shrink-0 border-t border-border px-4 py-6 space-y-3">
            <a
              href={`tel:${settings.phone_number}`}
              className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
            >
              <svg aria-hidden="true" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {settings.phone_number}
            </a>
            <a
              href="#lead-form"
              onClick={close}
              className="flex items-center justify-center w-full h-12 rounded-lg bg-accent text-white font-semibold text-base transition-colors hover:bg-accent-strong"
            >
              Get a Free Quote
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
