# Bill Snap evaluation

These 20 cases were run through `interpretOcr`, the same classification and extraction functions the app uses after OCR.
They are OCR transcripts, not photographs. On-device ML Kit output will differ on a real camera image.
Nothing in this table was typed in by hand after the run; `npm run evaluate` regenerated it.

| Image | Actual | Predicted | Merchant | Date | Amount | Category | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bill-01-cafe | bill | bill (match) | CAFE MOCHA | 2026-11-05 | ₹180.00 | Food | Clean cafe receipt; low confidence: date |
| bill-02-grocery-gst | bill | bill (match) | BIG BAZAAR | 2026-11-04 | ₹418.00 | Groceries | GST grocery invoice; low confidence: date |
| bill-03-electricity | bill | bill (match) | BESCOM | 2026-10-01 | ₹2,450.50 | Utilities | Utility bill; low confidence: date |
| bill-04-total-next-line | bill | bill (match) | SRI ANNAPOORNA | 2026-11-05 | ₹120.00 | Food | Total printed on the following line; low confidence: date |
| bill-05-two-dates | bill | bill (match) | CITY MART | 2026-11-01 | ₹999.00 | Groceries | Invoice date preferred over delivery date; low confidence: date |
| bill-06-no-merchant | bill | bill (match) | missing | 2026-11-11 | ₹30.00 | missing | Invoice with no merchant name |
| bill-07-pharmacy | bill | bill (match) | APOLLO PHARMACY | 2026-10-28 | ₹30.00 | missing | Valid bill outside the three categories |
| bill-08-tax-lines | bill | bill (match) | DAILY GROCERS | 2026-11-02 | ₹210.00 | Groceries | Tax lines must not replace the total; low confidence: date |
| bill-09-amount-next-line | bill | bill (match) | TATA POWER | 2026-10-15 | ₹1,200.00 | Utilities | Amount payable on the next line |
| bill-10-ocr-noise | bill | bill (match) | RAJU TEA STALL | 2026-11-07 | ₹50.00 | Food | OCR read T0tal instead of Total |
| bill-11-iso-date | bill | bill (match) | WATER BOARD | 2026-09-30 | ₹640.00 | Utilities | ISO date and INR prefix |
| bill-12-discount | bill | bill (match) | PIZZA HUT | 2026-11-03 | ₹450.00 | Food | Discount must not become the total; low confidence: date |
| bill-13-cash-change | bill | bill (match) | LOCAL KIRANA | 2026-11-06 | ₹180.00 | Groceries | Cash tendered is not the total; low confidence: date |
| bill-14-upi | bill | bill (match) | SWIGGY | 2026-11-04 | ₹486.00 | Food | UPI payment receipt |
| bill-15-missing-amount | bill | bill (match) | MEGHANA FOODS | 2026-11-09 | missing | Food | Invoice text with no readable amount; low confidence: date |
| nonbill-01-selfie | non-bill | non-bill (match) | n/a | n/a | n/a | n/a | Almost no text, like a selfie |
| nonbill-02-aadhaar | non-bill | non-bill (match) | n/a | n/a | n/a | n/a | Identity card |
| nonbill-03-whatsapp | non-bill | non-bill (match) | n/a | n/a | n/a | n/a | Chat screenshot |
| nonbill-04-instagram | non-bill | non-bill (match) | n/a | n/a | n/a | n/a | Social app screenshot |
| nonbill-05-article | non-bill | non-bill (match) | n/a | n/a | n/a | n/a | Article with text but no receipt signals |
