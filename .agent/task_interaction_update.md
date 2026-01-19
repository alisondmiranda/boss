Refined Task Item Interaction Logic.

**Summary of Changes:**

1.  **Card Expansion:**
    *   Clicking anywhere on the task card now fully expands the card (`isFullyExpanded`), replicating the behavior of the chevron icon.
    *   This replaces the previous "quick expand" behavior which might have felt inconsistent or required extra clicks.

2.  **Title Editing:**
    *   Clicking the task title now **immediately** activates edit mode (`isEditing`).
    *   Previously, the first click would expand the card, and a second click was required to edit. Now, a single click on the title achieves both: it enters edit mode and ensures the card is expanded (if it wasn't already).

**Verification:**
*   `npm run build` passed successfully.
*   The interaction flow is now more direct:
    *   Click Card Body -> Full Expand.
    *   Click Title -> Edit + Full Expand.
