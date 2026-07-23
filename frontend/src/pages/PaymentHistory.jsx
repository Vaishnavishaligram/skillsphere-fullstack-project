import { useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePaymentHistory, useCreateRazorpayOrder, useVerifyRazorpayPayment, useReleasePayment } from '../../hooks/queries/usePaymentQueries';
import { useGigsList } from '../../hooks/queries/useGigQueries';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PaymentHistory = () => {
  const { user } = useAuth();
  const [fundModalOpen, setFundModalOpen] = useState(false);

  const { data: payments = [], isLoading } = usePaymentHistory();
  const { data: gigsData } = useGigsList({ status: 'in_progress', limit: 50 }, { enabled: user?.role === 'client' });
  const gigs = gigsData?.gigs || [];

  const releasePayment = useReleasePayment();

  const handleRelease = async (paymentId) => {
    try {
      await releasePayment.mutateAsync(paymentId);
      toast.success('Payment released to freelancer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release payment');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink-900">Payments</h1>
          <p className="text-sm text-ink-400">Escrow deposits, milestone releases, and transaction history.</p>
        </div>
        {user?.role === 'client' && (
          <button onClick={() => setFundModalOpen(true)} className="btn-accent">
            <CreditCard size={15} /> Fund a milestone
          </button>
        )}
      </div>

      {payments.length === 0 ? (
        <EmptyState title="No transactions yet" description="Payment activity will show up here." />
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p._id} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink-900">{p.gig?.title}</p>
                <p className="text-xs text-ink-400 capitalize">
                  {p.type.replace(/_/g, ' ')} · {p.provider} · {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-sm font-semibold text-ink-900">₹{p.amount?.toLocaleString()}</span>
                <StatusBadge status={p.status} />
                {user?.role === 'client' && p.status === 'held_in_escrow' && (
                  <button onClick={() => handleRelease(p._id)} className="btn-accent btn-sm">
                    Release
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FundMilestoneModal open={fundModalOpen} onClose={() => setFundModalOpen(false)} gigs={gigs} />
    </div>
  );
};

const FundMilestoneModal = ({ open, onClose, gigs }) => {
  const [gigId, setGigId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [amount, setAmount] = useState('');

  const createOrder = useCreateRazorpayOrder();
  const verifyPayment = useVerifyRazorpayPayment();

  const selectedGig = gigs.find((g) => g._id === gigId);

  const handleFund = async (e) => {
    e.preventDefault();
    try {
      const data = await createOrder.mutateAsync({ gigId, milestoneId, amount: Number(amount) });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Unable to load Razorpay checkout. Check your connection.');
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: 'SkillSphere',
        description: 'Milestone escrow deposit',
        handler: async (response) => {
          try {
            await verifyPayment.mutateAsync({
              paymentId: data.paymentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Funds held in escrow');
            onClose();
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        theme: { color: '#FFB100' },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payment order');
    }
  };

  const isSubmitting = createOrder.isPending || verifyPayment.isPending;

  return (
    <Modal open={open} onClose={onClose} title="Fund a milestone">
      <form onSubmit={handleFund} className="space-y-4">
        <div>
          <label className="label">Gig</label>
          <select required className="input" value={gigId} onChange={(e) => setGigId(e.target.value)}>
            <option value="">Select an in-progress gig</option>
            {gigs.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
        {selectedGig && (
          <div>
            <label className="label">Milestone</label>
            <select required className="input" value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
              <option value="">Select a milestone</option>
              {selectedGig.milestones?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title} — ₹{m.amount}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Amount (₹)</label>
          <input required type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <p className="text-xs text-ink-400">
          Funds are held in escrow and only released to the freelancer once you approve the milestone.
        </p>
        <button className="btn-accent w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Proceed to payment'}
        </button>
      </form>
    </Modal>
  );
};

export default PaymentHistory;
