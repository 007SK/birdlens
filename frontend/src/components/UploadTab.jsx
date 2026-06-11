import { useRef, useState } from 'react'
import { api } from '../api/client.js'

const ACCEPTED = '.wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4,audio/x-m4a'
const MAX_DURATION = 30

async function getAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const reader = new FileReader()
    reader.onload = (e) => {
      ctx.decodeAudioData(e.target.result, (buf) => {
        ctx.close()
        resolve(buf.duration)
      }, reject)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export default function UploadTab({ onResult }) {
  const [phase, setPhase] = useState('idle') // idle | ready | analysing | error
  const [file, setFile] = useState(null)
  const [duration, setDuration] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(f) {
    setErrorMsg('')
    setFile(null)
    setDuration(null)
    setPhase('idle')

    if (!f) return

    let dur
    try {
      dur = await getAudioDuration(f)
    } catch {
      setErrorMsg('Could not read this file. Make sure it is a valid audio file.')
      return
    }

    if (dur > MAX_DURATION) {
      setErrorMsg(`This clip is ${Math.round(dur)}s — maximum is 30 seconds. Please trim it and try again.`)
      return
    }

    setFile(f)
    setDuration(Math.round(dur))
    setPhase('ready')
  }

  async function analyse() {
    setPhase('analysing')
    const form = new FormData()
    form.append('audio', file, file.name)
    form.append('duration', duration)
    form.append('source', 'upload')
    try {
      const loc = JSON.parse(localStorage.getItem('birdlens_location') ?? 'null')
      if (loc?.lat != null) form.append('lat', loc.lat)
      if (loc?.lon != null) form.append('lon', loc.lon)
      if (loc?.text) form.append('location_label', loc.text)
    } catch {}
    try {
      const data = await api.analyze(form)
      setPhase('idle')
      setFile(null)
      setDuration(null)
      onResult(data)
    } catch (err) {
      setPhase('error')
      setErrorMsg(err.message || 'Analysis failed. Please try again.')
    }
  }

  function reset() {
    setPhase('idle')
    setFile(null)
    setDuration(null)
    setErrorMsg('')
  }

  function onDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  return (
    <div className="upload-tab">
      <div
        className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <p className="drop-zone__icon">🎵</p>
        <p className="drop-zone__text">Drag & drop an audio file here</p>
        <p className="drop-zone__hint">or click to browse</p>
        <p className="drop-zone__formats">WAV · MP3 · M4A &nbsp;(max 30 seconds)</p>
      </div>

      {phase === 'ready' && (
        <div className="upload-ready">
          <p className="upload-filename">{file.name} <span className="upload-duration">({duration}s)</span></p>
          <div className="upload-actions">
            <button className="btn btn--primary" onClick={analyse}>Analyse</button>
            <button className="btn btn--ghost" onClick={reset}>Clear</button>
          </div>
        </div>
      )}

      {phase === 'analysing' && (
        <div className="analysing-state">
          <span className="spinner" />
          Analysing…
        </div>
      )}

      {(phase === 'error' || errorMsg) && (
        <div className="inline-error">
          <p>{errorMsg}</p>
          {phase === 'error' && (
            <button className="btn btn--secondary" onClick={reset}>Try again</button>
          )}
        </div>
      )}
    </div>
  )
}
