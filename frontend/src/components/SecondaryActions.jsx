import { useState, useRef, useLayoutEffect } from 'react'

const UPLOAD_TIP = 'Have a bird sound saved? Upload a 30 second or shorter file.'
const SPECIES_TIP = 'See every unique bird heard on BirdLens so far.'

function clampToViewport(el) {
  if (!el) return
  const rect = el.getBoundingClientRect()
  const margin = 8
  if (rect.left < margin) {
    el.style.left = '0'
    el.style.transform = 'none'
  } else if (rect.right > window.innerWidth - margin) {
    el.style.left = 'auto'
    el.style.right = '0'
    el.style.transform = 'none'
  }
}

export default function SecondaryActions({ onUpload, onSpecies }) {
  const [hover, setHover] = useState(null) // 'upload' | 'species' | null
  const uploadTooltipRef = useRef(null)
  const speciesTooltipRef = useRef(null)

  useLayoutEffect(() => {
    if (hover === 'upload') clampToViewport(uploadTooltipRef.current)
    if (hover === 'species') clampToViewport(speciesTooltipRef.current)
  }, [hover])

  return (
    <div className="secondary-actions">
      <div className="secondary-action">
        {hover === 'upload' && (
          <div className="secondary-action__tooltip" ref={uploadTooltipRef}>
            {UPLOAD_TIP}
          </div>
        )}
        <button
          className="btn-secondary-action"
          onClick={onUpload}
          onMouseEnter={() => setHover('upload')}
          onMouseLeave={() => setHover(null)}
        >
          Upload Audio File
        </button>
        <p className="secondary-action__caption">{UPLOAD_TIP}</p>
      </div>

      <div className="secondary-action">
        {hover === 'species' && (
          <div className="secondary-action__tooltip" ref={speciesTooltipRef}>
            {SPECIES_TIP}
          </div>
        )}
        <button
          className="btn-secondary-action"
          onClick={onSpecies}
          onMouseEnter={() => setHover('species')}
          onMouseLeave={() => setHover(null)}
        >
          Birds Discovered
        </button>
        <p className="secondary-action__caption">{SPECIES_TIP}</p>
      </div>
    </div>
  )
}
