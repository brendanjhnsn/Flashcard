import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useState as useFlipState } from 'react'
import { getPublicCards } from '../api/public'
import type { PublicCard } from '../api/public'
import { useAuth } from '../context/AuthContext'

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

function PublicCardItem({ card }: { card: PublicCard }) {
  const [flipped, setFlipped] = useFlipState(false)

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
          <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: '#4f545c', userSelect: 'none', pointerEvents: 'none' }}>
            click to flip ▶
          </span>
        </div>

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
          <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: '#4f545c', userSelect: 'none' }}>
            ◀ click to flip
          </span>
        </div>
      </div>
    </div>
  )
}

export function BrowsePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [cards, setCards] = useState<PublicCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicCards()
      .then(setCards)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    navigate('/browse')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#36393f', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#2f3136', borderBottom: '1px solid #202225', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🃏</span>
          <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Public Cards</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: '#b9bbbe' }}>{user.email}</span>
              <Link to="/cards" style={{ fontSize: 13, color: '#b9bbbe', textDecoration: 'none' }}>My Cards</Link>
              {user.role === 'admin' && (
                <Link to="/admin" style={{ fontSize: 13, color: '#5865f2', textDecoration: 'none', fontWeight: 600 }}>Admin Panel</Link>
              )}
              <button className="ghost" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: 13 }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: 13, color: '#b9bbbe', textDecoration: 'none' }}>Log in</Link>
              <Link to="/register" style={{ fontSize: 13, color: '#5865f2', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 680, width: '100%', margin: '0 auto', padding: '24px 16px' }}>
        {loading && (
          <p style={{ color: '#72767d', textAlign: 'center' }}>Loading…</p>
        )}

        {!loading && cards.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60, color: '#72767d' }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No public cards yet</p>
            <p style={{ fontSize: 14 }}>
              <Link to="/register" style={{ color: '#5865f2' }}>Create an account</Link> to start making flashcards.
            </p>
          </div>
        )}

        {cards.map((card) => (
          <PublicCardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}
