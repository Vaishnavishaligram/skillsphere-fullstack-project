import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, count, size = 14, interactive = false, onChange }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(s)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={s <= Math.round(rating) ? 'fill-signal text-signal' : 'fill-transparent text-ink-200'}
          />
        </button>
      ))}
      {count !== undefined && <span className="text-xs text-ink-400 ml-1">({count})</span>}
    </div>
  );
};

export default RatingStars;
