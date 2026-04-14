import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User } from 'src/generated/prisma/client.js';
import { PrismaService } from 'src/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {

  constructor(private readonly prisma: PrismaService) {}
  async createUser(createUserDto: CreateUserDto):Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });
    if (existingUser) {
      throw new Error('Email đã tồn tại');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);
    return await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        username: createUserDto.username,
        role: Role.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
