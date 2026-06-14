import { useState } from 'react'
import type { Card } from '../api/cards'

interface Props {
  card: Card
  onEdit: (card: Card) => void
  onDelete: (id: number) => void
}

const face: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  borderRadius: 8,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

export function CardItem({ card, onEdit, onDelete }: Props) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      style={{ perspective: '1200px', marginBottom: 12, height: 180 }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        style={{
          position: 'relative',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4, 0.2, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
          borderRadius: 8,
        }}
      >
        {/* ── Front face ── */}
        <div style={{ ...face, backgroundColor: '#40444b' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#72767d', marginBottom: 8 }}>
            Front
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {card.front_text && (
              <p style={{ color: '#dcddde', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {card.front_text}
              </p>
            )}
            {card.front_image_url && (
              <img src={card.front_image_url} alt="" style={{ maxWidth: '100%', maxHeight: 70, borderRadius: 4, marginTop: 4, objectFit: 'contain' }} />
            )}
          </div>
          {/* Buttons — stop propagation so clicks don't flip the card */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => onEdit(card)}>
              Edit
            </button>
            <button
              style={{ padding: '5px 12px', fontSize: 13, background: '#ed4245' }}
              onClick={() => onDelete(card.id)}
            >
              Delete
            </button>
            {!!card.is_public && (
              <span style={{ marginLeft: 4, fontSize: 11, color: '#3ba55d', fontWeight: 600 }}>
                ● Public
              </span>
            )}
          </div>
          <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: '#4f545c', userSelect: 'none', pointerEvents: 'none' }}>
            click to flip ▶
          </span>
        </div>

        {/* ── Back face ── */}
        <div style={{ ...face, backgroundColor: '#2f3136', transform: 'rotateY(180deg)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5865f2', marginBottom: 8 }}>
            Back
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {card.back_text && (
              <p style={{ color: '#dcddde', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                {card.back_text}
              </p>
            )}
            {card.back_image_url && (
              <img src={card.back_image_url} alt="" style={{ maxWidth: '100%', maxHeight: 70, borderRadius: 4, marginTop: 4, objectFit: 'contain' }} />
            )}
          </div>
          <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: '#4f545c', userSelect: 'none', pointerEvents: 'none' }}>
            ◀ click to flip
          </span>
        </div>
      </div>
    </div>
  )
}
