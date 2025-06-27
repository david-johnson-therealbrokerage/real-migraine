# Real Migraine Tracker

A privacy-focused web application for tracking migraines, built with React and designed to help users identify patterns and triggers in their migraine occurrences.

## 🌐 Live Application

Visit the app at: [https://real-migraines.web.app/](https://real-migraines.web.app/)

## 📋 Project Overview

Real Migraine Tracker is a progressive web application that allows users to:
- Log detailed migraine episodes including intensity, duration, symptoms, and triggers
- View analytics and patterns to better understand their condition
- Keep all data private with local storage (MVP) or sync across devices with Firebase (future)
- Export data for healthcare providers

### Hackathon Submission Description

**Migraine Tracking and predictions** - The app serves 2 purposes: 
1) Predict when you are going to have a migraine based on barometric pressure, temperature fluctuations, intervals (hormonal), and self-reported wellness factors like sleep, mood, diet. 
2) Provide an easy way to export your data to medical providers for the purpose of making decisions on preventative vs abortive, and treatment adjustments (like demonstrating triptan therapy failure).

### Key Features
- 📱 Mobile-responsive design
- 🌙 Dark mode for light-sensitive users
- 🔒 PIN-based authentication
- 💾 Local data storage (no data leaves your device in MVP)
- 📊 Dashboard with statistics
- 📝 Comprehensive entry logging
- 🔄 Data export capabilities

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/real-migraine.git
cd real-migraine

# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:1234`

### Available Scripts
- `npm start` - Run development server
- `npm run build` - Build for production
- `npm run deploy` - Deploy to Firebase Hosting
- `npm run screenshot:all` - Capture screenshots in multiple modes

## 📚 Documentation

- [Product Requirements Document](./prd-migraine.md) - Detailed feature specifications
- [Development Checklist](./checklist.md) - Track implementation progress
- [Milestones](./docs/milestones.md) - Development milestones and screenshots

## 🛠️ Technology Stack

- **Frontend**: React 19
- **Build Tool**: Parcel
- **Routing**: React Router
- **Storage**: LocalStorage (MVP), Firebase Firestore (planned)
- **Hosting**: Firebase Hosting
- **Authentication**: Local PIN (MVP), Firebase Auth (planned)

## 🔐 Privacy & Security

In the MVP version:
- All data is stored locally on your device
- No data is sent to any servers
- PIN authentication protects your data from other device users
- Export your data anytime in JSON format

## 🗺️ Roadmap

### Phase 1 (MVP) ✅
- Local storage implementation
- Basic authentication
- Core tracking features
- Dashboard analytics

### Phase 2 (Planned)
- Firebase integration
- Cloud sync across devices
- Enhanced authentication
- Real-time data updates

### Phase 3 (Future)
- Advanced analytics
- Weather integration
- Healthcare provider reports
- Machine learning insights

## 🤝 Contributing

This project is currently in active development. Feel free to submit issues or pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.