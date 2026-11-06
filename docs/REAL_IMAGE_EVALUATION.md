# Real-image OCR evaluation

ML Kit ran on a phone. This report scores that run only. It does not reuse `docs/EVALUATION.md`.

The requested folders `test-dataset/bills` (15 images) and `test-dataset/non-bills` (5 images) are not in the project. The only receipt photos on disk are eight JPEGs in `test_dataset/`. All eight were readable, and all eight went through the installed Android app. There is no measured result for the other twelve images, because those files are not here.

## 1. Dataset description

Manifest: `docs/real-image-manifest.json`. Ground truth, written from the photos before looking at pipeline output: `docs/real-image-ground-truth.json`. Originals were not modified.

| File | Format | Pixels | Bytes | Readable |
| --- | --- | --- | --- | --- |
| WhatsApp Image 2026-11-04 at 10.43.51 PM.jpeg | JPEG | 899×1599 | 146868 | yes |
| WhatsApp Image 2026-11-05 at 10.10.59 AM.jpeg | JPEG | 1200×1600 | 127310 | yes |
| WhatsApp Image 2026-11-05 at 10.11.00 AM.jpeg | JPEG | 1200×1600 | 136894 | yes |
| WhatsApp Image 2026-11-05 at 10.11.03 AM.jpeg | JPEG | 1600×1200 | 142250 | yes |
| WhatsApp Image 2026-11-05 at 10.11.05 AM.jpeg | JPEG | 1200×1600 | 111645 | yes |
| WhatsApp Image 2026-11-05 at 10.11.06 AM.jpeg | JPEG | 1200×1600 | 77972 | yes |
| WhatsApp Image 2026-11-05 at 10.11.08 AM.jpeg | JPEG | 1200×1600 | 83931 | yes |
| WhatsApp Image 2026-11-05 at 9.59.52 PM.jpeg | JPEG | 900×1600 | 355261 | yes |

Every photo is a bill or a cropped bill. Several are cut off, rotated, handwritten, or blurred. There is no non-bill image in this folder, so false acceptance cannot be measured.

Ground truth uses integer paise. A field that is cropped, handwritten and unclear, conflicting, or ambiguous between day-month and month-day is **Uncertain** and is left out of that field's accuracy denominator.

## 2. Evaluation methodology

The debug app `com.billsnap.app` on a **motorola moto g64 5G**, **Android 15 (API 35)**, ran the same functions as Scan a Bill / Upload from Gallery:

1. `preprocessBillImage` resizes to width 2000 and writes JPEG quality 0.85.
2. `readBillText` calls `recognizeText` from `expo-mlkit-ocr` on the device. Text is not uploaded.
3. `interpretOcr` classifies first. Merchant, date, amount, and category run only when the image is accepted as a bill.

How this run was invoked:

- `adb` serial `ZD222LMZ5P` was authorized.
- The eight files were copied into the app private directory `files/ocr-eval/inbox/`. Copied sizes matched the originals.
- `adb reverse tcp:8081 tcp:8081` forwarded Metro over USB. The phone was on mobile data, so the LAN Metro address was not used.
- The app cold-started with `billsnap://?__expo_url=http://127.0.0.1:8081` and opened `app/dev/ocr-eval.tsx`.
- That screen timed the three stages and wrote `files/ocr-eval/results.json`.
- The file was pulled to `docs/real-image-pipeline-output.json` (gitignored; it contains recognized text). A field-only copy is `docs/real-image-pipeline-summary.json`.

Run window: `2026-11-06T16:37:19.522Z` to `2026-11-06T16:37:24.265Z`. `mlKitInvoked` is true. All eight images have `mlKitRan: true`.

Scoring rules:

- Predicted class is bill when `isBill` is true (`accepted` or `needs-review`).
- A null category matches expected **Others**. The extractor has no Others label; a blank category is how the app leaves those expenses.
- Merchant, date, and amount must match the ground-truth value. Merchant comparison is the extracted string, not a fuzzy match.
- Uncertain ground truth is excluded from that field. A readable field that was not extracted counts as incorrect.
- Rejected images do not extract fields.

To run it again: set `DEV_OCR_EVAL` to `true` in `src/dev/evalAutostart.ts`, start Metro (`npx expo start` or the existing `expo run:android` session), then `npm run evaluate:device`. Set the flag back to `false` afterwards so normal launches stay on Home. A warm `billsnap://dev/ocr-eval` link did not change the already-running activity on this build; the script cold-starts through the Metro URL instead.

### Performance

Measured on motorola moto g64 5G, Android 15, API 35. Times are milliseconds around the existing functions. Interpret time includes classification and, for accepted bills, field extraction.

