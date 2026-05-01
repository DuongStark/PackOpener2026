# Pack Design Prompt System

Tài liệu này mô tả chi tiết hướng thiết kế cho 16 pack đầu tiên của Pack Opener 2026. Mục tiêu là đủ cụ thể để:

- dùng làm prompt tạo ảnh/asset;
- chuyển thành React component bằng CSS/theme config;
- giữ 16 pack nhất quán nhưng vẫn phân biệt rõ tier;
- tránh việc pack nào cũng chỉ là đổi màu đơn giản.

## Global Art Direction

Tất cả pack nên cùng một design language: dạng gói thẻ bóng đá hình chữ nhật đứng, tỷ lệ khoảng `0.70-0.74`, bo góc vừa phải, có lớp foil/metallic, mép hàn trên dưới, pattern chìm, crest/icon trung tâm và title panel rõ ràng.

Phong cách tổng thể:

- premium football trading-card pack;
- game UI asset, không phải ảnh chụp thật;
- semi-realistic 3D render hoặc CSS-rendered card pack;
- rõ tier ngay từ cái nhìn đầu tiên;
- text ngắn, to, dễ đọc ở kích thước nhỏ;
- có chiều sâu bằng shadow, bevel, inner glow;
- không dùng logo đội bóng thật hoặc thương hiệu thật;
- không đặt ảnh cầu thủ thật trên pack phổ thông;
- pack xịn có thể dùng abstract stadium lights, crown, starburst, trophy silhouette.

Base composition:

```txt
Canvas: vertical pack centered, aspect ratio 3:4 or 0.72.
Top: small game label, icon badges, crimped foil edge.
Middle top: pack name in strong uppercase typography.
Center: tier crest/icon, shield, ball, crown, glove, boot, etc.
Bottom: card count and coin price area.
Surface: layered foil, subtle diagonal shine, embossed pattern.
Lighting: top-left key light, bottom-right shadow, controlled glow.
Background: transparent or dark neutral when used as standalone asset.
```

Reusable pack layers:

```txt
1. Outer body shape
2. Side depth / folded edge
3. Top and bottom crimped foil seals
4. Inner border stroke
5. Repeating embossed pattern
6. Diagonal shine layer
7. Main title panel
8. Central crest/icon
9. Bottom stat chips
10. Small serial code / tier code
11. Optional spark particles for premium packs
```

Typography:

- Pack name: heavy condensed uppercase, no negative letter spacing.
- Subtitle: small uppercase label, e.g. `COMMON SERIES`, `RARE SERIES`, `ELITE SERIES`.
- Numbers: bold and compact.
- Avoid long labels inside small pills.

Recommended visual hierarchy:

```txt
Pack name > central icon/crest > tier color > card count/price > decorative detail
```

## Shared Component Theme Fields

Nếu làm bằng React/CSS, mỗi pack nên có config tương tự:

```ts
type PackTheme = {
  key: string;
  name: string;
  subtitle: string;
  tierCode: string;
  primary: string;
  secondary: string;
  dark: string;
  light: string;
  accent: string;
  glow: string;
  icon: 'shield' | 'star' | 'sparkles' | 'crown' | 'boot' | 'glove' | 'wall' | 'midfield';
  material: 'matte' | 'metallic' | 'foil' | 'premium-foil';
  pattern: 'plain' | 'diagonal' | 'hex' | 'pitch' | 'stars' | 'chevrons';
  shine: 'low' | 'medium' | 'high' | 'legendary';
};
```

## Pack 1: Free Recovery Pack

Purpose:

- Cho người chơi hết tiền vẫn còn cách chơi tiếp.
- Không được nhìn quá xịn, tránh cảm giác reward lớn.
- Nên có cảm giác “basic rescue pack”, sạch, nhẹ, thân thiện.

Visual prompt:

