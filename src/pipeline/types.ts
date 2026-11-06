import type { ExpenseCategory } from '../domain/categories';

export type OcrLine = {
  text: string;
  topRatio?: number;
};

export type OcrDocument = {
  lines: OcrLine[];
};

export type Confidence = 'high' | 'low' | 'missing';

export type Field<T> = {
  value: T | null;
  confidence: Confidence;
};

export type RejectReason = 'low-text' | 'identity-document' | 'app-screenshot' | 'not-a-receipt';

export type BillDecision = 'accepted' | 'needs-review' | 'rejected';

export type Classification = {
  isBill: boolean;
  decision: BillDecision;
  reason: RejectReason | null;
  signals: string[];
};

export type ExtractedFields = {
  merchant: Field<string>;
  date: Field<string>;
  amountMinor: Field<number>;
  category: Field<ExpenseCategory>;
};
