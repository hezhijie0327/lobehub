import { Hono } from 'hono';

import agentSignalApp from './agent-signal';
import memoryUserMemoryApp from './memory-user-memory';
import taskApp from './task';
import { ensureTaskDispatchSchedule } from './task/bootstrap';

const app = new Hono().basePath('/api/workflows');

void ensureTaskDispatchSchedule().catch((error) => {
  console.error('[workflows-hono] Failed to ensure task dispatch schedule:', error);
});

app.route('/agent-signal', agentSignalApp);
app.route('/memory-user-memory', memoryUserMemoryApp);
app.route('/task', taskApp);

export default app;
