# Release Notes - Lost Account Manager v1.0.28

**Release Date:** 26 липня 2025

## 🔐 Major Features - License System Implementation

### Нова система ліцензування з HWID-прив'язкою
- **HWID Binding**: Автоматична прив'язка ліцензій до апаратного ідентифікатора
- **GitHub Integration**: Повна інтеграція з GitHub для зберігання та управління ліцензіями
- **Automatic Updates**: Автоматичне оновлення ліцензійного файлу через GitHub API
- **Secure Validation**: Безпечна валідація ліцензій з fallback механізмами

### Компоненти системи ліцензування
- `license_manager.js` - Основний модуль керування ліцензіями
- `github_license_updater.js` - GitHub API інтеграція
- `license.html` - Інтерфейс активації та управління ліцензіями
- Environment configuration через `.env` файл

## 🔧 Technical Improvements

### GitHub API Integration
- Автоматичне завантаження ліцензій з GitHub raw URLs
- Real-time оновлення ліцензійного статусу
- Secure token-based authentication
- Comprehensive error handling з fallback на локальні файли

### Security Enhancements
- HWID generation using crypto module
- Environment variable configuration for sensitive data
- License expiry validation
- Status-based access control (active/inactive/expired)

### User Interface
- Новий інтерфейс для активації ліцензій
- Відображення поточного HWID
- Real-time статус ліцензії
- Опції деактивації та управління

## 📋 Configuration

### Environment Variables Required
```properties
GITHUB_TOKEN=your_github_personal_access_token
GH_TOKEN=your_github_personal_access_token  # Backup variable
```

### Supported License Types
- **DEMO**: Демонстраційна ліцензія з обмеженим терміном дії
- **PREMIUM**: Повнофункціональна ліцензія
- **TRIAL**: Пробна ліцензія

## 🔄 System Flow
1. User enters license key in activation interface
2. System generates unique HWID for device
3. License validation against GitHub-hosted JSON
4. Automatic binding of license to HWID via GitHub API
5. Real-time license status updates

## 📦 Dependencies Added
- `dotenv: ^17.2.1` - Environment variables management
- Enhanced GitHub API integration

## 🐛 Bug Fixes
- Improved error handling for network connectivity issues
- Fixed license validation edge cases
- Enhanced security for token storage

## 📖 Documentation
- Comprehensive administrator guide
- User activation instructions
- Technical implementation details
- GitHub setup procedures

## ⚙️ Installation & Usage
1. Clone/download the latest release
2. Configure `.env` file with GitHub token
3. Run `npm install` to install dependencies
4. Launch application with `npm start`
5. Access license management through the application menu

## 🔮 Future Enhancements
- Multi-license support per user
- License transfer capabilities
- Advanced analytics and reporting
- License marketplace integration

---

**Administrator Actions Required:**
- Set up GitHub Personal Access Token
- Configure license database on GitHub
- Review and approve license requests manually

**For Users:**
- Contact administrator for license key
- Use activation interface in application
- Keep application updated for latest security features

---

**Full Changelog**: https://github.com/D1noDen/lost/compare/v1.0.27...v1.0.28
