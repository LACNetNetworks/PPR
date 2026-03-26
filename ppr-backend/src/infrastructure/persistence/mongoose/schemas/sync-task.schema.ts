// sync-task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SyncTaskDocument = SyncTask & Document;
export type SyncTaskStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'RETRY' | 'FAILED';

@Schema({ timestamps: true, collection: 'sync_tasks' })
export class SyncTask {
  @Prop({ required: true })
  jobId!: string;

  @Prop({ required: true, default: 'PENDING' })
  status!: SyncTaskStatus;

  @Prop({ required: true, default: 0 })
  attempts!: number;

  @Prop({ required: true, default: () => new Date() })
  nextRunAt!: Date;

  // locking (para que no la agarren dos workers)
  @Prop()
  lockedBy?: string;

  @Prop()
  lockExpiresAt?: Date;

  @Prop({ type: Object, required: true })
  payload!: {
    email: string;         // para ensure user
    vcHash: string;        // idempotencia del título
    externalRef: string;   // id para bajar el archivo del título
    vc?: any;              // opcional: guardá el VC si te sirve
  };

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  dedupeKey!: string;

  @Prop()
  lastError?: string;

  @Prop({ type: Object })
  result?: {
    id_user?: string;
    evidenceId?: string;
    txHash?: string;
    fileUri?: string;
  };
}

export const SyncTaskSchema = SchemaFactory.createForClass(SyncTask);

//SyncTaskSchema.index({ jobId: 1, 'payload.vcHash': 1 }, { unique: true });
SyncTaskSchema.index({ status: 1, nextRunAt: 1, lockExpiresAt: 1 });
SyncTaskSchema.index({ type: 1, dedupeKey: 1 }, { unique: true }); 
SyncTaskSchema.index({ type: 1, status: 1, nextRunAt: 1, lockExpiresAt: 1 });