import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// The Book a Room page, routed at /bookings/new (book) and /bookings/:id (edit).
// Both routes are wrapped in <ProtectedRoute>, so api.js always has a token to send.

const defaults = { roomNumber: '', startDate: '', endDate: '', purpose: '' }

// The server sends dates as full ISO strings ("2026-10-10T00:00:00.000Z"),
// but <input type="date"> only accepts "YYYY-MM-DD". The date part of the ISO
// string is already in that format (and in UTC, which is how the server stored it).
function toDateInput(iso) {
  return iso ? iso.slice(0, 10) : ''
}

export default function BookingForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: load the booking and fill the form with its current values.
  // Both routes render the same component, so going from Edit to "Book a Room"
  // keeps this instance alive: reset the form there instead of showing stale values.
  useEffect(() => {
    setError('')
    if (!id) {
      setForm(defaults)
      return
    }
    api.get('/bookings/' + id)
      .then(res => {
        const b = res.data.booking
        setForm({
          roomNumber: b.roomNumber,
          startDate: toDateInput(b.startDate),
          endDate: toDateInput(b.endDate),
          purpose: b.purpose ?? ''
        })
      })
      .catch(err => setError(err?.response?.data?.message || 'Could not load booking'))
  }, [id])

  // Every input has a `name` matching a key in `form`, so one handler covers them all.
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // POST a new booking, or PATCH the existing one when editing, then go back to /bookings.
  // bookedBy is never sent: the server takes the booker from the token.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const { roomNumber, startDate, endDate, purpose } = form
    const body = { roomNumber, startDate, endDate, purpose }
    try {
      if (id) await api.patch('/bookings/' + id, body)
      else await api.post('/bookings', body)
      nav('/bookings')
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'New'} Booking</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          name="roomNumber"
          placeholder="Room number (e.g. B2-104)"
          value={form.roomNumber}
          onChange={onChange}
        />
        <label className="block text-sm">
          Start date
          <input className="input mt-1" type="date" name="startDate" value={form.startDate} onChange={onChange} />
        </label>
        <label className="block text-sm">
          End date
          <input className="input mt-1" type="date" name="endDate" value={form.endDate} onChange={onChange} />
        </label>
        <textarea
          className="input"
          name="purpose"
          rows={3}
          placeholder="Purpose (optional)"
          value={form.purpose}
          onChange={onChange}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
