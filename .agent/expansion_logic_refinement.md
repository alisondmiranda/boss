Implemented Refined Temporary Expansion Logic.

**Summary of Changes:**

1.  **Expansion Behavior Update:**
    *   **Card Click:** Now triggers **temporary expansion** (`isQuickExpanded`) instead of permanent expansion.
    *   **Title Click:** Triggers **temporary expansion** AND enters **edit mode** immediately.
    *   **Chevron Click:** Remains the only way to trigger **permanent expansion** (`isFullyExpanded`).

2.  **Auto-Collapse Logic:**
    *   The existing logic in `TaskItem.tsx` correctly listens for clicks outside the card component.
    *   When a click occurs outside, `isQuickExpanded` is set to false, automatically collapsing the card (unless it was permanently expanded via the chevron).

**Verification:**
*   `npm run build` passed successfully.
*   The logic now satisfies:
    *   Single click title -> Edit Mode + Auto-Expand (Quick).
    *   Click Card -> Auto-Expand (Quick).
    *   Click Outside -> Auto-Collapse (if Quick).
    *   Click Chevron -> Permanent Expand/Collapse.
