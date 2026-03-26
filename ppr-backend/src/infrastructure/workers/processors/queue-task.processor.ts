export interface QueueTaskProcessor {
  type: string;
  process(task: { payload: any; jobId: string; id: string }): Promise<any>;
}
