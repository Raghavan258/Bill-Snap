import type { ExpenseCategory } from '../src/domain/categories';
import { interpretOcr } from '../src/pipeline/interpretOcr';
import type { OcrDocument } from '../src/pipeline/types';

export type EvalCase = {
  id: string;
  actualType: 'bill' | 'non-bill';
  note: string;
  text: string;
  merchant: string | null;
  date: string | null;
  amountMinor: number | null;
  category: ExpenseCategory | null;
};

export function documentFrom(text: string): OcrDocument {
  return {
    lines: text.split('\n').map((line) => ({ text: line.trim() })).filter((line) => line.text.length > 0),
  };
}

export const EVAL_CASES: EvalCase[] = [
  caseOf('bill-01-cafe', 'bill', 'Clean cafe receipt', 'CAFE MOCHA', '2026-11-05', 18000, 'Food', `CAFE MOCHA
12 MG Road
Date: 05/11/2026
Cappuccino 180.00
Total 180.00`),
  caseOf('bill-02-grocery-gst', 'bill', 'GST grocery invoice', 'BIG BAZAAR', '2026-11-04', 41800, 'Groceries', `BIG BAZAAR
GSTIN 29ABCDE1234F1Z5
Tax Invoice
Date 04-11-2026
Rice 5kg 320.00
Milk 60.00
CGST 19.00
SGST 19.00
Grand Total 418.00`),
  caseOf('bill-03-electricity', 'bill', 'Utility bill', 'BESCOM', '2026-10-01', 245050, 'Utilities', `BESCOM
Electricity Bill
Account 1234567890
Bill Date: 01.10.2026
Amount Payable 2,450.50`),
  caseOf('bill-04-total-next-line', 'bill', 'Total printed on the following line', 'SRI ANNAPOORNA', '2026-11-05', 12000, 'Food', `SRI ANNAPOORNA
HOTEL
Date 5-11-26
Idly 2 40.00
Dosa 80.00
Total
120.00`),
  caseOf('bill-05-two-dates', 'bill', 'Invoice date preferred over delivery date', 'CITY MART', '2026-11-01', 99900, 'Groceries', `CITY MART
Invoice Date 01/11/2026
Delivery 03/11/2026
Rice 10kg 400.00
Oil 599.00
Total 999.00`),
  caseOf('bill-06-no-merchant', 'bill', 'Invoice with no merchant name', null, '2026-11-11', 3000, null, `Tax Invoice
Date: 11/11/2026
Item A 10.00
Item B 20.00
Total 30.00`),
  caseOf('bill-07-pharmacy', 'bill', 'Valid bill outside the three categories', 'APOLLO PHARMACY', '2026-10-28', 3000, null, `APOLLO PHARMACY
Tax Invoice
Date 28/10/2026
Paracetamol 30.00
Total 30.00`),
  caseOf('bill-08-tax-lines', 'bill', 'Tax lines must not replace the total', 'DAILY GROCERS', '2026-11-02', 21000, 'Groceries', `DAILY GROCERS
Date 02/11/2026
Subtotal 200.00
CGST 5.00
SGST 5.00
Total 210.00`),
  caseOf('bill-09-amount-next-line', 'bill', 'Amount payable on the next line', 'TATA POWER', '2026-10-15', 120000, 'Utilities', `TATA  POWER
Electricity
Bill Date 15-10-2026
Amount Payable
Rs. 1,200.00`),
  caseOf('bill-10-ocr-noise', 'bill', 'OCR read T0tal instead of Total', 'RAJU TEA STALL', '2026-11-07', 5000, 'Food', `RAJU TEA STALL
Dt 7 Nov 2026
Tea 20
Snacks 30
T0tal 50`),
  caseOf('bill-11-iso-date', 'bill', 'ISO date and INR prefix', 'WATER BOARD', '2026-09-30', 64000, 'Utilities', `WATER BOARD
Utility Bill
2026-09-30
Total INR 640.00`),
  caseOf('bill-12-discount', 'bill', 'Discount must not become the total', 'PIZZA HUT', '2026-11-03', 45000, 'Food', `PIZZA HUT
Receipt
Date: 03/11/2026
Subtotal 500.00
Discount 50.00
Total 450.00`),
  caseOf('bill-13-cash-change', 'bill', 'Cash tendered is not the total', 'LOCAL KIRANA', '2026-11-06', 18000, 'Groceries', `LOCAL KIRANA
Cash Memo
Date 06.11.2026
Total 180.00
Cash 200.00
Change 20.00`),
  caseOf('bill-14-upi', 'bill', 'UPI payment receipt', 'SWIGGY', '2026-11-04', 48600, 'Food', `Payment Successful
Paid to SWIGGY
04 Nov 2026
₹486.00
UPI Ref 123456789012`),
  caseOf('bill-15-missing-amount', 'bill', 'Invoice text with no readable amount', 'MEGHANA FOODS', '2026-11-09', null, 'Food', `MEGHANA FOODS
Tax Invoice
Bill No 441
Date: 09/11/2026
Meals
Thank you`),
  caseOf('nonbill-01-selfie', 'non-bill', 'Almost no text, like a selfie', null, null, null, null, 'IMG_2044'),
  caseOf('nonbill-02-aadhaar', 'non-bill', 'Identity card', null, null, null, null, `Government of India
Aadhaar
Name Ravi Kumar
DOB: 01/01/1990
1234 5678 9012`),
  caseOf('nonbill-03-whatsapp', 'non-bill', 'Chat screenshot', null, null, null, null, `WhatsApp
Today
Priya
See you at 6
Type a message`),
  caseOf('nonbill-04-instagram', 'non-bill', 'Social app screenshot', null, null, null, null, `Instagram
stories
likes
following
Your story`),
  caseOf('nonbill-05-article', 'non-bill', 'Article with text but no receipt signals', null, null, null, null, `The Daily Herald
City council approves a new park near the river
Residents said the plan would take three years
Officials declined to comment on the budget talks`),
];

function caseOf(
  id: string,
  actualType: EvalCase['actualType'],
  note: string,
  merchant: string | null,
  date: string | null,
  amountMinor: number | null,
  category: ExpenseCategory | null,
  text: string,
): EvalCase {
  return { id, actualType, note, merchant, date, amountMinor, category, text };
}

export function runCase(item: EvalCase) {
  return interpretOcr(documentFrom(item.text));
}
