Implemented refinements to Tag UX in Task Item and Popup.

**Summary of Changes:**

1.  **Task Item (Card) Button Text:**
    *   Changed the "create tag" button text from "Criar Nova Etiqueta" to **"+ Nova Eti..."** as requested. This keeps the dropdown menu compact.

2.  **Edit Task Dropdown (TaskFormModal):**
    *   Added the missing **"+ Nova Eti..."** button to the bottom of the tag selection dropdown in the "Edit Task" popup.
    *   This ensures consistency between the quick edit (on card) and full edit (popup) modes.
    *   Both buttons now share the same visual style and behavior (closing the menu and triggering the settings event).

**Verification:**
*   `npm run build` passed successfully.
*   Verified correct iconography (`Plus` icon added where missing).
*   Fixed syntax error introduced during the addition of the button in the modal.
