# Bill Snap

Bill Snap is a personal finance organiser for Android. Its differentiator is turning a physical receipt into a searchable local expense record. It also records income, recurring commitments, savings goals, and monthly cash flow.

It is an interview app built with React Native and Expo. Everything stays on the device: accounts, receipts, OCR, and totals. There is no cloud backup, no bank sync, and no SMS OTP.

## Features

- **Local registration and login.** Name, mobile number, and password. The same mobile number cannot be registered twice on this phone.
- **Record Expense.** Camera, gallery, or manual entry. Manual entry requires a name, amount, and category. Date, merchant, and notes are optional.
- **On-device OCR.** Google ML Kit reads the image on the phone. Classification returns **accepted**, **needs review**, or **rejected**. Arbitrary text is not treated as a bill. A missing merchant, date, amount, or category stays empty; the app does not invent one. Accepted and needs-review readings open an editable review screen before save. Rejected images are not saved as expenses.
- **Add Income.** Recurring income is a schedule (source, amount, frequency, category, start date, optional end date and notes). One-time income is money already received. A schedule is not received income until you record the payment.
- **Start Saving.** Monthly Saving Target, Emergency Fund, and My Next Buy. Each goal tracks a target, explicitly recorded contributions, the remaining amount, progress, and an optional target date. Contributions are not inferred from surplus.
- **Home.** Current-month income, expenses, and surplus as numbers from saved records. Quick actions are Add Income and Start Saving. They are not bottom-navigation tabs.
- **Receipt Vault, Recurring Expenses, Savings, and Monthly Tracker.** Saved expenses (with the receipt image when one was stored), unpaid recurring commitments, savings goals, and a month of recorded expenses.
- **Month-end expense estimate.** Labelled as an estimate. It projects the current month from the recorded spending pace and is withheld when there is not enough spending to project. A closed month shows the recorded total. It is not a guarantee.
- **Overview.** Charts from real records for the selected month: an expense category breakdown, income versus expenses, daily spending, and savings progress. Unpaid schedules are excluded.
- **Manage.** Configuration only: categories, recurring rules, an honest payment-methods screen (card, UPI id, and bank account are not stored, and payment method is not detected), budgets that are limits rather than expenses, on-device data counts, and fixed display preferences.
- **Transaction history.** Search by name or merchant, filter by type, category, and date range, open a row to edit it, and delete only after Confirm Delete.
- **Deleting a recurring income schedule** removes the schedule only. Income already recorded as received stays in history and in totals.
- **User-scoped records.** Expenses, income, schedules, savings goals, and budgets are stored against the signed-in local user.
- **One-time data clear.** Schema version 3 clears financial rows that were saved before accounts existed, because those rows have no owner. The clear runs once on upgrade. Users and the local session are kept. A new install does not wipe itself.

Bottom navigation is Home, Overview, and Manage.

## Financial rules

- Money is stored as integer paise (`amount_minor`), not as a binary floating-point rupee value.
- Surplus for a period is recorded income minus recorded expenses.
- Surplus is not a bank balance.
- Savings contributions are explicit rows. They are not inferred from surplus and are not subtracted again as expenses.
- Expected recurring income is not received income.
- Recurring commitments are not automatically paid.
- Forecasts are estimates.

A receipt image is stored on the expense it belongs to. It does not create a second expense.

## Engineering evidence

Checked in this workspace on 6 November 2026:

| Check | Result |
| --- | --- |
| `npm test` | 61 tests, 13 suites, 0 failures |
| `npx tsc --noEmit` | Exit 0 |

The test script covers money, dates, surplus and forecasts, validation, the OCR transcript pipeline, analytics, income month rules, and account scoping. Eight files: `tests/money.test.ts`, `tests/dates.test.ts`, `tests/finance.test.ts`, `tests/validation.test.ts`, `tests/pipeline.test.ts`, `tests/analytics.test.ts`, `tests/income.test.ts`, `tests/accounts.test.ts`.

**OCR evaluation is transcript-only.** `docs/EVALUATION.md` is 20 cases (15 bills, 5 non-bills) run through `interpretOcr`, the same classification and extraction functions the app uses after OCR. They are text transcripts, not photographs, and they are not an on-device ML Kit accuracy figure. Camera glare, handwriting, and cropped totals still need a device pass. `npm run evaluate` regenerates that file.

**Stack, as declared in `package.json`:**

- Expo `~58.0.23`
- React Native `0.88.1`
- TypeScript `~6.0.3`
- React `19.3.0`
- expo-router `~58.0.30`
- expo-sqlite `~58.0.15`
- expo-mlkit-ocr `^0.2.7`

**Database.** SQLite file `billsnap.db`, schema version **3**. Tables: `users`, `local_session`, `schema_version`, `expenses`, `income_received`, `income_schedules`, `expense_schedules`, `savings_goals`, `savings_contributions`, `category_budgets`.

Keyword OCR categories are Food, Groceries, and Utilities. A pharmacy bill can be accepted and still left uncategorised. Manual expenses use those same three categories. Income categories are separate (Salary, Rent, Freelance, Gift, Refund, Other).

## Architecture

Screens are Expo Router routes under `app/`. Home, Overview, and Manage are tabs. Auth, expense review, income, savings, history, and settings are their own routes.

SQLite via `expo-sqlite` is the only database. Domain modules under `src/domain` and `src/pipeline` are pure: money, dates, classification, extraction, analytics, and the month-end estimate take inputs and return data. Screens and `src/data` perform the database and file IO.

OCR path:

```
camera or gallery
  -> JPEG resize
  -> expo-mlkit-ocr on the device
  -> interpretOcr (classify, then extract)
  -> editable review
  -> SQLite row plus image file in app documents
```

There is no cloud backup, no bank connection, and no SMS OTP. The password is a salted SHA-256 digest in the local `users` table (`expo-crypto`, random 16-byte salt, `salt:password`). That is a fast hash, not a slow password hash such as Argon2, and it only protects the on-device database. The session is a single local user id in `local_session`. Signing out clears that row; it does not delete the user's records.

## Run

Requirements: Node.js, Android Studio, an Android device or emulator, and `ANDROID_HOME` pointing at the SDK. The application id is `com.billsnap.app`.

```bash
npm install
npx expo start
npx expo run:android
```

On-device OCR needs a development build. Expo Go does not include ML Kit. The debug build targets `arm64-v8a` (`plugins/withAndroidBuild.js`). On Windows, that plugin sets `GRADLE_USER_HOME=C:\g` in `gradlew.bat` so native paths stay under the 260-character limit. For an Intel emulator, set `reactNativeArchitectures=x86_64` in `android/gradle.properties`.

`android/` and `ios/` are generated by Expo and are not in this repository.

Checks that do not need a phone:

```bash
npm test
npm run typecheck
npm run evaluate
```

## Privacy

Receipt images, OCR text, amounts, and account details stay on the device. OCR text is not uploaded. Bill Snap does not read SMS or bank messages, and Manage states that backup is not set up.
