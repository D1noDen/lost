# Інструкції для створення GitHub Release v1.0.8

## 🎯 Щоб виправити помилку "Cannot find latest.yml"

### 1. Перейти на GitHub
Відкрити: https://github.com/D1noDen/lost/releases

### 2. Створити новий реліз
- Натиснути "Create a new release"
- **Tag version**: `v1.0.8`
- **Release title**: `v1.0.8: Auto-linking maFiles, Modal Windows, History Tab Fixes`

### 3. Завантажити файли (ОБОВ'ЯЗКОВО!)
Завантажити всі 3 файли з папки `d:\programing\lost\dist\`:

✅ **Lost Account Manager Setup 1.0.8.exe** (основний інсталятор)
✅ **Lost Account Manager Setup 1.0.8.exe.blockmap** (для дельта-оновлень)  
✅ **latest.yml** (метадані для автоматичних оновлень)

### 4. Опис релізу
Скопіювати з файлу `RELEASE_NOTES_v1.0.8.md`

### 5. Опублікувати
Натиснути "Publish release"

## ⚠️ ВАЖЛИВО
Файл `latest.yml` **ОБОВ'ЯЗКОВИЙ** для автоматичних оновлень!
Без нього буде помилка: "Cannot find latest.yml in the latest release artifacts"

## 🔍 Перевірка
Після публікації перевірити:
- Всі 3 файли завантажені
- URL файлів доступні
- Auto-updater працює без помилок
