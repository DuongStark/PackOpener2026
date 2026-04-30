# Pack Opener Game Backend API

**An Enterprise-Grade Football Card Collection System** *Built with NestJS, Prisma, and PostgreSQL*

---

## Project Overview
**Pack Opener Game** is a comprehensive Backend system designed for a web-based football card simulation. Beyond standard CRUD operations, this project tackles complex engineering challenges such as **Game Economy Balancing**, **Concurrent Transaction Handling**, and **Provably Fair Randomness**.

The system enables a seamless core loop for users:
> **Purchase Pack ➔ Open Pack ➔ Manage Inventory ➔ Liquidate Assets ➔ Reinvest**.

---

## Tech Stack & Architecture
The project is built with a **Clean Architecture** mindset and an **N-Layer Pattern**, ensuring the system is decoupled, testable, and scalable.

* **Core Framework:** **NestJS (Node.js)** – Leveraging Dependency Injection and a Modular system for high maintainability.
* **Database & ORM:** **PostgreSQL** with **Prisma ORM** for type-safe queries and robust schema migrations.
* **Real-time Interaction:** **Socket.IO** (WebSockets) to handle the sequence of "The Reveal" and real-time state updates.
* **Security:** **JWT-based Authentication** with **Passport.js** and Role-Based Access Control (**RBAC**) to distinguish between Users and Admins.

---

## Technical Highlights

### 1. Atomic Financial Transactions
All economic actions (Purchasing packs, Selling cards) are wrapped in **Database Transactions**. 
* Implemented **Pessimistic Locking** (`SELECT FOR UPDATE`) to prevent race conditions during high-concurrency balance updates.
* Enforced a "Strict Zero-Floor" policy: **Balances can never drop below zero**.

### 2. Cryptographic Weighted Randomness
The card-dropping logic is not just a simple `Math.random()`.
* **Cryptographically Secure:** Uses `crypto.randomBytes` to generate entropy, ensuring pack results are unpredictable and tamper-proof.
* **Weighted Probability Engine:** A custom-built engine calculates card drops based on rarity weights (Common to Legendary) defined in the dynamic Pool configuration.

### 3. Absolute Idempotency
The **Pack Opening** sequence is designed to be idempotent. If a user loses their internet connection mid-opening, the system ensures that the same request results in the same outcome, preventing duplicate charges or lost items.

### 4. Instance-based Inventory Management
Instead of simple counters, cards are managed as unique **Instances**. This allows for:
* Granular tracking of card history and ownership.
* Extensibility for future features like a **Peer-to-Peer Marketplace** or **Card Leveling** systems.

### 5. Admin Control Plane
A dedicated administrative module allows for real-time adjustments to the game economy, including:
* Dynamic Pool & Rarity weight adjustments.
* Transaction monitoring and user adjustment tools.

---