```txt
Design a free recovery football card pack for a pack opening game.
The pack is simple but polished, using a muted charcoal and soft bronze-gray palette.
It should look like a basic emergency pack, not premium.
Use a compact vertical foil wrapper with crimped top and bottom edges.
Add a small lifeline or shield icon in the center, subtle embossed football pitch lines, and a small label reading "FREE RECOVERY".
Use restrained shine, low glow, matte foil texture, and minimal particles.
The overall feeling should be useful, humble, and reliable.
No real club logos, no player photos, no brand names, no clutter.
```

Design details:

- Colors: `#181716`, `#3a332b`, `#8a7154`, `#d7c0a1`
- Material: matte paper-foil hybrid
- Pattern: very subtle pitch-line grid
- Icon: shield + small plus/lifeline mark
- Shine: low
- Glow: almost none
- Text: `FREE RECOVERY`, subtitle `DAILY SUPPORT`

## Pack 2: Starter Pack

Purpose:

- First paid/starting pack.
- Should feel more exciting than free pack but still beginner tier.

Visual prompt:

```txt
Design a starter football card pack for a pack opening game.
The wrapper should feel accessible, clean, and beginner-friendly.
Use warm bronze, soft cream, and muted green pitch accents.
Create a vertical pack with a clear title panel reading "STARTER PACK".
Add a simple football crest icon in the center, with subtle pitch-line embossing behind it.
Use medium-low metallic shine, tidy borders, and a small beginner series label.
The pack should feel like the first real step in progression, not rare or elite.
No real team badges, no player photos, no sponsor logos.
```

Design details:

- Colors: `#2d2217`, `#8b5b31`, `#d59a5f`, `#4f7a52`
- Material: soft metallic foil
- Pattern: football pitch lines, light diagonal foil
- Icon: simple ball inside shield
- Shine: low-medium
- Text: `STARTER PACK`, subtitle `FIRST TOUCH SERIES`

## Pack 3: Bronze Pack

Purpose:

- Cheapest normal pack.
- Must look collectible, not ugly, but clearly low tier.

Visual prompt:

```txt
Design a bronze football card pack with a detailed metallic wrapper.
Use deep brown, copper, and warm bronze colors with realistic foil reflections.
The pack has crimped top and bottom seals, a beveled inner border, and subtle embossed football pattern.
Center icon is a bronze shield with a football symbol.
Title reads "BRONZE PACK" in bold uppercase.
The mood is rugged, entry-level, collectible, and game-ready.
Use controlled shine, not too many spark particles.
No real clubs, no real players, no brand marks.
```

Design details:

- Colors: `#251006`, `#5a2b12`, `#b56f37`, `#ffd7a1`
- Material: bronze metallic foil
- Pattern: diagonal foil + small circular football motifs
- Icon: shield + ball
- Shine: medium
- Text: `BRONZE PACK`, subtitle `COMMON SERIES`

## Pack 4: Bronze Plus Pack

Purpose:

- Bronze nhưng có cơ hội tốt hơn.
- Phải nhìn rõ “plus” so với Bronze Pack.

Visual prompt:

```txt
Design a Bronze Plus football card pack.
Keep the bronze identity but make it brighter and sharper than a basic bronze pack.
Use copper foil with brighter amber highlights, thin cream accent lines, and a small plus emblem.
The central crest should combine a shield, football, and plus mark.
Add slightly stronger diagonal shine and small edge sparks.
Title reads "BRONZE PLUS".
The design should say upgraded entry-level pack, not silver or gold.
No real club logos, no real player images, no external branding.
```

Design details:

- Colors: `#301307`, `#7b3b18`, `#cf8140`, `#ffe0ad`
- Material: brighter copper foil
- Pattern: diagonal streaks, plus symbols very subtle
- Icon: shield + plus
- Shine: medium-high
- Text: `BRONZE PLUS`, subtitle `UPGRADE SERIES`

## Pack 5: Silver Pack

Purpose:

- Clear jump from bronze.
- Cooler, cleaner, more technical.

