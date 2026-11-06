---
name: feature-workflow
description: Implements a Bill Snap user flow from entry point through persistence and completion.
---
1. Define user journey and acceptance criteria.
2. Inspect architecture and current data models.
3. Map screens, transitions, cancellation/back behaviour, and states.
4. Define validation and error cases.
5. Implement using existing UI patterns.
6. Connect to real persistence.
7. Add tests for logic and critical transitions.
8. Run checks and report outcomes.

Expectations: quick actions open focused sheets; choices lead to the correct form; required/optional fields are clear; duplicate submissions are prevented; saved records are discoverable; cancel/back does not save accidentally; empty/loading/failure/retry states are considered.
