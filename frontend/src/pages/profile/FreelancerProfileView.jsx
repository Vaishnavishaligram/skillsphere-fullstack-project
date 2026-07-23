import { useParams, Link } from 'react-router-dom';
import { BadgeCheck, MessageSquare, ShieldCheck } from 'lucide-react';
import { useFreelancerProfile } from '../../hooks/queries/useProfileQueries';
import { useReviewsForUser } from '../../hooks/queries/useReviewQueries';
import LoadingSpinner from '../../components/LoadingSpinner';
import RatingStars from '../../components/RatingStars';
import ReputationBreakdown from '../../components/ReputationBreakdown';
import { useAuth } from '../../context/AuthContext';

const FreelancerProfileView = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { data: profile, isLoading: profileLoading } = useFreelancerProfile(id || '');
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsForUser(profile?.user?._id);

  if (profileLoading) return <LoadingSpinner />;
  if (!profile) return <p className="text-ink-400">Profile not found.</p>;

  const isOwnProfile = currentUser?._id === profile.user._id;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-ink-100 flex items-center justify-center font-display font-semibold text-xl text-ink-600 overflow-hidden shrink-0">
              {profile.user.avatar ? (
                <img src={profile.user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.user.name?.[0]
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-semibold text-ink-900">{profile.user.name}</h1>
                {profile.isVerified && <BadgeCheck size={18} className="text-pin" />}
              </div>
              <p className="text-sm text-ink-400">{profile.title}</p>
              <div className="mt-2">
                <RatingStars rating={profile.ratingAverage} count={profile.ratingCount} />
              </div>
            </div>
          </div>
          {!isOwnProfile && (
            <Link to={`/messages/${profile.user._id}`} className="btn-outline btn-sm">
              <MessageSquare size={14} /> Message
            </Link>
          )}
        </div>

        <p className="text-sm text-ink-600 mt-5 leading-relaxed">{profile.bio || 'No bio provided yet.'}</p>

        <div className="flex flex-wrap gap-2 mt-5">
          {(profile.skills || []).map((s) => (
            <span key={s.name} className="text-xs font-mono px-2.5 py-1 bg-ink-50 text-ink-600 rounded">
              {s.name} · {s.proficiency}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-ink-100">
          <div>
            <p className="eyebrow">Hourly rate</p>
            <p className="font-mono font-semibold text-ink-900">₹{profile.hourlyRate}/hr</p>
          </div>
          <div>
            <p className="eyebrow">Completed gigs</p>
            <p className="font-mono font-semibold text-ink-900">{profile.completedGigs}</p>
          </div>
          <div>
            <p className="eyebrow">Profile views</p>
            <p className="font-mono font-semibold text-ink-900">{profile.profileViews}</p>
          </div>
        </div>
      </div>

      {profile.portfolio?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-semibold text-ink-900 mb-4">Portfolio</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.portfolio.map((item, i) => (
              <div key={i} className="border border-ink-100 rounded-md overflow-hidden">
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover" />}
                <div className="p-3">
                  <p className="font-medium text-sm text-ink-900">{item.title}</p>
                  <p className="text-xs text-ink-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weighted reputation breakdown - the "smart" reputation surface */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-ink-900 mb-4">Reputation</h2>
        <ReputationBreakdown userId={profile.user._id} />
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold text-ink-900 mb-4">Reviews ({reviews.length})</h2>
        {reviewsLoading ? (
          <LoadingSpinner />
        ) : reviews.length === 0 ? (
          <p className="text-sm text-ink-400">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="pb-4 border-b border-ink-50 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-ink-900">{r.reviewer?.name}</span>
                    {r.isVerified && (
                      <span className="flex items-center gap-0.5 text-xs text-pin bg-pin/10 rounded-full px-1.5 py-0.5">
                        <ShieldCheck size={11} /> Verified
                      </span>
                    )}
                  </div>
                  <RatingStars rating={r.rating} size={12} />
                </div>
                <p className="text-sm text-ink-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerProfileView;