Visual prompt:

```txt
Design a silver football card pack for a pack opening game.
Use brushed silver metal, cool gray, white highlights, and faint blue accents.
The wrapper should look cleaner and more refined than bronze.
Add crimped foil edges, beveled borders, and a subtle hexagonal embossed pattern.
Center icon is a silver shield with a football symbol.
Title reads "SILVER PACK" in bold uppercase.
Use crisp reflections and a cool stadium-light shine.
No real teams, no players, no brand logos.
```

Design details:

- Colors: `#20252b`, `#6b7280`, `#cbd5e1`, `#f8fafc`
- Accent: `#9cc7e8`
- Material: brushed metal foil
- Pattern: hex grid
- Icon: shield + ball
- Shine: medium
- Text: `SILVER PACK`, subtitle `STANDARD SERIES`

## Pack 6: Silver Plus Pack

Purpose:

- Silver nâng cấp, có hint lên Gold.

Visual prompt:

```txt
Design a Silver Plus football card pack.
Use a premium silver foil base with icy highlights and thin warm-gold accent lines.
The pack should feel sharper and more valuable than a normal silver pack.
Add layered crimped seals, a central shield with a plus mark, and subtle star glints.
Title reads "SILVER PLUS".
Use a polished metallic texture, medium-high shine, and clean sports UI styling.
Do not make it look fully gold or elite.
No real clubs, no real players, no sponsor marks.
```

Design details:

- Colors: `#1f2933`, `#8793a0`, `#e5e7eb`, `#fff7d6`
- Accent: pale gold `#f3d078`
- Material: polished silver foil
- Pattern: hex + thin vertical foil lines
- Icon: shield + plus
- Shine: medium-high
- Text: `SILVER PLUS`, subtitle `UPGRADE SERIES`

## Pack 7: Gold Pack

Purpose:

- Main aspirational mid-game pack.
- Looks valuable but not top-end.

Visual prompt:

```txt
Design a gold football card pack.
Use rich gold foil, dark amber shadows, and warm cream highlights.
The pack should look valuable and satisfying, with a central golden crest and football icon.
Add crimped foil edges, fine diagonal foil texture, and a strong but controlled highlight sweep.
Title reads "GOLD PACK" in bold uppercase.
The design should feel like the main premium pack, not the rarest pack in the game.
No real club logos, no player portraits, no brand names.
```

Design details:

- Colors: `#3b2504`, `#9a6412`, `#dca72b`, `#fff0a8`
- Material: gold metallic foil
- Pattern: diagonal foil + small stars
- Icon: gold shield + ball/star
- Shine: high
- Text: `GOLD PACK`, subtitle `PREMIUM SERIES`

## Pack 8: Premium Gold Pack

Purpose:

- Gold Pack nâng cấp, nhiều card hơn.
- Cần nhìn dày, sáng, có “premium”.

Visual prompt:

```txt
Design a Premium Gold football card pack.
Use a layered gold foil wrapper with deeper contrast, brighter highlights, and more ornate borders than a normal gold pack.
Add a large central crest with a football star emblem.
Use small controlled spark particles, diagonal light sweep, and embossed star pattern.
Title reads "PREMIUM GOLD".
The pack should feel richer, heavier, and more rewarding than Gold Pack, but still below Elite and Ultimate.
No real football clubs, no real players, no sponsor logos.
```

Design details:

- Colors: `#2f1b03`, `#8a560c`, `#f0b72f`, `#fff3b8`
- Accent: `#ffffff` highlights
- Material: layered gold foil
- Pattern: embossed stars + diagonal foil
- Icon: star crest
- Shine: high
- Text: `PREMIUM GOLD`, subtitle `VALUE SERIES`

## Pack 9: Rare Gold Pack

Purpose:

- Gold nhưng tập trung rare.
- Phải khác Premium Gold bằng cảm giác sắc, hiếm, ít nhưng chất.

Visual prompt:

