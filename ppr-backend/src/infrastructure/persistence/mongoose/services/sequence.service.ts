import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from '../schemas/counter.schema';

@Injectable()
export class SequenceService {
  constructor(
    @InjectModel(Counter.name)
    private readonly counterModel: Model<Counter>,
  ) {}

  async next(key: string): Promise<number> {
    const updated = await this.counterModel.findOneAndUpdate(
      { key },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return updated.seq;
  }
}