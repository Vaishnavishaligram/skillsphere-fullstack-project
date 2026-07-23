import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateGig } from '../../hooks/queries/useGigQueries';

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Design',
  'Writing',
  'Marketing',
  'Home Services',
  'Tutoring',
  'Other',
];

const CreateGig = () => {
  const navigate = useNavigate();
  const createGig = useCreateGig();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    skillsRequired: '',
    budgetType: 'fixed',
    budgetMin: '',
    budgetMax: '',
    city: '',
    isRemote: false,
    deadline: '',
  });
  const [milestones, setMilestones] = useState([{ title: '', description: '', amount: '', dueDate: '' }]);

  const addMilestone = () => setMilestones([...milestones, { title: '', description: '', amount: '', dueDate: '' }]);
  const updateMilestone = (i, field, value) => {
    const next = [...milestones];
    next[i] = { ...next[i], [field]: value };
    setMilestones(next);
  };
  const removeMilestone = (i) => setMilestones(milestones.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        skillsRequired: form.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        milestones: milestones
          .filter((m) => m.title && m.amount)
          .map((m) => ({ ...m, amount: Number(m.amount) })),
      };
      const gig = await createGig.mutateAsync(payload);
      toast.success('Gig posted successfully');
      navigate(`/gigs/${gig._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create gig');
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-1">Post a gig</h1>
      <p className="text-sm text-ink-400 mb-6">Describe the work — our AI matching engine recommends the best local freelancers.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Title</label>
          <input
            required
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Build a React landing page"
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            required
            className="input min-h-32"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What needs to be done, and what does success look like?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Budget type</label>
            <select
              className="input"
              value={form.budgetType}
              onChange={(e) => setForm({ ...form, budgetType: e.target.value })}
            >
              <option value="fixed">Fixed price</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Skills required (comma-separated)</label>
          <input
            className="input"
            value={form.skillsRequired}
            onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
            placeholder="React, Node.js, Tailwind CSS"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Min budget (₹)</label>
            <input
              type="number"
              required
              className="input"
              value={form.budgetMin}
              onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Max budget (₹)</label>
            <input
              type="number"
              required
              className="input"
              value={form.budgetMax}
              onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="label">City</label>
            <input
              className="input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Pune"
              disabled={form.isRemote}
            />
          </div>
          <label className="flex items-center gap-2 pb-2.5 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={form.isRemote}
              onChange={(e) => setForm({ ...form, isRemote: e.target.checked })}
            />
            This gig is fully remote
          </label>
        </div>

        <div>
          <label className="label">Deadline</label>
          <input
            type="date"
            className="input"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Milestones</label>
            <button type="button" onClick={addMilestone} className="text-xs text-pin font-medium flex items-center gap-1">
              <Plus size={14} /> Add milestone
            </button>
          </div>
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="border border-ink-100 rounded-md p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="Milestone title"
                    value={m.title}
                    onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                  />
                  <input
                    type="number"
                    className="input max-w-32"
                    placeholder="Amount"
                    value={m.amount}
                    onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                  />
                  <button type="button" onClick={() => removeMilestone(i)} className="text-rose">
                    <Trash2 size={18} />
                  </button>
                </div>
                <input
                  className="input"
                  placeholder="Milestone description (optional)"
                  value={m.description}
                  onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <button className="btn-accent w-full" disabled={createGig.isPending}>
          {createGig.isPending ? 'Posting...' : 'Post gig'}
        </button>
      </form>
    </div>
  );
};

export default CreateGig;
