import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure client interceptor to attach User Id for data isolation on all endpoints
client.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem('kairon_user') || sessionStorage.getItem('kairon_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.email) {
          config.headers['X-User-Id'] = user.email;
        }
      } catch (e) {
        console.error('Error parsing saved user for auth header.', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiService = {
  getProfileSummary: (profileData?: any): string => {
    if (profileData) {
      return `
Candidate Name: ${profileData.name || 'Candidate'}
Target Role: ${profileData.targetRole || ''}
Professional Bio: ${profileData.bio || ''}
Skills Profile: ${profileData.skills ? profileData.skills.join(', ') : ''}
Active Resume: ${profileData.resumeName || 'None'}
`.trim();
    }

    const savedUser = localStorage.getItem('kairon_user') || sessionStorage.getItem('kairon_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const savedProfile = localStorage.getItem(`kairon_profile_${user.email}`);
        if (savedProfile) {
          const p = JSON.parse(savedProfile);
          return `
Candidate Name: ${p.name}
Target Role: ${p.targetRole}
Professional Bio: ${p.bio}
Skills Profile: ${p.skills.join(', ')}
Active Resume: ${p.resumeName}
`.trim();
        }
      } catch (e) {
        console.error('Error constructing profile summary from active context.', e);
      }
    }
    
    return '';
  },

  getDashboard: async () => {
    const response = await client.get('/dashboard');
    return response.data;
  },

  getGraph: async () => {
    const response = await client.get('/graph');
    return response.data;
  },

  askAssistant: async (question: string) => {
    const response = await client.post('/chat', { question });
    return response.data;
  },

  analyzeSkillGap: async (profile: string, targetRole: string) => {
    const payload = { profile, target_role: targetRole };
    console.log("[API REQUEST] POST /skill-gap payload:", payload);
    try {
      const response = await client.post('/skill-gap', payload);
      console.log("[API RESPONSE] POST /skill-gap data:", response.data);
      return response.data;
    } catch (error: any) {
      // Extract backend error message from axios error response body
      const backendMsg = error?.response?.data?.error || error?.response?.data?.detail;
      console.error("[API ERROR] POST /skill-gap error:", backendMsg || error?.message, error);
      if (backendMsg) {
        throw new Error(backendMsg);
      }
      throw error;
    }
  },

  getInterviewQuestions: async (profile: string) => {
    const payload = { profile };
    console.log("[API REQUEST] POST /interview payload:", payload);
    try {
      const response = await client.post('/interview', payload);
      console.log("[API RESPONSE] POST /interview data:", response.data);
      return response.data;
    } catch (error) {
      console.error("[API ERROR] POST /interview error:", error);
      throw error;
    }
  },

  generateRoadmap: async (role: string, days: number) => {
    const payload = { role, days };
    console.log("[API REQUEST] POST /generate-roadmap payload:", payload);
    try {
      const response = await client.post('/generate-roadmap', payload);
      console.log("[API RESPONSE] POST /generate-roadmap data:", response.data);
      return response.data;
    } catch (error) {
      console.error("[API ERROR] POST /generate-roadmap error:", error);
      throw error;
    }
  },

  uploadResume: async (formData: FormData, email: string) => {
    const response = await client.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-User-Id': email,
      },
    });
    return response.data;
  },

  syncProfile: async (data: { skills: string[]; projects: string[] }, email: string) => {
    const response = await client.post('/sync-profile', data, {
      headers: {
        'X-User-Id': email,
      },
    });
    return response.data;
  },
};
