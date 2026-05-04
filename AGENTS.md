# PackOpener - Agent Instructions

## Quick Commands

```bash
npm run start:dev       # Development server with hot reload
npm run lint             # Lint and fix
npm run build            # Build for production
npm run test             # Run unit tests
npm run seed:all        # Seed database (cards + packs)
```

## Architecture

- **Framework**: NestJS with Clean Architecture
- **ORM**: Prisma (generated types in `src/generated/prisma/`)
- **Modules**: `src/modules/` - each feature is a module (user-pack, inventory, pack, card, admin, auth, etc.)
- **Database**: PostgreSQL with Prisma migrations

## Key Patterns

- **Prisma**: Use imported types from `src/generated/prisma/enums.js` for enums like `PackStatus.OPENED`
- **Auth**: JWT via `JwtAuthGuard` in `src/common/guards/`
- **User context**: Get from `@Req() req` with `req.user.id`
- **Admin routes**: All in `src/modules/admin/` with prefix `/admin/`

## Testing

- Tests are co-located (e.g., `user-pack.service.spec.ts`)
- Run single test: `npm test -- user-pack.service.spec.ts`

## Generated Code

- Prisma client is generated - don't edit files in `src/generated/prisma/`
- Run `npx prisma generate` after schema changes