import { useParams } from 'react-router-dom';
import { useClientProfile } from '../../hooks/queries/useProfileQueries';
import LoadingSpinner from '../../components/LoadingSpinner';
import RatingStars from '../../components/RatingStars';
import ReputationBreakdown from '../../components/ReputationBreakdown';

const ClientProfileView = () => {
  const { id } = useParams();
  const { data: profile, isLoading } = useClientProfile(id || '');

  if (isLoading) return <LoadingSpinner />;
  if (!profile) return <p className="text-ink-400">Profile not found.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-ink-100 flex items-center justify-center font-display font-semibold text-xl text-ink-600 overflow-hidden">
            {profile.user.avatar ? (
              <img src={profile.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.user.name?.[0]
            )}
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-ink-900">
              {profile.companyName || profile.user.name}
            </h1>
            <RatingStars rating={profile.ratingAverage} count={profile.ratingCount} />
          </div>
        </div>
        <p className="text-sm text-ink-600 mt-5">{profile.about || 'No description provided.'}</p>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-ink-100">
          <div>
            <p className="eyebrow">Gigs posted</p>
            <p className="font-mono font-semibold text-ink-900">{profile.totalGigsPosted}</p>
          </div>
          <div>
            <p className="eyebrow">Total spent</p>
            <p className="font-mono font-semibold text-ink-900">₹{profile.totalSpent?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold text-ink-900 mb-4">Reputation</h2>
        <ReputationBreakdown userId={profile.user._id} />
      </div>
    </div>
  );
};

export default ClientProfileView;
