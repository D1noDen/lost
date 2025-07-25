// Система перекладу для LOST Accounts
const translations = {
  uk: {
    // index.html
    app_title: "LOST — Вхід",
    main_title: "LOST Accounts",
    main_subtitle: "Управління, фарм і безпека акаунтів",
    password_placeholder: "Введіть пароль",
    login_button: "🔓 Увійти",
    wrong_password: "❌ Неправильний пароль!",
    config_error: "Помилка конфігурації!",
    first_run_hint: "Перший запуск? Використайте пароль:",
    created_by: "Створено",
    check_updates: "🔄 Оновлення",
    checking_updates: "Перевірка оновлень...",
    update_error: "Помилка перевірки оновлень",
    downloading: "Завантаження",
    
    // main.html
    main_app_title: "LOST - Steam Акаунти",
    accounts: "Акаунти",
    add_account: "Додати акаунт",
    statistics: "Статистика",
    trading: "Торгівля",
    settings: "Налаштування",
    
    // Пошук та фільтри
    search_placeholder: "🔍 Пошук по логіну, імені, ID або дропу...",
    filter_all: "Усі",
    filter_farmed: "Відфармлені",
    filter_not_farmed: "Не відфармлені",
    clear_search: "Очистити пошук",
    
    // Глобальні елементи
    global_trade_link_placeholder: "Глобальна трейд-лінка (Trade URL для всіх акаунтів)",
    
    // Імпорт/Експорт
    import_export: "📁 Імпорт/Експорт",
    export_accounts: "📤 Експорт акаунтів",
    export_accounts_btn: "Експортувати акаунти",
    import_accounts: "📥 Імпорт акаунтів", 
    import_accounts_btn: "Імпортувати акаунти",
    import_mafiles: "🔑 Імпорт .maFile файлів",
    import_mafiles_folder: "Імпорт папки з .maFile",
    import_mafiles_individual: "Імпорт окремих .maFile",
    close: "Закрити",
    
    // Заголовки сторінок
    statistics_title: "NEO-Stat Панель",
    trading_title: "LOST - Інтерфейс торгівлі",
    
    // Статистика
    back: "← Назад",
    statistics_header: "📊 LOST — Статистика",
    statistics_subtitle: "Аналіз акаунтів, прибутків і активності",
    total_income: "Загальний дохід",
    total_expenses: "Загальні витрати",
    net_profit: "Чистий прибуток",
    income_dynamics: "📈 Динаміка доходів",
    accounts_comparison: "📊 Порівняння акаунтів",
    weekly_income: "📅 Тижневі доходи",
    
    // Навігація main.html
    change_password: "Змінити пароль",
    auto_link: "Авто-з'єднання",
    trading: "Трейди",
    history: "Історія",
    portfolio: "Портфоліо",
    reset: "Скинути",
    
    // Trading.html
    trade_management: "📈 Trade Management",
    trade_subtitle: "💼 Управління трейдами Steam",
    back_to_accounts: "🏠 Повернутися до акаунтів",
    account_login: "💻 Вхід в акаунт",
    load_accounts: "🔄 Завантажити акаунти",
    select_account: "👤 Оберіть акаунт",
    loading_accounts: "Завантаження акаунтів...",
    login_steam: "Увійти в Steam",
    logged_in_as: "Увійшли як:",
    logout: "Вийти",
    active_trades: "Активні угоди",
    history: "Історія",
    no_active_trades: "Немає активних угод",
    login_to_view_trades: "Увійдіть в акаунт щоб переглянути трейди",
    history_empty: "Історія порожня",
    completed_trades_here: "Тут будуть відображатися завершені угоди",
    no_trades_to_process: "На даний момент немає трейдів для обробки",
    
    // Повідомлення помилок
    error_loading_accounts: "Помилка завантаження акаунтів",
    error_account_login: "Помилка входу в акаунт",
    error_loading_trades: "Помилка завантаження трейдів",
    error_accepting_trade: "Помилка при прийнятті трейду",
    error_declining_trade: "Помилка при відхиленні трейду",
    error_reading_mafile: "Помилка читання maFile",
    error_login: "Помилка входу",
    error_loading: "Помилка завантаження",
    
    // Кнопки дій в трейдингу
    accept_trade: "Прийняти",
    decline_trade: "Відхилити",
    trade_not_found: "Трейд не знайдено!",
    accepting_trade: "Прийняття трейду...",
    declining_trade: "Відхилення трейду...",
    trade_accepted_success: "Трейд успішно прийнято!",
    trade_declined_success: "Трейд успішно відхилено!",
    login_success: "Успішно увійшли як",
    
    // Повідомлення помилок файлів
    error_reading_file: "Помилка читання файлу:",
    file_not_selected: "Файл не обрано.",
    mafiles_folder_not_initialized: "Папка maFiles не ініціалізована. Спробуйте перезапустити додаток.",
    error_copying_file: "Помилка копіювання файлу:",
    mafile_not_found: "maFile не знайдено!",
    error_reading_mafile: "Помилка при зчитуванні maFile:",
    
    // Модальне вікно зміни пароля
    change_password_title: "Зміна пароля",
    
    // Портфоліо повідомлення
    portfolio_updated: 'Портфоліо оновлено',
    portfolio_error_calculation: 'Помилка розрахунку портфоліо',
    portfolio_loading_error: 'Помилка завантаження для',
    portfolio_auto_load_completed: 'Завершено автозавантаження. Успішно:',
    portfolio_auto_load_errors: 'Помилок:',
    nothing_to_copy: 'Нічого копіювати',
    no_drops_to_copy: 'Немає дропів для копіювання',
    login_password_required: 'Потрібно вказати логін та пароль для акаунту',
    no_drops_info_found: 'Не вдалося знайти інформацію про дропи або інвентар порожній',
    no_inventory_info_found: 'Не вдалося знайти інформацію про інвентар або інвентар порожній',
    
    // Завантаження інвентарів
    loading_all_inventories: 'Завантаження інвентарів для всіх акаунтів...',
    no_accounts_with_credentials: 'Немає акаунтів з налаштованими даними для входу',
    loading_inventory_account: 'Завантаження інвентаря',
    inventories_loaded_success: 'Завантажено інвентарі для',
    accounts_word: 'акаунтів',
    errors_word: 'помилок',
    no_inventories_loaded: 'Не вдалося завантажити жоден інвентар',
    
    // Дропи та інвентарі
    drops_updated_for: 'Дропи оновлено для',
    inventory_updated: 'Інвентар оновлено!',
    mafile_not_found_for: 'maFile не знайдено для акаунту',
    checked_paths: 'Перевірено:',
    loaded_items: 'Завантажено',
    items_word_genitive: 'предметів',
    total_cost: 'Загальна вартість',
    currency_uah_short: 'грн',
    inventory_not_loaded: 'Інвентар не завантажено',
    file_uploaded_successfully: 'Файл успішно завантажено',
    file_uploaded_via_ipc: 'Файл успішно завантажено через IPC',
    account_loading: 'Завантажується інвентар акаунту',
    
    // Трансфер предметів
    no_cs2_tf2_inventory: 'У акаунта немає інвентаря CS2 або TF2 для перекидання!',
    no_cs2_inventory: 'У акаунта немає інвентаря CS2 для перекидання!',
    
    // Файлові операції
    select_accounts_file: 'Виберіть файл з акаунтами для імпорту...',
    select_history_file: 'Виберіть файл з історією торгівлі для імпорту...',
    select_mafiles_folder: 'Виберіть папку з .maFile файлами для імпорту...',
    select_mafiles: 'Виберіть .maFile файли для імпорту...',
    select_save_location: 'Виберіть місце для збереження файлу...',
    
    // Перейменування та файлові операції
    renaming_mafiles: 'Перейменовуємо .maFile файли...',
    mafiles_path_not_initialized: 'Шлях до папки maFiles не ініціалізований',
    mafiles_folder_not_exists: 'Папка maFiles не існує',
    no_accounts_for_renaming: 'Немає облікових записів для перейменування файлів',
    critical_renaming_error: 'Критична помилка перейменування',
    starting_mafiles_renaming: 'Запускається перейменування .maFile файлів...',
    renaming_error: 'Помилка перейменування',
    
    // Автозавантаження та налаштування
    auto_loading_at_startup: 'Автозавантаження при старті',
    auto_loading_enabled: 'увімкнено',
    auto_loading_disabled: 'вимкнено',
    global_trade_link_saved: 'Глобальна трейд-лінка збережена!',
    global_trade_link_not_specified: 'Глобальна трейд-лінка не вказана!',
    all_skins_sent: 'Всі скіни відправлено!',
    error_general: 'Помилка',
    
    // Оновлення портфоліо
    updating_portfolio: 'Оновлення портфоліо...',
    current_password: "Поточний пароль",
    new_password: "Новий пароль",
    confirm_password: "Підтвердження",
    enter_current_password: "Введіть поточний пароль",
    enter_new_password: "Введіть новий пароль",
    confirm_new_password: "Підтвердіть новий пароль",
    
    // Форми та кнопки
    username: "Логін",
    password: "Пароль",
    shared_secret: "Shared Secret",
    identity_secret: "Identity Secret",
    device_id: "Device ID",
    steam_id: "Steam ID",
    save: "Зберегти",
    cancel: "Скасувати",
    edit: "Редагувати",
    delete: "Видалити",
    farm: "ФАРМ",
    unfarm: "СТОП",
    
    // Статуси
    online: "Онлайн",
    offline: "Офлайн",
    farming: "Фармлю",
    not_farming: "Не фармлю",
    
    // Повідомлення
    account_added: "Акаунт додано",
    account_updated: "Акаунт оновлено",
    account_deleted: "Акаунт видалено",
    farming_started: "Фарм запущено",
    farming_stopped: "Фарм зупинено",
    
    // Налаштування
    language: "Мова",
    theme: "Тема",
    notifications: "Сповіщення",
    auto_updates: "Автооновлення",
    
    // Графіки та тултіпи
    chart_tooltip_trades: "Трейдів",
    chart_tooltip_items: "Предметів",
    chart_tooltip_value: "Вартість",
    chart_tooltip_date: "Дата",
    chart_tooltip_account: "Акаунт",
    
    // Повідомлення пошуку
    search_no_results: "Нічого не знайдено",
    search_results_found: "Знайдено результатів",
    
    // Інвентар
    inventory_loading: "Завантаження інвентаря...",
    inventory_empty: "Інвентар порожній",
    inventory_value: "Вартість інвентаря",
    
    // Карточки акаунтів
    account_no_name: "Без назви",
    no_drops: "Немає дропів",
    click_to_get: "Натисніть для отримання",
    transfer_skins_global: "Передати скіни глобально",
    farmed: "Відфармлений",
    not_farmed: "Не відфармлений",
    remove_prime: "Видалити Prime",
    until_prime: "До Prime: через",
    days: "днів",
    set_prime: "Встановити Prime",
    mafile_path: "Шлях до maFile",
    trade_url: "Трейд-лінка (Trade URL)",
    trade_url_copied: "🔗 Трейд-лінка скопійована",
    name_placeholder: "Ім'я",
    login_placeholder: "Login",
    password_placeholder: "Password",
    total_income: "💰 Загальний дохід:",
    weekly_income: "➕ Дохід за тиждень:",
    add_weekly: "➕ Додати",
    total_expenses: "💸 Загальні витрати:",
    net_profit_label: "💹 Чистий прибуток:",
    copy_code: "Копіювати код",
    refresh_drop: "Оновити дроп",
    total_price: "Загалом:",
    currency_uah: "грн",
    
    // Історія
    history_title: "📜 Історія операцій",
    history_empty: "Історія порожня",
    history_date: "Дата",
    history_action: "Дія",
    history_account: "Акаунт",
    history_description: "Опис",
    history_amount: "Сума",
    filter_all_operations: "Всі операції",
    filter_income: "Доходи",
    filter_expenses: "Витрати",
    filter_drops: "Дропи",
    
    // Портфоліо додаткові
    portfolio_title: "💼 Портфоліо",
    portfolio_inventory_title: "📊 Портфоліо Інвентарю",
    portfolio_summary: "Загальна інформація",
    portfolio_accounts: "Акаунти з інвентарем",
    portfolio_total_value: "Загальна вартість",
    portfolio_items_count: "Всього предметів",
    portfolio_accounts_count: "Активних акаунтів",
    portfolio_average_value: "Середня вартість",
    load_all_inventories: "Завантажити всі інвентарі",
    auto_on_startup: "Авто при старті",
    refresh: "Оновити",
    total_profit: "Загальний прибуток",
    total_value: "Загальна вартість",
    total_items: "Всього предметів",
    active_accounts_count: "Активних акаунтів",
    average_item_price: "Середня ціна предмету",
    game_csgo: "CS:GO",
    game_tf2: "Team Fortress 2",
    items_word: "предметів",
    more_items: "Ще предметів",
    tradeable: "Можна обміняти",
    not_tradeable: "Заблоковано",
    
    // Копіювання та повідомлення
    login_copied: "👤 Логін скопійовано",
    password_copied: "🔒 Пароль скопійовано",
    get_drops: "Отримати дропи",
    load_full_inventory: "Завантажити повний інвентар",
    price_no_price: "Без ціни",
    update_button: "Оновити",
    
    // Додаткові переклади карточок
    last_drops: "Останні дропи",
    copy_2fa: "Копіювати 2FA",
    copy_trade_link: "Копіювати трейд-лінку",
    total_drops_price: "Загалом",
    refresh_drops: "Оновити дропи",
    copy_drop_price: "Копіювати ціну",
    steam_inventory: "Steam інвентар",
    no_trade_url: "Немає трейд-лінки",
    farming_status: "Фармиться",
    not_farming_status: "Не фармиться",
    copied_to_clipboard: "Скопійовано в буфер обміну",
    login_copied: "Логін скопійовано",
    password_copied: "Пароль скопійовано",
    code_2fa_copied: "2FA код скопійовано",
    
    // Statistics
    total_accounts: "Всього акаунтів",
    farming_accounts: "Фармлять",
    online_accounts: "Онлайн",
    total_hours: "Всього годин",
    today_hours: "Сьогодні годин",
    estimated_profit: "Очікуваний прибуток",
    
    // Модальні вікна
    account_details: "Деталі акаунта",
    account_settings: "Налаштування акаунта",
    confirm_delete: "Підтвердити видалення",
    delete_account_text: "Ви впевнені, що хочете видалити цей акаунт?",
    confirm: "Підтвердити",
    
    // Карточки акаунтів
    account_status: "Статус акаунта",
    last_seen: "Останній раз онлайн",
    farming_time: "Час фармлення",
    drops_earned: "Отримано дропів",
    steam_level: "Рівень Steam",
    games_count: "Кількість ігор",
    profile_name: "Ім'я профілю",
    account_actions: "Дії з акаунтом",
    view_profile: "Переглянути профіль",
    manage_account: "Управління акаунтом",
    
    // Портфоліо
    portfolio_value: "Вартість портфеля",
    items_count: "Кількість предметів",
    most_valuable: "Найдорожчий предмет",
    recent_items: "Останні предмети",
    inventory_worth: "Вартість інвентаря",
    market_trend: "Тренд ринку",
    price_change: "Зміна ціни",
    
    // Tooltip для графіків
    chart_tooltip_accounts: "Кількість акаунтів по днях",
    chart_tooltip_income: "Дохід за період",
    chart_tooltip_comparison: "Порівняння доходів акаунтів",
    chart_tooltip_weekly: "Тижневий дохід",
    chart_tooltip_daily: "Денний дохід",
    chart_tooltip_monthly: "Місячний дохід",
    total_drops_copied: "Загальна сума дропів скопійована",
    general_processing_error: "Загальна помилка обробки акаунту",
    prime_status: "Статус Prime",
    check_updates: "Перевірити оновлення",
    toggle_auto_load_startup: "Увімкнути/вимкнути автозавантаження при старті",
    import_export_data: "Імпорт / Експорт даних",
    import_data: "Імпорт",
    export_data: "Експорт",
    import_trade_history: "Імпорт історії торгівлі",
    information: "Інформація",
    import_accounts_info: "Додає нові акаунти до існуючих (дублікати пропускаються)",
    import_history: "Імпорт історії",
    import_history_info: "Замінює поточну історію торгівлі",
    import_mafiles_info: "Копіює .maFile файли до папки програми",
    export_accounts_info: "Зберігає всі акаунти у JSON файл",
    import_accounts_error: "Помилка імпорту акаунтів",
    import_history_error: "Помилка імпорту історії",
    import_mafiles_error: "Помилка імпорту maFiles",
    import_mafiles_folder_error: "Помилка імпорту папки maFiles",
    import_individual_mafiles_error: "Помилка імпорту окремих maFiles",
    export_accounts_error: "Помилка експорту акаунтів",
    week: "Тиждень",
    income: "Дохід",
    share: "Частка",
    minimum: "мін"
  },
  
  ru: {
    // index.html
    app_title: "LOST — Вход",
    main_title: "LOST Accounts",
    main_subtitle: "Управление, фарм и безопасность аккаунтов",
    password_placeholder: "Введите пароль",
    login_button: "🔓 Войти",
    wrong_password: "❌ Неправильный пароль!",
    config_error: "Ошибка конфигурации!",
    first_run_hint: "Первый запуск? Используйте пароль:",
    created_by: "Создано",
    check_updates: "🔄 Обновления",
    checking_updates: "Проверка обновлений...",
    update_error: "Ошибка проверки обновлений",
    downloading: "Загрузка",
    
    // main.html
    main_app_title: "LOST - Steam Аккаунты",
    accounts: "Аккаунты",
    add_account: "Добавить аккаунт",
    statistics: "Статистика",
    trading: "Торговля",
    settings: "Настройки",
    
    // Поиск и фильтры
    search_placeholder: "🔍 Поиск по логину, имени, ID или дропу...",
    filter_all: "Все",
    filter_farmed: "Отфармленные",
    filter_not_farmed: "Не отфармленные",
    clear_search: "Очистить поиск",
    
    // Глобальные элементы
    global_trade_link_placeholder: "Глобальная трейд-ссылка (Trade URL для всех аккаунтов)",
    
    // Импорт/Экспорт
    import_export: "📁 Импорт/Экспорт",
    export_accounts: "📤 Экспорт аккаунтов",
    export_accounts_btn: "Экспортировать аккаунты",
    import_accounts: "📥 Импорт аккаунтов",
    import_accounts_btn: "Импортировать аккаунты",
    import_mafiles: "🔑 Импорт .maFile файлов",
    import_mafiles_folder: "Импорт папки с .maFile",
    import_mafiles_individual: "Импорт отдельных .maFile",
    close: "Закрыть",
    
    // Заголовки страниц
    statistics_title: "NEO-Stat Панель",
    trading_title: "LOST - Интерфейс торговли",
    
    // Статистика
    back: "← Назад",
    statistics_header: "📊 LOST — Статистика",
    statistics_subtitle: "Анализ аккаунтов, прибылей и активности",
    total_income: "Общий доход",
    total_expenses: "Общие расходы",
    net_profit: "Чистая прибыль",
    income_dynamics: "📈 Динамика доходов",
    accounts_comparison: "📊 Сравнение аккаунтов",
    weekly_income: "📅 Недельные доходы",
    
    // Навигация main.html
    change_password: "Изменить пароль",
    auto_link: "Авто-связь",
    
    // Графики и тултипы
    chart_tooltip_trades: "Трейдов",
    chart_tooltip_items: "Предметов",
    chart_tooltip_value: "Стоимость",
    chart_tooltip_date: "Дата",
    chart_tooltip_account: "Аккаунт",
    
    // Сообщения поиска
    search_no_results: "Ничего не найдено",
    search_results_found: "Найдено результатов",
    
    // Инвентарь
    inventory_loading: "Загрузка инвентаря...",
    inventory_empty: "Инвентарь пуст",
    inventory_value: "Стоимость инвентаря",
    
    // Карточки аккаунтов
    account_no_name: "Без названия",
    no_drops: "Нет дропов",
    click_to_get: "Нажмите для получения",
    transfer_skins_global: "Передать скины глобально",
    farmed: "Отфармлен",
    not_farmed: "Не отфармлен",
    remove_prime: "Удалить Prime",
    until_prime: "До Prime: через",
    days: "дней",
    set_prime: "Установить Prime",
    mafile_path: "Путь к maFile",
    trade_url: "Трейд-ссылка (Trade URL)",
    trade_url_copied: "🔗 Трейд-ссылка скопирована",
    name_placeholder: "Имя",
    login_placeholder: "Login",
    password_placeholder: "Password",
    total_income: "💰 Общий доход:",
    weekly_income: "➕ Доход за неделю:",
    add_weekly: "➕ Добавить",
    total_expenses: "💸 Общие расходы:",
    net_profit_label: "💹 Чистая прибыль:",
    copy_code: "Копировать код",
    refresh_drop: "Обновить дроп",
    total_price: "Всего:",
    currency_uah: "грн",
    
    // История
    history_title: "📜 История операций",
    history_empty: "История пуста",
    history_date: "Дата",
    history_action: "Действие",
    history_account: "Аккаунт",
    history_description: "Описание",
    history_amount: "Сумма",
    filter_all_operations: "Все операции",
    filter_income: "Доходы",
    filter_expenses: "Расходы",
    filter_drops: "Дропы",
    
    // Портфолио дополнительные
    portfolio_title: "💼 Портфолио",
    portfolio_inventory_title: "📊 Портфолио Инвентаря",
    portfolio_summary: "Общая информация",
    portfolio_accounts: "Аккаунты с инвентарем",
    portfolio_total_value: "Общая стоимость",
    portfolio_items_count: "Всего предметов",
    portfolio_accounts_count: "Активных аккаунтов",
    portfolio_average_value: "Средняя стоимость",
    load_all_inventories: "Загрузить все инвентари",
    auto_on_startup: "Авто при старте",
    refresh: "Обновить",
    total_profit: "Общая прибыль",
    total_value: "Общая стоимость",
    total_items: "Всего предметов",
    active_accounts_count: "Активных аккаунтов",
    average_item_price: "Средняя цена предмета",
    game_csgo: "CS:GO",
    game_tf2: "Team Fortress 2",
    items_word: "предметов",
    more_items: "Еще предметов",
    tradeable: "Можно обменять",
    not_tradeable: "Заблокировано",
    
    // Копирование и сообщения
    login_copied: "� Логин скопирован",
    password_copied: "� Пароль скопирован", 
    get_drops: "Получить дропы",
    load_full_inventory: "Загрузить полный инвентарь",
    price_no_price: "Без цены",
    update_button: "Обновить",
    
    // Дополнительные переводы карточек
    last_drops: "Последние дропы",
    copy_2fa: "Копировать 2FA",
    copy_trade_link: "Копировать трейд-ссылку",
    total_drops_price: "Всего",
    refresh_drops: "Обновить дропы",
    copy_drop_price: "Копировать цену",
    steam_inventory: "Steam инвентарь",
    no_trade_url: "Нет трейд-ссылки",
    farming_status: "Фармится",
    not_farming_status: "Не фармится",
    copied_to_clipboard: "Скопировано в буфер обмена",
    login_copied: "Логин скопирован",
    password_copied: "Пароль скопирован",
    code_2fa_copied: "2FA код скопирован",
    
    trading: "Трейды",
    history: "История",
    portfolio: "Портфолио",
    reset: "Сбросить",
    
    // Trading.html
    trade_management: "📈 Trade Management",
    trade_subtitle: "💼 Управление трейдами Steam",
    back_to_accounts: "🏠 Вернуться к аккаунтам",
    account_login: "💻 Вход в аккаунт",
    load_accounts: "🔄 Загрузить аккаунты",
    select_account: "👤 Выберите аккаунт",
    loading_accounts: "Загрузка аккаунтов...",
    login_steam: "Войти в Steam",
    logged_in_as: "Вошли как:",
    logout: "Выйти",
    active_trades: "Активные сделки",
    history: "История",
    no_active_trades: "Нет активных сделок",
    login_to_view_trades: "Войдите в аккаунт чтобы просмотреть трейды",
    history_empty: "История пуста",
    completed_trades_here: "Здесь будут отображаться завершённые сделки",
    no_trades_to_process: "В данный момент нет трейдов для обработки",
    
    // Сообщения об ошибках
    error_loading_accounts: "Ошибка загрузки аккаунтов",
    error_account_login: "Ошибка входа в аккаунт",
    error_loading_trades: "Ошибка загрузки трейдов",
    error_accepting_trade: "Ошибка при принятии трейда",
    error_declining_trade: "Ошибка при отклонении трейда",
    error_reading_mafile: "Ошибка чтения maFile",
    error_login: "Ошибка входа",
    error_loading: "Ошибка загрузки",
    
    // Кнопки действий в трейдинге
    accept_trade: "Принять",
    decline_trade: "Отклонить",
    trade_not_found: "Трейд не найден!",
    accepting_trade: "Принятие трейда...",
    declining_trade: "Отклонение трейда...",
    trade_accepted_success: "Трейд успешно принят!",
    trade_declined_success: "Трейд успешно отклонён!",
    login_success: "Успешно вошли как",
    
    // Сообщения об ошибках файлов
    error_reading_file: "Ошибка чтения файла:",
    file_not_selected: "Файл не выбран.",
    mafiles_folder_not_initialized: "Папка maFiles не инициализирована. Попробуйте перезапустить приложение.",
    error_copying_file: "Ошибка копирования файла:",
    mafile_not_found: "maFile не найден!",
    error_reading_mafile: "Ошибка при чтении maFile:",
    
    // Модальное окно смены пароля
    change_password_title: "Смена пароля",
    
    // Портфолио сообщения
    portfolio_updated: 'Портфолио обновлено',
    portfolio_error_calculation: 'Ошибка расчета портфолио',
    portfolio_loading_error: 'Ошибка загрузки для',
    portfolio_auto_load_completed: 'Завершена автозагрузка. Успешно:',
    portfolio_auto_load_errors: 'Ошибок:',
    nothing_to_copy: 'Нечего копировать',
    no_drops_to_copy: 'Нет дропов для копирования',
    login_password_required: 'Нужно указать логин и пароль для аккаунта',
    no_drops_info_found: 'Не удалось найти информацию о дропах или инвентарь пуст',
    no_inventory_info_found: 'Не удалось найти информацию об инвентаре или инвентарь пуст',
    
    // Загрузка инвентарей
    loading_all_inventories: 'Загрузка инвентарей для всех аккаунтов...',
    no_accounts_with_credentials: 'Нет аккаунтов с настроенными данными для входа',
    loading_inventory_account: 'Загрузка инвентаря',
    inventories_loaded_success: 'Загружены инвентари для',
    accounts_word: 'аккаунтов',
    errors_word: 'ошибок',
    no_inventories_loaded: 'Не удалось загрузить ни один инвентарь',
    
    // Дропы и инвентари
    drops_updated_for: 'Дропы обновлены для',
    inventory_updated: 'Инвентарь обновлен!',
    mafile_not_found_for: 'maFile не найден для аккаунта',
    checked_paths: 'Проверено:',
    loaded_items: 'Загружено',
    items_word_genitive: 'предметов',
    total_cost: 'Общая стоимость',
    currency_uah_short: 'грн',
    inventory_not_loaded: 'Инвентарь не загружен',
    file_uploaded_successfully: 'Файл успешно загружен',
    file_uploaded_via_ipc: 'Файл успешно загружен через IPC',
    account_loading: 'Загружается инвентарь аккаунта',
    
    // Трансфер предметов
    no_cs2_tf2_inventory: 'У аккаунта нет инвентаря CS2 или TF2 для переброски!',
    no_cs2_inventory: 'У аккаунта нет инвентаря CS2 для переброски!',
    
    // Файловые операции
    select_accounts_file: 'Выберите файл с аккаунтами для импорта...',
    select_history_file: 'Выберите файл с историей торговли для импорта...',
    select_mafiles_folder: 'Выберите папку с .maFile файлами для импорта...',
    select_mafiles: 'Выберите .maFile файлы для импорта...',
    select_save_location: 'Выберите место для сохранения файла...',
    
    // Переименование и файловые операции
    renaming_mafiles: 'Переименовываем .maFile файлы...',
    mafiles_path_not_initialized: 'Путь к папке maFiles не инициализирован',
    mafiles_folder_not_exists: 'Папка maFiles не существует',
    no_accounts_for_renaming: 'Нет учетных записей для переименования файлов',
    critical_renaming_error: 'Критическая ошибка переименования',
    starting_mafiles_renaming: 'Запускается переименование .maFile файлов...',
    renaming_error: 'Ошибка переименования',
    
    // Автозагрузка и настройки
    auto_loading_at_startup: 'Автозагрузка при старте',
    auto_loading_enabled: 'включена',
    auto_loading_disabled: 'отключена',
    global_trade_link_saved: 'Глобальная трейд-ссылка сохранена!',
    global_trade_link_not_specified: 'Глобальная трейд-ссылка не указана!',
    all_skins_sent: 'Все скины отправлены!',
    error_general: 'Ошибка',
    
    // Обновление портфолио
    updating_portfolio: 'Обновление портфолио...',
    current_password: "Текущий пароль",
    new_password: "Новый пароль",
    confirm_password: "Подтверждение",
    enter_current_password: "Введите текущий пароль",
    enter_new_password: "Введите новый пароль",
    confirm_new_password: "Подтвердите новый пароль",
    
    // Формы и кнопки
    username: "Логин",
    password: "Пароль",
    shared_secret: "Shared Secret",
    identity_secret: "Identity Secret",
    device_id: "Device ID",
    steam_id: "Steam ID",
    save: "Сохранить",
    cancel: "Отменить",
    edit: "Редактировать",
    delete: "Удалить",
    farm: "ФАРМ",
    unfarm: "СТОП",
    
    // Статусы
    online: "Онлайн",
    offline: "Оффлайн",
    farming: "Фармлю",
    not_farming: "Не фармлю",
    
    // Сообщения
    account_added: "Аккаунт добавлен",
    account_updated: "Аккаунт обновлен",
    account_deleted: "Аккаунт удален",
    farming_started: "Фарм запущен",
    farming_stopped: "Фарм остановлен",
    
    // Настройки
    language: "Язык",
    theme: "Тема",
    notifications: "Уведомления",
    auto_updates: "Автообновление",
    
    // Статистика
    total_accounts: "Всего аккаунтов",
    farming_accounts: "Фармят",
    online_accounts: "Онлайн",
    total_hours: "Всего часов",
    today_hours: "Сегодня часов",
    estimated_profit: "Ожидаемая прибыль",
    
    // Модальные окна
    account_details: "Детали аккаунта",
    account_settings: "Настройки аккаунта",
    confirm_delete: "Подтвердить удаление",
    delete_account_text: "Вы уверены, что хотите удалить этот аккаунт?",
    confirm: "Подтвердить",
    
    // Карточки аккаунтов
    account_status: "Статус аккаунта",
    last_seen: "Последний раз онлайн",
    farming_time: "Время фармления",
    drops_earned: "Получено дропов",
    steam_level: "Уровень Steam",
    games_count: "Количество игр",
    profile_name: "Имя профиля",
    account_actions: "Действия с аккаунтом",
    view_profile: "Просмотреть профиль",
    manage_account: "Управление аккаунтом",
    
    // Портфолио
    portfolio_value: "Стоимость портфеля",
    items_count: "Количество предметов",
    most_valuable: "Самый дорогой предмет",
    recent_items: "Последние предметы",
    inventory_worth: "Стоимость инвентаря",
    market_trend: "Тренд рынка",
    price_change: "Изменение цены",
    
    // Tooltip для графиков
    chart_tooltip_accounts: "Количество аккаунтов по дням",
    chart_tooltip_income: "Доход за период",
    chart_tooltip_comparison: "Сравнение доходов аккаунтов",
    chart_tooltip_weekly: "Недельный доход",
    chart_tooltip_daily: "Дневной доход",
    chart_tooltip_monthly: "Месячный доход",
    total_drops_copied: "Общая сумма дропов скопирована",
    general_processing_error: "Общая ошибка обработки аккаунта",
    prime_status: "Статус Prime",
    check_updates: "Проверить обновления", 
    toggle_auto_load_startup: "Включить/выключить автозагрузку при запуске",
    import_export_data: "Импорт / Экспорт данных",
    import_data: "Импорт",
    export_data: "Экспорт",
    import_trade_history: "Импорт истории торговли",
    information: "Информация",
    import_accounts_info: "Добавляет новые аккаунты к существующим (дубликаты пропускаются)",
    import_history: "Импорт истории",
    import_history_info: "Заменяет текущую историю торговли",
    import_mafiles_info: "Копирует .maFile файлы в папку программы",
    export_accounts_info: "Сохраняет все аккаунты в JSON файл",
    import_accounts_error: "Ошибка импорта аккаунтов",
    import_history_error: "Ошибка импорта истории",
    import_mafiles_error: "Ошибка импорта maFiles",
    import_mafiles_folder_error: "Ошибка импорта папки maFiles",
    import_individual_mafiles_error: "Ошибка импорта отдельных maFiles",
    export_accounts_error: "Ошибка экспорта аккаунтов",
    week: "Неделя",
    income: "Доход",
    share: "Доля",
    minimum: "мин"
  },
  
  en: {
    // index.html
    app_title: "LOST — Login",
    main_title: "LOST Accounts",
    main_subtitle: "Management, farming & account security",
    password_placeholder: "Enter password",
    login_button: "🔓 Login",
    wrong_password: "❌ Wrong password!",
    config_error: "Configuration error!",
    first_run_hint: "First run? Use password:",
    created_by: "Created By",
    check_updates: "🔄 Updates",
    checking_updates: "Checking for updates...",
    update_error: "Update check error",
    downloading: "Downloading",
    
    // main.html
    main_app_title: "LOST - Steam Accounts",
    accounts: "Accounts",
    add_account: "Add Account",
    statistics: "Statistics",
    trading: "Trading",
    settings: "Settings",
    
    // Search and filters
    search_placeholder: "🔍 Search by username, name, ID or drop...",
    filter_all: "All",
    filter_farmed: "Farmed",
    filter_not_farmed: "Not farmed",
    clear_search: "Clear search",
    
    // Global elements
    global_trade_link_placeholder: "Global trade link (Trade URL for all accounts)",
    
    // Import/Export
    import_export: "📁 Import/Export",
    export_accounts: "📤 Export Accounts",
    export_accounts_btn: "Export Accounts",
    import_accounts: "📥 Import Accounts",
    import_accounts_btn: "Import Accounts",
    import_mafiles: "🔑 Import .maFile files",
    import_mafiles_folder: "Import .maFile folder",
    import_mafiles_individual: "Import individual .maFile",
    close: "Close",
    
    // Page titles
    statistics_title: "NEO-Stat Dashboard",
    trading_title: "LOST - Trading Interface",
    
    // Statistics
    back: "← Back",
    statistics_header: "📊 LOST — Statistics",
    statistics_subtitle: "Analysis of accounts, profits and activity",
    total_income: "Total Income",
    total_expenses: "Total Expenses",
    net_profit: "Net Profit",
    income_dynamics: "📈 Income Dynamics",
    accounts_comparison: "📊 Accounts Comparison",
    weekly_income: "📅 Weekly Income",
    
    // Navigation main.html
    change_password: "Change Password",
    auto_link: "Auto-Link",
    
    // Charts and tooltips
    chart_tooltip_trades: "Trades",
    chart_tooltip_items: "Items",
    chart_tooltip_value: "Value",
    chart_tooltip_date: "Date",
    chart_tooltip_account: "Account",
    
    // Search messages
    search_no_results: "No results found",
    search_results_found: "Results found",
    
    // Inventory
    inventory_loading: "Loading inventory...",
    inventory_empty: "Inventory is empty",
    inventory_value: "Inventory value",
    
    // Account cards
    account_no_name: "No name",
    no_drops: "No drops",
    click_to_get: "Click to get",
    transfer_skins_global: "Transfer skins globally",
    farmed: "Farmed",
    not_farmed: "Not farmed",
    remove_prime: "Remove Prime",
    until_prime: "Until Prime: in",
    days: "days",
    set_prime: "Set Prime",
    mafile_path: "Path to maFile",
    trade_url: "Trade URL",
    trade_url_copied: "🔗 Trade URL copied",
    name_placeholder: "Name",
    login_placeholder: "Login",
    password_placeholder: "Password",
    total_income: "💰 Total income:",
    weekly_income: "➕ Weekly income:",
    add_weekly: "➕ Add",
    total_expenses: "💸 Total expenses:",
    net_profit_label: "💹 Net profit:",
    copy_code: "Copy code",
    refresh_drop: "Refresh drop",
    total_price: "Total:",
    currency_uah: "UAH",
    
    // History
    history_title: "📜 Operations History",
    history_empty: "History is empty",
    history_date: "Date",
    history_action: "Action",
    history_account: "Account",
    history_description: "Description",
    history_amount: "Amount",
    filter_all_operations: "All operations",
    filter_income: "Income",
    filter_expenses: "Expenses",
    filter_drops: "Drops",
    
    // Portfolio additional
    portfolio_title: "💼 Portfolio",
    portfolio_inventory_title: "📊 Inventory Portfolio",
    portfolio_summary: "Summary",
    portfolio_accounts: "Accounts with inventory",
    portfolio_total_value: "Total value",
    portfolio_items_count: "Total items",
    portfolio_accounts_count: "Active accounts",
    portfolio_average_value: "Average value",
    load_all_inventories: "Load all inventories",
    auto_on_startup: "Auto on startup",
    refresh: "Refresh",
    total_profit: "Total Profit",
    total_value: "Total Value",
    total_items: "Total Items",
    active_accounts_count: "Active Accounts",
    average_item_price: "Average Item Price",
    game_csgo: "CS:GO",
    game_tf2: "Team Fortress 2",
    items_word: "items",
    more_items: "More items",
    tradeable: "Tradeable",
    not_tradeable: "Locked",
    
    // Copy and messages
    login_copied: "� Login copied",
    password_copied: "🔒 Password copied",
    get_drops: "Get drops", 
    load_full_inventory: "Load full inventory",
    price_no_price: "No price",
    update_button: "Update",
    
    // Additional card translations
    last_drops: "Last drops",
    copy_2fa: "Copy 2FA",
    copy_trade_link: "Copy trade link",
    total_drops_price: "Total",
    refresh_drops: "Refresh drops",
    copy_drop_price: "Copy price",
    steam_inventory: "Steam inventory",
    no_trade_url: "No trade URL",
    farming_status: "Farming",
    not_farming_status: "Not farming",
    copied_to_clipboard: "Copied to clipboard",
    login_copied: "Login copied",
    password_copied: "Password copied",
    code_2fa_copied: "2FA code copied",
    
    trading: "Trading",
    history: "History",
    portfolio: "Portfolio",
    reset: "Reset",
    
    // Trading.html
    trade_management: "📈 Trade Management",
    trade_subtitle: "💼 Steam Trading Management",
    back_to_accounts: "🏠 Back to Accounts",
    account_login: "💻 Account Login",
    load_accounts: "🔄 Load Accounts",
    select_account: "👤 Select Account",
    loading_accounts: "Loading accounts...",
    login_steam: "Login to Steam",
    logged_in_as: "Logged in as:",
    logout: "Logout",
    active_trades: "Active Trades",
    history: "History",
    no_active_trades: "No active trades",
    login_to_view_trades: "Login to view trades",
    history_empty: "History is empty",
    completed_trades_here: "Completed trades will be displayed here",
    no_trades_to_process: "No trades to process at the moment",
    
    // Error messages
    error_loading_accounts: "Error loading accounts",
    error_account_login: "Account login error",
    error_loading_trades: "Error loading trades",
    error_accepting_trade: "Error accepting trade",
    error_declining_trade: "Error declining trade",
    error_reading_mafile: "Error reading maFile",
    error_login: "Login error",
    error_loading: "Loading error",
    
    // Trading action buttons
    accept_trade: "Accept",
    decline_trade: "Decline",
    trade_not_found: "Trade not found!",
    accepting_trade: "Accepting trade...",
    declining_trade: "Declining trade...",
    trade_accepted_success: "Trade successfully accepted!",
    trade_declined_success: "Trade successfully declined!",
    login_success: "Successfully logged in as",
    
    // File error messages
    error_reading_file: "Error reading file:",
    file_not_selected: "No file selected.",
    mafiles_folder_not_initialized: "maFiles folder not initialized. Try restarting the application.",
    error_copying_file: "Error copying file:",
    mafile_not_found: "maFile not found!",
    error_reading_mafile: "Error reading maFile:",
    
    // Password change modal
    change_password_title: "Change Password",
    
    // Portfolio messages
    portfolio_updated: 'Portfolio updated',
    portfolio_error_calculation: 'Portfolio calculation error',
    portfolio_loading_error: 'Loading error for',
    portfolio_auto_load_completed: 'Auto-loading completed. Success:',
    portfolio_auto_load_errors: 'Errors:',
    nothing_to_copy: 'Nothing to copy',
    no_drops_to_copy: 'No drops to copy',
    login_password_required: 'Need to specify login and password for account',
    no_drops_info_found: 'Could not find drops information or inventory is empty',
    no_inventory_info_found: 'Could not find inventory information or inventory is empty',
    
    // Loading inventories
    loading_all_inventories: 'Loading inventories for all accounts...',
    no_accounts_with_credentials: 'No accounts with configured login credentials',
    loading_inventory_account: 'Loading inventory',
    inventories_loaded_success: 'Loaded inventories for',
    accounts_word: 'accounts',
    errors_word: 'errors',
    no_inventories_loaded: 'Failed to load any inventory',
    
    // Drops and inventories
    drops_updated_for: 'Drops updated for',
    inventory_updated: 'Inventory updated!',
    mafile_not_found_for: 'maFile not found for account',
    checked_paths: 'Checked:',
    loaded_items: 'Loaded',
    items_word_genitive: 'items',
    total_cost: 'Total cost',
    currency_uah_short: 'UAH',
    inventory_not_loaded: 'Inventory not loaded',
    file_uploaded_successfully: 'File uploaded successfully',
    file_uploaded_via_ipc: 'File uploaded successfully via IPC',
    account_loading: 'Loading account inventory',
    
    // Item transfer
    no_cs2_tf2_inventory: 'Account has no CS2 or TF2 inventory for transfer!',
    no_cs2_inventory: 'Account has no CS2 inventory for transfer!',
    
    // File operations
    select_accounts_file: 'Select accounts file for import...',
    select_history_file: 'Select trading history file for import...',
    select_mafiles_folder: 'Select folder with .maFile files for import...',
    select_mafiles: 'Select .maFile files for import...',
    select_save_location: 'Select save location...',
    
    // Renaming and file operations
    renaming_mafiles: 'Renaming .maFile files...',
    mafiles_path_not_initialized: 'maFiles folder path not initialized',
    mafiles_folder_not_exists: 'maFiles folder does not exist',
    no_accounts_for_renaming: 'No accounts for renaming files',
    critical_renaming_error: 'Critical renaming error',
    starting_mafiles_renaming: 'Starting .maFile files renaming...',
    renaming_error: 'Renaming error',
    
    // Auto-loading and settings
    auto_loading_at_startup: 'Auto-loading at startup',
    auto_loading_enabled: 'enabled',
    auto_loading_disabled: 'disabled',
    global_trade_link_saved: 'Global trade link saved!',
    global_trade_link_not_specified: 'Global trade link not specified!',
    all_skins_sent: 'All skins sent!',
    error_general: 'Error',
    
    // Portfolio update
    updating_portfolio: 'Updating portfolio...',
    current_password: "Current Password",
    new_password: "New Password",
    confirm_password: "Confirmation",
    enter_current_password: "Enter current password",
    enter_new_password: "Enter new password",
    confirm_new_password: "Confirm new password",
    
    // Forms and buttons
    username: "Username",
    password: "Password",
    shared_secret: "Shared Secret",
    identity_secret: "Identity Secret",
    device_id: "Device ID",
    steam_id: "Steam ID",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    farm: "FARM",
    unfarm: "STOP",
    
    // Statuses
    online: "Online",
    offline: "Offline",
    farming: "Farming",
    not_farming: "Not farming",
    
    // Messages
    account_added: "Account added",
    account_updated: "Account updated",
    account_deleted: "Account deleted",
    farming_started: "Farming started",
    farming_stopped: "Farming stopped",
    
    // Settings
    language: "Language",
    theme: "Theme",
    notifications: "Notifications",
    auto_updates: "Auto-updates",
    
    // Statistics
    total_accounts: "Total accounts",
    farming_accounts: "Farming",
    online_accounts: "Online",
    total_hours: "Total hours",
    today_hours: "Today hours",
    estimated_profit: "Estimated profit",
    
    // Modal windows
    account_details: "Account Details",
    account_settings: "Account Settings",
    confirm_delete: "Confirm Delete",
    delete_account_text: "Are you sure you want to delete this account?",
    confirm: "Confirm",
    
    // Account cards
    account_status: "Account Status",
    last_seen: "Last seen online",
    farming_time: "Farming time",
    drops_earned: "Drops earned",
    steam_level: "Steam Level",
    games_count: "Games count",
    profile_name: "Profile name",
    account_actions: "Account actions",
    view_profile: "View profile",
    manage_account: "Manage account",
    
    // Portfolio
    portfolio_value: "Portfolio value",
    items_count: "Items count",
    most_valuable: "Most valuable item",
    recent_items: "Recent items",
    inventory_worth: "Inventory worth",
    market_trend: "Market trend",
    price_change: "Price change",
    
    // Chart tooltips
    chart_tooltip_accounts: "Account count by days",
    chart_tooltip_income: "Income for period",
    chart_tooltip_comparison: "Account income comparison",
    chart_tooltip_weekly: "Weekly income",
    chart_tooltip_daily: "Daily income",
    chart_tooltip_monthly: "Monthly income",
    total_drops_copied: "Total drops amount copied",
    general_processing_error: "General account processing error",
    prime_status: "Prime Status",
    check_updates: "Check for updates",
    toggle_auto_load_startup: "Toggle auto-load on startup",
    import_export_data: "Import / Export Data",
    import_data: "Import",
    export_data: "Export",
    import_trade_history: "Import Trading History",
    information: "Information",
    import_accounts_info: "Adds new accounts to existing ones (duplicates are skipped)",
    import_history: "Import History",
    import_history_info: "Replaces current trading history",
    import_mafiles_info: "Copies .maFile files to program folder",
    export_accounts_info: "Saves all accounts to JSON file",
    import_accounts_error: "Import accounts error",
    import_history_error: "Import history error",
    import_mafiles_error: "Import maFiles error",
    import_mafiles_folder_error: "Import maFiles folder error",
    import_individual_mafiles_error: "Import individual maFiles error",
    export_accounts_error: "Export accounts error",
    week: "Week",
    income: "Income",
    share: "Share",
    minimum: "min"
  }
};

