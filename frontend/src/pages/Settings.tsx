import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfile } from '../context/ProfileContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  User as UserIcon, 
  Cpu, 
  Upload, 
  Save, 
  Link as LinkIcon,
  Trash2,
  Plus,
  X,
  FileText,
  UserCheck
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    profile, 
    updateProfile, 
    uploadResume, 
    removeResume, 
    uploadAvatar, 
    removeAvatar 
  } = useProfile();
  
  const { addNotification } = useNotifications();
  const [searchParams] = useSearchParams();

  // Component Form States
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl);
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl);
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl);
  const [bio, setBio] = useState(profile.bio);
  const [targetRole, setTargetRole] = useState(profile.targetRole);
  const [skills, setSkills] = useState<string[]>(profile.skills);
  
  const [newSkill, setNewSkill] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000');
  const [modelSelection, setModelSelection] = useState('nvidia/nemotron-3-super-120b-a12b:free');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const profileSectionRef = useRef<HTMLDivElement>(null);
  const resumeSectionRef = useRef<HTMLDivElement>(null);

  // Focus sections based on tab query parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile' && profileSectionRef.current) {
      profileSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'resume' && resumeSectionRef.current) {
      resumeSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams]);

  // Sync state if context changes externally
  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setLinkedinUrl(profile.linkedinUrl);
    setGithubUrl(profile.githubUrl);
    setPortfolioUrl(profile.portfolioUrl);
    setBio(profile.bio);
    setTargetRole(profile.targetRole);
    setSkills(profile.skills);
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      await updateProfile({
        name,
        email,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        bio,
        targetRole,
        skills
      });
      setSaveStatus(true);
      addNotification('Twin Profile Updated', 'All preferences and career details saved.', 'success');
      setTimeout(() => setSaveStatus(false), 2500);
    } catch (err) {
      addNotification('Error Saving', 'Failed to lock preferences.', 'warning');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          uploadAvatar(reader.result);
          addNotification('Avatar Uploaded', 'New profile picture generated.', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeLoading(true);
      try {
        await uploadResume(file);
        addNotification('Resume Synchronized', `${file.name} successfully parsed and indexed into vector layers.`, 'success');
      } catch (err) {
        addNotification('Sync Failed', 'Could not index resume vectors.', 'warning');
      } finally {
        setResumeLoading(false);
      }
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'JS';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-text-primary mb-2">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your Career Digital Twin configurations, integrations, and resume metadata.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core settings forms */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Profile settings */}
          <div ref={profileSectionRef} className="p-6 rounded-2xl glass-panel flex flex-col gap-5 scroll-mt-24">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2 border-b border-white/5 pb-3">
              <UserIcon className="w-4.5 h-4.5 text-brand-pink" />
              Candidate Profile Information
            </h3>

            {/* Profile Avatar editor */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-white/2 rounded-xl border border-white/5">
              <div className="relative">
                {profile.profilePicUrl ? (
                  <img 
                    src={profile.profilePicUrl} 
                    alt="avatar" 
                    className="w-20 h-20 rounded-2xl object-cover border border-white/10" 
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-wine to-brand-pink flex items-center justify-center font-display font-bold text-2xl text-text-primary shadow">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-text-primary">Profile Picture</span>
                <p className="text-[10px] text-text-secondary">PNG, JPG, or WEBP up to 2MB. Stored locally.</p>
                <div className="flex gap-2 mt-1">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/8 text-[10px] font-semibold text-text-primary border border-white/5 rounded-lg transition-all cursor-pointer"
                  >
                    Upload Photo
                  </button>
                  {profile.profilePicUrl && (
                    <button 
                      onClick={() => {
                        removeAvatar();
                        addNotification('Avatar Removed', 'Profile picture reset to initials.', 'info');
                      }}
                      className="px-3 py-1.5 bg-brand-wine/10 hover:bg-brand-wine/25 text-[10px] font-semibold text-brand-pink border border-brand-rose/20 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* General Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold">FULL NAME</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold">TARGET POSITION ROLE</label>
                <input 
                  type="text" 
                  value={targetRole} 
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none transition-all"
                  placeholder="e.g. AI Engineer"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold">PROFESSIONAL BIO</label>
                <textarea 
                  rows={3}
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none resize-none transition-all"
                  placeholder="Summary of experience..."
                />
              </div>
            </div>

            {/* Social Integrations Links */}
            <div className="flex flex-col gap-3.5 mt-2">
              <span className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold uppercase">Digital Presence Linkages</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'LINKEDIN', val: linkedinUrl, set: setLinkedinUrl, placeholder: 'https://linkedin.com/in/username' },
                  { label: 'GITHUB', val: githubUrl, set: setGithubUrl, placeholder: 'https://github.com/username' },
                  { label: 'PORTFOLIO', val: portfolioUrl, set: setPortfolioUrl, placeholder: 'https://portfolio.dev' },
                ].map((social) => (
                  <div key={social.label} className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-text-secondary/50 font-mono tracking-wider font-bold">{social.label}</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-text-secondary/50">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </span>
                      <input 
                        type="url" 
                        value={social.val} 
                        onChange={(e) => social.set(e.target.value)}
                        placeholder={social.placeholder}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-[11px] text-text-primary font-sans focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Tag Management */}
            <div className="flex flex-col gap-3 mt-2">
              <span className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold uppercase">Skills Profile Tags</span>
              
              {/* Active list */}
              <div className="flex flex-wrap gap-2 p-3 bg-white/2 rounded-xl border border-white/3 min-h-[48px]">
                {skills.map((skill) => (
                  <span 
                    key={skill}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full bg-brand-wine/25 border border-brand-rose/25 text-brand-pink"
                  >
                    {skill}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-brand-pink hover:text-brand-pink/70 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add form */}
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input 
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Enter a new skill tag (e.g. FastAPI)"
                  className="flex-1 px-4 py-2 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-text-primary border border-white/5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Tag
                </button>
              </form>
            </div>
          </div>

          {/* AI API Config */}
          <div className="p-6 rounded-2xl glass-panel flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2 border-b border-white/5 pb-3">
              <Cpu className="w-4.5 h-4.5 text-brand-pink" />
              API & LLM Engine Settings
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold">FASTAPI BACKEND ENDPOINT</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-text-secondary/70">
                    <LinkIcon className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={apiEndpoint} 
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold">LLM INFERENCE MODEL (OPENROUTER)</label>
                <input 
                  type="text" 
                  value={modelSelection} 
                  onChange={(e) => setModelSelection(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save trigger button */}
          <button
            onClick={handleSaveProfile}
            disabled={saveLoading}
            className="px-6 py-3 bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink hover:from-brand-rose hover:to-brand-pink text-text-primary text-sm font-semibold rounded-xl transition-all duration-300 shadow flex items-center justify-center gap-2 self-end cursor-pointer disabled:opacity-40"
          >
            {saveLoading ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : saveStatus ? (
              <>
                <UserCheck className="w-4 h-4" />
                Settings Locked & Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Twin Preferences
              </>
            )}
          </button>
        </div>

        {/* Resume upload widget */}
        <div ref={resumeSectionRef} className="flex flex-col gap-6 scroll-mt-24">
          <div className="p-6 rounded-2xl glass-panel flex flex-col gap-4 text-center items-center">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2 self-start border-b border-white/5 pb-3 w-full">
              <Upload className="w-4.5 h-4.5 text-brand-pink" />
              Resume Synchronization
            </h3>
            
            {/* Upload drag drop panel */}
            <input 
              type="file" 
              ref={resumeInputRef} 
              onChange={handleResumeChange} 
              accept=".pdf" 
              className="hidden" 
            />
            <div 
              onClick={() => resumeInputRef.current?.click()}
              className="w-full h-44 rounded-xl border border-dashed border-white/10 hover:border-brand-rose/35 bg-white/1 flex flex-col items-center justify-center p-4 hover:bg-white/2 transition-all duration-300 cursor-pointer"
            >
              {resumeLoading ? (
                <div className="w-8 h-8 border-2 border-t-transparent border-brand-pink rounded-full animate-spin mb-3" />
              ) : (
                <Upload className="w-8 h-8 text-text-secondary/40 mb-3" />
              )}
              <span className="text-xs font-semibold text-text-primary">
                {resumeLoading ? 'Parsing document metadata...' : 'Drag resume PDF here'}
              </span>
              <span className="text-[10px] text-text-secondary mt-1">Accepts PDF files up to 10MB</span>
            </div>

            {profile.resumeName ? (
              <div className="w-full p-3 bg-white/2 rounded-xl border border-white/5 flex items-center justify-between text-left">
                <div className="overflow-hidden flex items-center gap-3">
                  <FileText className="w-6 h-6 text-brand-pink flex-shrink-0" />
                  <div className="overflow-hidden">
                    <span className="text-xs font-semibold text-text-primary truncate block">{profile.resumeName}</span>
                    <span className="text-[10px] text-text-secondary font-mono block">{profile.resumeSize} &bull; Synced</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono tracking-widest text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">ACTIVE</span>
                  <button 
                    onClick={() => {
                      removeResume();
                      addNotification('Resume Removed', 'Local vector workspace cleared.', 'info');
                    }}
                    className="p-1 text-text-secondary hover:text-brand-pink hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    title="Remove Resume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full p-4 rounded-xl border border-dashed border-white/5 text-xs text-text-secondary/60">
                No active resume index loaded
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
