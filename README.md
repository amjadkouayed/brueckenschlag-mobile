# Linde – Mobile

Connects seniors with (international) students for language exchange, company and cultural exchange.
Expo app, tested with Expo Go. The web app and the database schema live in `linde-web`.

## Setup

Requires Node 20+ and the Expo Go app on your phone.

```bash
npm install
cp .env.example .env.local   # then fill in Supabase URL + anon/publishable key (same project as web)
npx expo start               # scan the QR code with Expo Go
```

Never commit `.env.local`, because this repo is public.
