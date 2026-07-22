import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

const GigCard = ({ gig }) => {
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
  };

  return (
    <Link to={`/gigs/${gig._id}`} className="card p-5 flex flex-col gap-3 hover:border-pin transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-semibold text-ink-900 leading-snug group-hover:text-pin transition-colors">
          {gig.title}
        </h3>
        <StatusBadge status={gig.status} />
      </div>

      <p className="text-sm text-ink-400 line-clamp-2">{gig.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {(gig.skillsRequired || []).slice(0, 4).map((skill) => (
          <span key={skill} className="text-xs font-mono px-2 py-1 bg-ink-50 text-ink-600 rounded">
            {skill}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-ink-100 mt-1">
        <div className="font-mono text-sm font-semibold text-ink-900">
          ₹{gig.budgetMin?.toLocaleString()} – ₹{gig.budgetMax?.toLocaleString()}
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {gig.location?.isRemote ? 'Remote' : gig.location?.city || 'Local'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {timeAgo(gig.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default GigCard;
