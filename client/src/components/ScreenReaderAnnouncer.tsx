import { useEffect, useRef } from 'react';

interface Props {
    message: string;
    priority?: 'polite' | 'assertive';
}

/**
 * Screen reader announcer component for accessibility.
 * Announces messages to screen readers without visual display.
 */
export function ScreenReaderAnnouncer({ message, priority = 'polite' }: Props) {
    const prevMessageRef = useRef('');

    useEffect(() => {
        // Only announce if message changed
        if (message && message !== prevMessageRef.current) {
            prevMessageRef.current = message;
        }
    }, [message]);

    if (!message) return null;

    return (
        <div 
            role="status" 
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
        >
            {message}
        </div>
    );
}

/**
 * Global announcer hook for components to trigger screen reader announcements
 */
export function useAnnouncer() {
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        // Create temporary announcer element
        const announcer = document.createElement('div');
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.textContent = message;
        
        document.body.appendChild(announcer);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcer);
        }, 1000);
    };

    return { announce };
}
