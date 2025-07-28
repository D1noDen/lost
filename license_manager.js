const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const GitHubLicenseUpdater = require('./github_license_updater.js');
const ConfigManager = require('./config_manager.js');

class LicenseManager {
    constructor() {
        this.configManager = new ConfigManager();
        this.licenseUrl = 'https://raw.githubusercontent.com/D1noDen/lost/main/licenses.json';
        this.userDataPath = app.getPath('userData');
        this.licenseFile = path.join(this.userDataPath, 'license.json');
        this.localLicensesFile = path.join(__dirname, 'licenses.json'); // Backup локальний файл
        this.hwid = this.generateHWID();
        
        // GitHub updater з токеном з ConfigManager
        const token = this.configManager.getGitHubToken();
        this.githubUpdater = new GitHubLicenseUpdater(
            'D1noDen', 
            'lost', 
            token
        );
        
        // Переключили на GitHub режим (якщо токен доступний)
        this.isLocalMode = !token;
        
        // Логування режиму роботи
        console.log(`License Manager mode: ${this.isLocalMode ? 'Local' : 'GitHub'}`);
        console.log(`Token source: ${this.configManager.getTokenSource()}`);
    }

    // Генерація унікального HWID на основі характеристик системи
    generateHWID() {
        const os = require('os');
        const crypto = require('crypto');
        
        // Збираємо системну інформацію
        const hostname = os.hostname();
        const platform = os.platform();
        const arch = os.arch();
        const cpus = os.cpus().map(cpu => cpu.model).join('');
        const totalmem = os.totalmem().toString();
        
        // Створюємо хеш з системної інформації
        const systemInfo = hostname + platform + arch + cpus + totalmem;
        return crypto.createHash('sha256').update(systemInfo).digest('hex');
    }

    // Отримання HWID
    getHWID() {
        return this.hwid;
    }

