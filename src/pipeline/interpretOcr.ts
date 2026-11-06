import { classifyBill, rejectionMessage } from './classifyBill';
import { extractAmount } from './extractAmount';
import { extractCategory } from './extractCategory';
import { extractDate } from './extractDate';
import { extractMerchant } from './extractMerchant';
import type { Classification, ExtractedFields, OcrDocument } from './types';

export type BillReading = {
  kind: 'bill';
  classification: Classification;
  fields: ExtractedFields;
};

export type RejectedReading = {
  kind: 'rejected';
  classification: Classification;
  message: string;
};

export type Reading = BillReading | RejectedReading;

/** Runs classification first. Field extraction only runs for documents accepted as bills. */
export function interpretOcr(doc: OcrDocument): Reading {
  const classification = classifyBill(doc);
  if (!classification.isBill) return rejected(classification);
  return { kind: 'bill', classification, fields: extractFields(doc) };
}

function rejected(classification: Classification): RejectedReading {
  return {
    kind: 'rejected',
    classification,
    message: rejectionMessage(classification.reason ?? 'not-a-receipt'),
  };
}

function extractFields(doc: OcrDocument): ExtractedFields {
  return {
    merchant: extractMerchant(doc),
    date: extractDate(doc),
    amountMinor: extractAmount(doc),
    category: extractCategory(doc),
  };
}
