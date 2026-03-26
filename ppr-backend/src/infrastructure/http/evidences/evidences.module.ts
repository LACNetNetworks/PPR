import { Module } from '@nestjs/common';
import { MongoosePersistenceModule } from '../../persistence/mongoose/mongoose.module';
import { EvidencesController } from '../controllers/evidences.controller';
import { CreateEvidenceUseCase } from '../../../application/evidences/use-cases/create-evidence.usecase';
import { EvidenceRepository } from '../../../domain/evidences/evidence.repository';
import { EvidenceMongooseRepository } from '../../persistence/mongoose/repositories/evidence.mongoose.repository';
import { StorageModule } from '../../integrations/storage/storage.module';
import { EvidenceBlockchainPort } from  '../../../application/integrations/ports/evidence.blockchain.port';
import { BlockchainIntegrationModule } from '../../integrations/blockchain/blockchain.module';
import { EvidenceBlockchainClient } from 'src/infrastructure/integrations/blockchain/evidence.blockchain.client';



@Module({
  imports: [MongoosePersistenceModule,StorageModule,BlockchainIntegrationModule], 
  controllers: [EvidencesController],
  providers: [
    CreateEvidenceUseCase,
    EvidenceMongooseRepository,
    { provide: EvidenceRepository, useExisting: EvidenceMongooseRepository },

  ],
  exports: [CreateEvidenceUseCase,EvidenceRepository],
})
export class EvidencesModule {}