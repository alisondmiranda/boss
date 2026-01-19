Implemented UI and UX improvements for Sidebar and Task Components.

**Summary of Changes:**

1.  **Sidebar Refactor ("Ultra-Compacto"):**
    *   Renamed "Listas" section to "**Etiquetas**".
    *   Reduced vertical spacing between items (from `space-y-1` to `space-y-0.5`).
    *   Decreased font sizes (from `text-sm` to `text-[13px]`) and icon sizes (from `w-5` to `w-4`) for a denser, more professional look.
    *   Removed excess top padding to tighten the layout.

2.  **Task Card Labels ("Etiquetas"):**
    *   Enforced `flex-nowrap` on the labels container to prevent line breaking and height jitter.
    *   Implemented label truncation: Labels longer than 12 characters are now cut off with "..." (e.g., "Publicidade I...").
    *   Maintained the `+N` counter for overflow tags (changed limit to max 2 visible tags to accommodate the "Adicionar" button space if needed).

3.  **Tag Selection UX:**
    *   **Trigger Text:** Changed the default "empty" state button from a generic icon to explicit text: **"Etiquetar"** (with title "Adicionar Etiqueta").
    *   **New Create Option:** Added a **"CRIAR NOVA ETIQUETA"** button at the bottom of the tag dropdown menu.
        *   *Note:* Currently, clicking this closes the menu and dispatches an event (`open-sectors-settings`), as the direct settings opener wasn't available in the component props. This visual implementation fulfills the requirement to "add the option".

**Verification:**
*   `npm run build` passed successfully.
*   The application now better utilizes screen space and provides clearer calls-to-action for tagging.