```txt
Design a Rare Gold football card pack.
Use dark gold, black-gold contrast, and sharp luminous gold accents.
The wrapper should feel selective and rare, not just expensive.
Add angular foil panels, a central rare-star crest, and thin black enamel sections.
Use stronger edge glow and precise star glints.
Title reads "RARE GOLD".
The design should feel focused, rare, and high-value.
No real teams, no real player images, no external logos.
```

Design details:

- Colors: `#15110a`, `#5d3a08`, `#d89b1f`, `#ffef9f`
- Accent: black enamel `#080706`
- Material: black-gold foil
- Pattern: angular shards, rare star marks
- Icon: sharp star + shield
- Shine: high
- Text: `RARE GOLD`, subtitle `RARE SERIES`

## Pack 10: Mixed Value Pack

Purpose:

- Nhiều card, giá vừa.
- Không nên nhìn xịn hơn Gold, nhưng phải thấy “nhiều giá trị”.

Visual prompt:

```txt
Design a Mixed Value football card pack.
Use a multi-tier wrapper that blends bronze, silver, and muted gold panels.
The pack should feel generous and practical, with many cards inside, not elite.
Use segmented foil panels, small card-stack icon, and a clean title reading "MIXED VALUE".
Add moderate shine, clear borders, and a balanced game UI look.
No player photos, no real club logos, no sponsor branding.
```

Design details:

- Colors: `#2b211a`, `#8b5b31`, `#9ca3af`, `#d6a84d`
- Material: mixed segmented foil
- Pattern: card stack, panel divisions
- Icon: stacked cards
- Shine: medium
- Text: `MIXED VALUE`, subtitle `MULTI-TIER SERIES`

## Pack 11: Defender Pack

Purpose:

- Vị trí phòng ngự.
- Nên có cảm giác chắc chắn, mạnh, block.

Visual prompt:

```txt
Design a Defender football card pack.
Use dark steel, bronze trim, and tactical green accents.
The pack should feel strong, defensive, and solid.
Add a central shield-wall icon, angular armor-like panels, and subtle pitch-grid pattern.
Title reads "DEFENDER PACK".
Use lower glow but heavy bevels and strong shadows.
The design should communicate tackles, blocks, and defensive strength.
No real team logos, no real player photos, no brand names.
```

Design details:

- Colors: `#111827`, `#334155`, `#8b5b31`, `#4ade80`
- Material: dark metal with bronze trim
- Pattern: tactical pitch grid
- Icon: shield wall
- Shine: medium-low
- Text: `DEFENDER PACK`, subtitle `BACK LINE SERIES`

## Pack 12: Goalkeeper Pack

Purpose:

- Pack riêng cho GK, số card ít hơn.
- Phải khác biệt rõ bằng glove/net/goal visual.

Visual prompt:

```txt
Design a Goalkeeper football card pack.
Use deep teal, dark navy, white net-line accents, and small bronze details.
The wrapper should feel specialized, focused, and technical.
Add a central goalkeeper glove icon inside a shield, with subtle net pattern in the background.
Title reads "GOALKEEPER PACK".
Use cool lighting, clean foil, and controlled glow around the glove crest.
No real goalkeeper photos, no club logos, no sponsor branding.
```

Design details:

- Colors: `#061a1d`, `#0f3a40`, `#38bdf8`, `#f0c27a`
- Material: cool technical foil
- Pattern: goal net lines
- Icon: glove + shield
- Shine: medium
- Text: `GOALKEEPER PACK`, subtitle `LAST LINE SERIES`

## Pack 13: Midfielder Pack

Purpose:

- Midfield/control/playmaking.
- Nên nhìn thông minh, cân bằng, tactical.

Visual prompt:

