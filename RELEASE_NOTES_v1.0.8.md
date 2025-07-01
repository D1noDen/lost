# Release Notes v1.0.8

## 🚀 Lost Account Manager v1.0.8

### ✨ New Features
- **Auto-linking .maFile files** with accounts during import process
- **Auto-connection button** for manual maFile linking
- **Fuzzy matching algorithm** for intelligent file name matching (50%+ similarity threshold)
- **Enhanced import feedback** showing linking results

### 🐛 Bug Fixes
- **Fixed modal windows** for password change and import/export functionality
- **Fixed history tab** - now properly displays trading history
- **Fixed CSS styling issues** - removed extra closing brackets
- **Fixed UI responsiveness** for modal dialogs

### 🔧 Improvements
- **Automatic maFile linking** after importing accounts or maFiles
- **Better user feedback** with detailed linking operation results
- **Improved UI consistency** across all modal windows
- **Enhanced error handling** for import/export operations

### 📋 Technical Details
- Fuzzy matching algorithm considers:
  - Exact matches (100% similarity)
  - Substring matches (80% similarity)  
  - Character-by-character matching (up to 60% similarity)
- Minimum 50% similarity threshold for automatic linking
- Automatic reload after successful linking operations

### 🎯 How to Use New Features
1. **Import Accounts**: Use "Import/Export" → "Import Accounts" - maFiles will auto-link
2. **Import maFiles**: Use "Import/Export" → "Import maFiles" - will auto-link to existing accounts
3. **Manual Linking**: Use new "Auto-connection" button to manually trigger linking process

### 📦 Installation
Download `Lost Account Manager Setup 1.0.8.exe` and run the installer.

### 🔄 Auto-Updates
Existing users will receive automatic update notification.

**IMPORTANT**: For auto-updates to work, the following files must be uploaded to the GitHub release:
- `Lost Account Manager Setup 1.0.8.exe` (main installer)
- `Lost Account Manager Setup 1.0.8.exe.blockmap` (for delta updates)
- `latest.yml` (update metadata)

---
**File Size**: ~86 MB  
**Platform**: Windows x64  
**Requirements**: Windows 10/11

### 📋 Files to Upload to GitHub Release:
1. `Lost Account Manager Setup 1.0.8.exe`
2. `Lost Account Manager Setup 1.0.8.exe.blockmap`  
3. `latest.yml`
