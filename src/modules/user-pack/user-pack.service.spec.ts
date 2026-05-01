import { Test, TestingModule } from '@nestjs/testing';
import { UserPackService } from './user-pack.service';
import { TransactionService } from '../transaction/transaction.service';
import { PackService } from '../pack/pack.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../core/database/prisma.service';
import { RandomService } from '../../core/random/random.service';
import { PackStatus, Type } from '../../generated/prisma/enums';
import { ConflictException } from '@nestjs/common';

describe('UserPackService', () => {
  let service: UserPackService;
  let prisma: {
    userPack: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let packService: { findPackPrices: jest.Mock };
  let userService: { deductBalance: jest.Mock };
  let transactionService: { create: jest.Mock };

  beforeEach(async () => {
    prisma = {
      userPack: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    packService = { findPackPrices: jest.fn() };
    userService = { deductBalance: jest.fn() };
    transactionService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPackService,
        { provide: TransactionService, useValue: transactionService },
        { provide: PackService, useValue: packService },
        { provide: UserService, useValue: userService },
        { provide: PrismaService, useValue: prisma },
        { provide: RandomService, useValue: {} },
      ],
    }).compile();

    service = module.get<UserPackService>(UserPackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('allows a free pack when the user has not claimed it recently', async () => {
    packService.findPackPrices.mockResolvedValue([0, 'Free Recovery Pack']);
    prisma.userPack.findMany.mockResolvedValue([]);
    userService.deductBalance.mockResolvedValue({ balance: 300 });
    prisma.userPack.create.mockResolvedValue({
      id: 'user-pack-id',
      status: PackStatus.PENDING,
    });

    await expect(service.buyPack('pack-id', 'user-id')).resolves.toEqual({
      userPackId: 'user-pack-id',
      packName: 'Free Recovery Pack',
      price: 0,
      newBalance: 300,
      status: PackStatus.PENDING,
    });
    expect(prisma.userPack.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        packId: 'pack-id',
        purchasedAt: { gte: expect.any(Date) },
      },
      orderBy: { purchasedAt: 'desc' },
      select: { purchasedAt: true },
    });
    expect(transactionService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        type: Type.BUY_PACK,
        amount: -0,
        description: 'Mua pack Free Recovery Pack',
      }),
      'user-pack-id',
      prisma,
    );
  });

  it('blocks a free pack after 10 claims within the last 24 hours', async () => {
    packService.findPackPrices.mockResolvedValue([0, 'Free Recovery Pack']);
    prisma.userPack.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => ({
        purchasedAt: new Date(Date.UTC(2026, 4, 1, 0, index, 0)),
      })),
    );

    await expect(service.buyPack('pack-id', 'user-id')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
