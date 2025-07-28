# 🔑 ВИПРАВЛЕННЯ ДОЗВОЛІВ GITHUB ТОКЕНА

## 🎯 **Проблема:**
```
❌ Failed to bind license to HWID: GitHub API Error: Bad credentials
💡 Рішення: перевірте права доступу токена
```

**Причина:** Поточний GitHub токен має тільки права читання, але не має прав для запису в репозиторій.

## ✅ **Рішення:**

### 1. Створіть новий GitHub токен з правильними дозволами:

1. Перейдіть: https://github.com/settings/tokens
2. Натисніть "Generate new token" → "Generate new token (classic)"
3. **Назва токена**: `Lost-Account-Manager-License-System`
4. **Термін дії**: Без терміну дії (No expiration)
5. **Необхідні дозволи:**
   - ✅ **repo** - Full control of private repositories
     - ✅ repo:status
     - ✅ repo_deployment  
     - ✅ public_repo
     - ✅ repo:invite
     - ✅ security_events
   - ✅ **contents:write** - Write access to repository contents

### 2. Замініть токен у .env файлі:

```env
GITHUB_TOKEN=ВАШ_НОВИЙ_ТОКЕН_З_ПРАВАМИ_ЗАПИСУ
GH_TOKEN=ВАШ_НОВИЙ_ТОКЕН_З_ПРАВАМИ_ЗАПИСУ
BUILT_IN_GITHUB_TOKEN=ВАШ_НОВИЙ_ТОКЕН_З_ПРАВАМИ_ЗАПИСУ
```

## 🔧 **Альтернативне рішення - Локальний режим:**

Якщо не хочете давати права запису, можна повернути локальний режим:

### Змініть config_manager.js:
```javascript
// Примусово повернути null для використання локального режиму
getGitHubToken() {
    return null; // Це примусово включить локальний режим
}
```

## 📋 **Перевірка після виправлення:**

1. Перезапустіть додаток
2. Спробуйте активувати ліцензію
3. Повинні побачити: `✅ Ліцензія успішно активована та оновлена на GitHub сервері`

## 🔍 **Діагностика:**

**Поточний стан токена:**
- ✅ Читання: працює (HWID перевірка успішна)
- ❌ Запис: не працює (активація не вдається)

**Необхідні дозволи GitHub API:**
- GET `/repos/owner/repo/contents/path` - потребує repo:read
- PUT `/repos/owner/repo/contents/path` - потребує repo:write
