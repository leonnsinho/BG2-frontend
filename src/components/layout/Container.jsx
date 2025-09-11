import React from 'react'
import { cn } from '../../utils/cn'

const Container = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
      className
    )}
    {...props}
  />
))

Container.displayName = "Container"

export { Container }
