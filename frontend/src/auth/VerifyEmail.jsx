import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  if (status === 'loading') return <LoadingSpinner label="Verifying email" />;

  return (
    <div className="text-center">
      {status === 'success' ? (
        <>
          <CheckCircle2 size={40} className="text-pin mx-auto mb-4" />
          <h1 className="text-xl font-display font-semibold text-ink-900 mb-2">Email verified</h1>
          <p className="text-sm text-ink-400 mb-6">Your address has been confirmed. You're all set.</p>
        </>
      ) : (
        <>
          <XCircle size={40} className="text-rose mx-auto mb-4" />
          <h1 className="text-xl font-display font-semibold text-ink-900 mb-2">Link expired or invalid</h1>
          <p className="text-sm text-ink-400 mb-6">Request a new verification email from your account settings.</p>
        </>
      )}
      <Link to="/dashboard" className="btn-accent">
        Go to dashboard
      </Link>
    </div>
  );
};

export default VerifyEmail;
