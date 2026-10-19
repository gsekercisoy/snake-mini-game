# Mini Yılan v2

Artık tam stack: **React (Vite) ön yüz + Java (Spring Boot 2.7) REST API + H2 (bellek içi) veritabanı.**
Oyun mantığı tarayıcıda (canvas), skorlar ise sunucudaki `scores` tablosunda tutulur.

## Özellikler

- Klasik yılan oyunu: hızlanma, duraklatma, WASD/yön tuşları
- Oyun sonunda oyuncu adıyla **skor sunucuya kaydedilir** (doğrulamalı: skor 0-100000, ad 1-20 karakter)
- **Skor tablosu API'den** topl-10, 10 saniyede bir öz yenileme
- Oyuncu başına en iyi 5 oyun: `GET /api/scores/{player}`

## Çalıştırma

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` — `/api` istekleri vite proxy ile 8080'e gider.

## API

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/scores` | Top-10 skor |
| POST | `/api/scores` | `{player, score, apples}` — skor kaydet |
| GET | `/api/scores/{player}` | Oyuncunun en iyi 5 + oyun sayısı |
| GET | `/api/stats` | `{totalGames, bestScore, top}` |

## Not

v1 tek dosyalık HTML sürümü git geçmişinde korunmaktadır (v1 commit'i).
