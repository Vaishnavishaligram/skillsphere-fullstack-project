import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/endpoints';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="eyebrow mb-2">Set a new password</p>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Reset your password</h1>
      <label className="label">New password</label>
      <input
        type="password"
        required
        className="input mb-6"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
      />
      <button className="btn-accent w-full" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset password'}
      </button>
    </form>
  );
};

export default ResetPassword;
