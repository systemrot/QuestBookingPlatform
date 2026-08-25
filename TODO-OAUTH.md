# TODO: OAuth / вход через сторонние сервисы

**Статус:** кабинетов ещё нет → сначала создать приложения у провайдеров → потом внедрение в NextAuth.  
**Зачем:** многие (как ты) не хотят регистрироваться email/паролем; для СНГ это норма.  
**Сейчас в коде:** только Credentials (email + пароль).

Как вернуться: открой этот файл или скажи «продолжи OAuth по TODO-OAUTH.md».

---

## Приоритет для НеКвест (СНГ)

| # | Провайдер | Нужен? | Зачем |
|---|-----------|--------|--------|
| 1 | **Яндекс ID** | Да, первым | Самый привычный вход в рунете |
| 2 | **VK ID** | Да | VK + ОК + Mail.ru одним SDK |
| 3 | **Telegram** | Желательно | Аудитория квестов часто в TG |
| 4 | **Google** | Опционально | Привычка / гости извне РФ |
| — | Сбер / T-ID / МТС | Позже / не надо на старте | Избыточно для квестов |

Email/пароль **оставляем** как запасной способ.

---

## Что сделать тебе (по шагам, без кода)

Пока **нет секретов в чат** — только Client ID / куда вставить. Секреты потом в `.env` локально.

### 1) Яндекс ID
1. Зайти: https://oauth.yandex.ru/  
2. «Создать новое приложение» / зарегистрировать приложение  
3. Платформы: **Веб-сервисы**  
4. Redirect URI (подставь свой домен; для локалки тоже добавь):  
   - `http://localhost:3000/api/auth/callback/yandex`  
   - `https://ТВОЙ-ДОМЕН/api/auth/callback/yandex`  
5. Права (scopes): обычно логин, имя, email (если доступно)  
6. Сохранить → появятся **ClientID** и **Client secret**  
7. Записать в заметки (потом в `.env`):  
   - `AUTH_YANDEX_ID=`  
   - `AUTH_YANDEX_SECRET=`

Доки: https://yandex.ru/dev/id/doc/

### 2) VK ID
1. Зайти: https://id.vk.com/about/business/go / https://dev.vk.com/ru/vkid  
2. Создать приложение / подключить VK ID  
3. Тип: сайт / веб  
4. Redirect / Trusted redirect URL:  
   - `http://localhost:3000/api/auth/callback/vk`  
   - `https://ТВОЙ-ДОМЕН/api/auth/callback/vk`  
   (точный path уточним при внедрении под NextAuth)  
5. Запросить доступ к базовому профилю и email (если есть)  
6. Записать: app id / protected key / client secret по инструкции VK  
7. В `.env` позже:  
   - `AUTH_VK_ID=`  
   - `AUTH_VK_SECRET=`

Важно: бери **VK ID**, не старый отдельный OAuth «только ВК».

### 3) Telegram (когда будете готовы)
1. BotFather → создать бота (или взять существующего)  
2. Настроить Login / OIDC по актуальной доке Telegram (`oauth.telegram.org` или Login Widget)  
3. Домен должен быть **HTTPS** (для прода; localhost — через туннель или виджет-исключения)  
4. Записать bot token / client id по доке  

Доки: https://core.telegram.org/bots/telegram-login и раздел OIDC у Telegram.

### 4) Google (опционально)
1. https://console.cloud.google.com/ → APIs & Services → Credentials  
2. OAuth client → Web application  
3. Authorized redirect URIs:  
   - `http://localhost:3000/api/auth/callback/google`  
   - `https://ТВОЙ-ДОМЕН/api/auth/callback/google`  
4. `.env`: `AUTH_GOOGLE_ID=` / `AUTH_GOOGLE_SECRET=`

---

## Чеклист «готово к коду»

- [x] Яндекс: Client ID + Secret в `.env`
- [x] Миграция: `User.password` nullable (OAuth)
- [ ] Яндекс: те же переменные на Vercel + redeploy
- [ ] Локально проверен вход «Войти с Яндекс ID» (кнопка на /login)
- [ ] (позже) VK ID
- [ ] (позже) SMS-вход по телефону

Формат `.env` (пример, без реальных значений):

```env
AUTH_YANDEX_ID=
AUTH_YANDEX_SECRET=
AUTH_VK_ID=
AUTH_VK_SECRET=
# AUTH_GOOGLE_ID=
# AUTH_GOOGLE_SECRET=
# TELEGRAM_...=
```

---

## Что сделает агент после ключей

- [x] Провайдер NextAuth (Яндекс)
- [x] Кнопки на `/login` и `/register`
- [x] Создание User при первом входе + связка по email
- [x] Миграция: `password` nullable для OAuth-пользователей
- [ ] Проверка localhost и Vercel
- [ ] VK ID
- [ ] Обязательный телефон перед бронированием

---

## Риски (знать заранее)

- Без **email** от провайдера сложнее связать аккаунты — заложить «привязать email» в профиле  
- Google в РФ может быть капризным — не единственная кнопка  
- Redirect URI должен **байт-в-байт** совпадать с кабинетом  
- Секреты только в `.env` / хостинге, не в git

---

*Создано из чата: соцлогин нужен, кабинетов ещё нет, опыт настройки с нуля.*
