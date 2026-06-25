# Căn cứ bí mật

Phòng chat ẩn danh realtime cho lớp học.

## Chạy ngay (không cần Supabase)

```bash
cd secret-base
npm install
npm run dev
```

Mở http://localhost:3000 — app chạy **chế độ local** (API + SSE trong Next.js).

### Chia cho cả lớp trên WiFi lớp

```bash
npm run dev:network
```

Bạn khác mở `http://<IP-máy-bạn>:3000` (VD: `http://192.168.1.30:3000`).

> Chế độ local: tin nhắn lưu trong RAM server. Tắt `npm run dev` là mất tin.

## Chat chung trên Vercel (bắt buộc 1 lần)

Vercel chạy nhiều server — **cần database chung** để mọi người thấy tin nhau.

### Cách nhanh: Upstash Redis (~2 phút)

1. Mở https://vercel.com/hihihah012/secret-base/integrations/upstash
2. Cài **Upstash for Redis** (free) → region **Singapore (sin1)**
3. Vercel tự thêm `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
4. **Deployments → Redeploy**

### Hoặc: Supabase

1. https://supabase.com → New project
2. SQL Editor → chạy `supabase/schema.sql`
3. Thêm env trên Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy

## Deploy production (Supabase — khuyến nghị)

### 1. Tạo Supabase project

1. https://supabase.com → New project (free)

### 2. Chạy SQL

SQL Editor → paste `supabase/schema.sql` → Run

### 3. Bật Realtime (nếu cần)

Database → Replication → bật `messages`

### 4. Cấu hình env

```bash
copy .env.example .env.local
```

Điền từ **Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Restart: `npm run dev`

Header sẽ hiện **Supabase** thay vì **Local**.

### 5. Deploy Vercel

**Production:** https://secret-base-navy.vercel.app

```bash
npm run deploy
```

Sau deploy, thêm env trên [Vercel Dashboard](https://vercel.com/hihihah012/secret-base/settings/environment-variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Rồi **Redeploy** — bắt buộc để chat realtime hoạt động ổn định trên production.

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Dev local |
| `npm run dev:network` | Dev + truy cập từ điện thoại cùng WiFi |
| `npm run build` | Build production |
| `npm run start` | Chạy production |

## Cấu trúc

```
src/
  app/api/messages/   → API local + SSE
  components/         → UI chat
  hooks/use-chat.ts   → Supabase hoặc local
  lib/chat/           → in-memory store (local)
supabase/schema.sql   → SQL production
```

## Lưu ý ẩn danh

Ẩn danh chỉ trên giao diện (nickname). Không gửi info cá nhân nhạy cảm.
