# Безопасность ReSchool

## Уже в коде (пилот)

- Заголовки: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP, HSTS в production (`src/proxy.ts`).
- In-memory rate limit по IP для `/login`, `/register` (POST) и медиа-маршрутов.
- Единый текст ошибки входа, небольшая задержка при неверных данных.
- Пароли — bcrypt; сессия — подписанная cookie.
- Фото: лимит 5 МБ, проверка MIME и сигнатуры файла.
- Роли проверяются на сервере; раздел в `proxy` — быстрый отсев.

## Перед промышленным запуском

1. **WAF / anti-DDoS** — Cloudflare или аналог перед Next.js; не полагаться только на in-memory лимит.
2. **Rate limit** — Redis / Upstash на все инстансы; отдельные квоты на login, register, upload, server actions.
3. **Секреты** — `SESSION_SECRET` ≥ 32 символов, ротация; `DATABASE_URL` только из секрет-хранилища.
4. **Бэкапы Postgres** — ежедневные снапшоты + проверка восстановления.
5. **Хранилище фото** — объектное хранилище (S3-совместимое) вместо локального диска, подписанные URL.
6. **Мониторинг** — алерты на 429/5xx, аномальный трафик логина.
7. **Право** — согласовать `/legal/*` с юристом; журнал согласий (`consentAt` / `consentVersion`).
