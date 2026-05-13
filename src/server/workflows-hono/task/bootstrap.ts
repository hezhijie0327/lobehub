import debug from 'debug';

import { appEnv } from '@/envs/app';
import { qstashClient } from '@/libs/qstash';

const log = debug('lobe-server:workflows:task:bootstrap');

const TASK_DISPATCH_SCHEDULE_ID = 'task-schedule-dispatch';
const TASK_DISPATCH_CRON = '*/10 * * * *';
const TASK_DISPATCH_PATH = '/api/workflows/task/schedule-dispatch';

interface TaskDispatchScheduleCreateRequest {
  body?: BodyInit;
  cron: string;
  destination: string;
  headers?: HeadersInit;
  label?: string;
  method?: 'POST';
  scheduleId?: string;
}

interface TaskDispatchQStashClient {
  schedules: {
    create: (request: TaskDispatchScheduleCreateRequest) => Promise<{ scheduleId: string }>;
  };
}

export interface EnsureTaskDispatchScheduleOptions {
  appUrl?: string;
  enabled?: boolean;
  qstash?: TaskDispatchQStashClient;
}

let ensureDefaultSchedulePromise: Promise<void> | null = null;

const ensureTaskDispatchScheduleInternal = async (
  options: EnsureTaskDispatchScheduleOptions,
): Promise<void> => {
  const enabled = options.enabled ?? appEnv.enableQueueAgentRuntime;
  if (!enabled) return;

  const appUrl = options.appUrl ?? appEnv.APP_URL ?? appEnv.INTERNAL_APP_URL;
  if (!appUrl) {
    throw new Error('APP_URL is required to create the task dispatch QStash schedule');
  }

  const client = options.qstash ?? qstashClient;
  const destination = `${appUrl.replace(/\/$/, '')}${TASK_DISPATCH_PATH}`;

  await client.schedules.create({
    body: JSON.stringify({}),
    cron: TASK_DISPATCH_CRON,
    destination,
    headers: {
      'Content-Type': 'application/json',
    },
    label: TASK_DISPATCH_SCHEDULE_ID,
    method: 'POST',
    scheduleId: TASK_DISPATCH_SCHEDULE_ID,
  });

  log(
    'Ensured task dispatch schedule id=%s cron=%s destination=%s',
    TASK_DISPATCH_SCHEDULE_ID,
    TASK_DISPATCH_CRON,
    destination,
  );
};

export const ensureTaskDispatchSchedule = (
  options: EnsureTaskDispatchScheduleOptions = {},
): Promise<void> => {
  if (Object.keys(options).length > 0) {
    return ensureTaskDispatchScheduleInternal(options);
  }

  if (ensureDefaultSchedulePromise) return ensureDefaultSchedulePromise;

  ensureDefaultSchedulePromise = ensureTaskDispatchScheduleInternal(options).catch((error) => {
    ensureDefaultSchedulePromise = null;
    throw error;
  });

  return ensureDefaultSchedulePromise;
};
