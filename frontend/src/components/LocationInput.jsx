import { useEffect, useRef, useState } from 'react'

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

function extractCityCountry(address) {
  const city = address?.city || address?.town || address?.village || ''
  const country = address?.country || ''
  if (city && country) return `${city}, ${country}`
  return city || country || ''
}

export default function LocationInput() {
  const stored = readStored()
  const [saved, setSaved] = useState(stored?.text ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stored?.text ?? '')
  const [geoError, setGeoError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function persistLocation(text, lat, lon) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, lat, lon }))
    setSaved(text)
    setEditing(false)
    setGeoError('')
    setSuggestions([])
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
          const text = extractCityCountry(data.address) || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
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

  async function fetchSuggestions(text) {
    try {
      const res = await fetch(
        `${NOMINATIM}/search?q=${encodeURIComponent(text)}&format=json&limit=3&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const results = await res.json()
      setSuggestions(
        results
          .map((r) => ({
            text: extractCityCountry(r.address),
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon),
          }))
          .filter((s) => s.text)
      )
    } catch {
      setSuggestions([])
    }
  }

  function handleDraftChange(e) {
    const val = e.target.value
    setDraft(val)
    clearTimeout(debounceRef.current)
    if (val.trim().length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(val.trim()), 500)
  }

  function selectSuggestion(s) {
    setDraft(s.text)
    persistLocation(s.text, s.lat, s.lon)
  }

  async function geocodeAndSave(text) {
    try {
      const res = await fetch(
        `${NOMINATIM}/search?q=${encodeURIComponent(text)}&format=json&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const results = await res.json()
      if (results.length > 0) {
        const r = results[0]
        const formatted = extractCityCountry(r.address) || text
        persistLocation(formatted, parseFloat(r.lat), parseFloat(r.lon))
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

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setSuggestions([])
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      setSuggestions([])
      const val = draft.trim()
      if (val) geocodeAndSave(val)
    }
  }

  function startEditing() {
    setDraft(saved)
    setEditing(true)
    setGeoError('')
    setSuggestions([])
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // Location saved, not editing → pill
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

  // No location saved, not editing → placeholder box
  if (!editing && !saved) {
    return (
      <>
        <div
          className="location-placeholder"
          onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0) }}
        >
          <span className="location-placeholder__icon">📍</span>
          <span className="location-placeholder__text">Set your location</span>
          <span className="location-placeholder__optional">optional</span>
        </div>
        <p className="location-caption">Helps identify birds local to your area</p>
      </>
    )
  }

  // Editing state (either setting new or changing existing)
  return (
    <div className="location-form-wrap" ref={wrapRef}>
      <form className="location-form" onSubmit={handleSubmit}>
        <div className="location-form__input-wrap">
          <input
            ref={inputRef}
            className="location-form__input"
            type="text"
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder="Where is the bird sound from?"
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="location-suggestions">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="location-suggestion"
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s) }}
                >
                  📍 {s.text}
                </li>
              ))}
            </ul>
          )}
        </div>
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
            onClick={() => { setSuggestions([]); setEditing(false) }}
          >
            Cancel
          </button>
        )}
      </form>
      <p className="location-helper">Optional — helps identify local species</p>
      {geoError && <p className="location-geo-error">{geoError}</p>}
    </div>
  )
}
