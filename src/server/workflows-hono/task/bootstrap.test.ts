// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureTaskDispatchSchedule } from './bootstrap';

describe('ensureTaskDispatchSchedule', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the 10-minute dispatch schedule with a stable scheduleId', async () => {
    const create = vi.fn().mockResolvedValue({ scheduleId: 'task-schedule-dispatch' });

    await ensureTaskDispatchSchedule({
      appUrl: 'https://app.example.com/',
      enabled: true,
      qstash: {
        schedules: {
          create,
        },
      },
    });

    expect(create).toHaveBeenCalledWith({
      body: JSON.stringify({}),
      cron: '*/10 * * * *',
      destination: 'https://app.example.com/api/workflows/task/schedule-dispatch',
      headers: {
        'Content-Type': 'application/json',
      },
      label: 'task-schedule-dispatch',
      method: 'POST',
      scheduleId: 'task-schedule-dispatch',
    });
  });

  it('skips schedule creation when task queue runtime is disabled', async () => {
    const create = vi.fn();

    await ensureTaskDispatchSchedule({
      appUrl: 'https://app.example.com',
      enabled: false,
      qstash: {
        schedules: {
          create,
        },
      },
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('trims the trailing slash from the app url', async () => {
    const create = vi.fn().mockResolvedValue({ scheduleId: 'task-schedule-dispatch' });

    await ensureTaskDispatchSchedule({
      appUrl: 'https://app.example.com/',
      enabled: true,
      qstash: {
        schedules: {
          create,
        },
      },
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: 'https://app.example.com/api/workflows/task/schedule-dispatch',
      }),
    );
  });
});
