import { Test, TestingModule } from '@nestjs/testing';
import { UserPackController } from './user-pack.controller';

describe('UserPackController', () => {
  let controller: UserPackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPackController],
    }).compile();

    controller = module.get<UserPackController>(UserPackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
