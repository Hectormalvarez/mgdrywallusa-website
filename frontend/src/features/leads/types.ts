/**
 * Types for the lead intake API.
 */

export type ProjectTier = 'repair' | 'single_room' | 'adu';

export interface LeadSubmission {
  name: string;
  phone: string;
  email: string;
  project_tier: ProjectTier;
  details: string;
  photos: File[];
}

export interface LeadApiResponse {
  status: 'created';
  id: number;
}

export interface LeadApiErrors {
  [field: string]: string | string[];
}
