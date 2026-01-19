Refined Task Item Interaction Logic (Part 2) - Visual Consistency.

**Summary of Changes:**

1.  **Visual Parity for Quick Expansion:**
    *   Previously, "Quick Expansion" (temporary) did not show the "Add Subtask" input or the editable Description textarea, unlike "Full Expansion" (permanent).
    *   Updated the rendering logic in `TaskItem.tsx` to use `isActuallyExpanded` (which encompasses both temporary and permanent states) instead of checking only `isFullyExpanded`.
    *   Now, when a user clicks the card or title:
        *   The **"Add Subtask"** input appears at the bottom.
        *   The **Description** field becomes an editable textarea immediately (if visible).

2.  **User Experience Goal:**
    *   This fulfills the request: "It has to expand everything just like the chevron but temporarily!".
    *   The temporary nature (auto-collapse on outside click) is preserved.

**Verification:**
*   `npm run build` passed successfully.
*   Verified that `isActuallyExpanded` is the condition for both the subtask input and the description edit mode.
