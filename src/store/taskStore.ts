import { create } from 'zustand'
import { TaskState, Task, Subtask } from './types'
import { createTaskSlice } from './slices/taskSlice'
import { createSubtaskSlice } from './slices/subtaskSlice'
import { createUiSlice } from './slices/uiSlice'

export type { Task, Subtask, TaskState }

export const useTaskStore = create<TaskState>()((...a) => ({
    ...createTaskSlice(...a),
    ...createSubtaskSlice(...a),
    ...createUiSlice(...a),
}))