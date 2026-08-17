"use client";

import { useRef, useState, type RefObject } from "react";
import { type ProjectTier } from "@/features/leads/constants";
import { submitLead } from "@/lib/api";
import type { LeadApiErrors } from "@/features/leads/types";
import {
  type FormErrors,
  type ErrorFieldKey,
  validateName,
  validatePhone,
  validateEmail,
  validateProjectTier,
  validateFiles,
  validateForm,
  formatPhone,
} from "@/features/leads/validation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface LeadIntakeFormProps {
  apiUrl?: string;
}

const PROJECT_TIERS: { value: ProjectTier; label: string }[] = [
  { value: "repair", label: "Repair" },
  { value: "single_room", label: "Single Room" },
  { value: "adu", label: "ADU" },
];

const fieldBase =
  "w-full h-11 rounded-md border bg-surface px-4 text-base text-ink transition-colors placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-50";

function fieldClass(error?: string) {
  return cn(fieldBase, error ? "border-accent" : "border-border");
}

const FOCUS_ORDER: ErrorFieldKey[] = ["name", "phone", "email", "projectTier", "files"];

export default function LeadIntakeForm({ apiUrl = '/api/v1/leads/' }: LeadIntakeFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [projectTier, setProjectTier] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [fileValidationError, setFileValidationError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const projectTierRef = useRef<HTMLSelectElement | null>(null);
  const filesRef = useRef<HTMLInputElement | null>(null);

  function handleNameBlur() {
    const err = validateName(name);
    setErrors((prev) => ({ ...prev, name: err }));
  }

  function handlePhoneBlur() {
    const formatted = formatPhone(phone);
    if (formatted !== phone) setPhone(formatted);
    const err = validatePhone(formatted);
    setErrors((prev) => ({ ...prev, phone: err }));
  }

  function handleEmailBlur() {
    const err = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: err }));
  }

  function handleTierChange(value: string) {
    setProjectTier(value);
    const err = validateProjectTier(value);
    setErrors((prev) => ({ ...prev, projectTier: err }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const result = validateFiles(selected);

    if (result.errors.length > 0) {
      setErrors((prev) => ({ ...prev, files: result.errors.join('. ') }));
      setFileValidationError(true);
      setFiles([]);
      return;
    }

    setErrors((prev) => ({ ...prev, files: undefined }));
    setFileValidationError(false);
    setFiles(result.accepted);
  }

  function focusFirstInvalid(errs: FormErrors) {
    const refMap: Record<ErrorFieldKey, RefObject<HTMLInputElement | HTMLSelectElement | null> | undefined> = {
      name: nameRef,
      phone: phoneRef,
      email: emailRef,
      projectTier: projectTierRef,
      files: filesRef,
    };
    for (const key of FOCUS_ORDER) {
      if (errs[key]) {
        const el = refMap[key]?.current;
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (honeypot) return;

    const allErrors = validateForm({
      name, phone, email, projectTier, files, fileValidationError,
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      focusFirstInvalid(allErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('project_tier', projectTier);
      formData.append('details', details);
      files.forEach((file) => formData.append('photos', file));

      await submitLead(formData, apiUrl);
      setSubmitted(true);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; data?: { errors?: LeadApiErrors } };
      if (apiErr?.data?.errors) {
        const serverErrors: FormErrors = {};
        const src = apiErr.data.errors;
        if (src.name) serverErrors.name = Array.isArray(src.name) ? src.name[0] : src.name;
        if (src.phone) serverErrors.phone = Array.isArray(src.phone) ? src.phone[0] : src.phone;
        if (src.email) serverErrors.email = Array.isArray(src.email) ? src.email[0] : src.email;
        if (src.project_tier) serverErrors.projectTier = Array.isArray(src.project_tier) ? src.project_tier[0] : src.project_tier;
        if (src.photos) serverErrors.files = Array.isArray(src.photos) ? src.photos[0] : src.photos;
        setErrors(serverErrors);
        focusFirstInvalid(serverErrors);
      } else {
        const netErr: FormErrors = { files: 'Submission failed. Please try again.' };
        setErrors(netErr);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-lg border border-green-300 bg-green-50 p-6 text-center"
      >
        <h3 className="text-lg font-semibold text-green-800">
          Thank you!
        </h3>
        <p className="mt-2 text-green-700">
          Your request has been submitted successfully. We&apos;ll be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="lead-name" className="mb-1.5 block text-sm font-medium text-ink">
          Name <span className="text-accent" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          ref={nameRef}
          id="lead-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "lead-name-error" : undefined}
          className={fieldClass(errors.name)}
          placeholder="Your full name"
        />
        {errors.name && (
          <span id="lead-name-error" role="alert" className="mt-1.5 block text-sm text-accent">
            {errors.name}
          </span>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="lead-phone" className="mb-1.5 block text-sm font-medium text-ink">
          Phone <span className="text-accent" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          ref={phoneRef}
          id="lead-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={handlePhoneBlur}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "lead-phone-error" : undefined}
          className={fieldClass(errors.phone)}
          placeholder="555-123-4567"
        />
        {errors.phone && (
          <span id="lead-phone-error" role="alert" className="mt-1.5 block text-sm text-accent">
            {errors.phone}
          </span>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="lead-email" className="mb-1.5 block text-sm font-medium text-ink">
          Email <span className="text-accent" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          ref={emailRef}
          id="lead-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "lead-email-error" : undefined}
          className={fieldClass(errors.email)}
          placeholder="you@example.com"
        />
        {errors.email && (
          <span id="lead-email-error" role="alert" className="mt-1.5 block text-sm text-accent">
            {errors.email}
          </span>
        )}
      </div>

      {/* Project Tier */}
      <div>
        <label htmlFor="lead-project" className="mb-1.5 block text-sm font-medium text-ink">
          Project Tier <span className="text-accent" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <select
          ref={projectTierRef}
          id="lead-project"
          value={projectTier}
          onChange={(e) => handleTierChange(e.target.value)}
          aria-invalid={!!errors.projectTier}
          aria-describedby={errors.projectTier ? "lead-project-error" : undefined}
          className={fieldClass(errors.projectTier)}
        >
          <option value="">Select a tier…</option>
          {PROJECT_TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {errors.projectTier && (
          <span id="lead-project-error" role="alert" className="mt-1.5 block text-sm text-accent">
            {errors.projectTier}
          </span>
        )}
      </div>

      {/* Details */}
      <div>
        <label htmlFor="lead-details" className="mb-1.5 block text-sm font-medium text-ink">
          Details
        </label>
        <textarea
          id="lead-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className={cn(fieldBase, "h-28 py-3 resize-y border-border")}
          placeholder="Describe your project…"
        />
      </div>

      {/* Honeypot — hidden from real users, bots fill it */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="lead-company">Company</label>
        <input
          id="lead-company"
          type="text"
          name="company"
          autoComplete="off"
          tabIndex={-1}
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Photos */}
      <div>
        <label htmlFor="lead-photos" className="mb-1.5 block text-sm font-medium text-ink">
          Photos (up to 3)
        </label>
        <input
          ref={filesRef}
          id="lead-photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          aria-invalid={!!errors.files}
          aria-describedby={errors.files ? "lead-photos-error" : "lead-photos-hint"}
          className={cn(
            "w-full rounded-md border bg-surface px-4 text-sm text-ink transition-colors",
            "file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2.5",
            "file:min-h-11 file:text-sm file:font-semibold file:text-white file:cursor-pointer",
            "hover:file:bg-brand-strong",
            errors.files ? "border-accent" : "border-border"
          )}
        />
        <span id="lead-photos-hint" className="mt-1.5 block text-xs text-muted">
          JPEG, PNG, or WebP — up to 3 images, 10 MB each
        </span>
        {errors.files && (
          <span id="lead-photos-error" role="alert" className="mt-1.5 block text-sm text-accent">
            {errors.files}
          </span>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={submitting}
        className="w-full sm:w-auto"
      >
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
