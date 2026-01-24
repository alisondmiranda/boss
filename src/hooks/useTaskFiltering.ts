import { useState, useMemo } from 'react'
import { Task } from '../store/types'
import { Sector } from '../store/settingsStore'

type SortOption = 'dueDate' | 'createdAt' | 'name' | 'manual'

export function useTaskFiltering(tasks: Task[], sectors: Sector[], sortBySettings: string) {
    const [filter, setFilter] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<SortOption>(() => {
        const saved = localStorage.getItem('boss-task-sort')
        return (saved as SortOption) || 'dueDate'
    })

    const toggleFilter = (sectorId: string) => {
        setFilter(prev => {
            if (prev.includes(sectorId)) {
                return prev.filter(id => id !== sectorId)
            } else {
                return [...prev, sectorId]
            }
        })
    }

    const handleSortChange = (newSort: SortOption) => {
        setSortBy(newSort)
        localStorage.setItem('boss-task-sort', newSort)
    }

    const sortedSectors = useMemo(() => {
        return [...sectors].sort((a, b) => {
            if (sortBySettings === 'alpha') return a.label.localeCompare(b.label)
            if (sortBySettings === 'created') return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime())
            return 0
        })
    }, [sectors, sortBySettings])

    const filteredTasks = useMemo(() => tasks.filter(t => {
        // Filter by sector
        if (filter.length > 0) {
            const taskSectors = Array.isArray(t.sector) ? t.sector : (t.sector?.toString().split(',').filter(Boolean) || [])
            if (!taskSectors.some((s: string) => filter.includes(s))) return false
        }
        // Filter by search query
        if (searchQuery.trim()) {
            return t.title.toLowerCase().includes(searchQuery.toLowerCase())
        }
        return true
    }), [tasks, filter, searchQuery])

    const sortedTasks = useMemo(() => [...filteredTasks].sort((a, b) => {
        switch (sortBy) {
            case 'dueDate':
                if (a.due_at && b.due_at) {
                    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
                }
                if (a.due_at) return -1
                if (b.due_at) return 1
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'createdAt':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'name':
                return a.title.localeCompare(b.title, 'pt-BR')
            case 'manual':
                return (a.order ?? 0) - (b.order ?? 0)
            default:
                return 0
        }
    }), [filteredTasks, sortBy])

    return {
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        sortBy,
        handleSortChange,
        toggleFilter,
        sortedSectors,
        sortedTasks
    }
}
