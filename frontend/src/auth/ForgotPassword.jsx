import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/endpoints';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink-900 mb-2">Check your inbox</h1>
        <p className="text-sm text-ink-400 mb-6">
          If an account exists for {email}, we've sent a link to reset your password.
        </p>
        <Link to="/login" className="text-pin font-medium text-sm hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="eyebrow mb-2">Reset password</p>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Forgot your password?</h1>
      <label className="label">Email</label>
      <input
        type="email"
        required
        className="input mb-6"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <button className="btn-accent w-full mb-5" disabled={loading}>
        {loading ? 'Sending...' : 'Send reset link'}
      </button>
      <Link to="/login" className="text-sm text-ink-400 hover:text-ink-900 block text-center">
        Back to sign in
      </Link>
    </form>
  );
};

export default ForgotPassword;
