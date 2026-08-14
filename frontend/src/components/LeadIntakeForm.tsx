'use client';

import { useState, type FormEvent } from 'react';
import { MAX_FILES, MAX_FILE_SIZE_BYTES, type ProjectTier } from '@/lib/leads';

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
  { value: 'repair', label: 'Repair' },
  { value: 'single_room', label: 'Single Room' },
  { value: 'adu', label: 'ADU' },
];

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

  async function handleSubmit(e: FormEvent) {
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
    } catch (err) {
      setErrors({ files: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p role="status">Thank you! Your submission was received successfully.</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="company"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />

      <div>
        <label htmlFor="lead-name">Name</label>
        <input id="lead-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        {errors.name && <span role="alert">{errors.name}</span>}
      </div>

      <div>
        <label htmlFor="lead-phone">Phone</label>
        <input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {errors.phone && <span role="alert">{errors.phone}</span>}
      </div>

      <div>
        <label htmlFor="lead-email">Email</label>
        <input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {errors.email && <span role="alert">{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="lead-project">Project Tier</label>
        <select id="lead-project" value={projectTier} onChange={(e) => setProjectTier(e.target.value)}>
          <option value="">Select a tier…</option>
          {PROJECT_TIERS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {errors.projectTier && <span role="alert">{errors.projectTier}</span>}
      </div>

      <div>
        <label htmlFor="lead-details">Details</label>
        <textarea id="lead-details" value={details} onChange={(e) => setDetails(e.target.value)} />
      </div>

      <div>
        <label htmlFor="lead-photos">Photos (up to 3)</label>
        <input id="lead-photos" type="file" accept="image/*" multiple onChange={handleFileChange} />
        {errors.files && <span role="alert">{errors.files}</span>}
      </div>

      <button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</button>
    </form>
  );
}