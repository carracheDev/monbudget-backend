import { Test, TestingModule } from '@nestjs/testing';
import { ParametresController } from './parametres.controller';

describe('ParametresController', () => {
  let controller: ParametresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParametresController],
    }).compile();

    controller = module.get<ParametresController>(ParametresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
