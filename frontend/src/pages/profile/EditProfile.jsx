import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, ShieldCheck, FileText, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/endpoints';
import {
  useFreelancerProfile,
  useClientProfile,
  useUpdateFreelancerProfile,
  useUpdateClientProfile,
  useUpdateBasicProfile,
  useUploadFreelancerFile,
} from '../../hooks/queries/useProfileQueries';
import LoadingSpinner from '../../components/LoadingSpinner';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const [basic, setBasic] = useState({ name: user?.name || '', phone: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [twoFA, setTwoFA] = useState({ qrCode: null, code: '' });

  // Server data, fetched/cached via React Query.
  const { data: freelancerProfile, isLoading: loadingFreelancer } = useFreelancerProfile('', {
    enabled: user.role === 'freelancer',
  });
  const { data: clientProfile, isLoading: loadingClient } = useClientProfile('', {
    enabled: user.role === 'client',
  });

  // Local editable draft, seeded from the query result once it arrives. Kept
  // separate from the cache itself since the form needs freely-editable
  // nested array state (skills/portfolio/certifications/experience) before
  // the person hits Save - React Query's cache should stay the source of
  // truth for the *saved* profile, not every keystroke of an in-progress edit.
  const [freelancer, setFreelancer] = useState(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (freelancerProfile && !freelancer) setFreelancer(freelancerProfile);
  }, [freelancerProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (clientProfile && !client) setClient(clientProfile);
  }, [clientProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = user.role === 'freelancer' ? loadingFreelancer : user.role === 'client' ? loadingClient : false;

  const updateBasicProfile = useUpdateBasicProfile();
  const updateFreelancerProfile = useUpdateFreelancerProfile();
  const updateClientProfile = useUpdateClientProfile();
  const uploadFreelancerFile = useUploadFreelancerFile();

  const saveBasic = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(basic).forEach(([k, v]) => v && formData.append(k, v));
      const updatedUser = await updateBasicProfile.mutateAsync(formData);
      updateUser(updatedUser);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const saveFreelancer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedProfile = await updateFreelancerProfile.mutateAsync(freelancer);
      setFreelancer(updatedProfile);
      toast.success('Freelancer profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const saveClient = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedProfile = await updateClientProfile.mutateAsync(client);
      setClient(updatedProfile);
      toast.success('Company profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    setFreelancer({ ...freelancer, skills: [...(freelancer.skills || []), { name: '', proficiency: 'intermediate' }] });
  };
  const updateSkill = (i, field, value) => {
    const skills = [...freelancer.skills];
    skills[i] = { ...skills[i], [field]: value };
    setFreelancer({ ...freelancer, skills });
  };
  const removeSkill = (i) => {
    setFreelancer({ ...freelancer, skills: freelancer.skills.filter((_, idx) => idx !== i) });
  };

  // ---- Resume ----
  const [uploadingResume, setUploadingResume] = useState(false);
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', 'resume');
      const { url } = await uploadFreelancerFile.mutateAsync(formData);
      setFreelancer({ ...freelancer, resumeUrl: url });
      toast.success('Resume uploaded');
    } catch (err) {
      toast.error('Resume upload failed');
    } finally {
      setUploadingResume(false);
    }
  };

  // ---- Portfolio ----
  const [uploadingPortfolioIndex, setUploadingPortfolioIndex] = useState(null);
  const addPortfolioItem = () => {
    setFreelancer({
      ...freelancer,
      portfolio: [...(freelancer.portfolio || []), { title: '', description: '', imageUrl: '', projectUrl: '' }],
    });
  };
  const updatePortfolioItem = (i, field, value) => {
    const portfolio = [...freelancer.portfolio];
    portfolio[i] = { ...portfolio[i], [field]: value };
    setFreelancer({ ...freelancer, portfolio });
  };
  const removePortfolioItem = (i) => {
    setFreelancer({ ...freelancer, portfolio: freelancer.portfolio.filter((_, idx) => idx !== i) });
  };
  const handlePortfolioImageUpload = async (i, file) => {
    if (!file) return;
    setUploadingPortfolioIndex(i);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', 'portfolio');
      const { url } = await uploadFreelancerFile.mutateAsync(formData);
      updatePortfolioItem(i, 'imageUrl', url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploadingPortfolioIndex(null);
    }
  };

  // ---- Certifications ----
  const [uploadingCertIndex, setUploadingCertIndex] = useState(null);
  const addCertification = () => {
    setFreelancer({
      ...freelancer,
      certifications: [...(freelancer.certifications || []), { name: '', issuer: '', issueDate: '', certificateUrl: '' }],
    });
  };
  const updateCertification = (i, field, value) => {
    const certifications = [...freelancer.certifications];
    certifications[i] = { ...certifications[i], [field]: value };
    setFreelancer({ ...freelancer, certifications });
  };
  const removeCertification = (i) => {
    setFreelancer({ ...freelancer, certifications: freelancer.certifications.filter((_, idx) => idx !== i) });
  };
  const handleCertificateUpload = async (i, file) => {
    if (!file) return;
    setUploadingCertIndex(i);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', 'certification');
      const { url } = await uploadFreelancerFile.mutateAsync(formData);
      updateCertification(i, 'certificateUrl', url);
      toast.success('Certificate uploaded');
    } catch (err) {
      toast.error('Certificate upload failed');
    } finally {
      setUploadingCertIndex(null);
    }
  };

  // ---- Experience ----
  const addExperience = () => {
    setFreelancer({
      ...freelancer,
      experience: [...(freelancer.experience || []), { company: '', roleTitle: '', startDate: '', endDate: '', description: '' }],
    });
  };
  const updateExperience = (i, field, value) => {
    const experience = [...freelancer.experience];
    experience[i] = { ...experience[i], [field]: value };
    setFreelancer({ ...freelancer, experience });
  };
  const removeExperience = (i) => {
    setFreelancer({ ...freelancer, experience: freelancer.experience.filter((_, idx) => idx !== i) });
  };

  const startTwoFactorSetup = async () => {
    const { data } = await authApi.setupTwoFactor();
    setTwoFA({ qrCode: data.qrCode, code: '' });
  };

  const confirmTwoFactorSetup = async (e) => {
    e.preventDefault();
    try {
      await authApi.confirmTwoFactor(twoFA.code);
      toast.success('Two-factor authentication enabled');
      setTwoFA({ qrCode: null, code: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-display font-semibold text-ink-900">Edit profile</h1>

      {/* Basic info */}
      <form onSubmit={saveBasic} className="card p-6 space-y-4">
        <h2 className="font-display font-semibold text-ink-900">Basic information</h2>
        <div>
          <label className="label">Full name</label>
          <input className="input" value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={basic.phone} onChange={(e) => setBasic({ ...basic, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">City</label>
          <input className="input" value={basic.city} onChange={(e) => setBasic({ ...basic, city: e.target.value })} />
        </div>
        <button className="btn-accent" disabled={saving}>
          Save changes
        </button>
      </form>

      {/* Freelancer-specific */}
      {user.role === 'freelancer' && freelancer && (
        <form onSubmit={saveFreelancer} className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-ink-900">Freelancer profile</h2>
          <div>
            <label className="label">Professional title</label>
            <input
              className="input"
              value={freelancer.title || ''}
              onChange={(e) => setFreelancer({ ...freelancer, title: e.target.value })}
              placeholder="e.g. Full Stack Developer"
            />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input min-h-24"
              value={freelancer.bio || ''}
              onChange={(e) => setFreelancer({ ...freelancer, bio: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Hourly rate (₹)</label>
            <input
              type="number"
              className="input"
              value={freelancer.hourlyRate || 0}
              onChange={(e) => setFreelancer({ ...freelancer, hourlyRate: Number(e.target.value) })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Skills</label>
              <button type="button" onClick={addSkill} className="text-xs text-pin font-medium flex items-center gap-1">
                <Plus size={14} /> Add skill
              </button>
            </div>
            <div className="space-y-2">
              {(freelancer.skills || []).map((skill, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input"
                    placeholder="Skill name"
                    value={skill.name}
                    onChange={(e) => updateSkill(i, 'name', e.target.value)}
                  />
                  <select
                    className="input max-w-40"
                    value={skill.proficiency}
                    onChange={(e) => updateSkill(i, 'proficiency', e.target.value)}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button type="button" onClick={() => removeSkill(i)} className="text-rose">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Resume upload */}
          <div>
            <label className="label">Resume</label>
            {freelancer.resumeUrl && (
              <a
                href={freelancer.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-pin hover:underline mb-2"
              >
                <FileText size={15} /> View current resume
              </a>
            )}
            <label className="btn-outline btn-sm w-fit cursor-pointer">
              <Upload size={13} />
              {uploadingResume ? 'Uploading...' : freelancer.resumeUrl ? 'Replace resume' : 'Upload resume'}
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
            </label>
          </div>

          {/* Portfolio gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Portfolio</label>
              <button type="button" onClick={addPortfolioItem} className="text-xs text-pin font-medium flex items-center gap-1">
                <Plus size={14} /> Add project
              </button>
            </div>
            <div className="space-y-3">
              {(freelancer.portfolio || []).map((item, i) => (
                <div key={i} className="border border-ink-100 rounded-md p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Project title"
                      value={item.title}
                      onChange={(e) => updatePortfolioItem(i, 'title', e.target.value)}
                    />
                    <button type="button" onClick={() => removePortfolioItem(i)} className="text-rose shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <textarea
                    className="input min-h-16"
                    placeholder="Short description"
                    value={item.description}
                    onChange={(e) => updatePortfolioItem(i, 'description', e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Project URL (optional)"
                    value={item.projectUrl}
                    onChange={(e) => updatePortfolioItem(i, 'projectUrl', e.target.value)}
                  />
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="w-14 h-14 object-cover rounded border border-ink-100" />
                    )}
                    <label className="btn-outline btn-sm w-fit cursor-pointer">
                      <ImageIcon size={13} />
                      {uploadingPortfolioIndex === i ? 'Uploading...' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePortfolioImageUpload(i, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
              ))}
              {(freelancer.portfolio || []).length === 0 && (
                <p className="text-xs text-ink-400">No portfolio projects added yet.</p>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Certifications</label>
              <button type="button" onClick={addCertification} className="text-xs text-pin font-medium flex items-center gap-1">
                <Plus size={14} /> Add certification
              </button>
            </div>
            <div className="space-y-3">
              {(freelancer.certifications || []).map((cert, i) => (
                <div key={i} className="border border-ink-100 rounded-md p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Certification name"
                      value={cert.name}
                      onChange={(e) => updateCertification(i, 'name', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Issuer"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(i, 'issuer', e.target.value)}
                    />
                    <button type="button" onClick={() => removeCertification(i)} className="text-rose shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      className="input max-w-44"
                      value={cert.issueDate ? String(cert.issueDate).slice(0, 10) : ''}
                      onChange={(e) => updateCertification(i, 'issueDate', e.target.value)}
                    />
                    {cert.certificateUrl && (
                      <a href={cert.certificateUrl} target="_blank" rel="noreferrer" className="text-xs text-pin hover:underline">
                        View certificate
                      </a>
                    )}
                    <label className="btn-outline btn-sm w-fit cursor-pointer">
                      <Upload size={13} />
                      {uploadingCertIndex === i ? 'Uploading...' : 'Upload file'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleCertificateUpload(i, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
              ))}
              {(freelancer.certifications || []).length === 0 && (
                <p className="text-xs text-ink-400">No certifications added yet.</p>
              )}
            </div>
          </div>

          {/* Work experience timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Work experience</label>
              <button type="button" onClick={addExperience} className="text-xs text-pin font-medium flex items-center gap-1">
                <Plus size={14} /> Add experience
              </button>
            </div>
            <div className="space-y-3">
              {(freelancer.experience || []).map((exp, i) => (
                <div key={i} className="border border-ink-100 rounded-md p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateExperience(i, 'company', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Role title"
                      value={exp.roleTitle}
                      onChange={(e) => updateExperience(i, 'roleTitle', e.target.value)}
                    />
                    <button type="button" onClick={() => removeExperience(i)} className="text-rose shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-ink-400">Start date</label>
                      <input
                        type="date"
                        className="input"
                        value={exp.startDate ? String(exp.startDate).slice(0, 10) : ''}
                        onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-ink-400">End date (blank if current)</label>
                      <input
                        type="date"
                        className="input"
                        value={exp.endDate ? String(exp.endDate).slice(0, 10) : ''}
                        onChange={(e) => updateExperience(i, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <textarea
                    className="input min-h-16"
                    placeholder="What did you work on?"
                    value={exp.description}
                    onChange={(e) => updateExperience(i, 'description', e.target.value)}
                  />
                </div>
              ))}
              {(freelancer.experience || []).length === 0 && (
                <p className="text-xs text-ink-400">No work experience added yet.</p>
              )}
            </div>
          </div>

          <button className="btn-accent" disabled={saving}>
            Save freelancer profile
          </button>
        </form>
      )}

      {/* Client-specific */}
      {user.role === 'client' && client && (
        <form onSubmit={saveClient} className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-ink-900">Company profile</h2>
          <div>
            <label className="label">Company name</label>
            <input
              className="input"
              value={client.companyName || ''}
              onChange={(e) => setClient({ ...client, companyName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Website</label>
            <input
              className="input"
              value={client.companyWebsite || ''}
              onChange={(e) => setClient({ ...client, companyWebsite: e.target.value })}
            />
          </div>
          <div>
            <label className="label">About</label>
            <textarea
              className="input min-h-24"
              value={client.about || ''}
              onChange={(e) => setClient({ ...client, about: e.target.value })}
            />
          </div>
          <button className="btn-accent" disabled={saving}>
            Save company profile
          </button>
        </form>
      )}

      {/* 2FA setup */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-pin" />
          <h2 className="font-display font-semibold text-ink-900">Two-factor authentication</h2>
        </div>
        {user.twoFactorEnabled ? (
          <p className="text-sm text-moss">2FA is enabled on your account.</p>
        ) : twoFA.qrCode ? (
          <form onSubmit={confirmTwoFactorSetup} className="space-y-3">
            <p className="text-sm text-ink-400">Scan this QR code with Google Authenticator or Authy:</p>
            <img src={twoFA.qrCode} alt="2FA QR code" className="w-40 h-40 border border-ink-100 rounded-md" />
            <input
              className="input max-w-40"
              placeholder="000000"
              value={twoFA.code}
              onChange={(e) => setTwoFA({ ...twoFA, code: e.target.value })}
            />
            <button className="btn-accent">Confirm & enable</button>
          </form>
        ) : (
          <button onClick={startTwoFactorSetup} className="btn-outline">
            Enable 2FA
          </button>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
