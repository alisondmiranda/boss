export function PandaIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Face */}
            <circle cx="12" cy="13" r="8" />
            {/* Ears */}
            <circle cx="6.5" cy="6.5" r="2.5" fill="currentColor" />
            <circle cx="17.5" cy="6.5" r="2.5" fill="currentColor" />
            {/* Eye Patches */}
            <ellipse cx="9" cy="11.5" rx="2" ry="2.5" fill="currentColor" />
            <ellipse cx="15" cy="11.5" rx="2" ry="2.5" fill="currentColor" />
            {/* Eyes (inner white) */}
            <circle cx="9" cy="11" r="0.5" fill="white" />
            <circle cx="15" cy="11" r="0.5" fill="white" />
            {/* Nose */}
            <path d="M11 15h2l-1 1z" fill="currentColor" />
        </svg>
    )
}
