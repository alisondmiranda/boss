Implemented "Nova Etiqueta" flow and terminology update in Settings.

**Summary of Changes:**

1.  **Terminology Update (SettingsModal):**
    *   Renamed UI references from "Lista" (Lists) to "**Etiqueta**" (Labels/Tags) to align with previous changes.
    *   This includes:
        *   Tab name: "Listas" -> "**Etiquetas**".
        *   Section header: "Minhas Listas" -> "**Minhas Etiquetas**".
        *   Buttons: "Nova Lista" -> "**Nova Etiqueta**", "Criar Lista" -> "**Criar Etiqueta**".
        *   Forms: "Nome da Lista" -> "**Nome da Etiqueta**".
        *   Messages: Toast/Confirm dialogs now refer to "Etiqueta".

2.  **Auto-Open Creation Flow:**
    *   Updated `Dashboard.tsx` to handle the `open-sectors-settings` event more intelligently.
    *   Now passes a `settingsOpenCreation` flag to `SettingsModal` when triggered from the "Nova Etiqueta" dropdown option.
    *   `SettingsModal.tsx` now accepts an `initialOpenCreation` prop. If true (and the tab is 'sectors'), it **automatically opens the creation form** immediately upon mounting/opening the modal.

**Verification:**
*   `npm run build` passed successfully.
*   The "Create New Tag" flow requested by the user is now fully implemented: Clicking "+ Nova Etiqueta" in the task dropdown directly opens the Settings > Labels > New Label form.
