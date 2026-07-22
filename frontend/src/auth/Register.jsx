import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Check your email to verify your address.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="eyebrow mb-2">Get started</p>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Create your account</h1>

      <label className="label">I want to</label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {['client', 'freelancer'].map((role) => (
          <button
            type="button"
            key={role}
            onClick={() => setForm({ ...form, role })}
            className={`rounded-md border px-4 py-3 text-sm font-medium text-left transition-colors ${
              form.role === role ? 'border-pin bg-pin/5 text-pin' : 'border-ink-100 text-ink-600 hover:border-ink-200'
            }`}
          >
            {role === 'client' ? 'Hire local talent' : 'Find local work'}
          </button>
        ))}
      </div>

      <label className="label">Full name</label>
      <input
        required
        className="input mb-4"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Jordan Lee"
      />

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
        className="input mb-6"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="At least 8 characters"
      />

      <button className="btn-accent w-full mb-6" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-sm text-ink-400 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-pin font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default Register;
