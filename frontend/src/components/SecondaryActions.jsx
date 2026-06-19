import { useState } from 'react'

const UPLOAD_TIP = 'Have a bird sound saved? Upload a 30 second or shorter file.'
const SPECIES_TIP = 'See every unique bird heard on BirdLens so far.'

export default function SecondaryActions({ onUpload, onSpecies }) {
  const [hover, setHover] = useState(null) // 'upload' | 'species' | null

  return (
    <div className="secondary-actions">
      <div className="secondary-action">
        {hover === 'upload' && (
          <div className="secondary-action__tooltip">
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
          <div className="secondary-action__tooltip">
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
