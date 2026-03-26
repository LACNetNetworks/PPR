import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SequenceService } from '../../persistence/mongoose/services/sequence.service';
import { TransactionRepository } from '../../../domain/transactions/transaction.repository';
import { Transaction } from '../../../domain/transactions/transaction.entity';
import { TransactionTypes } from '../../../domain/transactions/transaction-types.enum';
import { Request } from 'express';

interface TrackedRequest extends Request {
  transactionType?: TransactionTypes;
  currentUser?: { id_user?: string } | any;
}

@Injectable()
export class TransactionAuditInterceptor implements NestInterceptor {
  constructor(
    private readonly seq: SequenceService,
    private readonly txRepo: TransactionRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<TrackedRequest>();
    console.log(
      '[TX-INTERCEPTOR] IN',
      req.method,
      req.url,
    );

    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          const txType = req.transactionType;

          if (!txType) {
            return;
          }

          const currentUser = req.currentUser;
          const id_user: string | undefined = currentUser?.id_user;

          const body = (req.body as any) || {};
          const params = (req.params as any) || {};

          const id_project: string | undefined =
            body.id_project || params.projectId || params.id_project || undefined;

          const id_phase_project: string | undefined =
            body.id_phase_project || params.id_phase_project || undefined;

          const id_phase_project_task: string | undefined =
            body.id_phase_project_task || params.id_phase_project_task || undefined;

          const comment: string | undefined =
            body.comment || body.description || undefined;

          const now = new Date();

          const payload =
            responseBody && typeof responseBody === 'object'
              ? responseBody.data ?? responseBody
              : responseBody;

          const result_transaction = JSON.stringify(payload ?? null);

          const nextNumber = await this.seq.next('transactions');
          const id_transaction = `tx_${String(nextNumber).padStart(4, '0')}`;

          const tx = new Transaction(
            id_transaction,
            id_project ?? 'n/a',
            id_user ?? 'unknown',
            result_transaction,
            now,
            txType,
            id_phase_project,
            id_phase_project_task,
            comment,
          );

          await this.txRepo.save(tx);
        } catch (err) {
          // nunca romper la request por fallo de auditoría
          // console.error('[TX-INTERCEPTOR] error al registrar transaction', err);
        }
      }),
    );
  }
}