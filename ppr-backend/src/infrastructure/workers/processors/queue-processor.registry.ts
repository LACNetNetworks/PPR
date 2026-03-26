import { Injectable } from '@nestjs/common';
import { QueueTaskProcessor } from '../processors/queue-task.processor';
import { PokTitlesSyncProcessor } from '../processors/pok-titles-sync.processor';

@Injectable()
export class QueueProcessorsRegistry {
  constructor(private readonly pokTitles: PokTitlesSyncProcessor) {}

  getAll(): QueueTaskProcessor[] {
    return [this.pokTitles];
  }
}
