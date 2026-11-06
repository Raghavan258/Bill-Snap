---
name: financial-data-integrity
description: Protects correctness when changing income, expenses, savings, monthly totals, or forecasts.
---
Definitions:
- Income is money recorded as received; planned income must be separately labelled.
- Expense is money recorded as spent/paid.
- Surplus is recorded income minus recorded expenses for the period; it is not a bank balance.
- Savings contribution is an explicitly recorded contribution.
- Goal progress is recorded contributions divided by target, with safe handling for missing/zero targets.
- Forecasts are estimates, not guarantees.

Rules:
- Do not count expected recurring income as received without a defined recording event.
- Do not count a savings contribution as a second expense if already included in the expense ledger.
- Do not count a receipt image as a separate expense.
- Keep category separate from user-entered source/name.
- Handle refunds/reimbursements consistently and document the chosen model.
- Use exact monetary representations and test rounding.
- Test recurrence intervals, skipped periods, and month boundaries.
- Ask before implementing ambiguous business rules.
