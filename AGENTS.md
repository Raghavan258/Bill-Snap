# Bill Snap — Project Instructions

Bill Snap is a personal finance organisation app. Its differentiator is turning physical receipts into searchable digital expense records while helping users record income, manage recurring commitments, set savings goals, and understand monthly cash flow.

## Product principles
- Preserve the existing framework, architecture, package manager, conventions, and working functionality. Inspect the repository before coding.
- Use the supplied reference images as visual guidance, not pixel-perfect specifications.
- Keep the interface calm, modern, minimal, legible, and spacious. Use restrained forest-green accents; avoid excessive glow and crowded cards.
- Do not introduce dependencies, frameworks, services, or integrations without a clear need.
- Never imply bank syncing, automatic payment detection, or verified bank balances unless genuinely implemented.
- Distinguish recorded surplus from bank balance and actual savings contributions.
- Prioritise complete core flows over speculative features.

## Approved navigation and Home
Bottom navigation: Home · Overview · Manage.
Home contains:
1. Bill Snap header/profile actions.
2. Primary CTA: Record Expense.
3. Quick actions: Add Income and Start Saving.
4. Compact current-month income, expenses, and surplus summary.
5. Destinations: Receipt Vault, Recurring Expenses, Savings, Monthly Tracker.
6. Month-end expense prediction, clearly labelled as an estimate.
Do not duplicate Add Income or Start Saving in bottom navigation.

## Record Expense
CTA opens a bottom sheet with Scan a Bill, Upload from Gallery, Add Manually. All methods create a consistent expense record. Camera and gallery share validation, extraction, review/correction, and save. Manual entry requires expense name, amount, and category; date, merchant, notes can be optional.

## Add Income
CTA opens a bottom sheet with:
- Recurring Income — income received regularly, such as salary, rent, or pension.
- One-time Income — income received occasionally, such as a bonus, freelance payment, gift, or refund.
Recurring income: source/name, amount, frequency, category, start date, optional end date and notes.
One-time income: source/name, amount, category, received date, optional notes.
Keep forms concise and reuse existing data models where possible.

## Start Saving
CTA opens a bottom sheet with:
- Monthly Saving Target — build a regular monthly savings habit.
- Emergency Fund — save towards an emergency reserve.
- My Next Buy — save for a specific planned purchase, such as a laptop, phone, trip, or course.
Track target, explicitly recorded contributions, remaining amount, progress, and optional target date. Do not infer savings contributions from surplus.

## Financial correctness
- Income, expenses, and savings contributions are distinct concepts.
- Surplus = recorded income minus recorded expenses for the selected period, unless the existing documented model defines otherwise.
- Do not subtract savings contributions twice if already included in expenses.
- A receipt linked to an expense must not create a second expense.
- Expected recurring income is not received income. Recurring commitments are not automatically paid.
- Forecasts are estimates, never guarantees.
- Use exact monetary representation (integer minor units or the project's established decimal approach), not binary floating point for persisted money.

## Engineering workflow
Inspect repository, routes, screens, models, persistence, styles, package scripts, and tests. Plan the smallest safe change; implement incrementally; reuse patterns; add tests; run actual lint/typecheck/test/build scripts. Report changed files, checks actually run, and known gaps.

## Privacy
Treat receipts and financial records as sensitive. Avoid logging OCR text, receipt contents, amounts, or personal identifiers. Do not upload financial documents remotely without explicit product requirements and user consent.
