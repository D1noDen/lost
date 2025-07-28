const https = require('https');

class GitHubLicenseUpdater {
    constructor(owner, repo, token = null) {
        this.owner = owner;
        this.repo = repo;
        // Використовуємо переданий токен
        this.token = token;
        this.apiUrl = `api.github.com`;
        this.licensesPath = 'licenses.json';
        
        // Логування для діагностики
        if (this.token) {
            console.log('GitHub token successfully loaded for API access');
        } else {
            console.warn('GitHub token not provided - API operations will be unavailable');
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
        console.log('=== updateLicensesFile Debug ===');
        console.log('Token available:', !!this.token);
        console.log('Commit message:', commitMessage);
        
        if (!this.token) {
            console.error('GitHub token is required for updating files');
            throw new Error('GitHub token is required for updating files');
        }

        try {
            // Спочатку отримуємо поточний файл для SHA
            console.log('Getting current file from GitHub...');
            const currentFile = await this.getLicensesFile();
            console.log('Current file SHA:', currentFile.sha);
            
            return new Promise((resolve, reject) => {
                const content = JSON.stringify(newContent, null, 2);
                const encodedContent = Buffer.from(content).toString('base64');

                const updateData = {
                    message: commitMessage,
                    content: encodedContent,
                    sha: currentFile.sha
                };

                const postData = JSON.stringify(updateData);
                console.log('Update data prepared, content length:', postData.length);

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

                console.log('Making PUT request to GitHub API...');
                console.log('URL:', `https://${options.hostname}${options.path}`);

                const req = https.request(options, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        console.log('GitHub API Response Status:', res.statusCode);
                        console.log('GitHub API Response:', data);
                        
                        try {
                            const response = JSON.parse(data);
                            if (res.statusCode === 200) {
                                console.log('✅ Successfully updated licenses.json on GitHub');
                                resolve(response);
                            } else if (res.statusCode === 201) {
                                console.log('✅ Successfully created licenses.json on GitHub');
                                resolve(response);
                            } else {
                                console.error('❌ GitHub API Error Status:', res.statusCode);
                                console.error('❌ GitHub API Error Response:', response);
                                reject(new Error(`GitHub API Error (${res.statusCode}): ${response.message || 'Unknown error'}`));
                            }
                        } catch (error) {
                            console.error('❌ Failed to parse GitHub response:', error.message);
                            console.error('❌ Raw response:', data);
                            reject(new Error('Failed to parse GitHub response: ' + error.message));
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error('Request error:', error.message);
                    reject(new Error('GitHub API request failed: ' + error.message));
                });

                req.write(postData);
                req.end();
            });
        } catch (error) {
            console.error('Error in updateLicensesFile:', error.message);
            throw new Error('Failed to update licenses file: ' + error.message);
        }
    }

    // Прив'язка ліцензії до HWID
    async bindLicenseToHWID(licenseKey, hwid) {
        try {
            console.log('=== bindLicenseToHWID Debug ===');
            console.log('License Key:', licenseKey);
            console.log('HWID:', hwid);
            console.log('Token available:', !!this.token);
            console.log('Token length:', this.token ? this.token.length : 0);
            
            if (!this.token) {
                console.error('❌ No GitHub token available for license binding');
                console.log('Можливі причини:');
                console.log('1. Не налаштований .env файл з GITHUB_TOKEN');
                console.log('2. Токен не встановлений в системних змінних');
                console.log('3. Помилка в ConfigManager');
                return false;
            }

            console.log('🔄 Fetching current licenses file from GitHub...');
            const fileData = await this.getLicensesFile();
            const licenses = fileData.content;

            // Знаходимо ліцензію
            const licenseIndex = licenses.licenses.findIndex(l => l.key === licenseKey);
            
            if (licenseIndex === -1) {
                console.error('❌ License not found in licenses.json:', licenseKey);
                console.log('Available licenses:', licenses.licenses.map(l => l.key));
                throw new Error('License not found');
            }

            console.log('✅ Found license at index:', licenseIndex);
            console.log('Current license data:', licenses.licenses[licenseIndex]);

            // Оновлюємо ліцензію
            licenses.licenses[licenseIndex].hwid = hwid;
            licenses.licenses[licenseIndex].activatedAt = new Date().toISOString();
            licenses.lastUpdated = new Date().toISOString();

            console.log('✅ Updated license data:', licenses.licenses[licenseIndex]);

            // Оновлюємо файл на GitHub
            console.log('🚀 Attempting to update licenses file on GitHub...');
            const updateResult = await this.updateLicensesFile(
                licenses, 
                `Bind license ${licenseKey} to HWID ${hwid.substring(0, 8)}...`
            );
            console.log('📊 Update result:', updateResult ? 'Success' : 'Failed');

            console.log(`✅ License ${licenseKey} successfully bound to HWID`);
            return true;
        } catch (error) {
            console.error('❌ Failed to bind license to HWID:', error.message);
            console.error('Error stack:', error.stack);
            
            // Більш детальне логування помилок
            if (error.message.includes('GitHub token is required')) {
                console.log('💡 Рішення: налаштуйте GitHub токен у .env файлі');
            } else if (error.message.includes('GitHub API Error')) {
                console.log('💡 Рішення: перевірте права доступу токена');
            } else if (error.message.includes('License not found')) {
                console.log('💡 Рішення: перевірте правильність ключа ліцензії');
            }
            
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
