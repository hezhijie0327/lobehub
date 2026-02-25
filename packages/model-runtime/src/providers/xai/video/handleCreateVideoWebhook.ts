import createDebug from 'debug';

import type {
  HandleCreateVideoWebhookPayload,
  HandleCreateVideoWebhookResult,
} from '../../../types/video';

const log = createDebug('lobe-video:xai:webhook');

interface XAIVideoWebhookBody {
  model?: string;
  request_id?: string;
  status?: 'pending' | 'done' | 'expired';
  video?: {
    url?: string;
    duration?: number;
    respect_moderation?: boolean;
  };
}

export async function handleXAIVideoWebhook(
  payload: HandleCreateVideoWebhookPayload,
): Promise<HandleCreateVideoWebhookResult> {
  const body = payload.body as XAIVideoWebhookBody;

  log('Received XAI video webhook: %O', body);

  const status = body.status;

  // Skip intermediate statuses
  if (status === 'pending') {
    log('Skipping intermediate status: %s', status);
    return { status: 'pending' };
  }

  const inferenceId = body.request_id;
  if (!inferenceId) {
    throw new Error('Missing request_id in webhook body');
  }

  if (status === 'done') {
    const videoUrl = body.video?.url;
    if (!videoUrl) {
      throw new Error('Missing video URL in done webhook body');
    }

    log('Video generation succeeded: %s, videoUrl: %s', inferenceId, videoUrl);

    return {
      inferenceId,
      model: body.model,
      status: 'success' as const,
      videoUrl,
    };
  }

  // expired
  const errorMessage = status === 'expired' ? 'Video generation task expired' : 'Unknown error';

  log('Video generation failed: %s, error: %s', inferenceId, errorMessage);

  return { error: errorMessage, inferenceId, status: 'error' };
}
