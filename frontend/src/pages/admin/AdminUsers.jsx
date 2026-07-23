import { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldOff, ShieldCheck } from 'lucide-react';
import {
  useAdminUsers,
  useSuspendUser,
  useReinstateUser,
  useVerifyFreelancerAdmin,
} from '../../hooks/queries/useAdminQueries';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const AdminUsers = () => {
  const [roleFilter, setRoleFilter] = useState('');
  const { data: users = [], isLoading } = useAdminUsers(roleFilter ? { role: roleFilter } : {});
  const suspendUser = useSuspendUser();
  const reinstateUser = useReinstateUser();
  const verifyFreelancer = useVerifyFreelancerAdmin();

  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reason, setReason] = useState('');

  const handleSuspend = async (e) => {
    e.preventDefault();
    try {
      await suspendUser.mutateAsync({ id: suspendTarget._id, reason });
      toast.success('User suspended');
      setSuspendTarget(null);
      setReason('');
    } catch (err) {
      toast.error('Failed to suspend user');
    }
  };

  const handleReinstate = async (id) => {
    try {
      await reinstateUser.mutateAsync(id);
      toast.success('User reinstated');
    } catch (err) {
      toast.error('Failed to reinstate user');
    }
  };

  const handleVerify = async (id) => {
    try {
      await verifyFreelancer.mutateAsync(id);
      toast.success('Freelancer verified');
    } catch (err) {
      toast.error('Failed to verify freelancer');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Manage users</h1>

      <div className="flex gap-2 mb-6">
        {['', 'client', 'freelancer', 'admin'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`btn-sm rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
              roleFilter === r ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-400'
            }`}
          >
            {r || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-ink-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-ink-50">
                <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                <td className="px-4 py-3 text-ink-600">{u.email}</td>
                <td className="px-4 py-3 capitalize text-ink-600">{u.role}</td>
                <td className="px-4 py-3">
                  {u.isSuspended ? (
                    <span className="badge-danger">Suspended</span>
                  ) : (
                    <span className="badge-open">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {u.role === 'freelancer' && (
                    <button onClick={() => handleVerify(u._id)} className="btn-outline btn-sm">
                      <ShieldCheck size={13} /> Verify
                    </button>
                  )}
                  {u.role !== 'admin' &&
                    (u.isSuspended ? (
                      <button onClick={() => handleReinstate(u._id)} className="btn-outline btn-sm">
                        Reinstate
                      </button>
                    ) : (
                      <button onClick={() => setSuspendTarget(u)} className="btn-danger btn-sm">
                        <ShieldOff size={13} /> Suspend
                      </button>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!suspendTarget} onClose={() => setSuspendTarget(null)} title={`Suspend ${suspendTarget?.name}`}>
        <form onSubmit={handleSuspend} className="space-y-4">
          <div>
            <label className="label">Reason</label>
            <textarea required className="input min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <button className="btn-danger w-full">Suspend account</button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
