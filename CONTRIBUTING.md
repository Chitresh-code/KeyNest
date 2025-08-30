# Contributing to KeyNest

Thank you for your interest in contributing to KeyNest! We welcome contributions from developers of all skill levels. This guide will help you get started.

## 🚀 Quick Start

### Prerequisites

- **Git** for version control
- **Docker & Docker Compose** (recommended)
- **Node.js 18+** and **Python 3.11+** (for local development)
- **PostgreSQL** and **Redis** (if not using Docker)

### Setting up your development environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/your-username/keynest.git
   cd keynest
   ```

2. **Set up the backend**
   ```bash
   cd backend
   docker compose -f docker-compose.dev.yml up -d
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Verify everything works**
   - Backend API: http://localhost:8001
   - Frontend: http://localhost:3000
   - API Health: http://localhost:8001/health/

## 📋 How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug reports** - Help us identify and fix issues
- **💡 Feature requests** - Suggest new functionality
- **📝 Documentation** - Improve guides, examples, and API docs
- **🧪 Tests** - Add or improve test coverage
- **🎨 UI/UX improvements** - Enhance the user experience
- **⚡ Performance optimizations** - Make KeyNest faster
- **🔒 Security enhancements** - Strengthen our security posture

### Before You Start

1. **Check existing issues** to avoid duplicate work
2. **Create an issue** for new features or major changes
3. **Comment on issues** you'd like to work on
4. **Ask questions** if anything is unclear

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 2. Make Your Changes

#### Code Style Guidelines

**Backend (Python/Django)**
- Follow **PEP 8** style guidelines
- Use **type hints** where appropriate
- Write **docstrings** for functions and classes
- Keep functions small and focused
- Use **meaningful variable names**

**Frontend (TypeScript/React)**
- Use **TypeScript** for all new code
- Follow **React best practices**
- Use **functional components** with hooks
- Write **accessible HTML**
- Use **semantic CSS classes**

#### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): short description

Longer description if needed

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```bash
feat(auth): add two-factor authentication
fix(api): resolve variable encryption issue
docs(readme): update installation instructions
test(frontend): add component integration tests
```

### 3. Test Your Changes

#### Backend Tests

```bash
cd backend

# Run all tests
python manage.py test

# Run specific app tests
python manage.py test authentication
python manage.py test core

# Run with coverage
coverage run manage.py test
coverage report
```

#### Frontend Tests

```bash
cd frontend

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build to check for issues
npm run build
```

### 4. Submit a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub

3. **Fill out the PR template** with:
   - **Description** of changes
   - **Type of change** (feature, fix, docs, etc.)
   - **Testing performed**
   - **Screenshots** (for UI changes)

## 📝 Pull Request Guidelines

### PR Requirements

- [ ] **Descriptive title** and clear description
- [ ] **Tests pass** for both backend and frontend
- [ ] **No breaking changes** (unless discussed)
- [ ] **Documentation updated** (if needed)
- [ ] **Screenshots included** (for UI changes)
- [ ] **Security considerations** addressed
- [ ] **Performance impact** considered

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** and merge by maintainers

### Common Review Feedback

- **Code organization** - Keep related code together
- **Error handling** - Handle edge cases gracefully
- **Security** - Validate inputs, sanitize outputs
- **Performance** - Avoid unnecessary API calls or re-renders
- **Accessibility** - Ensure UI is accessible to all users
- **Documentation** - Comment complex logic

## 🧪 Testing Guidelines

### Backend Testing

- **Unit tests** for individual functions
- **Integration tests** for API endpoints
- **Authentication tests** for security features
- **Database tests** for data integrity

### Frontend Testing

- **Component tests** for UI components
- **Integration tests** for user flows
- **API integration tests** for backend communication
- **Accessibility tests** for inclusive design

### Test Organization

```bash
# Backend
backend/
├── authentication/tests/
├── core/tests/
└── keynest/tests/

# Frontend (future implementation)
frontend/
├── src/__tests__/
├── src/components/__tests__/
└── src/lib/__tests__/
```

## 🐛 Reporting Bugs

### Before Reporting

1. **Search existing issues** for duplicates
2. **Try the latest version** to see if it's fixed
3. **Check documentation** for expected behavior

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Ubuntu]
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Mockups, examples, or other context.
```

## 📚 Documentation

### Areas Needing Documentation

- **API endpoints** and usage examples
- **Component documentation** with props and usage
- **Deployment guides** for different platforms
- **Security best practices** for users
- **Troubleshooting guides** for common issues

### Documentation Style

- Use **clear, concise language**
- Include **code examples**
- Add **screenshots** for UI features
- Keep content **up-to-date**
- Test all **code examples**

## 🏗 Architecture Overview

### Backend Structure

```
backend/
├── authentication/    # User auth & JWT
├── core/             # Main business logic
│   ├── models.py     # Database models
│   ├── views.py      # API endpoints
│   ├── serializers.py # Data serialization
│   └── permissions.py # Access control
├── keynest/          # Django settings
└── requirements.txt  # Python dependencies
```

### Frontend Structure

```
frontend/
├── src/app/          # Next.js pages
├── src/components/   # React components
├── src/lib/          # Utilities & API
├── src/types/        # TypeScript types
└── package.json      # Node dependencies
```

## 🔒 Security Considerations

### Reporting Security Issues

**Do not** open public issues for security vulnerabilities. Instead:

1. **Email us** at security@keynest.dev
2. **Include details** about the vulnerability
3. **Wait for acknowledgment** before public disclosure

### Security Guidelines

- **Never commit** secrets or API keys
- **Validate all inputs** on both client and server
- **Use parameterized queries** to prevent SQL injection
- **Sanitize outputs** to prevent XSS
- **Follow OWASP** security guidelines

## 🎉 Recognition

Contributors will be:

- **Listed** in our contributors section
- **Credited** in release notes for significant contributions
- **Invited** to join our contributor community
- **Eligible** for contributor swag (coming soon!)

## 📞 Getting Help

### Community Support

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and community chat
- **Documentation** - Comprehensive guides and API reference

### Maintainer Contact

- **General questions** - Open a discussion
- **Security issues** - security@keynest.dev
- **Partnership inquiries** - partners@keynest.dev

## 📜 Code of Conduct

### Our Standards

- **Be respectful** and inclusive
- **Accept constructive criticism** gracefully
- **Focus on what's best** for the community
- **Show empathy** towards other community members

### Unacceptable Behavior

- **Harassment** or discriminatory language
- **Personal attacks** or trolling
- **Public or private harassment**
- **Publishing others' information** without consent

### Enforcement

Project maintainers are responsible for clarifying standards and will take appropriate action in response to unacceptable behavior.

---

Thank you for contributing to KeyNest! Together, we're building a more secure way to manage environment variables. 🚀