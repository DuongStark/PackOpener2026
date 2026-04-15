# Hướng dẫn Seed Bảng `cards`

## 1. Tất cả vị trí trong FC26

CSV `FC26_20250921.csv` có đúng **12 vị trí** (cột `player_positions`):

| Vị trí | Mô tả |
|--------|-------|
| `GK`   | Thủ môn |
| `CB`   | Trung vệ |
| `LB`   | Hậu vệ trái |
| `RB`   | Hậu vệ phải |
| `LM`   | Tiền vệ trái |
| `RM`   | Tiền vệ phải |
| `CM`   | Tiền vệ trung tâm |
| `CDM`  | Tiền vệ phòng thủ |
| `CAM`  | Tiền vệ tấn công |
| `LW`   | Cánh trái |
| `RW`   | Cánh phải |
| `ST`   | Tiền đạo |

> **→ Cập nhật Prisma schema:** Thay `position VARCHAR(10)` bằng enum đầy đủ 12 giá trị bên dưới.

---

## 2. Cập nhật Prisma Schema

### 2.1 Thêm enum `Position`

```prisma
// schema.prisma

enum Position {
  GK
  CB
  LB
  RB
  LM
  RM
  CM
  CDM
  CAM
  LW
  RW
  ST
}

enum Rarity {
  COMMON
  RARE
  EPIC
  LEGEND
}
```

### 2.2 Model `Card`

```prisma
model Card {
  id         String   @id @default(uuid())
  sofifa_id  Int      @unique
  name       String
  overall    Int
  rarity     Rarity
  position   Position
  club       String?
  nation     String?
  image_url  String?
  sell_price Int      @default(10)
  pace       Int?
  shooting   Int?
  passing    Int?
  dribbling  Int?
  defending  Int?
  physical   Int?
  created_at DateTime @default(now())

  @@map("cards")
}
```

---

## 3. Chuẩn bị môi trường

### 3.1 Cài dependency

```bash
npm install csv-parse
npm install -D ts-node @types/node
```

### 3.2 Cấu hình `package.json`

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### 3.3 Đặt file CSV

```
project-root/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts          ← seed script
├── FC26_20250921.csv    ← đặt ở root, hoặc chỉnh lại đường dẫn trong seed.ts
```

---

## 4. Logic xử lý dữ liệu

### 4.1 Mapping `position`

CSV lưu nhiều vị trí cách nhau bởi dấu phẩy, ví dụ `"CAM, CM"`. Seed script lấy **vị trí đầu tiên** làm primary position — đây là vị trí chính của cầu thủ trong game.

```
"CAM, CM"  → CAM
"ST, LM"   → ST
"GK"       → GK
```

Vì CSV đã chứa đúng 12 giá trị khớp 1-1 với enum, không cần bảng alias như phiên bản cũ.

### 4.2 Tính `rarity` từ `overall`

| overall | rarity   |
|---------|----------|
| ≥ 88    | `LEGEND` |
| 83 – 87 | `EPIC`   |
| 75 – 82 | `RARE`   |
| < 75    | `COMMON` |

Điều chỉnh ngưỡng tùy game design.

### 4.3 Tính `sell_price` từ `value_eur`

```
sell_price = max(round(value_eur / 100_000), 1)
```

- Tối thiểu **1 coin** (thỏa ràng buộc `> 0`)
- Cầu thủ trẻ/dự bị có `value_eur = 0` → nhận đúng 10 coin

### 4.4 Cột `physical`

CSV dùng tên cột `physic` (không phải `physical`). Seed script đọc `row.physic` và map vào field `physical` của Prisma.

---

## 5. Seed Script (`prisma/seed.ts`)

```typescript
import { PrismaClient, Rarity, Position } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

function mapPosition(raw: string): Position {
  const first = raw.split(',')[0].trim() as Position
  return first
}

function mapRarity(overall: number): Rarity {
  if (overall >= 88) return Rarity.LEGEND
  if (overall >= 83) return Rarity.EPIC
  if (overall >= 75) return Rarity.RARE
  return Rarity.COMMON
}

function calcSellPrice(valueEur: number): number {
  return Math.max(Math.round(valueEur / 100_000), 10)
}

function toIntOrNull(val: string | undefined): number | null {
  if (!val || val === '') return null
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

async function main() {
  const csvPath = path.resolve(__dirname, '../FC26_20250921.csv')
  const raw = fs.readFileSync(csvPath, 'utf-8')

  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    cast: false,
  }) as Record<string, string>[]

  console.log(`📦 Đọc được ${rows.length} cầu thủ`)

  const BATCH = 500

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)

    await prisma.$transaction(
      batch.map((row) => {
        const overall = parseInt(row.overall, 10)
        const valueEur = parseFloat(row.value_eur) || 0

        return prisma.card.upsert({
          where: { sofifa_id: parseInt(row.player_id, 10) },
          update: {},
          create: {
            sofifa_id:  parseInt(row.player_id, 10),
            name:       row.short_name,
            overall,
            rarity:     mapRarity(overall),
            position:   mapPosition(row.player_positions),
            club:       row.club_name       || null,
            nation:     row.nationality_name || null,
            image_url:  row.player_face_url  || null,
            sell_price: calcSellPrice(valueEur),
            pace:       toIntOrNull(row.pace),
            shooting:   toIntOrNull(row.shooting),
            passing:    toIntOrNull(row.passing),
            dribbling:  toIntOrNull(row.dribbling),
            defending:  toIntOrNull(row.defending),
            physical:   toIntOrNull(row.physic),   // ← CSV dùng "physic"
          },
        })
      })
    )

    console.log(`✅ ${Math.min(i + BATCH, rows.length)}/${rows.length}`)
  }

  console.log('🎉 Seed hoàn tất!')
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

---

## 6. Chạy Seed

```bash
# Bước 1: generate Prisma Client (bắt buộc sau khi sửa schema)
npx prisma generate

# Bước 2: tạo/migrate bảng trong DB
npx prisma migrate dev --name seed_cards

# Bước 3: chạy seed
npx prisma db seed
```

Kết quả mong đợi:

```
📦 Đọc được 18405 cầu thủ
✅ 500/18405
✅ 1000/18405
...
✅ 18405/18405
🎉 Seed hoàn tất!
```

---

## 7. Kiểm tra sau seed

```bash
# Đếm tổng số cards
npx prisma studio

# Hoặc query thẳng
psql $DATABASE_URL -c "
  SELECT rarity, position, COUNT(*) 
  FROM cards 
  GROUP BY rarity, position 
  ORDER BY rarity, position;
"
```

---

## 8. Lưu ý

| Vấn đề | Giải pháp |
|--------|-----------|
| Chạy seed nhiều lần | `upsert` theo `sofifa_id` — an toàn, không duplicate |
| GK có `pace/shooting/...` thấp bất thường | Đây là data gốc từ SoFIFA, không cần xử lý thêm |
| `value_eur = 0` (cầu thủ trẻ) | Tự nhận `sell_price = 10` (minimum) |
| Thay đổi ngưỡng rarity | Chỉnh hàm `mapRarity()` trong seed.ts |