// Система управління мовами
class LanguageManager {
  constructor() {
    this.currentLanguage = this.getStoredLanguage() || 'uk';
    this.observers = [];
  }

  getStoredLanguage() {
    try {
      return localStorage.getItem('lost_language') || 'uk';
    } catch (error) {
      console.warn('Could not access localStorage:', error);
      return 'uk';
    }
  }

  setLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`Language ${lang} not found, defaulting to Ukrainian`);
      lang = 'uk';
    }
    
    this.currentLanguage = lang;
    
    try {
      localStorage.setItem('lost_language', lang);
    } catch (error) {
      console.warn('Could not save language to localStorage:', error);
    }
    
    this.notifyObservers();
    this.updatePage();
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  translate(key) {
    const translation = translations[this.currentLanguage];
    return translation[key] || translations.uk[key] || key;
  }

  addObserver(callback) {
    this.observers.push(callback);
  }

  notifyObservers() {
    this.observers.forEach(callback => callback(this.currentLanguage));
  }

  updatePage() {
    // Оновлюємо всі елементи з атрибутом data-translate
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
      const key = element.getAttribute('data-translate');
      const translation = this.translate(key);
      
      if (element.tagName === 'INPUT' && element.type === 'password') {
        element.placeholder = translation;
      } else if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Оновлюємо всі елементи з атрибутом data-translate-title
    const titleElements = document.querySelectorAll('[data-translate-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-translate-title');
      const translation = this.translate(key);
      element.title = translation;
    });

    // Оновлюємо title сторінки
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.hasAttribute('data-translate')) {
      titleElement.textContent = this.translate(titleElement.getAttribute('data-translate'));
    }

    // Оновлюємо lang атрибут
    document.documentElement.lang = this.currentLanguage;
  }

  getLanguagesList() {
    return [
      { code: 'uk', name: 'Українська', flag: '🇺🇦' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'en', name: 'English', flag: '🇺🇸' }
    ];
  }
}

// Глобальний екземпляр менеджера мов
const langManager = new LanguageManager();

// Функція для швидкого перекладу
function t(key) {
  return langManager.translate(key);
}

// Ініціалізація при завантаженні DOM
document.addEventListener('DOMContentLoaded', () => {
  langManager.updatePage();
  
  // Слухаємо зміни мови з інших сторінок
  window.addEventListener('storage', function(e) {
    if (e.key === 'lost_language') {
      langManager.currentLanguage = e.newValue;
      langManager.updatePage();
    }
  });
});
