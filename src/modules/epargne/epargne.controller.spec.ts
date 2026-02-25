import { Test, TestingModule } from '@nestjs/testing';
import { EpargneController } from './epargne.controller';

describe('EpargneController', () => {
  let controller: EpargneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpargneController],
    }).compile();

    controller = module.get<EpargneController>(EpargneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
