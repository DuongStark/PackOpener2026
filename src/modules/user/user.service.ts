import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma, Role, Type, User } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service.js';
import { getAllUserDto } from './dto/get-all-user.dto.js';
import { PaginatedOutput } from '../../common/constants/global.dto.js';
import { UpdateUserByAdminDto } from './dto/update-user.dto.js';
import { TransactionService } from '../transaction/transaction.service.js';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
  ) {}
  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      },
    });
    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already exists');
      }

      if (existingUser.username === createUserDto.username) {
        throw new ConflictException('Username already exists');
      }
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const { passwordHash: _, ...user } = await this.prisma.$transaction(
      async (prisma) => {
        const user = await prisma.user.create({
          data: {
            email: createUserDto.email,
            passwordHash,
            username: createUserDto.username,
            role: Role.USER,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: Type.INITIAL_CREDIT,
            amount: +1000,
            balanceBefore: 0,
            balanceAfter: 1000,
            description: 'Initial credit for new user',
          },
        });

        return user;
      },
    );

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getPublicProfile(
    id: string,
  ): Promise<Omit<
    User,
    'passwordHash' | 'role' | 'isActive' | 'deletedAt'
  > | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        email: true,
        username: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updateUser(
    id: string,
    username: string,
  ): Promise<
    Omit<
      User,
      | 'passwordHash'
      | 'role'
      | 'isActive'
      | 'deletedAt'
      | 'createdAt'
      | 'updatedAt'
    >
  > {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { username, updatedAt: new Date() },
        select: {
          id: true,
          email: true,
          username: true,
          balance: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found');
        }

        if (error.code === 'P2002') {
          throw new ConflictException('Username already exists');
        }
      }

      throw error;
    }
  }

  async deductBalance(
    userId: string,
    amount: number,
    tx: Prisma.TransactionClient,
  ): Promise<User> {
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Not found user with id ${userId}`);
    }

    if (user.balance < amount) {
      throw new BadRequestException({
        statusCode: 402,
        message: 'insufficient balance',
        required: amount,
        current: user.balance,
      });
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    return updatedUser;
  }

  async getUserBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      throw new NotFoundException(`Not found user with id ${userId}`);
    }

    return user.balance;
  }

  //admin zone
  async getAllUsers(query: getAllUserDto): Promise<PaginatedOutput> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const where: Prisma.UserWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          balance: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      data,
    };
  }

  async getUserById(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [
      totalPacksBought,
      totalPacksOpened,
      totalCardOwned,
      totalCoinSpent,
      totalCoinEarned,
    ] = await Promise.all([
      this.prisma.userPack.count({ where: { userId: id } }),
      this.prisma.userPack.count({ where: { userId: id, status: 'OPENED' } }),
      this.prisma.inventory
        .aggregate({
          where: { userId: id },
          _sum: { quantity: true },
        })
        .then((r) => r._sum.quantity ?? 0),
      this.prisma.transaction
        .aggregate({
          where: { userId: id, amount: { lt: 0 } },
          _sum: { amount: true },
        })
        .then((r) => Math.abs(r._sum.amount ?? 0)),
      this.prisma.transaction
        .aggregate({
          where: { userId: id, amount: { gt: 0 } },
          _sum: { amount: true },
        })
        .then((r) => r._sum.amount ?? 0),
    ]);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: user.balance,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        totalPacksBought,
        totalPacksOpened,
        totalCardOwned,
        totalCoinSpent,
        totalCoinEarned,
      },
    };
  }

  async updateUserByAdmin(
    id: string,
    body: UpdateUserByAdminDto,
    adminId: string,
  ): Promise<any> {
    const { role, isActive, username, balance, description } = body;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (id === adminId) {
      throw new BadRequestException('Cannot update your own admin account');
    }

    if (balance !== undefined && balance !== user.balance) {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: { balance },
        });

        await this.transactionService.create(
          {
            userId: id,
            type: Type.ADMIN_ADJUSTMENT,
            amount: balance - user.balance,
            balanceBefore: user.balance,
            balanceAfter: balance,
            description: description ?? 'Admin balance adjustment',
          },
          adminId,
          tx,
        );
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(username !== undefined && { username }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  async softDeleteUser(
    id: string,
    adminId: string,
  ): Promise<{ message: string; deletedAt: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (id === adminId) {
      throw new BadRequestException('Cannot delete your own admin account');
    }

    const now = new Date();
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: now,
      },
    });

    return {
      message: 'User soft-deleted successfully',
      deletedAt: now.toISOString(),
    };
  }
}
