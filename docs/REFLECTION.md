# Reflection

## Decisions

The repository contained product notes and reference images, and no application. The app was created with Expo SDK 58 and React Native 0.88, keeping `AGENTS.md`, the Cursor rules, and the reference images in place.

OCR is Google ML Kit through `expo-mlkit-ocr`, on the phone. Receipt text is not uploaded. That requires `npx expo run:android` rather than Expo Go. The OCR adapter is separate from classification and field extraction, so either piece can be replaced without rewriting the screens.

Classification does not treat "any text" as a bill. It looks for receipt evidence: totals, invoice language, tax, GSTIN, or a payment confirmation, plus a real amount. Identity cards, social screenshots, and near-empty photos are rejected even when they contain numbers or a date. Extraction never substitutes zero, today's date, or a default category when it cannot find a value. Uncertain numeric dates are shown as "Check this".

Money is integer paise. Surplus is recorded income minus recorded expenses. Savings contributions and unpaid schedules stay outside that formula so they are not counted twice.

The visual direction follows the three reference images: dark surfaces, a bright green primary action, and Home / Overview / Manage. Add Income and Start Saving stay on Home. Where a reference label disagreed with the product notes, the notes won: Emergency Fund and My Next Buy, not the alternate labels in the generated image.

## What the evaluation actually covers

`docs/EVALUATION.md` is produced by running the same `interpretOcr` function the app uses. The 20 rows are realistic OCR transcripts (15 bills, 5 non-bills), including split totals, tax lines, cash tendered, a missing amount, and a misread "T0tal". They are not photographs passed through ML Kit. The repo did not include sample photos, and ML Kit cannot run in the Node test process. A device pass over real photos is still required before treating the table as an end-to-end camera result. Failures worth expecting on a phone: glare, handwriting, and cropped totals will come back as missing fields or as a rejected image when OCR returns too little text.

## Improvements

- Add a small vision check so a face or an ID card is rejected even when the OCR text is messy.
- Keep a labelled set of photographed receipts and run them on device into the same table.
- Learn merchant names from corrections instead of taking the first heading line.
- Widen categories beyond Food, Groceries, and Utilities without guessing when the keywords tie.
- Confirm the ML Kit build on a physical Android phone; the library is native and was not executed in this environment.
