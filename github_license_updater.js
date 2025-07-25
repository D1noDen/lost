const https = require('https');

// Завантажуємо змінні з .env файлу
require('dotenv').config();

class GitHubLicenseUpdater {
    constructor(owner, repo, token = null) {
        this.owner = owner;
        this.repo = repo;
        // Використовуємо токен з параметра або з змінних середовища
        this.token = token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
        this.apiUrl = `api.github.com`;
        this.licensesPath = 'licenses.json';
        
        // Логування для діагностики
        if (this.token) {
            console.log('GitHub token successfully loaded:', this.token.substring(0, 8) + '...');
        } else {
            console.warn('GitHub token not found in environment variables');
        }
    }

    // Отримання файлу licenses.json з GitHub
    async getLicensesFile() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.apiUrl,
                path: `/repos/${this.owner}/${this.repo}/contents/${this.licensesPath}`,
                method: 'GET',
                headers: {
                    'User-Agent': 'Lost-Account-Manager',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };

            if (this.token) {
                options.headers['Authorization'] = `token ${this.token}`;
            }

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode === 200) {
                            // Декодуємо base64 контент
                            const content = Buffer.from(response.content, 'base64').toString('utf8');
                            resolve({
                                content: JSON.parse(content),
                                sha: response.sha
                            });
                        } else {
                            reject(new Error(`GitHub API Error: ${response.message || 'Unknown error'}`));
                        }
                    } catch (error) {
                        reject(new Error('Failed to parse GitHub response: ' + error.message));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error('GitHub API request failed: ' + error.message));
            });

            req.end();
        });
    }

    // Оновлення файлу licenses.json на GitHub
    async updateLicensesFile(newContent, commitMessage = 'Update licenses') {
        if (!this.token) {
            throw new Error('GitHub token is required for updating files');
        }

        try {
            // Спочатку отримуємо поточний файл для SHA
            const currentFile = await this.getLicensesFile();
            
            return new Promise((resolve, reject) => {
                const content = JSON.stringify(newContent, null, 2);
                const encodedContent = Buffer.from(content).toString('base64');

                const updateData = {
                    message: commitMessage,
                    content: encodedContent,
                    sha: currentFile.sha
                };

                const postData = JSON.stringify(updateData);

                const options = {
                    hostname: this.apiUrl,
                    path: `/repos/${this.owner}/${this.repo}/contents/${this.licensesPath}`,
                    method: 'PUT',
                    headers: {
                        'User-Agent': 'Lost-Account-Manager',
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${this.token}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const req = https.request(options, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            if (res.statusCode === 200) {
                                resolve(response);
                            } else {
                                reject(new Error(`GitHub API Error: ${response.message || 'Unknown error'}`));
                            }
                        } catch (error) {
                            reject(new Error('Failed to parse GitHub response: ' + error.message));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(new Error('GitHub API request failed: ' + error.message));
                });

                req.write(postData);
                req.end();
            });
        } catch (error) {
            throw new Error('Failed to update licenses file: ' + error.message);
        }
    }

    // Прив'язка ліцензії до HWID
    async bindLicenseToHWID(licenseKey, hwid) {
        try {
            const fileData = await this.getLicensesFile();
            const licenses = fileData.content;

            // Знаходимо ліцензію
            const licenseIndex = licenses.licenses.findIndex(l => l.key === licenseKey);
            
            if (licenseIndex === -1) {
                throw new Error('License not found');
            }

            // Оновлюємо ліцензію
            licenses.licenses[licenseIndex].hwid = hwid;
            licenses.licenses[licenseIndex].activatedAt = new Date().toISOString();
            licenses.lastUpdated = new Date().toISOString();

            // Оновлюємо файл на GitHub
            await this.updateLicensesFile(
                licenses, 
                `Bind license ${licenseKey} to HWID ${hwid.substring(0, 8)}...`
            );

            console.log(`License ${licenseKey} successfully bound to HWID`);
            return true;
        } catch (error) {
            console.error('Failed to bind license to HWID:', error.message);
            return false;
        }
    }

    // Деактивація ліцензії
    async deactivateLicense(licenseKey) {
        try {
            const fileData = await this.getLicensesFile();
            const licenses = fileData.content;

            // Знаходимо ліцензію
            const licenseIndex = licenses.licenses.findIndex(l => l.key === licenseKey);
            
            if (licenseIndex === -1) {
                throw new Error('License not found');
            }

            // Деактивуємо ліцензію
            licenses.licenses[licenseIndex].status = 'inactive';
            licenses.lastUpdated = new Date().toISOString();

            // Оновлюємо файл на GitHub
            await this.updateLicensesFile(
                licenses, 
                `Deactivate license ${licenseKey}`
            );

            console.log(`License ${licenseKey} successfully deactivated`);
            return true;
        } catch (error) {
            console.error('Failed to deactivate license:', error.message);
            return false;
        }
    }

    // Відв'язування ліцензії від HWID
    async unbindLicenseFromHWID(licenseKey) {
        try {
            const fileData = await this.getLicensesFile();
            const licenses = fileData.content;

            // Знаходимо ліцензію
            const licenseIndex = licenses.licenses.findIndex(l => l.key === licenseKey);
            
            if (licenseIndex === -1) {
                throw new Error('License not found');
            }

            // Відв'язуємо ліцензію
            licenses.licenses[licenseIndex].hwid = null;
            licenses.licenses[licenseIndex].activatedAt = null;
            licenses.lastUpdated = new Date().toISOString();

            // Оновлюємо файл на GitHub
            await this.updateLicensesFile(
                licenses, 
                `Unbind license ${licenseKey} from HWID`
            );

            console.log(`License ${licenseKey} successfully unbound from HWID`);
            return true;
        } catch (error) {
            console.error('Failed to unbind license from HWID:', error.message);
            return false;
        }
    }
}

module.exports = GitHubLicenseUpdater;
