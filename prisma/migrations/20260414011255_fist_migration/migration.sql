-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('Common', 'Rare', 'Epic', 'Legendary');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('IN_INVENTORY', 'LISTED', 'SOLD', 'BURNED');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('BUY_PACK', 'SELL_CARD', 'INITIAL_CREDIT', 'ADMIN_ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 1000,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL,
    "sofifa_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "position" TEXT NOT NULL,
    "club" TEXT,
    "nation" TEXT,
    "image_url" TEXT,
    "sell_price" INTEGER NOT NULL DEFAULT 10,
    "pace" INTEGER,
    "shooting" INTEGER,
    "passing" INTEGER,
    "dribbling" INTEGER,
    "defending" INTEGER,
    "physical" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_definitions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "card_count" INTEGER NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pack_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_card_pool" (
    "id" UUID NOT NULL,
    "pack_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pack_card_pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_packs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pack_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),

    CONSTRAINT "user_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_opening_results" (
    "id" UUID NOT NULL,
    "user_pack_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "card_snapshot" JSONB NOT NULL,
    "position_in_pack" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pack_opening_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "source_result_id" UUID NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'IN_INVENTORY',
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "Type" NOT NULL DEFAULT 'ADMIN_ADJUSTMENT',
    "amount" INTEGER NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "related_entity_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "cards_sofifa_id_key" ON "cards"("sofifa_id");

-- CreateIndex
CREATE UNIQUE INDEX "pack_card_pool_pack_id_card_id_key" ON "pack_card_pool"("pack_id", "card_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_user_id_card_id_key" ON "inventory"("user_id", "card_id");

-- AddForeignKey
ALTER TABLE "pack_card_pool" ADD CONSTRAINT "pack_card_pool_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "pack_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_card_pool" ADD CONSTRAINT "pack_card_pool_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packs" ADD CONSTRAINT "user_packs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packs" ADD CONSTRAINT "user_packs_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "pack_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_opening_results" ADD CONSTRAINT "pack_opening_results_user_pack_id_fkey" FOREIGN KEY ("user_pack_id") REFERENCES "user_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_opening_results" ADD CONSTRAINT "pack_opening_results_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_source_result_id_fkey" FOREIGN KEY ("source_result_id") REFERENCES "pack_opening_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
