import { Test, TestingModule } from '@nestjs/testing';
import { PortefeuilleController } from './portefeuille.controller';

describe('PortefeuilleController', () => {
  let controller: PortefeuilleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortefeuilleController],
    }).compile();

    controller = module.get<PortefeuilleController>(PortefeuilleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
