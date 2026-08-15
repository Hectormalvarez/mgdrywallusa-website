/**
 * Client-side validation helpers for lead intake.
 *
 * All regex patterns and byte limits are kept in sync with
 * backend/leads/serializers.py to prevent drift.
 */

import {
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  VALID_TIER_VALUES,
} from './leads';

// ---------------------------------------------------------------------------
// Phone regex — must match backend US_PHONE_RE exactly
// ^(\+1[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3,4}[\s\-]?\d{0,4}$
// ---------------------------------------------------------------------------
const US_PHONE_RE =
  /^(\+1[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3,4}[\s\-]?\d{0,4}$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Field validators — each returns an error string or undefined
// ---------------------------------------------------------------------------

export function validateName(value: string): string | undefined {
  if (!value.trim()) return 'Name is required';
  return undefined;
}

/**
 * Format a US phone number with dashes on blur.
 * Strips everything except digits and +, then inserts dashes.
 * Input:  "5551234567" → Output: "555-123-4567"
 * Input:  "5551234"    → Output: "555-1234"
 * Input:  "+15551234567" → Output: "+1-555-123-4567"
 */
export function formatPhone(value: string): string {
  // Keep leading + for +1 prefix detection
  const hasPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');

  if (!digits) return '';

  // Handle +1 prefix
  if (hasPlus && digits.startsWith('1') && digits.length >= 11) {
    const rest = digits.slice(1);
    if (rest.length <= 3) return `+1-${rest}`;
    if (rest.length <= 6) return `+1-${rest.slice(0, 3)}-${rest.slice(3)}`;
    return `+1-${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6, 10)}`;
  }

  // No prefix — format based on digit count
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function validatePhone(value: string): string | undefined {
  if (!value.trim()) return 'Phone is required';
  if (!US_PHONE_RE.test(value.trim())) {
    return 'Enter a valid US phone number (e.g. 555-123-4567)';
  }
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email is required';
  if (!EMAIL_RE.test(value.trim())) {
    return 'Enter a valid email address';
  }
  return undefined;
}

export function validateProjectTier(value: string): string | undefined {
  if (!value) return 'Project tier is required';
  if (!(VALID_TIER_VALUES as readonly string[]).includes(value)) {
    return 'Invalid project tier';
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// File pre-flight validation
// ---------------------------------------------------------------------------

export interface FileValidationResult {
  errors: string[];
  accepted: File[];
}

/**
 * Run pre-flight checks on selected files: count, individual size, aggregate
 * size, and MIME type. Returns accepted files and any error messages.
 */
export function validateFiles(files: File[]): FileValidationResult {
  const errors: string[] = [];

  if (files.length > MAX_FILES) {
    errors.push(`No more than ${MAX_FILES} files allowed`);
  }

  const allowedSet = new Set<string>(ALLOWED_MIME_TYPES);
  for (const f of files) {
    if (f.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`'${f.name}' exceeds the 10 MB limit`);
    }
    if (!allowedSet.has(f.type)) {
      errors.push(
        `'${f.name}' is not an accepted file type (use JPEG, PNG, or WebP)`
      );
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    errors.push('Total upload size exceeds 10 MB');
  }

  // If there are any errors, reject all files
  const accepted = errors.length === 0 ? files : [];

  return { errors, accepted };
}

// ---------------------------------------------------------------------------
// Full form validation (used on submit)
// ---------------------------------------------------------------------------

export interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  projectTier?: string;
  files?: string;
}

/** Keys of FormErrors that map to a DOM element via id="lead-{key}-*". */
export type ErrorFieldKey = keyof FormErrors;

/**
 * Validate all fields and return an errors object. Also validates files if present.
 */
export function validateForm(fields: {
  name: string;
  phone: string;
  email: string;
  projectTier: string;
  files: File[];
  fileValidationError: boolean;
}): FormErrors {
  const errs: FormErrors = {};

  const nameErr = validateName(fields.name);
  if (nameErr) errs.name = nameErr;

  const phoneErr = validatePhone(fields.phone);
  if (phoneErr) errs.phone = phoneErr;

  const emailErr = validateEmail(fields.email);
  if (emailErr) errs.email = emailErr;

  const tierErr = validateProjectTier(fields.projectTier);
  if (tierErr) errs.projectTier = tierErr;

  if (fields.fileValidationError) {
    errs.files = errs.files ?? 'Fix file errors before submitting';
  }

  return errs;
}
