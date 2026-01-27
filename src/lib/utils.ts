/**
 * Utility functions for color styling
 */

/**
 * Returns Tailwind CSS classes for a given sector color
 */
export const getSectorColorClass = (color: string): string => {
    switch (color) {
        case 'slate': return 'bg-slate-100 text-slate-700 border-slate-200'
        case 'red': return 'bg-red-100 text-red-700 border-red-200'
        case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200'
        case 'amber': return 'bg-amber-100 text-amber-700 border-amber-200'
        case 'yellow': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
        case 'lime': return 'bg-lime-100 text-lime-700 border-lime-200'
        case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        case 'teal': return 'bg-teal-100 text-teal-700 border-teal-200'
        case 'cyan': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
        case 'sky': return 'bg-sky-100 text-sky-700 border-sky-200'
        case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200'
        case 'indigo': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
        case 'violet': return 'bg-violet-100 text-violet-700 border-violet-200'
        case 'purple': return 'bg-purple-100 text-purple-700 border-purple-200'
        case 'fuchsia': return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'
        case 'pink': return 'bg-pink-100 text-pink-700 border-pink-200'
        case 'rose': return 'bg-rose-100 text-rose-700 border-rose-200'
        case 'stone': return 'bg-stone-100 text-stone-700 border-stone-200'
        case 'zinc': return 'bg-zinc-100 text-zinc-700 border-zinc-200'
        case 'gray': return 'bg-gray-100 text-gray-700 border-gray-200'
        case 'brown': return 'bg-amber-900/10 text-amber-900 border-amber-900/20'
        case 'black': return 'bg-neutral-900 text-neutral-100 border-neutral-700'
        case 'white': return 'bg-white text-slate-900 border-slate-200 shadow-sm'
        default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
}

/**
 * Returns Tailwind CSS classes for Kanban column badge (softer variant)
 */
export const getColumnColorClass = (color: string): string => {
    switch (color) {
        case 'slate': return 'bg-slate-500/10 text-slate-600 border-slate-500/20'
        case 'red': return 'bg-red-500/10 text-red-600 border-red-500/20'
        case 'orange': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
        case 'amber': return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        case 'yellow': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
        case 'lime': return 'bg-lime-500/10 text-lime-600 border-lime-500/20'
        case 'green': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        case 'teal': return 'bg-teal-500/10 text-teal-600 border-teal-500/20'
        case 'cyan': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
        case 'sky': return 'bg-sky-500/10 text-sky-600 border-sky-500/20'
        case 'blue': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        case 'indigo': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
        case 'violet': return 'bg-violet-500/10 text-violet-600 border-violet-500/20'
        case 'purple': return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
        case 'fuchsia': return 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20'
        case 'pink': return 'bg-pink-500/10 text-pink-600 border-pink-500/20'
        case 'rose': return 'bg-rose-500/10 text-rose-600 border-rose-500/20'
        default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20'
    }
}
