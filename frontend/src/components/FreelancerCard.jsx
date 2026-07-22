import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin } from 'lucide-react';
import RatingStars from './RatingStars';

const FreelancerCard = ({ freelancer, matchScore }) => {
  const profile = freelancer.freelancer || freelancer; // supports {freelancer, matchScore} shape from recommendations
  const user = profile.user || {};

  return (
    <Link
      to={`/freelancers/${user._id}`}
      className="card p-5 flex flex-col gap-3 hover:border-pin transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-ink-100 flex items-center justify-center font-display font-semibold text-ink-600 overflow-hidden shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display font-semibold text-ink-900 truncate group-hover:text-pin transition-colors">
              {user.name}
            </h3>
            {profile.isVerified && <BadgeCheck size={16} className="text-pin shrink-0" />}
          </div>
          <p className="text-xs text-ink-400 truncate">{profile.title || 'Freelancer'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <RatingStars rating={profile.ratingAverage} count={profile.ratingCount} />
        {matchScore !== undefined && (
          <span className="text-xs font-mono font-semibold text-pin bg-pin/10 px-2 py-0.5 rounded">
            {matchScore}% match
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(profile.skills || []).slice(0, 3).map((s) => (
          <span key={s.name} className="text-xs font-mono px-2 py-1 bg-ink-50 text-ink-600 rounded">
            {s.name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-ink-100 mt-1 text-xs text-ink-400">
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {user.location?.city || 'Location not set'}
        </span>
        {profile.hourlyRate > 0 && (
          <span className="font-mono font-semibold text-ink-900">₹{profile.hourlyRate}/hr</span>
        )}
      </div>
    </Link>
  );
};

export default FreelancerCard;
