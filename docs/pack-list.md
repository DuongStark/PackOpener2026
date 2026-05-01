# Pack List

Danh sách này đang khớp với cấu hình trong `scripts/seed-packs.ts`.

| # | Pack | Giá | Số card | Tỉ lệ pool |
|---:|---|---:|---:|---|
| 1 | Free Recovery Pack | 0 | 3 | 100% `BRONZE_COMMON` |
| 2 | Starter Pack | 40 | 5 | 50% `BRONZE_COMMON`, 35% `BRONZE_RARE`, 15% `SILVER_COMMON` |
| 3 | Bronze Pack | 25 | 5 | 80% `BRONZE_COMMON`, 20% `BRONZE_RARE` |
| 4 | Bronze Plus Pack | 60 | 5 | 80% `BRONZE_RARE`, 20% `SILVER_COMMON` |
| 5 | Silver Pack | 120 | 5 | 75% `SILVER_COMMON`, 25% `SILVER_RARE` |
| 6 | Silver Plus Pack | 300 | 5 | 85% `SILVER_RARE`, 15% `GOLD_COMMON` |
| 7 | Gold Pack | 950 | 5 | 85% `GOLD_COMMON`, 15% `GOLD_RARE` |
| 8 | Premium Gold Pack | 1900 | 7 | 65% `GOLD_COMMON`, 30% `GOLD_RARE`, 5% `GOLD_EPIC` |
| 9 | Rare Gold Pack | 2600 | 5 | 90% `GOLD_RARE`, 10% `GOLD_EPIC` |
| 10 | Mixed Value Pack | 375 | 8 | 35% `BRONZE_RARE`, 35% `SILVER_COMMON`, 20% `SILVER_RARE`, 10% `GOLD_COMMON` |
| 11 | Goalkeeper Pack | 150 | 3 | 100% `GK`, overall `>= 65` |
| 12 | Defender Pack | 550 | 5 | 100% `CB/LB/RB/CDM`, overall `>= 70` |
| 13 | Midfielder Pack | 700 | 5 | 100% `CM/CDM/CAM/LM/RM`, overall `>= 70` |
| 14 | Forward Pack | 800 | 5 | 100% `ST/LW/RW/CAM`, overall `>= 70` |
| 15 | Elite Pack | 2800 | 5 | 100% overall `80-87` |
| 16 | Ultimate Pack | 7500 | 10 | 70% `GOLD_RARE`, 25% `GOLD_EPIC`, 4% `DIAMOND_COMMON`, 1% `DIAMOND_RARE` |

Lưu ý: tỉ lệ trên là tỉ lệ theo group. Trong mỗi group, script chia weight gần như đều cho các cầu thủ cùng group.
