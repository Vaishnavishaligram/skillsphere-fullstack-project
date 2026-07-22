import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { useSubmitProposal } from '../../hooks/queries/useGigQueries';

const SubmitProposalModal = ({ open, onClose, gig }) => {
  const [form, setForm] = useState({ coverLetter: '', bidAmount: '', estimatedDays: '' });
  const submitProposal = useSubmitProposal(gig?._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitProposal.mutateAsync({
        ...form,
        bidAmount: Number(form.bidAmount),
        estimatedDays: Number(form.estimatedDays),
      });
      toast.success('Proposal submitted');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit proposal');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Submit a proposal for "${gig?.title}"`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Cover letter</label>
          <textarea
            required
            className="input min-h-28"
            value={form.coverLetter}
            onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
            placeholder="Explain why you're a great fit for this gig..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Your bid (₹)</label>
            <input
              type="number"
              required
              className="input"
              value={form.bidAmount}
              onChange={(e) => setForm({ ...form, bidAmount: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Estimated days</label>
            <input
              type="number"
              required
              className="input"
              value={form.estimatedDays}
              onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
            />
          </div>
        </div>
        <button className="btn-accent w-full" disabled={submitProposal.isPending}>
          {submitProposal.isPending ? 'Submitting...' : 'Submit proposal'}
        </button>
      </form>
    </Modal>
  );
};

export default SubmitProposalModal;
