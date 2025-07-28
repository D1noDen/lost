class ConfigManager {
    constructor() {
        // Завантажуємо змінні з .env файлу (тільки в режимі розробки)
        try {
            require('dotenv').config();
        } catch (error) {
            // dotenv може бути недоступний в збірці
            console.log('dotenv не доступний, використовуємо вбудовані налаштування');
        }
    }

    // Отримання GitHub токена з різних джерел
    getGitHubToken() {
        console.log('=== ConfigManager.getGitHubToken Debug ===');
        
        // 1. Спочатку перевіряємо змінні середовища (.env файл або системні)
        const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        console.log('Environment token available:', !!envToken);
        console.log('Environment token length:', envToken ? envToken.length : 0);
        
        if (envToken && envToken !== 'your_github_token_here') {
            console.log('✅ Використовуємо токен з змінних середовища');
            return envToken;
        }

        // 2. Перевіряємо вбудований токен (для продакшн збірки)
        const builtInToken = this.getBuiltInToken();
        console.log('Built-in token available:', !!builtInToken);
        
        if (builtInToken) {
            console.log('✅ Використовуємо вбудований токен');
            return builtInToken;
        }

        // 3. Якщо токен не знайдено
        console.warn('❌ GitHub токен не знайдено. Система працюватиме в локальному режимі.');
        return null;
    }

    // Вбудований токен (замінюється під час збірки)
    getBuiltInToken() {
        // Токен для продакшн збірки
        const token = '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';
        
        if (token === 'your_github_token_here') {
            return null; // Плейсхолдер не замінено
        }
        
        return token;
    }

    // Перевірка чи система працює в режимі розробки
    isDevelopmentMode() {
        return process.env.NODE_ENV === 'development' || 
               process.env.NODE_ENV === 'dev' ||
               !this.isPackaged();
    }

    // Перевірка чи додаток запакований (збірка)
    isPackaged() {
        try {
            const { app } = require('electron');
            return app.isPackaged;
        } catch (error) {
            // Якщо electron недоступний, перевіряємо іншими способами
            return process.pkg !== undefined || process.execPath.includes('electron') === false;
        }
    }

    // Отримання джерела токена для логування
    getTokenSource() {
        const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        if (envToken && envToken !== 'your_github_token_here') {
            return 'environment';
        }

        const builtInToken = this.getBuiltInToken();
        if (builtInToken) {
            return 'built-in';
        }

        return 'none';
    }
}

module.exports = ConfigManager;
