import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useUndoDelete } from './UndoToast'

function Harness({ onDelete }: { onDelete: (id: string) => void }) {
  const { toast, scheduleDelete } = useUndoDelete<{ id: string }>(onDelete)
  return (
    <>
      <button type="button" onClick={() => scheduleDelete({ id: 'item-1' }, 'Rent')}>
        delete
      </button>
      {toast}
    </>
  )
}

describe('useUndoDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('commits the delete exactly once when the timer and the toast expiry both fire', () => {
    const onDelete = vi.fn()
    render(<Harness onDelete={onDelete} />)
    fireEvent.click(screen.getByText('delete'))

    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith('item-1')
  })

  it('commits once when the toast is closed early, without a second call from the timer', () => {
    const onDelete = vi.fn()
    render(<Harness onDelete={onDelete} />)
    fireEvent.click(screen.getByText('delete'))

    fireEvent.click(screen.getByRole('button', { name: /close|zamknij/i }))
    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('does not delete after undo', () => {
    const onDelete = vi.fn()
    render(<Harness onDelete={onDelete} />)
    fireEvent.click(screen.getByText('delete'))

    fireEvent.click(screen.getByRole('button', { name: /undo|cofnij/i }))
    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(onDelete).not.toHaveBeenCalled()
  })
})
