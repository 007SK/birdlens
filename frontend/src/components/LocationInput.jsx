import { useRef, useState } from 'react'

const STORAGE_KEY = 'birdlens_location'

export default function LocationInput() {
  const stored = localStorage.getItem(STORAGE_KEY) ?? ''
  const [saved, setSaved] = useState(stored)
  const [editing, setEditing] = useState(!stored)
  const [draft, setDraft] = useState(stored)
  const inputRef = useRef(null)

  function save(e) {
    e.preventDefault()
    const val = draft.trim()
    localStorage.setItem(STORAGE_KEY, val)
    setSaved(val)
    setEditing(false)
  }

  function startEditing() {
    setDraft(saved)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  if (!editing && saved) {
    return (
      <div className="location-display">
        <span className="location-display__icon">📍</span>
        <span className="location-display__value">{saved}</span>
        <button className="location-display__change" onClick={startEditing}>Change</button>
      </div>
    )
  }

  return (
    <form className="location-form" onSubmit={save}>
      <input
        ref={inputRef}
        className="location-form__input"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Your location (optional — improves accuracy)"
        autoComplete="off"
      />
      <button className="btn btn--secondary location-form__btn" type="submit">Save</button>
      {saved && (
        <button
          className="btn btn--ghost location-form__btn"
          type="button"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      )}
    </form>
  )
}
