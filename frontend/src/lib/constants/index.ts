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
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001',
  endpoints: {
    auth: {
      register: '/api/auth/register/',
      login: '/api/auth/login/',
      logout: '/api/auth/logout/',
      profile: '/api/auth/profile/',
    },
    organizations: '/api/organizations/',
    projects: '/api/projects/',
    environments: '/api/environments/',
    variables: '/api/variables/',
    auditLogs: '/api/audit-logs/',
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
