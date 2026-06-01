interface StarRatingProps {
  stars: 1 | 2 | 3
}

export function StarRating({ stars }: StarRatingProps) {
  return (
    <div style={{ display: 'flex', gap: '4px', fontSize: '1.8em' }}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          style={{ color: n <= stars ? 'var(--color-accent)' : '#333' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}
