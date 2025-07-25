# Інструкції для релізу v1.0.20

## Підготовка до релізу

### 1. Перевірка версії
- ✅ Версія в `package.json` оновлена до `1.0.20`
- ✅ Створено файл `RELEASE_NOTES_v1.0.20.md`

### 2. Збірка проекту
```bash
cd "d:\programing\lost"
npm install
npm run build
```

### 3. Перевірка збірки
Після успішної збірки в папці `dist` повинні з'явитися файли:
- `Lost Account Manager Setup 1.0.20.exe` - інсталятор
- `latest.yml` - метадані для автооновлення
- Інші допоміжні файли

## Створення релізу на GitHub

### 1. Підготовка файлів
- Основний інсталятор: `Lost Account Manager Setup 1.0.20.exe`
- Файл автооновлення: `latest.yml`
- Нотатки релізу: `RELEASE_NOTES_v1.0.20.md`

### 2. Створення тегу та релізу
```bash
git add .
git commit -m "Release v1.0.20: Added loading indicators and improved resetFarm function"
git tag v1.0.20
git push origin main
git push origin v1.0.20
```

### 3. Завантаження файлів на GitHub
1. Перейти на https://github.com/D1noDen/lost/releases
2. Натиснути "Create a new release"
3. Вибрати тег `v1.0.20`
4. Заповнити назву релізу: `v1.0.20 - Loading Indicators & ResetFarm Fix`
5. Скопіювати зміст з `RELEASE_NOTES_v1.0.20.md` в описание
6. Завантажити файли:
   - `Lost Account Manager Setup 1.0.20.exe`
   - `latest.yml`
7. Опублікувати реліз

## Автоматичний реліз (альтернатива)

Для автоматичного створення релізу на GitHub:
```bash
npm run release
```

Ця команда:
- Збере проект
- Автоматично створить реліз на GitHub
- Завантажить всі необхідні файли

## Тестування після релізу

1. **Завантажити інсталятор** з GitHub releases
2. **Встановити на чистій системі** та перевірити:
   - Запуск додатка
   - Функція отримання дропів з індикатором завантаження
   - Функція скидання фарму
   - Автооновлення (якщо налаштовано)

## Важливі нотатки

- Переконайтеся, що всі зміни збережені та закоммічені
- Перевірте, що іконка `LOST_icon.ico` існує в корені проекту
- Переконайтеся, що Git репозиторій налаштований правильно
- Файли з префіксом `test_` та бекапи не включаються в збірку

## Розв'язання проблем

### Якщо збірка не вдається:
1. Перевірити наявність Node.js та npm
2. Очистити кеш: `npm cache clean --force`
3. Видалити node_modules: `rmdir /s node_modules`
4. Перевстановити залежності: `npm install`

### Якщо автооновлення не працює:
1. Перевірити налаштування `publish` в `package.json`
2. Переконатися, що `latest.yml` завантажений в реліз
3. Перевірити доступ до GitHub репозиторію
