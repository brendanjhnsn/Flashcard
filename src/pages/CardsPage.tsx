import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as cardsApi from '../api/cards'
import type { Card, CardBody } from '../api/cards'
import { CardItem } from '../components/CardItem'
import { CardForm } from '../components/CardForm'

export function CardsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>([])
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    cardsApi.getCards().then(setCards).catch(console.error)
  }, [])

  async function handleCreate(body: CardBody) {
    const card = await cardsApi.createCard(body)
    setCards((prev) => [card, ...prev])
    setShowForm(false)
  }

  async function handleUpdate(body: CardBody) {
    if (!editingCard) return
    const updated = await cardsApi.updateCard(editingCard.id, body)
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setEditingCard(null)
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this card?')) return
    await cardsApi.deleteCard(id)
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#36393f', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div style={{ backgroundColor: '#2f3136', borderBottom: '1px solid #202225', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🃏</span>
          <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Flashcards</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#b9bbbe' }}>{user?.email}</span>
          <button className="ghost" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: 13 }}>
            Log out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, maxWidth: 680, width: '100%', margin: '0 auto', padding: '24px 16px' }}>
        {!showForm && !editingCard && (
          <button onClick={() => setShowForm(true)} style={{ marginBottom: 20, padding: '10px 20px' }}>
            + New card
          </button>
        )}

        {showForm && (
          <div style={{ backgroundColor: '#2f3136', borderRadius: 8, padding: '20px', marginBottom: 20 }}>
            <CardForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {editingCard && (
          <div style={{ backgroundColor: '#2f3136', borderRadius: 8, padding: '20px', marginBottom: 20 }}>
            <CardForm initial={editingCard} onSave={handleUpdate} onCancel={() => setEditingCard(null)} />
          </div>
        )}

        {cards.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', marginTop: 60, color: '#72767d' }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No cards yet</p>
            <p style={{ fontSize: 14 }}>Create your first flashcard to get started.</p>
          </div>
        )}

        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onEdit={setEditingCard}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
