import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, Role, Type, User } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
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

  async getUserById(
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
}
