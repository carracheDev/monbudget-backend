import { Test, TestingModule } from '@nestjs/testing';
import { PortefeuilleService } from './portefeuille.service';

describe('PortefeuilleService', () => {
  let service: PortefeuilleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortefeuilleService],
    }).compile();

    service = module.get<PortefeuilleService>(PortefeuilleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