```txt
Design a Midfielder football card pack.
Use deep green pitch tones, silver lines, and warm gold control accents.
The wrapper should feel tactical, balanced, and technical.
Add a central midfield diamond icon or pitch-control diagram inside a crest.
Use subtle passing-lane line patterns and clean foil reflections.
Title reads "MIDFIELDER PACK".
The design should communicate passing, control, and balance.
No real clubs, no real players, no sponsor marks.
```

Design details:

- Colors: `#071a12`, `#14532d`, `#a7f3d0`, `#d6a84d`
- Material: green tactical foil
- Pattern: passing lanes, pitch map lines
- Icon: midfield diamond
- Shine: medium
- Text: `MIDFIELDER PACK`, subtitle `CONTROL SERIES`

## Pack 14: Forward Pack

Purpose:

- Tấn công, tốc độ, bàn thắng.
- Nên sáng và năng lượng hơn Defender/Midfielder.

Visual prompt:

```txt
Design a Forward football card pack.
Use energetic crimson, hot orange, and gold highlights.
The wrapper should feel fast, attacking, and explosive.
Add a central boot-and-ball or striker arrow icon inside a crest.
Use diagonal speed lines, sharp foil streaks, and small goal-spark particles.
Title reads "FORWARD PACK".
The design should communicate pace, shooting, and goals.
No real player photos, no real clubs, no sponsor logos.
```

Design details:

- Colors: `#220707`, `#991b1b`, `#f97316`, `#ffd166`
- Material: high-energy foil
- Pattern: speed lines, attack arrows
- Icon: boot + ball / striker arrow
- Shine: high
- Text: `FORWARD PACK`, subtitle `ATTACK SERIES`

## Pack 15: Elite Pack

Purpose:

- High tier nhưng không phải Ultimate.
- Nhìn nghiêm túc, đắt, mạnh.

Visual prompt:

```txt
Design an Elite football card pack.
Use black enamel, deep red, and sharp gold highlights.
The wrapper should feel premium, competitive, and powerful.
Add a large central crown-shield crest, angular panels, and controlled red glow.
Use high-quality foil, black-gold trim, and precise star glints.
Title reads "ELITE PACK".
The design should feel like a high-tier pack for strong players, below Ultimate.
No real club logos, no real player photos, no sponsor branding.
```

Design details:

- Colors: `#050505`, `#3f0d0d`, `#991b1b`, `#f0b72f`
- Material: black enamel + premium foil
- Pattern: angular elite panels
- Icon: crown shield
- Shine: high
- Glow: red-gold controlled glow
- Text: `ELITE PACK`, subtitle `HIGH TIER SERIES`

## Pack 16: Ultimate Pack

Purpose:

- Pack xịn nhất.
- Phải có cảm giác rare nhất, nhưng không làm rối text.

Visual prompt:

```txt
Design the Ultimate football card pack, the highest-tier pack in a pack opening game.
Use black, deep royal purple, platinum, and radiant gold highlights.
The wrapper should feel legendary, expensive, and dramatic.
Add layered premium foil, a large crown-star crest, intense but controlled glow, and subtle stadium-light beams.
Use ornate borders, floating spark particles, and a strong diagonal light sweep.
Title reads "ULTIMATE PACK".
The design should clearly be the most prestigious pack in the collection.
No real football clubs, no real player photos, no sponsor logos, no cluttered text.
```

Design details:

- Colors: `#030303`, `#21103a`, `#5b21b6`, `#facc15`, `#f8fafc`
- Material: premium legendary foil
- Pattern: crown stars, stadium beams, ornate border
- Icon: crown + star crest
- Shine: legendary
- Glow: gold/platinum high glow
- Text: `ULTIMATE PACK`, subtitle `LEGENDARY SERIES`

## Recommended Final 16 Pack Set

Danh sách chính xác 16 pack tổng cộng:

```txt
1. Free Recovery Pack
2. Starter Pack
3. Bronze Pack
4. Bronze Plus Pack
5. Silver Pack
6. Silver Plus Pack
7. Gold Pack
8. Premium Gold Pack
9. Rare Gold Pack
10. Mixed Value Pack
11. Goalkeeper Pack
12. Defender Pack
13. Midfielder Pack
14. Forward Pack
15. Elite Pack
16. Ultimate Pack
```

