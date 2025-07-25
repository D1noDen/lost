# Release Instructions v1.0.28 - Lost Account Manager

## 📋 Pre-Release Checklist

### 1. Version Update ✅
- [x] Updated version in `package.json` to 1.0.28
- [x] Created release notes: `RELEASE_NOTES_v1.0.28.md`

### 2. License System Verification
- [x] License manager functionality tested
- [x] GitHub API integration working
- [x] HWID binding operational
- [x] Environment variables configured

### 3. Build Preparation
```powershell
# Install dependencies
npm install

# Test application locally
npm start

# Build application
npm run build
```

## 🚀 Release Process

### Step 1: Final Testing
```powershell
# Test license activation
# Verify GitHub integration
# Check HWID generation
# Validate error handling
```

### Step 2: Create GitHub Release
```powershell
# Build distribution
npm run dist

# The following files will be generated in /dist:
# - Lost Account Manager Setup 1.0.28.exe
# - latest.yml (for auto-updater)
```

### Step 3: Upload to GitHub
1. Go to: https://github.com/D1noDen/lost/releases
2. Click "Create a new release"
3. Tag version: `v1.0.28`
4. Release title: `Lost Account Manager v1.0.28 - License System Implementation`
5. Copy content from `RELEASE_NOTES_v1.0.28.md`
6. Upload files:
   - `Lost Account Manager Setup 1.0.28.exe`
   - `latest.yml`

### Step 4: Auto-Updater Configuration
The auto-updater is already configured in `package.json`:
```json
"publish": {
  "provider": "github",
  "owner": "D1noDen", 
  "repo": "lost",
  "releaseType": "release",
  "publishAutoUpdate": true
}
```

## 🔧 Build Commands

### Development Build
```powershell
npm run build
```

### Production Release with Auto-Publish
```powershell
npm run release
```

### Manual Distribution
```powershell
npm run dist
```

## 📋 Release Artifacts

### Primary Files
- `Lost Account Manager Setup 1.0.28.exe` - Main installer
- `latest.yml` - Auto-updater metadata
- `blockmap` files - Differential update support

### Size Estimates
- Installer: ~150-200 MB
- Unpacked: ~400-500 MB

## 🔐 Security Notes

### GitHub Token Requirements
- Personal Access Token with repo access
- Token stored in `.env` file (not committed)
- Token used for license management API calls

### License System Security
- HWID-based device binding
- GitHub-hosted license validation
- Encrypted local storage fallback

## 📱 Distribution Channels

### Primary Release
- GitHub Releases (main distribution)
- Auto-updater notifications

### Manual Installation
- Direct download from GitHub
- Local installation via setup file

## 🧪 Testing Checklist

### Core Functionality
- [ ] Application starts successfully
- [ ] All main features working
- [ ] Steam integration operational
- [ ] Trading functionality active

### License System
- [ ] License activation interface
- [ ] HWID generation and display
- [ ] GitHub API connectivity
- [ ] Error handling and fallbacks

### Auto-Updater
- [ ] Update checking functionality
- [ ] Download and installation process
- [ ] Rollback capabilities

## 📊 Post-Release Actions

### Monitoring
- Check GitHub release statistics
- Monitor auto-updater usage
- Review license activation rates

### User Support
- Monitor issues and bug reports
- Provide license activation support
- Document common problems

### Analytics
- Track adoption rates
- Monitor GitHub API usage
- License system performance metrics

---

## 🚨 Emergency Procedures

### Rollback Process
If critical issues are discovered:
1. Create hotfix branch
2. Revert problematic changes
3. Release patch version (v1.0.29)
4. Notify users via auto-updater

### License System Issues
- Fallback to local license validation
- Manual license binding via GitHub
- Emergency license distribution

---

**Note**: This release introduces a completely new license management system. Monitor closely for the first 48-72 hours after release.
