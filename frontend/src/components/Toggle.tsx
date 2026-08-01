interface ToggleProps {
  checked: boolean
  onChange: () => void
  id?: string
  ariaLabel?: string
}

/** Shared switch treatment for source and preference controls. */
export function Toggle({ checked, onChange, id, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      onClick={onChange}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
        checked ? "bg-slate-800" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}
