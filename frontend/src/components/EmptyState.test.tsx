import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Info } from 'lucide-react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState icon={Info} title="No expenses yet" />)
    expect(screen.getByText('No expenses yet')).toBeInTheDocument()
  })

  it('renders the description when provided, omits it otherwise', () => {
    const { rerender } = render(<EmptyState icon={Info} title="Title" description="Details" />)
    expect(screen.getByText('Details')).toBeInTheDocument()

    rerender(<EmptyState icon={Info} title="Title" />)
    expect(screen.queryByText('Details')).not.toBeInTheDocument()
  })

  it('renders the action node when provided', () => {
    render(<EmptyState icon={Info} title="Title" action={<button>Add expense</button>} />)
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeInTheDocument()
  })

  it('applies compact-mode sizing classes', () => {
    const { container: compact } = render(<EmptyState icon={Info} title="Title" compact />)
    const compactHeading = compact.querySelector('h3')
    expect(compactHeading?.className).toContain('text-sm')

    const { container: normal } = render(<EmptyState icon={Info} title="Title" />)
    const normalHeading = normal.querySelector('h3')
    expect(normalHeading?.className).toContain('text-base')
  })

  it('renders the passed icon', () => {
    const { container } = render(<EmptyState icon={Info} title="Title" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