Trong set này, mình cố tình không đưa `Top Rated Pack` vào bộ chính để tránh có quá nhiều pack high-tier khi data `85+` khá ít. Sau này `Top Rated Pack` có thể trở thành pack event cuối tuần.

## Design Differences Matrix

| Pack | Main Color | Material | Pattern | Icon | Shine |
|---|---|---|---|---|---|
| Free Recovery | charcoal/soft bronze | matte foil | pitch line | lifeline shield | low |
| Starter | bronze/green | soft metallic | pitch line | ball shield | low-medium |
| Bronze | bronze/copper | bronze foil | football motif | shield ball | medium |
| Bronze Plus | bright copper | copper foil | plus marks | shield plus | medium-high |
| Silver | silver/blue | brushed metal | hex | silver shield | medium |
| Silver Plus | silver/gold | polished foil | hex lines | shield plus | medium-high |
| Gold | gold/amber | gold foil | stars | gold shield | high |
| Premium Gold | rich gold | layered foil | embossed stars | star crest | high |
| Rare Gold | black/gold | enamel foil | angular shards | rare star | high |
| Mixed Value | bronze/silver/gold | segmented foil | card stack | stacked cards | medium |
| Goalkeeper | teal/navy | technical foil | goal net | glove shield | medium |
| Defender | steel/green | dark metal | tactical grid | shield wall | medium-low |
| Midfielder | green/gold | tactical foil | passing lanes | midfield diamond | medium |
| Forward | red/orange | energy foil | speed lines | boot ball | high |
| Elite | black/red/gold | enamel premium | angular panels | crown shield | high |
| Ultimate | black/purple/gold | legendary foil | crown stars | crown star | legendary |

## Optional Event Pack: Top Rated Pack

Pack này không nằm trong 16 pack chính. Nên dùng như event cuối tuần hoặc limited-time pack.

Visual prompt:

```txt
Design a Top Rated football card pack.
Use dark navy, platinum, and precise gold accents.
The wrapper should feel selective, clean, and prestigious.
Add a central rating badge icon with stars, like a top-performance seal.
Use polished foil, minimal but premium sparkles, and a refined title panel.
Title reads "TOP RATED".
The design should communicate guaranteed high quality, not quantity.
No real teams, no real players, no brand logos.
```

## Negative Prompt For All Image Generation

Use this negative prompt whenever generating pack art:

```txt
Do not include real football club logos, real player portraits, brand names, sponsor logos, copyrighted team crests, unreadable tiny text, misspelled text, extra random words, messy typography, low-resolution texture, blurry edges, cartoonish flat clipart, plastic toy look, overexposed glow, excessive particles, cluttered background, fake UI buttons, or photorealistic human faces.
```

## React/CSS Implementation Notes

Nếu render bằng code thay vì ảnh:

- Dùng cùng một base `PackCard` component.
- Theme bằng CSS variables: `--dark`, `--mid`, `--light`, `--accent`, `--glow`.
- Title, subtitle, card count, price lấy từ backend/config.
- Icon dùng SVG hoặc lucide icon nếu trong frontend đã có.
- Dùng pseudo-elements cho shine và foil:

```css
.pack::before {
  background:
    linear-gradient(115deg, transparent 35%, rgba(255,255,255,.38) 45%, transparent 55%),
    repeating-linear-gradient(132deg, rgba(255,255,255,.08) 0 1px, transparent 1px 7px);
  mix-blend-mode: screen;
}
```

- Dùng `clip-path` cho crest.
- Dùng `repeating-linear-gradient` cho crimped edge.
- Dùng `box-shadow` nhiều lớp cho bevel/inner depth.
- Không hardcode 16 component riêng; chỉ hardcode 16 theme objects.
