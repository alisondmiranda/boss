Implemented Floating UI for global positioning of floating elements.

**Summary of Changes:**
1.  **Hooks:**
    *   `src/hooks/useFloatingPopover.ts`: Created/Fixed a reusable hook for Floating UI logic.
2.  **Components:**
    *   `src/components/DatePicker.tsx`: Refactored to use `useFloating`, `FloatingPortal`, and `autoUpdate` for reliable positioning and z-index handling.
    *   `src/components/RecurrencePicker.tsx`: Refactored to use Floating UI, ensuring it floats correctly over other elements.
    *   `src/components/TaskFormModal.tsx`:
        *   Updated Recurrence Picker trigger to use refs.
        *   Refactored "Sector/Tag" dropdown to use Floating UI with `flip` and `shift` middleware for intelligent placement.
    *   `src/components/TaskItem.tsx`:
        *   Refactored "Calendar Popup" to use Floating UI, fixing positioning issues relative to the task card.
        *   Refactored "Sector Menu" to use Floating UI, allowing it to overflow the card container properly using `FloatingPortal`.

**Key Features Implemented:**
-   **Intelligent Positioning:** Elements prefer "bottom" but flip to "top" if space is limited.
-   **Viewport Awareness:** `shift` middleware keeps elements onscreen.
-   **Anchoring:** All floating elements are firmly anchored to their trigger elements using refs.
-   **Portals:** Used `FloatingPortal` to render elements at the root level, avoiding clipping by `overflow: hidden` containers (crucial for TaskItem and Modals).
-   **Consistent Offset:** Applied 8px offset standard.

**Verification:**
-   `npm run build` passed successfully.
