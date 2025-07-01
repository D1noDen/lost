# Release Notes v1.0.9

## 🚀 Lost Account Manager v1.0.9

### 🐛 Critical Bug Fix
- **Fixed "An object could not be cloned" error** in auto-updater system
- **Resolved IPC communication issues** that prevented update checking
- **Enhanced error handling** for better stability

### 🔧 Technical Improvements
- **Serialized complex objects** before sending via IPC to prevent cloning errors
- **Improved update progress tracking** with safer object handling
- **Better error message processing** for auto-updater events
- **Enhanced stability** of the update checking process

### 📋 What Was Fixed
The previous version had an issue where the auto-updater would fail with:
```
Error: An object could not be cloned
```

This happened because complex objects from `autoUpdater.checkForUpdates()` couldn't be properly serialized for IPC communication.

### ✅ Solution
- Modified IPC handlers to return only serializable data
- Added safe object extraction for update information
- Improved error handling with proper serialization
- Enhanced progress event processing

### 🎯 All Previous Features Included
- ✅ Auto-linking .maFile files with accounts during import
- ✅ Auto-connection button for manual maFile linking  
- ✅ Fuzzy matching algorithm (50%+ similarity threshold)
- ✅ Fixed modal windows for password change and import/export
- ✅ Fixed history tab functionality
- ✅ Enhanced import feedback and error handling

### 📦 Installation
Download `Lost Account Manager Setup 1.0.9.exe` and run the installer.

### 🔄 Auto-Updates
This version fixes the auto-update system! Existing users should now receive proper update notifications.

**IMPORTANT**: For auto-updates to work, upload these files to GitHub release:
- `Lost Account Manager Setup 1.0.9.exe`
- `Lost Account Manager Setup 1.0.9.exe.blockmap`
- `latest.yml`

---
**File Size**: ~86 MB  
**Platform**: Windows x64  
**Requirements**: Windows 10/11

### 🎯 Priority Fix
This is a critical stability update that fixes auto-updater crashes. Recommended for all users.
