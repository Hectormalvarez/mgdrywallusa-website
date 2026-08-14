/**
 * Shared types and constants for lead intake feature.
 */

export const MAX_FILES = 3;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export type ProjectTier = 'repair' | 'single_room' | 'adu';

export interface LeadIntakePayload {
  name: string;
  phone: string;
  email: string;
  project_tier: ProjectTier;
  details: string;
  photos: File[];
}