    // Завантаження ліцензій з GitHub
    async fetchLicensesFromGitHub() {
        try {
            const https = require('https');
            
            return new Promise((resolve, reject) => {
                https.get(this.licenseUrl, (res) => {
                    let data = '';
                    
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        try {
                            // Очищуємо дані від можливих зайвих символів
                            const cleanData = data.trim();
                            
                            // Перевіряємо чи починається з {
                            if (!cleanData.startsWith('{')) {
                                console.log('Raw response:', data);
                                // Fallback на локальний файл
                                console.log('GitHub недоступний, використовуємо локальний файл');
                                return this.fetchLicensesFromLocal().then(resolve).catch(reject);
                            }
                            
                            const licenses = JSON.parse(cleanData);
                            console.log('Ліцензії завантажено з GitHub');
                            resolve(licenses);
                        } catch (error) {
                            console.error('GitHub JSON parse error:', error.message);
                            console.log('Fallback на локальний файл');
                            // Fallback на локальний файл
                            this.fetchLicensesFromLocal().then(resolve).catch(reject);
                        }
                    });
                }).on('error', (error) => {
                    console.error('GitHub connection error:', error.message);
                    console.log('Fallback на локальний файл');
                    // Fallback на локальний файл
                    this.fetchLicensesFromLocal().then(resolve).catch(reject);
                });
            });
        } catch (error) {
            console.error('GitHub fetch error:', error.message);
            // Fallback на локальний файл
            return this.fetchLicensesFromLocal();
        }
    }

    // Завантаження ліцензій з локального файлу (fallback)
    async fetchLicensesFromLocal() {
        try {
            if (!fs.existsSync(this.localLicensesFile)) {
                throw new Error('Локальний файл licenses.json не знайдено');
            }

            const data = fs.readFileSync(this.localLicensesFile, 'utf8');
            
            // Очищуємо дані від можливих зайвих символів
            const cleanData = data.trim();
            
            // Перевіряємо чи починається з {
            if (!cleanData.startsWith('{')) {
                throw new Error('Файл licenses.json не є валідним JSON');
            }
            
            const licenses = JSON.parse(cleanData);
            console.log('Ліцензії завантажено з локального файлу');
            return licenses;
        } catch (error) {
            console.error('Помилка завантаження локальних ліцензій:', error.message);
            throw new Error('Помилка завантаження ліцензій: ' + error.message);
        }
    }

    // Локальне оновлення файлу ліцензій (тільки для читання)
    async updateLocalLicenses(licenses) {
        try {
            const content = JSON.stringify(licenses, null, 2);
            fs.writeFileSync(this.localLicensesFile, content, 'utf8');
            console.log('Локальний файл ліцензій оновлено');
            return true;
        } catch (error) {
            console.error('Помилка оновлення локального файлу ліцензій:', error);
            return false;
        }
    }

    // Збереження локальної інформації про ліцензію
    saveLicenseInfo(licenseKey, hwid, status) {
        const licenseInfo = {
            licenseKey: licenseKey,
            hwid: hwid,
            status: status,
            activatedAt: new Date().toISOString(),
            lastCheck: new Date().toISOString()
        };

        try {
            fs.writeFileSync(this.licenseFile, JSON.stringify(licenseInfo, null, 2));
            return true;
        } catch (error) {
            console.error('Помилка збереження ліцензії:', error);
            return false;
        }
    }

    // Завантаження локальної інформації про ліцензію
    loadLicenseInfo() {
        try {
            if (fs.existsSync(this.licenseFile)) {
                const data = fs.readFileSync(this.licenseFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Помилка завантаження ліцензії:', error);
        }
        return null;
    }

    // Перевірка ліцензії
    async validateLicense(licenseKey = null) {
        try {
            // Якщо ключ не передано, беремо з локального файлу
            if (!licenseKey) {
                const localLicense = this.loadLicenseInfo();
                if (!localLicense) {
                    return { valid: false, error: 'Ліцензія не знайдена' };
                }
                licenseKey = localLicense.licenseKey;
            }

            // Завантажуємо ліцензії з GitHub (з fallback на локальний файл)
            const licenses = await this.fetchLicensesFromGitHub();
            
            // Шукаємо ліцензію
            const license = licenses.licenses.find(l => l.key === licenseKey);
            
            if (!license) {
                return { valid: false, error: 'Недійсна ліцензія' };
            }

            // Перевіряємо статус ліцензії
            if (license.status !== 'active') {
                return { valid: false, error: 'Ліцензія неактивна' };
            }

            // Перевіряємо термін дії (якщо є)
            if (license.expiryDate) {
                const expiryDate = new Date(license.expiryDate);
                if (new Date() > expiryDate) {
                    return { valid: false, error: 'Термін дії ліцензії закінчився' };
                }
            }

            // Перевіряємо HWID
            if (license.hwid && license.hwid !== this.hwid) {
                return { valid: false, error: 'Ліцензія прив\'язана до іншого пристрою' };
            }

            // Якщо HWID не прив'язаний АБО це повторна активація, прив'язуємо через GitHub API
            let githubUpdated = null; // null = не потрібно було оновлювати, true = успішно, false = не вдалося
            
            if (!license.hwid || license.hwid === this.hwid) {
                console.log('Прив\'язуємо ліцензію до HWID:', this.hwid);
                
                // Обов'язково оновлюємо через GitHub API (без fallback)
                try {
                    const updated = await this.githubUpdater.bindLicenseToHWID(licenseKey, this.hwid);
                    if (updated) {
                        console.log('✅ Ліцензія успішно прив\'язана через GitHub API');
                        githubUpdated = true;
                    } else {
                        console.log('❌ Не вдалося оновити GitHub - активація неможлива');
                        return { valid: false, error: 'Помилка активації: не вдалося оновити GitHub сервер' };
                    }
                } catch (error) {
                    console.log('❌ GitHub API недоступний:', error.message);
                    return { valid: false, error: 'Помилка активації: GitHub API недоступний - ' + error.message };
                }
            }

            // Зберігаємо інформацію локально
            this.saveLicenseInfo(licenseKey, this.hwid, 'active');

            return { 
                valid: true, 
                license: license,
                hwid: this.hwid,
                githubUpdated: githubUpdated
            };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Активація ліцензії
    async activateLicense(licenseKey) {
        const validation = await this.validateLicense(licenseKey);
        
        if (validation.valid) {
            // Ліцензія дійсна, зберігаємо її
            this.saveLicenseInfo(licenseKey, this.hwid, 'active');
            
            // GitHub завжди успішний (інакше була б помилка)
            return { 
                success: true, 
                message: 'Ліцензія успішно активована та оновлена на GitHub сервері',
                githubUpdated: true 
            };
        } else {
            return { success: false, error: validation.error };
        }
    }

    // Перевірка чи додаток ліцензований
    async isLicensed() {
        const validation = await this.validateLicense();
        return validation.valid;
    }

    // Отримання інформації про ліцензію
    getLicenseInfo() {
        return this.loadLicenseInfo();
    }

    // Видалення ліцензії
    async removeLicense() {
        try {
            // Спочатку отримуємо інформацію про поточну ліцензію
            const licenseInfo = this.loadLicenseInfo();
            
            if (licenseInfo && licenseInfo.licenseKey) {
                // Обов'язково відв'язуємо ліцензію через GitHub API
                try {
                    const unbound = await this.githubUpdater.unbindLicenseFromHWID(licenseInfo.licenseKey);
                    if (!unbound) {
                        console.error('❌ Не вдалося відв\'язати ліцензію через GitHub API');
                        return false;
                    }
                    console.log('✅ Ліцензія успішно відв\'язана через GitHub API');
                } catch (error) {
                    console.error('❌ GitHub API недоступний для відв\'язування:', error.message);
                    return false;
                }
            }
            
            // Видаляємо локальний файл ліцензії користувача
            if (fs.existsSync(this.licenseFile)) {
                fs.unlinkSync(this.licenseFile);
            }
            return true;
        } catch (error) {
            console.error('Помилка видалення ліцензії:', error);
            return false;
        }
    }
}

module.exports = LicenseManager;
