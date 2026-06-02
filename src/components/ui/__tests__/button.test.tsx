import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with default variant (primary)', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button', { name: /outline/i })
    expect(button).toHaveClass('border-input')
  })

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole('button', { name: /ghost/i })
    expect(button).toHaveClass('hover:bg-muted')
  })

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass('bg-destructive')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    let button = screen.getByRole('button', { name: /small/i })
    expect(button).toHaveClass('min-h-9')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button', { name: /large/i })
    expect(button).toHaveClass('min-h-12')

    rerender(<Button size="icon">Icon</Button>)
    button = screen.getByRole('button', { name: /icon/i })
    expect(button).toHaveClass('min-h-11')
    expect(button).toHaveClass('min-w-11')
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByRole('button', { name: /click/i }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toBeDisabled()
  })

  it('renders children correctly', () => {
    render(
      <Button>
        <span data-testid="child">Child Element</span>
      </Button>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
