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
  const [error, setError] = useState<string | null>(null)

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
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Cards</h1>
        <div>
          <span style={{ marginRight: 12 }}>{user?.email}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}

      {!showForm && !editingCard && (
        <button onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>
          + New card
        </button>
      )}

      {showForm && (
        <CardForm
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingCard && (
        <CardForm
          initial={editingCard}
          onSave={handleUpdate}
          onCancel={() => setEditingCard(null)}
        />
      )}

      {cards.length === 0 && !showForm && (
        <p>No cards yet. Create your first one!</p>
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
  )
}
