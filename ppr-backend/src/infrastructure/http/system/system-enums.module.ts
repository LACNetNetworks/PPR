import { Module } from '@nestjs/common';
import { SystemEnumController } from '../controllers/system-enums.controller';
import { SystemEnumsUseCase } from '../../../application/system/system-enums.use-case';
import { MongoosePersistenceModule } from '../../persistence/mongoose/mongoose.module';
import { TaskMongooseRepository } from '../../persistence/mongoose/repositories/task.mongoose.repository';
import { TaskRepository } from '../../../domain/tasks/task.repository';


@Module({
  imports: [MongoosePersistenceModule], 
  controllers: [SystemEnumController],
  providers: [
    SystemEnumsUseCase,
  ],
})
export class SystemEnumModule {}