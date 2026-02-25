import { Test, TestingModule } from '@nestjs/testing';
import { EpargneService } from './epargne.service';

describe('EpargneService', () => {
  let service: EpargneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EpargneService],
    }).compile();

    service = module.get<EpargneService>(EpargneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
