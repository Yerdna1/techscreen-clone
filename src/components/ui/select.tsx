"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-9 w-full appearance-none items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
      </div>
    )
  }
)
Select.displayName = "Select"

// Custom Select component that renders dropdown in DOM (not native OS popup)
// This ensures the dropdown is protected by Electron's setContentProtection
interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
  disabled?: boolean
  variant?: "default" | "dark" // dark variant for Electron app
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled = false,
  variant = "default",
}: CustomSelectProps) {
  const isDark = variant === "dark"
  const [isOpen, setIsOpen] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = selectedOption?.label || placeholder || "Select..."

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Close on window blur (important for Electron screen share protection)
  React.useEffect(() => {
    function handleWindowBlur() {
      setIsOpen(false)
    }

    window.addEventListener("blur", handleWindowBlur)
    return () => window.removeEventListener("blur", handleWindowBlur)
  }, [])

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      switch (event.key) {
        case "Escape":
          event.preventDefault()
          setIsOpen(false)
          break
        case "ArrowDown":
          event.preventDefault()
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          event.preventDefault()
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          )
          break
        case "Enter":
        case " ":
          event.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            onChange(options[highlightedIndex].value)
            setIsOpen(false)
          }
          break
        case "Tab":
          setIsOpen(false)
          break
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, highlightedIndex, options, onChange])

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]")
      const item = items[highlightedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex, isOpen])

  // Reset highlighted index when opening
  React.useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value)
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0)
    }
  }, [isOpen, options, value])

  function handleToggle() {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  function handleSelect(optionValue: string) {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between whitespace-nowrap rounded-md border px-3 py-1.5 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          isDark
            ? "h-7 bg-[#3a3a3a] border-[#4a4a4a] text-gray-300 focus:border-violet-500 text-xs"
            : "h-9 border-input bg-transparent ring-offset-background focus:ring-1 focus:ring-ring",
          "text-left"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={cn(!selectedOption && (isDark ? "text-gray-500" : "text-muted-foreground"))}>
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          className={cn(
            "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 shadow-lg",
            isDark
              ? "bg-[#2a2a2a] border-[#4a4a4a]"
              : "border-input bg-popover"
          )}
          role="listbox"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              data-option
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "flex cursor-pointer items-center px-3 py-1.5 text-sm",
                isDark ? "text-gray-300" : "",
                highlightedIndex === index && (isDark ? "bg-[#3a3a3a]" : "bg-accent"),
                option.value === value && "font-medium"
              )}
            >
              <span className="flex-1">{option.label}</span>
              {option.value === value && (
                <Check className={cn("h-4 w-4", isDark ? "text-violet-400" : "text-primary")} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { Select, CustomSelect }
