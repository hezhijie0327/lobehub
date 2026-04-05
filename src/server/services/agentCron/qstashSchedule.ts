import { appEnv } from '@/envs/app';
import { qstashClient } from '@/libs/qstash';

const JOB_TICK_CRON = '*/15 * * * *';
const JOB_SCHEDULE_ID_PREFIX = 'cron-job';

const buildExecuteUrl = (): string => {
  // QStash is an external service and must call a publicly reachable URL.
  // Do not use INTERNAL_APP_URL here because it may be private/localhost.
  const baseUrl = appEnv.APP_URL || appEnv.INTERNAL_APP_URL;

  return new URL('/api/agent/cron/execute', baseUrl).toString();
};

export const getCronJobScheduleId = (jobId: string): string => {
  return `${JOB_SCHEDULE_ID_PREFIX}-${jobId}`;
};

export const upsertCronJobSchedule = async (jobId: string): Promise<string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward Vercel deployment protection bypass header to destination endpoint
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  }

  const response = await qstashClient.schedules.create({
    body: JSON.stringify({ jobId }),
    cron: JOB_TICK_CRON,
    destination: buildExecuteUrl(),
    headers,
    method: 'POST',
    retries: 3,
    scheduleId: getCronJobScheduleId(jobId),
  });

  return response.scheduleId;
};

export const deleteCronJobSchedule = async (jobId: string): Promise<void> => {
  const scheduleId = getCronJobScheduleId(jobId);
  try {
    await qstashClient.schedules.delete(scheduleId);
  } catch (error) {
    // Idempotent delete: ignore not-found schedule
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('404') || message.toLowerCase().includes('not found')) {
      return;
    }

    throw error;
  }
};
