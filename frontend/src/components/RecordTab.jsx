import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'

const MAX_SECONDS = 30
const MIN_STOP_SECONDS = 3

export default function RecordTab({ onResult }) {
  const [phase, setPhase] = useState('idle') // idle | recording | analysing | error
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS)
  const [elapsed, setElapsed] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  async function startRecording() {
    setErrorMsg('')
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErrorMsg('Microphone access was denied. Enable it in your browser settings and refresh.')
      return
    }

    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
      submitBlob(blob)
    }

    recorder.start(250)
    startTimeRef.current = Date.now()
    setElapsed(0)
    setSecondsLeft(MAX_SECONDS)
    setPhase('recording')

    let secs = 0
    timerRef.current = setInterval(() => {
      secs += 1
      setElapsed(secs)
      setSecondsLeft(MAX_SECONDS - secs)
      if (secs >= MAX_SECONDS) stopRecording()
    }, 1000)
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setPhase('analysing')
  }

  async function submitBlob(blob) {
    const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    const form = new FormData()
    form.append('audio', blob, 'recording.webm')
    form.append('duration', duration)
    form.append('source', 'mic')
    try {
      const loc = JSON.parse(localStorage.getItem('birdlens_location') ?? 'null')
      if (loc?.lat != null) form.append('lat', loc.lat)
      if (loc?.lon != null) form.append('lon', loc.lon)
    } catch {}
    try {
      const data = await api.analyze(form)
      setPhase('idle')
      onResult(data)
    } catch (err) {
      setPhase('error')
      setErrorMsg(err.message || 'Analysis failed. Please try again.')
    }
  }

  function reset() {
    setPhase('idle')
    setErrorMsg('')
    setElapsed(0)
    setSecondsLeft(MAX_SECONDS)
  }

  const canStop = elapsed >= MIN_STOP_SECONDS

  return (
    <div className="record-tab">
      {phase === 'recording' && (
        <div className="recording-banner">
          <span className="recording-dot" /> Recording live — keep this tab active
        </div>
      )}

      {phase === 'idle' && (
        <>
          <button className="btn btn--primary btn--large" onClick={startRecording}>
            Start Recording
          </button>
          <p className="record-hint">Keep this tab active while recording</p>
        </>
      )}

      {phase === 'recording' && (
        <div className="record-active">
          <div className="countdown">{secondsLeft}</div>
          <div className="countdown-label">seconds remaining</div>
          <button
            className="btn btn--danger"
            onClick={stopRecording}
            disabled={!canStop}
          >
            {canStop ? 'Stop' : `Stop (${MIN_STOP_SECONDS - elapsed}s)`}
          </button>
        </div>
      )}

      {phase === 'analysing' && (
        <div className="analysing-state">
          <span className="spinner" />
          Analysing…
        </div>
      )}

      {phase === 'error' && (
        <div className="inline-error">
          <p>{errorMsg}</p>
          <button className="btn btn--secondary" onClick={reset}>Try again</button>
        </div>
      )}

      {phase === 'idle' && errorMsg && (
        <p className="inline-error">{errorMsg}</p>
      )}
    </div>
  )
}
