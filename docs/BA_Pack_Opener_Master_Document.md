# BA Master Document - Pack Opener Game

## 1. Thong tin tai lieu

- Ten tai lieu: BA Master Document - Pack Opener Game
- Phien ban: v1.0
- Ngay cap nhat: 2026-04-10
- Trang thai: Draft for Development
- Nen tang backend: NestJS + Prisma + PostgreSQL

## 2. Tong quan san pham

### 2.1 Muc tieu san pham

Xay dung backend cho web game mo the cau thu, cho phep nguoi choi dang ky, dang nhap, mua pack, mo pack, quan ly inventory, ban the, va theo doi lich su giao dich.

### 2.2 Gia tri kinh doanh

- Tao vong lap choi game lien tuc: mua pack -> mo pack -> quan ly bo suu tap -> ban the -> tiep tuc mua pack.
- Tang kha nang giu chan nguoi choi qua co che rarity va cam giac may man.
- Tao nen tang de mo rong sang su kien, leaderboard, va premium economy.

### 2.3 KPI de xuat

- D1 retention >= 35%.
- So luong pack mo trung binh / user / ngay >= 3.
- Ty le user co phat sinh giao dich (buy/sell) >= 60% sau 7 ngay.
- Ty le loi mo pack (5xx) < 0.1%.

## 3. Stakeholder va doi tuong su dung

### 3.1 Stakeholder

- Product Owner: quyet dinh luat game va pricing.
- BA: dac ta nghiep vu, acceptance criteria, pham vi.
- Backend Developer: trien khai API va transaction logic.
- QA: test API, nghiem thu business rule, regression.
- DevOps: van hanh, giam sat, backup du lieu.

### 3.2 Persona chinh

- New Player: moi tham gia, can trai nghiem de hieu, gia pack de tiep can.
- Collector: tap trung thu thap the hiem, quan tam inventory va history.
- Trader: toi uu coin qua ban the va mua goi phu hop.

## 4. Pham vi du an

### 4.1 In-scope (MVP)

- Auth: register, login, me.
- Pack: danh sach pack, mua pack, mo pack.
- Inventory: xem bo suu tap, filter/sort/pagination.
- Sell: ban the lay coin.
- Transaction history: lich su dong coin.
- Pack opening history: lich su ket qua mo pack.
- Health check.

### 4.2 Out-of-scope (MVP)

- PvP, marketplace user-to-user.
- Su kien seasonal, mission, achievement.
- Thanh toan that (real money gateway).
- Admin CMS day du.

## 5. Gia dinh va rang buoc

### 5.1 Gia dinh

- Moi user moi duoc cap 1000 coin khoi tao.
- Tat ca thao tac coin quan trong phai atomic transaction.
- Client khong duoc truyen tham so random cho mo pack.

### 5.2 Rang buoc ky thuat

- Backend dung NestJS.
- ORM va migration thong qua Prisma.
- CSDL PostgreSQL.

## 6. Luat nghiep vu (Business Rules)

- BR-01: Email dang ky la unique.
- BR-02: Password toi thieu 6 ky tu.
- BR-03: Login tra ve JWT token co han 24h.
- BR-04: Endpoint can auth phai yeu cau JWT hop le.
- BR-05: Chi pack isActive = true moi duoc hien thi/mua.
- BR-06: Mua pack phai tru coin va tao userPack trong cung transaction.
- BR-07: Mo pack phai idempotent, userPack da mo thi tra ve ket qua cu.
- BR-08: Khong random lai ket qua cho cung mot userPack.
- BR-09: Random card dua tren weighted random tu pool cua pack.
- BR-10: Ban the phai giam inventory + cong coin + ghi transaction trong cung transaction.
- BR-11: Lich su giao dich la du lieu bat bien (khong sua/xoa).
- BR-12: Inventory phan trang voi limit mac dinh 20, toi da 100.

## 7. Yeu cau chuc nang (Functional Requirements)

### 7.1 Module Auth

- FR-AUTH-01: Dang ky tai khoan moi voi email/password.
- FR-AUTH-02: Tu choi dang ky neu email da ton tai.
- FR-AUTH-03: Dang nhap va tra access token.
- FR-AUTH-04: Lay thong tin user hien tai qua endpoint me.

### 7.2 Module Pack

- FR-PACK-01: Lay danh sach pack dang ban (public).
- FR-PACK-02: Mua pack theo packId neu user du coin.
- FR-PACK-03: Tu choi mua khi khong du coin hoac pack khong hop le.
- FR-PACK-04: Mo userPack va tra ve danh sach card nhan duoc.
- FR-PACK-05: Kiem tra quyen so huu userPack khi mo pack.
- FR-PACK-06: Dam bao idempotent khi open cung userPack.

### 7.3 Module Inventory

- FR-INV-01: Lay danh sach card user dang so huu.
- FR-INV-02: Ho tro filter theo rarity, position, search ten.
- FR-INV-03: Ho tro sort theo overall, name, rarity.
- FR-INV-04: Ho tro pagination (limit, offset).

### 7.4 Module Sell

- FR-SELL-01: Ban card theo cardId va quantity.
- FR-SELL-02: Tu choi neu user khong so huu card.
- FR-SELL-03: Tu choi neu quantity vuot qua so luong dang co.
- FR-SELL-04: Tra ve so coin nhan duoc va so du moi.

### 7.5 Module History/Transaction

- FR-HIS-01: Lay lich su giao dich coin co filter theo type.
- FR-HIS-02: Sap xep giao dich moi nhat truoc.
- FR-HIS-03: Lay lich su mo pack co snapshot card tai thoi diem mo.

### 7.6 Module System

