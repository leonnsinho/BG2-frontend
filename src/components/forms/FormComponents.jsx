import React from 'react'
import { cn } from '../../utils/cn'

// FormField Component - Wrapper para campos de formulário
export const FormField = ({ 
  children, 
  error, 
  className,
  ...props 
}) => {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

// Label Component
export const Label = ({ 
  children, 
  required = false, 
  className,
  ...props 
}) => {
  return (
    <label 
      className={cn(
        "block text-sm font-medium text-gray-700",
        className
      )} 
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

// Textarea Component
export const Textarea = React.forwardRef(({ 
  className, 
  error,
  rows = 4,
  ...props 
}, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2",
        "text-sm placeholder:text-gray-500",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-vertical min-h-[80px]",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

// Select Component
export const Select = React.forwardRef(({ 
  className, 
  error,
  children,
  placeholder,
  ...props 
}, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2",
        "text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  )
})

Select.displayName = "Select"

// Checkbox Component
export const Checkbox = React.forwardRef(({ 
  className, 
  label,
  error,
  ...props 
}, ref) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-primary-600",
          "focus:ring-primary-500 focus:ring-2 focus:ring-offset-0",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {label && (
        <label className="text-sm text-gray-700 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  )
})

Checkbox.displayName = "Checkbox"

// Radio Group Component
export const RadioGroup = ({ 
  options = [], 
  name, 
  value, 
  onChange, 
  error,
  className 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <input
            type="radio"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className={cn(
              "h-4 w-4 border-gray-300 text-primary-600",
              "focus:ring-primary-500 focus:ring-2 focus:ring-offset-0",
              error && "border-red-500"
            )}
          />
          <label 
            htmlFor={`${name}-${option.value}`}
            className="text-sm text-gray-700 cursor-pointer"
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  )
}

// Form Component - Wrapper principal
export const Form = ({ 
  children, 
  onSubmit, 
  className,
  ...props 
}) => {
  return (
    <form 
      onSubmit={onSubmit}
      className={cn("space-y-6", className)}
      {...props}
    >
      {children}
    </form>
  )
}
