# Architecture Reference

## Estrutura de Pastas (`src/store/`)

*   **`types.ts`**: Centraliza todas as interfaces (Task, Subtask, TaskState).
*   **`slices/uiSlice.ts`**: Gerencia estados de interface (loading, filter, syncingIds).
*   **`slices/taskSlice.ts`**: Contém lógica de CRUD de tarefas (fetch, add, update, delete, trash).
*   **`slices/subtaskSlice.ts`**: Contém lógica de manipulação de sub-tarefas.
*   **`taskStore.ts`**: Ponto de entrada que unifica os slices usando o padrão do Zustand.

## Regras de UI (Design System)

*   **Layout Ultra-Dense**: Maximize a densidade de informações sem comprometer a leitura.
*   **Design Arredondado**: Utilize `rounded-lg` para containers e `rounded-full` para botões/badges.
*   **Hierarquia de 3 Estados nos Cards**: Clareza visual entre estados (normal, hover, ativo/expandido).
*   **Terminologia**: Utilizar "**Etiqueta**" em vez de "Lista" para categorização de tarefas.
*   **Etiquetas no Card**: Máximo de 2 etiquetas visíveis, truncar em 12 caracteres, seguido de contador `+N`.

## Lógica de Interação e Componentes

*   **Expansão de Tarefas**: 
    *   Clique no Card ou Ícone (Chevron) -> Expansão Completa.
    *   Clique no Título -> Ativa Modo de Edição + Expansão Completa.
*   **Calendário**: Componente único (`StandardCalendar`) com suporte a horário (`enableTime`).
*   **Floating UI**: 
    *   Offset padrão de **8px**. 
    *   Uso de `FloatingPortal` para evitar corte de conteúdo em containers com `overflow: hidden`.
    *   Middleware `flip` e `shift` para posicionamento inteligente.

## Fluxo de Trabalho

> **IMPORTANTE**: Antes de criar novas funções ou lógicas, verifique se elas pertencem a um Slice existente (`task`, `subtask` ou `ui`). Mantenha a separação de responsabilidades.
