import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueRepositoryPort } from '../../application/queue/port/queue.repository.port';
import { QueueTaskProcessor } from '../workers/processors/queue-task.processor';
import { QueueProcessorsRegistry } from '../workers/processors/queue-processor.registry';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class QueueRunner {
  private readonly workerId = `worker_${process.pid}`;

  constructor(
    private readonly config: ConfigService,
    private readonly queue: QueueRepositoryPort,
    private readonly registry: QueueProcessorsRegistry, // inyectás array
  ) {}

  @Cron('*/20 * * * * *')
  async tick() {
    //if (this.config.get('SYNC_WORKER_ENABLED') !== 'true') return;

    /* const batchSize = Number(this.config.get('SYNC_TASK_BATCH_SIZE') ?? 10);
    const lockSeconds = Number(this.config.get('SYNC_LOCK_SECONDS') ?? 120);
    const concurrency = Number(this.config.get('SYNC_TASK_CONCURRENCY') ?? 3); */

    const batchSize = Number(3);
    const lockSeconds = Number(120);
    const concurrency = Number(1);
    console.log('[QueueRunner] tick', new Date().toISOString());
    // procesar por cada processor type (simple)
    for (const p of this.registry.getAll()) {
      const tasks = await this.queue.lockNextBatch({
        type: p.type,
        limit: batchSize,
        workerId: this.workerId,
        lockSeconds,
      });

      if (tasks[0]) console.log('[Runner] locked sample', tasks[0]);
      if (!tasks.length) continue;

      // concurrency limitada (simple con Promise.allSettled en chunks)
      for (let i = 0; i < tasks.length; i += concurrency) {
        const chunk = tasks.slice(i, i + concurrency);
         console.log("Inicia Tarea",i);
        await Promise.allSettled(
          chunk.map(async (t) => {
            //console.log("EL VALOR DE T",JSON.stringify(t));
            //console.log('[Runner] about to process', { id: t.id, jobId: t.jobId, type: p.type });
            try {
              console.log('[Runner] calling processor', t.id);
                
               
              const result = await p.process({ id: t.id, jobId: t.jobId, payload: t.payload });
              //console.log('[Runner] processor ok', t.id, result);
              //console.log('[Runner] markDone', t.id);
              await this.queue.markDone({ taskId: t.id, workerId: this.workerId, result });
              //console.log('[Runner] bumpJobProgress ok', t.id);
              try {
                await this.queue.bumpJobProgress({ jobId: t.jobId, processed: 1, ok: 1, failed: 0 });
              } catch (e:any) {
                //console.log('[Runner]***** bumpJobProgress success error', e?.message);
              }  
            } catch (e: any){
              //console.log('[Runner -error] PROCESSOR FAILDE', t.id, e?.message);
              //console.log('[Runner - error] markRetryOrFail', t.id);
              let finalStatus: 'RETRY' | 'FAILED' | undefined;

              try {
              finalStatus = await this.queue.markRetryOrFail({ taskId: t.id, workerId: this.workerId, error: e?.message ?? 'error' });
              } catch (marError:any) {
                  console.error('[Runner] markRetryOrFail failed', marError?.message);
              }
              
              try {
                await this.queue.bumpJobProgress({ jobId: t.jobId, processed: 1, ok: 0,  failed: finalStatus === 'FAILED' ? 1 : 0, });
              } catch (bumError:any) { 
                console.log('[Runner -  error] ##### bumpJobProgress success error', bumError?.message); 
              }  
            }
          }),
        );
        console.log("Termina la tarea------>",i);
      }

      const jobIds = [...new Set(tasks.map((t) => t.jobId))];
      for (const jobId of jobIds) await this.queue.finalizeJobIfDone({ jobId });
    }
  }
}
