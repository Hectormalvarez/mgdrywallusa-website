"use client";

import { useState } from "react";
import { MAX_FILES, MAX_FILE_SIZE_BYTES, type ProjectTier } from "@/lib/leads";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface LeadIntakeFormProps {
  apiUrl?: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  projectTier?: string;
  files?: string;
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

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!phone.trim()) errs.phone = 'Phone is required';
    if (!email.trim()) errs.email = 'Email is required';
    if (!projectTier) errs.projectTier = 'Project tier is required';
    return errs;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const validationErrors: string[] = [];

    if (selected.length > MAX_FILES) {
      validationErrors.push(`No more than ${MAX_FILES} files allowed`);
    }

    const oversized = selected.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      validationErrors.push('Each file must be under 10MB');
    }

    if (validationErrors.length > 0) {
      setErrors((prev) => ({ ...prev, files: validationErrors.join('. ') }));
      setFileValidationError(true);
      setFiles([]);
      return;
    }

    setErrors((prev) => ({ ...prev, files: undefined }));
    setFileValidationError(false);
    setFiles(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot: silently abort
    if (honeypot) return;

    const fieldErrors = validate();
    const fileErrors: FormErrors = {};

    if (files.length > MAX_FILES) {
      fileErrors.files = `No more than ${MAX_FILES} files allowed`;
    }
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      fileErrors.files = 'Each file must be under 10MB';
    }

    const allErrors = { ...fieldErrors, ...fileErrors };
    if (Object.keys(allErrors).length > 0 || Object.keys(fieldErrors).length > 0 || fileValidationError) {
      setErrors((prev) => ({ ...prev, ...allErrors }));
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('project_tier', projectTier);
      formData.append('details', details);
      files.forEach((file) => formData.append('photos', file));

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      setSubmitted(true);
      setErrors({});
    } catch {
      setErrors({ files: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-lg border border-success/30 bg-success-tint px-6 py-8 text-center"
      >
        <svg
          aria-hidden="true"
          className="mx-auto h-12 w-12 text-success"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-3 text-lg font-semibold text-success">Thank you!</h3>
        <p className="mt-1 text-sm text-success/80">
          Your submission was received successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="company"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          opacity: 0,
          height: 0,
          width: 0,
        }}
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />

      {/* Name */}
      <div>
        <label htmlFor="lead-name" className="mb-1.5 block text-sm font-medium text-ink">
          Name <span className="text-accent" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="lead-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "lead-name-error" : undefined}
          className={fieldClass(errors.name)}
          placeholder="Full name"
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
          id="lead-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "lead-phone-error" : undefined}
          className={fieldClass(errors.phone)}
          placeholder="(555) 123-4567"
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
          id="lead-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          id="lead-project"
          value={projectTier}
          onChange={(e) => setProjectTier(e.target.value)}
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

      {/* Photos */}
      <div>
        <label htmlFor="lead-photos" className="mb-1.5 block text-sm font-medium text-ink">
          Photos (up to 3)
        </label>
        <input
          id="lead-photos"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          aria-invalid={!!errors.files}
          aria-describedby="lead-photos-hint"
          className={cn(
            "w-full rounded-md border bg-surface px-4 text-sm text-ink transition-colors",
            "file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2.5",
            "file:min-h-11 file:text-sm file:font-semibold file:text-white file:cursor-pointer",
            "hover:file:bg-brand-strong",
            errors.files ? "border-accent" : "border-border"
          )}
        />
        <span id="lead-photos-hint" className="mt-1.5 block text-xs text-muted">
          Up to 3 images, 10 MB each
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