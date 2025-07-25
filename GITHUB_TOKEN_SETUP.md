# Налаштування GitHub Token для автоматичного оновлення ліцензій

## Що це таке?

GitHub Personal Access Token дозволяє системі ліцензування автоматично оновлювати файл `licenses.json` у вашому репозиторії при активації ліцензій користувачами. Це означає, що коли користувач активує ліцензію, вона автоматично прив'язується до його HWID в GitHub файлі.

## Як створити GitHub Token

### 1. Увійдіть до GitHub
Перейдіть на https://github.com та увійдіть у ваш акаунт

### 2. Відкрийте налаштування токенів
- Натисніть на ваш аватар у правому верхньому куті
- Оберіть "Settings"
- У лівому меню оберіть "Developer settings"
- Оберіть "Personal access tokens" → "Tokens (classic)"

### 3. Створіть новий токен
- Натисніть "Generate new token" → "Generate new token (classic)"
- Введіть опис токена, наприклад: "Lost License System"
- Встановіть термін дії (рекомендовано: No expiration)

### 4. Встановіть дозволи (Scopes)
Виберіть тільки необхідні дозволи:
- ✅ **repo** - Full control of private repositories
  - Це дозволить читати та записувати файли у ваш репозиторій

### 5. Збережіть токен
- Натисніть "Generate token"
- **ВАЖЛИВО:** Скопіюйте токен одразу! Він більше не відображатиметься
- Зберігайте токен у безпечному місці

## Налаштування токена в додатку

### Метод 1: Змінна середовища (Рекомендовано)

1. **Windows:**
   ```cmd
   setx GITHUB_TOKEN "your_token_here"
   ```
   Після цього перезапустіть додаток

2. **PowerShell:**
   ```powershell
   $env:GITHUB_TOKEN = "your_token_here"
   ```

3. **Для постійного налаштування в Windows:**
   - Натисніть Win + R, введіть `sysdm.cpl`
   - Перейдіть на вкладку "Advanced" → "Environment Variables"
   - Додайте нову змінну:
     - Назва: `GITHUB_TOKEN`
     - Значення: ваш токен

### Метод 2: Файл конфігурації

Створіть файл `.env` у папці додатка:
```
GITHUB_TOKEN=your_token_here
```

**ВАЖЛИВО:** Додайте `.env` до `.gitignore` щоб не закомітити токен!

## Перевірка роботи

Після налаштування токена:

1. Запустіть додаток
2. Активуйте тестову ліцензію (наприклад, `DEMO-LICENSE-KEY-001`)
3. Перевірте файл `licenses.json` у вашому GitHub репозиторії
4. У ліцензії має з'явитися HWID та дата активації

## Приклад автоматичного оновлення

До активації:
```json
{
  "key": "DEMO-LICENSE-KEY-001",
  "status": "active",
  "hwid": null,
  "activatedAt": null
}
```

Після активації:
```json
{
  "key": "DEMO-LICENSE-KEY-001", 
  "status": "active",
  "hwid": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "activatedAt": "2025-07-26T15:30:45.123Z"
}
```

## Безпека токена

### ✅ Що робити:
- Зберігайте токен у змінних середовища
- Використовуйте мінімальні необхідні дозволи
- Регулярно оновлюйте токен
- Не передавайте токен третім особам

### ❌ Чого не робити:
- Не комітьте токен у Git репозиторій
- Не передавайте токен в URL або логах
- Не зберігайте токен у звичайних текстових файлах
- Не використовуйте один токен для кількох проектів

## Що робити якщо токен скомпрометований

1. **Негайно відкличте токен:**
   - Зайдіть у GitHub Settings → Developer settings → Personal access tokens
   - Знайдіть ваш токен та натисніть "Delete"

2. **Створіть новий токен** за інструкціями вище

3. **Оновіть змінну середовища** з новим токеном

## Робота без токена

Якщо токен не налаштований:
- Система ліцензування працюватиме
- Ліцензії будуть перевірятися та збережуватися локально
- Автоматичне оновлення GitHub файлу не працюватиме
- Потрібно буде вручну оновлювати `licenses.json`

## Помилки та їх вирішення

### "GitHub token is required for updating files"
- Налаштуйте змінну середовища `GITHUB_TOKEN`

### "GitHub API Error: Bad credentials"
- Перевірте правильність токена
- Переконайтеся що токен не закінчився

### "GitHub API Error: Not Found"
- Перевірте що репозиторій існує
- Переконайтеся що токен має доступ до репозиторію

### "Failed to bind license to HWID"
- Перевірте інтернет-з'єднання
- Переконайтеся що файл `licenses.json` існує в репозиторії
