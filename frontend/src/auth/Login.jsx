import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/endpoints';

const Login = () => {
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [twoFactor, setTwoFactor] = useState(null); // { preAuthToken }
  const [code, setCode] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result.twoFactorRequired) {
        setTwoFactor({ preAuthToken: result.preAuthToken });
      } else {
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyTwoFactor(twoFactor.preAuthToken, code);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  if (twoFactor) {
    return (
      <form onSubmit={handleTwoFactorSubmit}>
        <p className="eyebrow mb-2">Two-factor verification</p>
        <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Enter your code</h1>
        <label className="label">6-digit authenticator code</label>
        <input
          className="input mb-5 tracking-widest text-center font-mono text-lg"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          autoFocus
        />
        <button className="btn-accent w-full" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify & sign in'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="eyebrow mb-2">Welcome back</p>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Sign in to SkillSphere</h1>

      <label className="label">Email</label>
      <input
        type="email"
        required
        className="input mb-4"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="you@example.com"
      />

      <label className="label">Password</label>
      <input
        type="password"
        required
        className="input mb-2"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="••••••••"
      />
      <div className="text-right mb-5">
        <Link to="/forgot-password" className="text-xs text-pin font-medium hover:underline">
          Forgot password?
        </Link>
      </div>

      <button className="btn-accent w-full mb-3" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <a href={authApi.googleLoginUrl()} className="btn-outline w-full mb-6">
        Continue with Google
      </a>

      <p className="text-sm text-ink-400 text-center">
        New to SkillSphere?{' '}
        <Link to="/register" className="text-pin font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
};

export default Login;
