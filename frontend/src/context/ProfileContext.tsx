import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

export interface UserProfileData {
  name: string;
  email: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  bio: string;
  targetRole: string;
  skills: string[];
  resumeName: string;
  resumeSize: string;
  profilePicUrl: string;
}

interface ProfileContextType {
  profile: UserProfileData;
  completionPercentage: number;
  updateProfile: (data: Partial<UserProfileData>) => Promise<boolean>;
  uploadResume: (file: File) => Promise<boolean>;
  removeResume: () => void;
  uploadAvatar: (dataUrl: string) => void;
  removeAvatar: () => void;
  resetToDefaults: () => void;
}

const DEFAULT_JAYA_PROFILE: UserProfileData = {
  name: 'Jaya Shree Lakshmi S',
  email: 'shreejayalakshmis@gmail.com',
  linkedinUrl: 'https://linkedin.com/in/jaya-shree-lakshmi',
  githubUrl: 'https://github.com/shreejayalakshmis',
  portfolioUrl: 'https://jayashree.dev',
  bio: 'B.Tech in Artificial Intelligence & Machine Learning Student at Sri Shakthi Institute of Engineering and Technology. Experienced builder of autonomous LLM pipelines and task agents.',
  targetRole: '',
  skills: [],
  resumeName: 'j_resume.pdf',
  resumeSize: '103.8 KB',
  profilePicUrl: '',
};

const CLEAN_DEFAULT_PROFILE: UserProfileData = {
  name: '',
  email: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  bio: '',
  targetRole: '',
  skills: [],
  resumeName: '',
  resumeSize: '',
  profilePicUrl: '',
};


const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData>(CLEAN_DEFAULT_PROFILE);

  // Load profile from user-scoped localStorage key when user changes
  useEffect(() => {
    if (!user) {
      setProfile(CLEAN_DEFAULT_PROFILE);
      return;
    }
    const userKey = `kairon_profile_${user.email}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      setProfile(JSON.parse(saved));
    } else {
      // Seed default if it is Jaya's email, otherwise create clean profile with user info
      const isDefaultJaya = user.email.toLowerCase() === 'shreejayalakshmis@gmail.com';
      const initial: UserProfileData = isDefaultJaya
        ? { ...DEFAULT_JAYA_PROFILE }
        : {
            ...CLEAN_DEFAULT_PROFILE,
            name: user.name || '',
            email: user.email,
            profilePicUrl: user.avatar || '',
            resumeName: user.resume || ''
          };
      
      setProfile(initial);
      localStorage.setItem(userKey, JSON.stringify(initial));
    }
  }, [user]);

  // Calculate dynamic completion percentage
  const calculateCompletion = (p: UserProfileData): number => {
    let score = 0;
    if (p.name?.trim()) score += 10;
    if (p.email?.trim()) score += 10;
    if (p.bio?.trim() && p.bio.length > 15) score += 15;
    if (p.targetRole?.trim()) score += 10;
    if (p.linkedinUrl?.trim().startsWith('http')) score += 10;
    if (p.githubUrl?.trim().startsWith('http')) score += 10;
    if (p.portfolioUrl?.trim().startsWith('http')) score += 10;
    if (p.skills?.length >= 3) score += 10;
    if (p.resumeName) score += 10;
    if (p.profilePicUrl) score += 5;
    return score;
  };

  const updateProfile = async (data: Partial<UserProfileData>): Promise<boolean> => {
    if (!user) return false;
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save latency

    // Sync profile skills to backend Neo4j graph concurrently
    if (data.skills) {
      try {
        await apiService.syncProfile({ skills: data.skills, projects: [] }, user.email);
      } catch (e) {
        console.warn("Failed to sync profile skills to backend Neo4j graph.", e);
      }
    }

    setProfile(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem(`kairon_profile_${user.email}`, JSON.stringify(updated));
      return updated;
    });

    // Propagate name and email changes back to AuthContext OUTSIDE the setProfile callback
    // to avoid calling setState on another component during the render phase.
    const authUpdates: any = {};
    if (data.name !== undefined) authUpdates.name = data.name;
    if (data.email !== undefined) authUpdates.email = data.email;
    if (Object.keys(authUpdates).length > 0) {
      updateUser(authUpdates);
    }

    return true;
  };

  const uploadResume = async (file: File): Promise<boolean> => {
    if (!user) return false;
    
    // Upload the file to backend resume endpoint
    const formData = new FormData();
    formData.append('file', file);
    let extracted: any = null;
    try {
      const res = await apiService.uploadResume(formData, user.email);
      if (res && res.extracted_data) {
        extracted = res.extracted_data;
      }
    } catch (e) {
      console.warn("Failed to upload resume to backend, falling back to local metadata updates.", e);
    }

    const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    setProfile(prev => {
      const updated = {
        ...prev,
        resumeName: file.name,
        resumeSize: sizeStr,
        ...(extracted ? {
          name: extracted.name || prev.name,
          bio: extracted.bio || prev.bio,
          targetRole: extracted.inferred_role || prev.targetRole,
          skills: extracted.skills || prev.skills,
        } : {})
      };
      localStorage.setItem(`kairon_profile_${user.email}`, JSON.stringify(updated));
      return updated;
    });

    // Call updateUser OUTSIDE the setProfile callback to avoid setState-during-render warning
    updateUser({ 
      resume: file.name,
      ...(extracted ? { name: extracted.name || user.name } : {})
    });

    return true;
  };


  const removeResume = () => {
    if (!user) return;
    setProfile(prev => {
      const updated = {
        ...prev,
        resumeName: '',
        resumeSize: ''
      };
      localStorage.setItem(`kairon_profile_${user.email}`, JSON.stringify(updated));
      updateUser({ resume: '' });
      return updated;
    });
  };

  const uploadAvatar = (dataUrl: string) => {
    if (!user) return;
    setProfile(prev => {
      const updated = {
        ...prev,
        profilePicUrl: dataUrl
      };
      localStorage.setItem(`kairon_profile_${user.email}`, JSON.stringify(updated));
      updateUser({ avatar: dataUrl });
      return updated;
    });
  };

  const removeAvatar = () => {
    if (!user) return;
    setProfile(prev => {
      const updated = {
        ...prev,
        profilePicUrl: ''
      };
      localStorage.setItem(`kairon_profile_${user.email}`, JSON.stringify(updated));
      updateUser({ avatar: '' });
      return updated;
    });
  };

  const resetToDefaults = () => {
    if (!user) return;
    const isDefaultJaya = user.email.toLowerCase() === 'shreejayalakshmis@gmail.com';
    const defaults = isDefaultJaya ? DEFAULT_JAYA_PROFILE : CLEAN_DEFAULT_PROFILE;
    setProfile(defaults);
    localStorage.setItem(`kairon_profile_${user.email}`, JSON.stringify(defaults));
    updateUser({
      name: defaults.name,
      email: defaults.email,
      avatar: defaults.profilePicUrl,
      resume: defaults.resumeName
    });
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      completionPercentage: calculateCompletion(profile),
      updateProfile,
      uploadResume,
      removeResume,
      uploadAvatar,
      removeAvatar,
      resetToDefaults
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
