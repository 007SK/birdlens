import { useRef, useState } from 'react'

const STORAGE_KEY = 'birdlens_location'
const NOMINATIM = 'https://nominatim.openstreetmap.org'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'string') return { text: parsed, lat: null, lon: null }
    return parsed
  } catch {
    return null
  }
}

export default function LocationInput() {
  const stored = readStored()
  const [saved, setSaved] = useState(stored?.text ?? '')
  const [editing, setEditing] = useState(!stored)
  const [draft, setDraft] = useState(stored?.text ?? '')
  const [geoError, setGeoError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const inputRef = useRef(null)

  function persistLocation(text, lat, lon) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, lat, lon }))
    setSaved(text)
    setEditing(false)
    setGeoError('')
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Enter it manually.')
      return
    }
    setGeoError('')
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        try {
          const res = await fetch(
            `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const text = data.display_name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
          setDraft(text)
          persistLocation(text, lat, lon)
        } catch {
          setGeoError('Could not detect location. Enter it manually.')
        } finally {
          setGeoLoading(false)
        }
      },
      () => {
        setGeoLoading(false)
        setGeoError('Could not detect location. Enter it manually.')
      }
    )
  }

  async function geocodeAndSave(text) {
    if (!text) return
    try {
      const res = await fetch(
        `${NOMINATIM}/search?q=${encodeURIComponent(text)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const results = await res.json()
      if (results.length > 0) {
        persistLocation(text, parseFloat(results[0].lat), parseFloat(results[0].lon))
      } else {
        persistLocation(text, null, null)
      }
    } catch {
      persistLocation(text, null, null)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const val = draft.trim()
    if (val) geocodeAndSave(val)
  }

  function handleBlur() {
    const val = draft.trim()
    if (val && val !== saved) geocodeAndSave(val)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = draft.trim()
      if (val) geocodeAndSave(val)
    }
  }

  function startEditing() {
    setDraft(saved)
    setEditing(true)
    setGeoError('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  if (!editing && saved) {
    return (
      <div className="location-display">
        <span className="location-display__icon">📍</span>
        <span className="location-display__value">{saved}</span>
        {justSaved && <span className="location-display__check">✓ Saved</span>}
        <button className="location-display__change" onClick={startEditing}>Change</button>
      </div>
    )
  }

  return (
    <div className="location-form-wrap">
      <form className="location-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="location-form__input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Your location (optional — improves accuracy)"
          autoComplete="off"
        />
        <button
          className="btn btn--ghost location-form__geo-btn"
          type="button"
          onClick={useMyLocation}
          disabled={geoLoading}
          title="Detect my location automatically"
        >
          {geoLoading ? '…' : '📍 Use my location'}
        </button>
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
      {geoError && <p className="location-geo-error">{geoError}</p>}
    </div>
  )
}
