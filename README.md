# LOST - Steam Accounts Manager

![Build Status](https://github.com/D1noDen/lost/workflows/Build%20Test/badge.svg)
![Release](https://github.com/D1noDen/lost/workflows/Build%20and%20Release/badge.svg)

Modern Electron-based application for managing Steam accounts with auto-updates and secure file handling.

## ✨ Features

- 🔐 **Secure Account Management** - Store and manage multiple Steam accounts
- 🛡️ **2FA Support** - Integration with Steam Mobile Authenticator files (.maFile)
- 📊 **Statistics & Analytics** - Track account performance and farming progress
- 🔄 **Auto-Updates** - Automatic application updates via GitHub releases
- 💰 **Financial Tracking** - Monitor profits and account values
- 🎮 **Trade Management** - Handle Steam trading operations
- 🌟 **User-Friendly Interface** - Modern and intuitive design

## 🚀 Installation

### Download Latest Release

1. Go to [Releases](https://github.com/D1noDen/lost/releases)
2. Download the latest `Lost Account Manager Setup.exe`
3. Run the installer and follow the setup wizard

### Auto-Updates

The application includes built-in auto-update functionality:
- Automatically checks for updates on startup
- Downloads and installs updates in the background
- Prompts user before applying updates

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/D1noDen/lost.git
cd lost

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Create distributable
npm run dist
```

### Project Structure

```
lost/
├── main.js              # Main Electron process
├── renderer.js          # Renderer process logic
├── index.html           # Login page
├── main.html            # Main application interface
├── package.json         # Project configuration
├── maFiles/             # Steam authenticator files (gitignored)
├── accounts.json        # Account data (gitignored)
└── dist/                # Build output
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Development settings
NODE_ENV=development
DEBUG=true
```

### Account Data

Account data is stored in:
- **Development**: `./accounts.json`
- **Production**: `%APPDATA%/lost/accounts.json`

### Steam Authenticator Files

.maFile files are stored in:
- **Development**: `./maFiles/`
- **Production**: `%APPDATA%/lost/maFiles/`

## 📋 Features Overview

### Account Management
- Add, edit, and delete Steam accounts
- Secure password storage
- Account status tracking
- Star/favorite accounts

### 2FA Integration
- Import .maFile Steam Mobile Authenticator files
- Generate 2FA codes
- Automatic code copying

### Trading System
- Trade offer management
- Trade history tracking
- Profit calculations

### Statistics
- Account performance metrics
- Farming progress tracking
- Financial analytics

## 🔐 Security

- Account data is stored locally
- .maFile files are handled securely
- No data is transmitted to external servers
- Authentication files are excluded from version control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Release Process

### Creating a Release

1. Update version in `package.json`
2. Commit changes
3. Create and push a tag:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
4. GitHub Actions will automatically build and create a release

### Manual Release

```bash
# Build and publish to GitHub releases
npm run publish
```

## 🐛 Troubleshooting

### Common Issues

**Update Check Fails**
- Ensure internet connection
- Check GitHub repository access

**MaFile Import Issues**
- Verify file format and permissions
- Check file path accessibility

**Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Update dependencies: `npm update`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Den** - [@D1noDen](https://github.com/D1noDen)

## 🙏 Acknowledgments

- Electron team for the amazing framework
- Steam community for tools and APIs
- All contributors and users

---

⭐ **If you find this project useful, please give it a star!** ⭐
