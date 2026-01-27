import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    name?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ''}] Caught error:`, error)
        console.error('Component stack:', errorInfo.componentStack)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex items-center justify-center p-4 bg-surface-variant/30 rounded-xl min-h-[60px]">
                    <div className="flex items-center gap-2 text-on-surface-variant/50">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium">Erro ao carregar</span>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
