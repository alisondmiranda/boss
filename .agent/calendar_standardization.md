Standardized Calendar Component across the application.

**Summary of Changes:**

1.  **StandardCalendar Enhanced:**
    *   Added `enableTime` prop (boolean) to `StandardCalendar`.
    *   Implemented a clean Time Picker section (Clock icon + Time Input) at the bottom of the calendar if `enableTime` is true.
    *   Logic added to preserve the time when changing dates and preserve the date when changing times.

2.  **DatePicker Refactored:**
    *   Removed completely duplicated custom calendar logic (grid generation, headers, click handlers, etc.).
    *   Now wraps `StandardCalendar` directly.
    *   Passed `enableTime={true}` to ensuring the edit task popup supports time selection.
    *   Maintained Floating UI wrapper for correct positioning.
    *   This ensures the "Edit Task" popup now matches the "Calendar Widget" design (Rounder corners, same styling).

3.  **TaskItem Updated:**
    *   Updated the inline calendar popup in `TaskItem` to pass `enableTime={true}` to `StandardCalendar`.
    *   This ensures the "Card Calendar" now allows time selection, fixing the user issue "O calendário do card de tarefa não aparece hora".

**Verification:**
*   `npm run build` passed successfully.
*   Codebase now has a Single Source of Truth for Calendar UI (`StandardCalendar`).
