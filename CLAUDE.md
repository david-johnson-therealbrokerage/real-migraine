# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a migraine tracking web application being developed in phases:
- **MVP Phase 1**: Local storage-based version (current focus)
- **Phase 2**: Firebase integration (auth, Firestore, hosting)
- **Phase 3**: Advanced analytics and features

## Technology Stack

- **Frontend**: React
- **Build Tool**: Parcel
- **Storage**: Local Storage (MVP), Firestore (Phase 2+)
- **Authentication**: Local PIN/password (MVP), Firebase Auth (Phase 2+)
- **Hosting**: Local development (MVP), Firebase Hosting (Phase 2+)

## Development Commands

Since the project hasn't been initialized yet, here are the commands that will be used once npm is set up:

```bash
# Initialize project
npm init -y

# Install dependencies
npm install react react-dom
npm install --save-dev parcel

# Development server (after setup)
npm start

# Build for production
npm run build
```

## Project Structure (Planned)

```
/src
  /components     # React components
  /services       # Data services (localStorage, later Firebase)
  /pages          # Route-based page components
  /styles         # Global styles and CSS
  /utils          # Helper functions
  App.js          # Main application component
  index.js        # Entry point
/public
  index.html      # HTML template
```

## Key Development Files

- `prd-migraine.md` - Product requirements document with detailed feature specifications
- `checklist.md` - Development checklist broken into MVP phases
- `user-prompts.md` - Log of user requests for this project

## Data Models

### Migraine Entry (MVP)
```javascript
{
  id: string,
  startDateTime: Date,
  endDateTime: Date,
  duration: number,
  intensity: number (1-10),
  location: string,
  symptoms: string[],
  triggers: string[],
  notes: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Local Storage Structure
- `migraine_entries`: Array of migraine entries
- `user_preferences`: User settings (theme, etc.)
- `auth_credentials`: Hashed PIN/password

## Development Guidelines

1. **MVP Focus**: Currently building Phase 1 with local storage only
2. **Mobile-First**: Ensure all features work well on mobile devices
3. **Dark Mode**: Essential feature for migraine sufferers
4. **Data Persistence**: Implement versioning for local storage schema
5. **Security**: Hash credentials even for local storage

## Testing Approach

For MVP, focus on manual testing of:
- Data persistence across browser sessions
- Form validation
- Responsive design on various screen sizes
- Local storage limits and handling

## Important Notes

- The project is already in a Git repository
- No npm project has been initialized yet
- Start with the MVP checklist items in `checklist.md`
- Log all user prompts to `user-prompts.md`