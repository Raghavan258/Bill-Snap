# Bill Snap — Cursor Handoff

## Setup
1. Extract this kit into the Bill Snap project root. The `.cursor` directory must sit beside `package.json` (or the project's root manifest).
2. Put the three downloaded images in the same root. Suggested filenames:
   - `bill-snap-record-expense-reference.png`
   - `bill-snap-add-income-reference.png`
   - `bill-snap-start-saving-reference.png`
3. Open the project root in Cursor.

## First prompt — inspect only
Read `AGENTS.md`, all applicable `.cursor/rules`, and the three Bill Snap reference images in the project root. Inspect the repository thoroughly before changing anything. Use the researcher sub-agent to map the current architecture, screens, data models, navigation, persistence, and tests. Do not modify code yet. Return:
- current stack and app structure
- existing functionality to reuse
- screen-by-screen interpretation of the three images
- gaps against the agreed Bill Snap flows
- prioritised plan with exact files likely to change
- risks, assumptions, and actual test commands

Do not scaffold a new app or add dependencies during this first pass.

## Second prompt — implement
Implement the approved flows incrementally, starting from the existing Home screen and navigation. Use coder for implementation, tester for validation, and reviewer for independent review. Preserve the existing stack and persistence layer. Do not add unapproved features. After each increment, report changed files and checks actually run.

## Suggested order
1. Audit app and images.
2. Home Action Hub and navigation.
3. Add Income options sheet and both income forms.
4. Start Saving options sheet and three goal setup flows.
5. Persistence and Overview/Manage summaries.
6. Validation, tests, responsive and keyboard checks.
7. Financial correctness review.

## Decisions to preserve
- Add Income: Recurring Income and One-time Income.
- Start Saving: Monthly Saving Target, Emergency Fund, My Next Buy.
- Navigation: Home, Overview, Manage.
- Add Income and Start Saving remain Home quick actions.
- Summaries use clearly defined recorded data.
