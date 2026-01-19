import { useState } from 'react';
import { useFloating, autoUpdate, offset, flip, shift, useClick, useDismiss, useRole, useInteractions } from '@floating-ui/react';

export function useFloatingPopover({
    open,
    onOpenChange,
    placement = 'bottom',
    offsetPx = 8
}: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    offsetPx?: number;
} = {}) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

    const isOpen = open !== undefined ? open : uncontrolledOpen;
    const handleOpenChange = (nextOpen: boolean) => {
        if (open === undefined) {
            setUncontrolledOpen(nextOpen);
        }
        onOpenChange?.(nextOpen);
    };

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: handleOpenChange,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(offsetPx),
            flip({
                fallbackAxisSideDirection: 'start',
            }),
            shift({ padding: 8 })
        ],
        placement: placement === 'bottom' ? 'bottom-start' : placement,
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    // Merge interactions
    const { getReferenceProps, getFloatingProps } = useInteractions([
        click,
        dismiss,
        role,
    ]);

    return {
        isOpen,
        setIsOpen: handleOpenChange, // Expose a setter that works for both
        refs,
        floatingStyles,
        context,
        getReferenceProps,
        getFloatingProps
    };
}