| Image | Preprocess | OCR | Interpret | Total |
| --- | ---: | ---: | ---: | ---: |
| 10.43.51 PM | 337 | 740 | 8 | 1086 |
| 10.10.59 AM | 161 | 306 | 13 | 480 |
| 10.11.00 AM | 145 | 363 | 12 | 520 |
| 10.11.03 AM | 110 | 299 | 8 | 417 |
| 10.11.05 AM | 152 | 238 | 6 | 396 |
| 10.11.06 AM | 121 | 271 | 8 | 400 |
| 10.11.08 AM | 125 | 272 | 2 | 399 |
| 9.59.52 PM | 234 | 617 | 22 | 873 |

Sums: preprocess 1385 ms, OCR 3106 ms, interpret 79 ms, per-image total 4571 ms. Means: preprocess 173 ms, OCR 388 ms, interpret 10 ms, total 571 ms. Wall clock for the eight-image loop was 4.743 s.

## 3. Complete results

Eight images were on disk. Twelve of the requested twenty were not available to run.

| Image | Expected class | Predicted class | Merchant | Date | Amount | Category | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-04 10.43.51 PM.jpeg | bill | Incorrect — rejected, not-a-receipt | Incorrect — expected PNB Pony Salons; not extracted | Uncertain — handwritten 4/11/26; not extracted | Uncertain — handwritten total; not extracted | Incorrect — expected Others; not extracted | Printed cash bill. OCR read "CASH BILL", "pony salons", "Total", and "Date :", but not the handwritten amount. Signals: total only. |
| 2026-11-05 10.10.59 AM.jpeg | bill | Correct — accepted | Uncertain — header cropped; extracted "CHUPA CHUP LOLI POPS 8GM" | Uncertain — no date in frame; extracted missing | Uncertain — slip shows 93.00 and 93.20; extracted ₹3.00 (300 paise) | Uncertain — store type not in frame; extracted missing | Cropped GST receipt. Signals: total, tax, money. |
| 2026-11-05 10.11.00 AM.jpeg | bill | Correct — accepted | Uncertain — header cropped; extracted "Item(s) : 13" | Correct — 2026-04-24 | Incorrect — expected ₹1,516.00 (151600 paise); got ₹737.00 (73700 paise) | Correct — Others (extracted missing) | OCR read "Rs 1,516. 0e" with a broken decimal and "TOTAL SAVED: Rs 737.0e". Signals: invoice, total, tax, date, money. |
| 2026-11-05 10.11.03 AM.jpeg | bill | Correct — accepted | Uncertain — name out of frame; extracted "2.No Refund No Exchange" | Uncertain — no date in frame; extracted missing | Uncertain — payable not fixed from the photo; extracted ₹321.00 (32100 paise) | Uncertain — soap and freshener only; extracted missing | Rotated crop. Signals: total, money. |
| 2026-11-05 10.11.05 AM.jpeg | bill | Correct — accepted | Uncertain — name cropped; extracted "1 Adrak Tea" | Uncertain — no date in frame; extracted missing | Incorrect — expected ₹32.00 (3200 paise); got ₹5.00 (500 paise) | Correct — Food | OCR did read "Grand Total" and a separate "32.00". Signals: total, tax, money. |
| 2026-11-05 10.11.06 AM.jpeg | bill | Correct — accepted | Uncertain — not readable; extracted "order." | Uncertain — stamp not readable; extracted missing | Uncertain — photo shows 188.0 and 188.1; extracted ₹1.00 (100 paise) | Incorrect — expected Food; extracted missing | Blurry. Signals: total, tax, money. The word Food was not in the recognized text. |
| 2026-11-05 10.11.08 AM.jpeg | bill | Incorrect — rejected, not-a-receipt | Uncertain — name cropped; not extracted | Uncertain — no date in frame; not extracted | Uncertain — 2615.00 is unlabeled; not extracted | Incorrect — expected Food; not extracted | Angled restaurant crop. OCR read "Naan", "Punjabi Tadka", prices, and "2615.00", and read the total label as "tal". Signals: money only. |
| 2026-11-05 9.59.52 PM.jpeg | bill | Correct — accepted | Incorrect — expected Dua Lima Retail Pvt.; got "Dua Li ma" | Uncertain — visible 05-11-26, day/month not labeled; extracted missing | Incorrect — expected ₹639.00 (63900 paise); got ₹476.00 (47600 paise) | Correct — Others (extracted missing) | Tax invoice. OCR read "Rs 639.00" and "TOTAL SAVED: Rs 476.00". The saved line was selected. Signals: invoice, total, tax, money. |

## 4. Classification metrics

Denominator: 8 images, all ground-truth bills.

