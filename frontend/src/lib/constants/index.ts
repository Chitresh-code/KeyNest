export const APP_CONFIG = {
  name: 'KeyNest',
  description: 'Secure environment variable management for teams',
  version: '1.0.0',
  author: 'Chitresh Gyanani',
  repository: 'https://github.com/Chitresh-code/KeyNest',
  socials: {
    website: 'https://chitresh.in',
    email: 'gychitresh1290@gmail.com',
    github: 'https://github.com/Chitresh-code',
    linkedin: 'https://linkedin.com/in/chitresh-gyanani',
    twitter: 'https://twitter.com/chitreshgyanani',
    leetcode: 'https://leetcode.com/chitresh_g',
    telegram: 'https://t.me/gyanani21',
  },
} as const;

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  endpoints: {
    auth: {
      register: '/api/auth/register/',
      login: '/api/auth/login/',
      logout: '/api/auth/logout/',
      profile: '/api/auth/profile/',
      refresh: '/api/auth/token/refresh/',
      activate: '/api/auth/activate/',
      passwordReset: '/api/auth/password-reset/',
      passwordResetConfirm: '/api/auth/password-reset-confirm/',
      changePassword: '/api/auth/change-password/',
      oauth: {
        google: '/api/auth/oauth/google/',
        github: '/api/auth/oauth/github/',
      },
      config: '/api/auth/config/',
      status: '/api/auth/status/',
      invitations: {
        accept: '/api/auth/invitations/accept/',
      },
    },
    core: {
      organizations: '/api/core/organizations/',
      projects: '/api/core/projects/',
      environments: '/api/core/environments/',
      variables: '/api/core/variables/',
      auditLogs: '/api/core/audit-logs/',
    },
  },
} as const;

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  projects: '/projects',
  environments: '/environments',
  settings: '/settings',
} as const;
