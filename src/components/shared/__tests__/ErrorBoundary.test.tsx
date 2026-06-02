import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

// Suppress console.error in test output for caught errors
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Test harness that lets us toggle the error state externally.
 * This is necessary because ErrorBoundary catches errors during render,
 * so we need to control whether children throw or not from outside.
 */
function ErrorBoundaryTestHarness() {
  const [hasError, setHasError] = useState(true)
  return (
    <div>
      <button onClick={() => setHasError(false)}>Fix error</button>
      <ErrorBoundary>
        {hasError ? <ThrowComponent shouldThrow /> : <div>Recovered content</div>}
      </ErrorBoundary>
    </div>
  )
}

describe('ErrorBoundary', () => {
  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Go Home')).toBeInTheDocument()
  })

  it('shows the error message in the fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('resets error state when "Try Again" is clicked', async () => {
    const user = userEvent.setup()
    render(<ErrorBoundaryTestHarness />)

    // Error state is shown initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()

    // First, remove the error source so children won't throw on re-render
    await user.click(screen.getByText('Fix error'))

    // Now click "Try Again" to reset ErrorBoundary internal state
    await user.click(screen.getByText('Try Again'))

    // After reset and re-render, the safe children should display
    expect(screen.getByText('Recovered content')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})

const ThrowComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal content</div>
}
