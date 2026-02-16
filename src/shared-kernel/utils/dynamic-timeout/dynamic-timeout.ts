import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class DynamicTimeoutsService {
  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  addDynamicTimeouts(
    name: string,
    milliSeconds: number,
    callBackFunc: () => void,
  ) {
    const timeout = setTimeout(callBackFunc, milliSeconds);
    this.schedulerRegistry.addTimeout(name, timeout);
  }
}
