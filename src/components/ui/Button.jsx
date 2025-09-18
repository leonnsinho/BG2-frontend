import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../utils/cn'

// Variações do botão usando CVA (Class Variance Authority)
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-background hover:bg-primary-700",
        neutral: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        success: "bg-success-600 text-background hover:bg-success-700",
        danger: "bg-danger-600 text-background hover:bg-danger-700",
        warning: "bg-warning-600 text-background hover:bg-warning-700",
        outline: "border border-neutral-300 bg-background hover:bg-neutral-50",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900",
        link: "underline-offset-4 hover:underline text-primary-500"
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
