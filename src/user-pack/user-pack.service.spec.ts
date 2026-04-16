import { Test, TestingModule } from '@nestjs/testing';
import { UserPackService } from './user-pack.service';

describe('UserPackService', () => {
  let service: UserPackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPackService],
    }).compile();

    service = module.get<UserPackService>(UserPackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
