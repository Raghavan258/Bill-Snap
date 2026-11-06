import type { ExtractedFields } from '../pipeline/types';

export type ReviewDraft = {
  imageUri: string;
  source: 'scan' | 'gallery';
  fields: ExtractedFields;
  uncertain: boolean;
};

let current: ReviewDraft | null = null;

export function setReviewDraft(draft: ReviewDraft): void {
  current = draft;
}

export function getReviewDraft(): ReviewDraft | null {
  return current;
}

export function clearReviewDraft(): void {
  current = null;
}
