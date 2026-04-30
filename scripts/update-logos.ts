import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import csv from 'csv-parser';
import 'dotenv/config';

// Khởi tạo connection với PrismaPg adapter
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Vui lòng set DATABASE_URL trong file .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Chỉnh sửa lại đường dẫn tới file CSV của bạn nếu cần
const CSV_FILE_PATH = 'players_24.csv';

async function main() {
  console.log('⏳ Đang đọc file CSV và tạo bộ từ điển mapping...');
  
  const clubMapping: Record<string, number> = {};
  const nationMapping: Record<string, number> = {};

  // 1. Đọc file CSV và lưu ID vào bộ nhớ tạm
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => {
        const clubName = data.club_name?.trim();
        const clubId = parseInt(data.club_team_id, 10);
        
        const nationName = data.nationality_name?.trim();
        const nationId = parseInt(data.nationality_id, 10);

        if (clubName && !isNaN(clubId)) clubMapping[clubName] = clubId;
        if (nationName && !isNaN(nationId)) nationMapping[nationName] = nationId;
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`✅ Đã tìm thấy ${Object.keys(clubMapping).length} Câu lạc bộ và ${Object.keys(nationMapping).length} Quốc gia trong file CSV.`);
  console.log('⏳ Đang cập nhật ảnh vào Database...');

  // 2. Lấy tất cả cards trong Database của bạn
  const cards = await prisma.cards.findMany({
    select: { id: true, club: true, nation: true }
  });

  let updatedCount = 0;

  // 3. Cập nhật URL ảnh cho từng thẻ
  // Chạy vòng lặp for...of để Prisma update tuần tự (tránh quá tải DB)
  for (const card of cards) {
    let updateData: any = {};
    let needsUpdate = false;

    if (card.club && clubMapping[card.club]) {
      const clubId = clubMapping[card.club];
      // EA CDN Format: https://cdn.sofifa.net/meta/team/{ID}/120.png
      updateData.clubImageUrl = `https://cdn.sofifa.net/meta/team/${clubId}/120.png`;
      needsUpdate = true;
    }

    if (card.nation && nationMapping[card.nation]) {
      const nationId = nationMapping[card.nation];
      // EA CDN Format: https://cdn.sofifa.net/meta/nation/{ID}/120.png
      // Lưu ý: Đôi khi CDN dùng flag code thay vì ID (nhưng dùng ID meta/nation an toàn nhất trên sofifa)
      updateData.nationImageUrl = `https://cdn.sofifa.net/meta/nation/${nationId}/120.png`;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.cards.update({
        where: { id: card.id },
        data: updateData
      });
      updatedCount++;
      if (updatedCount % 100 === 0) {
        console.log(`Đã cập nhật ${updatedCount} thẻ cầu thủ...`);
      }
    }
  }

  console.log(`🎉 Hoàn tất! Đã cập nhật logo cho ${updatedCount} thẻ cầu thủ.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