- FR-SYS-01: Health endpoint tra ve tinh trang app va db.

## 8. API Contract Tong hop

### 8.1 Auth

- POST /auth/register: Tao tai khoan.
- POST /auth/login: Dang nhap lay JWT.
- GET /me: Lay thong tin user hien tai (JWT).

### 8.2 Pack

- GET /packs: Danh sach pack dang ban.
- POST /packs/:id/buy: Mua pack (JWT).
- POST /user-packs/:id/open: Mo pack da mua (JWT).

### 8.3 Inventory va Sell

- GET /inventory: Xem bo suu tap (JWT).
- POST /inventory/sell: Ban card lay coin (JWT).

### 8.4 History

- GET /transactions: Lich su dong coin (JWT).
- GET /history: Lich su mo pack (JWT).

### 8.5 System

- GET /health: Health check.

## 9. Mo hinh du lieu (ERD Mapping)

### 9.1 Bang chinh

- users: thong tin tai khoan va balance.
- cards: metadata the cau thu.
- pack_definitions: cau hinh pack dang ban.
- user_packs: pack user da mua.
- pack_opening_results: ket qua mo pack (snapshot).
- inventory: ton kho the cua user.
- transactions: lich su bien dong coin.
- pack_card_pool: trong so card theo tung pack.

### 9.2 Quan he chinh

- users 1-n user_packs.
- pack_definitions 1-n user_packs.
- user_packs 1-1 pack_opening_results.
- users 1-n inventory.
- cards 1-n inventory.
- users 1-n transactions.
- pack_definitions 1-n pack_card_pool.
- cards 1-n pack_card_pool.

### 9.3 Rang buoc du lieu quan trong

- users.email unique.
- cards.sofifa_id unique.
- inventory nen unique theo (user_id, card_id).
- user_packs status gom PENDING, OPENED (de xuat).
- transactions.amount co dau theo loai giao dich (de xuat quy uoc thong nhat).

## 10. Yeu cau phi chuc nang (NFR)

- NFR-01: P95 response time cho endpoint read < 300ms (khong tinh luc cao diem bat thuong).
- NFR-02: P95 response time cho open pack < 700ms.
- NFR-03: Availability muc tieu >= 99.5%/thang.
- NFR-04: Tat ca endpoint protected phai xac thuc JWT.
- NFR-05: Log day du request id, user id, endpoint, duration.
- NFR-06: Co co che global exception filter cho response loi nhat quan.
- NFR-07: Du lieu quan trong can transaction va co kha nang retry an toan.

## 11. Bao mat va tuan thu

- SEC-01: Password hash bang thuat toan an toan (bcrypt/argon2).
- SEC-02: Khong tra ve thong tin nhay cam trong response.
- SEC-03: Validate input o tat ca endpoint.
- SEC-04: Rate-limit cho auth endpoint de tranh brute-force.
- SEC-05: Kiem soat idempotency cho open pack de chong replay khong mong muon.

## 12. Luong nghiep vu trong tam

### 12.1 Luong mua va mo pack

1. User dang nhap thanh cong.
2. User goi mua pack.
3. He thong kiem tra so du va tinh hop le pack.
4. He thong tru coin + tao userPack + ghi transaction BUY_PACK (atomic).
5. User goi open userPack.
6. He thong random card theo weighted pool.
7. He thong luu opening result snapshot + cap nhat inventory + ghi log giao dich lien quan.
8. He thong tra ve danh sach card mo duoc.

### 12.2 Luong ban the

1. User chon card va quantity.
2. He thong kiem tra so huu va so luong.
3. He thong giam inventory + cong coin + ghi transaction SELL_CARD (atomic).
4. Tra ve coin nhan duoc va newBalance.

## 13. Acceptance Criteria tong hop (UAT-ready)

- AC-01: Register voi email moi tra 201, tao user thanh cong.
- AC-02: Register email trung tra 409.
- AC-03: Login dung tra 200 va co accessToken.
- AC-04: Me khong token tra 401.
- AC-05: GET /packs tra danh sach pack dang active va sort tang theo price.
- AC-06: Buy pack thanh cong lam giam balance dung gia pack.
- AC-07: Buy pack thieu coin tra 402.
- AC-08: Open pack khong thuoc user tra 403.
- AC-09: Open cung 1 userPack 2 lan cho ket qua giong nhau.
- AC-10: Inventory filter/sort/pagination cho ket qua dung.
- AC-11: Sell card cap nhat dung inventory va balance.
- AC-12: Transactions endpoint tra dung thu tu moi nhat truoc.
- AC-13: Health endpoint tra status ok va db connected.

## 14. Backlog ky thuat uu tien sau MVP

- Tich hop Passport JWT strategy va role-based authorization.
- Seed du lieu cards/pack pool tu nguon du lieu thuc te.
- Them optimistic locking hoac co che tranh race condition khi mua/mo pack.
- Bo sung observability: metrics, tracing, dashboard.
- Tao bo test e2e cho cac flow critical (buy/open/sell).

## 15. Mapping voi codebase hien tai

- Cac module domain da ton tai trong src/modules: auth, user, pack, card, inventory, transaction.
- Core da duoc bo tri theo huong dung chung: database, config, random.
- Common da duoc bo tri cho cross-cutting concern: decorator, guard, filter, interceptor, constants.

## 16. Mo rong tai lieu de ban giao

Ban co the tach file nay thanh bo tai lieu BA chuan theo bo cuc:

- BRD (Business Requirement Document)
- SRS (Software Requirement Specification)
- API Specification
- Data Dictionary
- UAT Test Scenario

Tai lieu hien tai da du thong tin cot loi de dev, QA va stakeholder lam viec thong nhat tren cung mot baseline.