| Metric | Result |
| --- | --- |
| Classification accuracy | 6/8 = 75% |
| Bill precision | 6/6 = 100% |
| Bill recall | 6/8 = 75% |
| False acceptance count | 0 |
| False rejection count | 2 |

True positives are the six accepted bills. There were no predicted non-bills that were actually bills besides the two rejections, and there were no non-bill photos, so precision has no false-acceptance cases to fail. The two false rejections are the Pony Salons cash bill and the angled restaurant crop.

## 5. Field extraction metrics

Only readable, applicable ground-truth fields are in the denominator. Uncertain fields are excluded. A missing category counts as Others.

| Field | Correct | Denominator | Accuracy |
| --- | --- | --- | --- |
| Merchant | 0 | 2 | 0% |
| Date | 1 | 1 | 100% |
| Amount | 0 | 3 | 0% |
| Category | 3 | 6 | 50% |

The single scored date is 24 April 2026 on the accessories receipt. The two scored merchants are PNB Pony Salons (not extracted, because the bill was rejected) and Dua Lima Retail Pvt. (extracted as "Dua Li ma"). The three scored amounts are ₹1,516.00, ₹32.00, and ₹639.00. None matched.

These percentages are separate from the 75% classification accuracy. They are also too small to treat as a general OCR rate.

## 6. Failure analysis

**2026-11-04 10.43.51 PM.jpeg — false rejection, merchant and category missed.** OCR recognition, then receipt classification. The printed words "CASH BILL" and "Total" were read. The handwritten payable was not, so there was no money signal. `classifyBill` does not treat total-without-money as a bill, and `interpretOcr` then skips field extraction. The salon name was in the OCR text and was never passed to merchant extraction.

**2026-11-05 10.11.00 AM.jpeg — amount.** OCR recognition and total amount selection. The payable was recognized as "Rs 1,516. 0e", with a space that breaks the decimal. "TOTAL SAVED" still contains "total", and the integer 737 on that line became the selected amount.

**2026-11-05 10.11.05 AM.jpeg — amount.** Total amount selection. OCR read both "Grand Total" and "32.00", on different lines. The line after "Total" was "2.5%". That percent was parsed as ₹5.00 and won over the separated grand total.

**2026-11-05 10.11.06 AM.jpeg — category.** Image quality and OCR recognition. The photo is blurred. Recognized text did not contain "Food", so category extraction had nothing to match. The ₹1.00 figure is the same OCR damage; the payable ground truth stays Uncertain because the photo itself shows both 188.0 and 188.1.

**2026-11-05 10.11.08 AM.jpeg — false rejection and category.** Image quality and OCR recognition, then receipt classification. The slip is angled. Item names and 2615.00 were read, but the total label came back as "tal". With only a money signal and more than 14 lines and no date, the classifier rejected it. Food words such as naan and pulao were read, but extraction did not run.

**2026-11-05 9.59.52 PM.jpeg — merchant and amount.** OCR recognition for the merchant ("Dua Li ma" instead of Dua Lima Retail Pvt.). Total amount selection for the money: "Rs 639.00" was read, and so was "TOTAL SAVED: Rs 476.00". The saved line was chosen.

No production classifier or extractor was changed after these results.

## 7. Limitations

- The assigned 20-image layout was not in the repo. Metrics cover these eight photos only.
- All eight are bills. False acceptance of selfies, identity cards, or chat screenshots was not tested.
- Six merchant fields, seven dates, five amounts, and two categories are Uncertain because of crops, handwriting, blur, rotation, or an unlabeled day/month. Those cells are not accuracy wins or losses.
- One phone, one pass. A second run was not averaged.
- The eval screen is dev-only. `DEV_OCR_EVAL` is false again, so ordinary launches do not open it.
- Full recognized text is only in `docs/real-image-pipeline-output.json`.

## 8. Proposed improvements

From this run only. None of these were implemented.

- If OCR sees cash-bill or invoice wording and a total label but no parsed amount, send the image to review instead of rejecting it. That matches the handwritten Pony Salons total.
- Do not treat "total saved", "you saved", or a discount line as the payable total. That choice produced ₹737.00 and ₹476.00.
- When "grand total" and its amount are on separate OCR lines, prefer a nearby decimal such as 32.00 over an integer taken from "2.5%".
- A long receipt that has several prices but a broken total word ("tal") should be needs-review, not a hard rejection.
- Merchant selection should skip item rows ("1 Adrak Tea", "CHUPA CHUP LOLI POPS 8GM"), quantity lines ("Item(s) : 13"), and footer lines ("2.No Refund No Exchange").
- Blurry and strongly rotated photos need a retake hint. The blur case lost both the payable digits and the Food label.
