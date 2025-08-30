# KeyNest Frontend

This is the frontend application for KeyNest, built with Next.js 14, TypeScript, and Tailwind CSS.

## 🛠 Technology Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **TanStack Query** for server state management
- **Zustand** for client state management
- **React Hook Form** with Zod validation
- **Framer Motion** for animations
- **Sonner** for toast notifications

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   │   ├── login/         # Sign in page
│   │   └── register/      # Sign up page
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── dashboard/     # Main dashboard
│   │   └── projects/      # Projects management
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── common/           # Shared components
│   ├── environments/     # Environment management
│   ├── landing/          # Landing page sections
│   ├── projects/         # Project management
│   ├── ui/               # UI component library
│   └── variables/        # Variable management
├── lib/                  # Utilities and configurations
│   ├── api/              # API client and hooks
│   ├── constants/        # App constants
│   ├── stores/           # Zustand stores
│   └── utils.ts          # Utility functions
└── types/                # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **npm** or **yarn** or **pnpm**

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and set:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

### Development
```bash
# Start development server
npm run dev

# Start development server on different port
npm run dev -- -p 3001
```

### Building
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Run Prettier
npm run format

# Run TypeScript type checking
npm run type-check
```

## 🎨 UI Components

The application uses a custom component library built on top of Radix UI primitives and styled with Tailwind CSS.

### Component Categories

- **Layout**: Headers, navigation, containers
- **Forms**: Inputs, selects, textareas, validation
- **Feedback**: Alerts, toasts, loading states
- **Overlays**: Modals, dialogs, dropdowns
- **Data Display**: Tables, cards, badges
- **Navigation**: Breadcrumbs, tabs, pagination

## 🔌 API Integration

### API Client Configuration

The frontend uses a centralized API client built with Axios:

```typescript
// lib/api/client.ts
import axios from 'axios'
import { API_CONFIG } from '@/lib/constants'

export const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### React Query Hooks

API interactions are handled through custom React Query hooks:

```typescript
// Example usage
import { useProjects } from '@/lib/api/projects'

function ProjectsList() {
  const { data, isLoading, error } = useProjects()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading projects</div>
  
  return (
    <div>
      {data?.results.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  )
}
```

### Available API Hooks

- **Authentication**: `useLogin`, `useRegister`, `useLogout`, `useProfile`
- **Organizations**: `useOrganizations`, `useCreateOrganization`
- **Projects**: `useProjects`, `useProject`, `useCreateProject`
- **Environments**: `useEnvironments`, `useEnvironment`, `useCreateEnvironment`
- **Variables**: `useEnvironmentVariables`, `useCreateVariable`

## 🎛 State Management

### Server State (TanStack Query)

Used for server data caching, synchronization, and mutation:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'

// Query for server data
const { data, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: () => api.get('/projects/')
})

// Mutation for server updates
const createProject = useMutation({
  mutationFn: (data) => api.post('/projects/', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['projects'])
  }
})
```

### Client State (Zustand)

Used for authentication and UI state:

```typescript
// stores/auth.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
}))
```

## 🔒 Authentication

The frontend implements JWT-based authentication with automatic token refresh:

### Authentication Flow

1. **User login** → Store JWT token in Zustand
2. **API requests** → Automatically include Authorization header
3. **Token expiration** → Redirect to login page
4. **Protected routes** → Check authentication status

## 🚀 Deployment

### Build Configuration

```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze
```

### Environment Variables

Production environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.keynest.dev
NEXT_PUBLIC_APP_ENV=production
```

### Deployment Options

1. **Vercel** (Recommended for Next.js)
2. **Netlify**
3. **Docker** with `Dockerfile`
4. **Static hosting** with `next export`

## 🔧 Development Guidelines

### Code Style

- **ESLint**: Enforced linting rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking
- **Conventional Commits**: Standardized commit messages

### Component Guidelines

1. **Use TypeScript** for all components
2. **Props interface** for component props
3. **Default exports** for components
4. **Named exports** for utilities
5. **Consistent naming** (PascalCase for components)

## 🐛 Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
```bash
npm run type-check
```

**Styling not working**
```bash
# Restart development server
npm run dev
```

**API calls failing**
```bash
# Check environment variables
cat .env.local

# Verify backend is running
curl http://localhost:8001/health/
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Shadcn/ui Components](https://ui.shadcn.com/docs)

---

**Need help?** Open an issue on [GitHub](https://github.com/keynest/keynest/issues)