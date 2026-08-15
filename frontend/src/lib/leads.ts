/**
 * Shared types and constants for lead intake feature.
 *
 * These values MUST mirror backend/leads/serializers.py exactly
 * to prevent client/server validation drift.
 */

export const MAX_FILES = 3;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB aggregate

/** Accepted MIME types for lead photo uploads. */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type ProjectTier = 'repair' | 'single_room' | 'adu';

export const VALID_TIER_VALUES = ['repair', 'single_room', 'adu'] as const;

export interface LeadIntakePayload {
  name: string;
  phone: string;
  email: string;
  project_tier: ProjectTier;
  details: string;
  photos: File[];
}