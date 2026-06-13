import type { Card } from '../api/cards'

interface Props {
  card: Card
  onEdit: (card: Card) => void
  onDelete: (id: number) => void
}

export function CardItem({ card, onEdit, onDelete }: Props) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <div>
        <strong>Front</strong>
        <p>{card.front_text}</p>
        {card.front_image_url && (
          <img src={card.front_image_url} alt="Front" style={{ maxWidth: 200 }} />
        )}
      </div>
      <hr />
      <div>
        <strong>Back</strong>
        <p>{card.back_text}</p>
        {card.back_image_url && (
          <img src={card.back_image_url} alt="Back" style={{ maxWidth: 200 }} />
        )}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => onEdit(card)}>Edit</button>
        <button onClick={() => onDelete(card.id)}>Delete</button>
      </div>
    </div>
  )
}
