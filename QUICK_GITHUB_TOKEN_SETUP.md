# 🚀 Швидке налаштування GitHub токена

## Проблема
При активації ліцензії показується:
```
Failed to bind license to HWID: GitHub token is required for updating files
```

GitHub файл НЕ оновлюється автоматично.

## Рішення за 3 хвилини

### Крок 1: Створіть GitHub токен
1. Перейдіть: https://github.com/settings/tokens
2. Натисніть **"Generate new token"** → **"Generate new token (classic)"**
3. **Name:** `Lost License System`
4. **Expiration:** `No expiration` (або на ваш розсуд)
5. **Дозволи:** Оберіть тільки ☑️ **`repo`** (Full control of private repositories)
6. Натисніть **"Generate token"**
7. **ВАЖЛИВО:** Скопіюйте токен ЗАРАЗ (він більше не відобразиться!)

### Крок 2: Встановіть токен
**Windows (Command Prompt):**
```cmd
setx GITHUB_TOKEN "вставте_ваш_токен_тут"
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "вставте_ваш_токен_тут", "User")
```

### Крок 3: Перезапустіть додаток
```cmd
# Закрийте поточний додаток і запустіть знову
npm start
```

## ✅ Результат

Після налаштування при активації ліцензії ви побачите:
```
Ліцензія успішно прив'язана через GitHub API
```

Замість:
```
Failed to bind license to HWID: GitHub token is required for updating files
```

## 🔄 Автоматичне оновлення

З токеном GitHub файл оновлюється автоматично:

**До активації:**
```json
{
  "key": "DEMO-LICENSE-KEY-001",
  "hwid": null,
  "activatedAt": null
}
```

**Після активації (автоматично):**
```json
{
  "key": "DEMO-LICENSE-KEY-001", 
  "hwid": "b08a53b8b5ee5a9958635f581c80383bf7fe32d7a...",
  "activatedAt": "2025-07-26T15:30:45.123Z"
}
```

## 🔒 Безпека токена

- ✅ Токен зберігається в змінних середовища
- ✅ Не потрапляє в код або Git
- ✅ Доступ тільки до вашого репозиторію
- ✅ Можна відкликати будь-коли

## ❌ Альтернатива без токена

Якщо не хочете налаштовувати токен:
1. Ліцензія працюватиме локально
2. GitHub файл потрібно оновлювати вручну
3. Скопіюйте HWID з логів: `b08a53b8b5ee5a9958635f581c80383bf7fe32d7a...`
4. Вставте в GitHub файл вручну

---

**Рекомендація: Налаштуйте токен за 3 хвилини для повної автоматизації! 🚀**
