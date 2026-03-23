import createDebug from 'debug';

import type {
  HandleCreateVideoWebhookPayload,
  HandleCreateVideoWebhookResult,
} from '../../../types/video';

const log = createDebug('lobe-video:keling:webhook');

interface KelingVideoWebhookBody {
  code?: number;
  data?: {
    task_id?: string;
    task_status?: string;
    task_status_msg?: string;
    task_result?: {
      videos?: Array<{
        id?: string;
        url?: string;
        duration?: string;
      }>;
      images?: Array<{
        index?: number;
        url?: string;
      }>;
    };
    final_unit_deduction?: string;
    watermark_info?: {
      enabled?: boolean;
    };
    task_info?: {
      external_task_id?: string;
    };
    created_at?: number;
    updated_at?: number;
  };
  message?: string;
  request_id?: string;
}

export async function handleKelingVideoWebhook(
  payload: HandleCreateVideoWebhookPayload,
): Promise<HandleCreateVideoWebhookResult> {
  const body = payload.body as KelingVideoWebhookBody;

  log('Received Keling video webhook: %O', body);

  const taskStatus = body.data?.task_status;

  if (taskStatus === 'submitted' || taskStatus === 'processing') {
    log('Skipping intermediate status: %s', taskStatus);
    return { status: 'pending' };
  }

  const inferenceId = body.data?.task_id;
  if (!inferenceId) {
    throw new Error('Missing task_id in webhook body');
  }

  if (taskStatus === 'succeed') {
    const videos = body.data?.task_result?.videos;
    if (!videos || videos.length === 0) {
      throw new Error('Missing videos in succeeded webhook body');
    }

    const videoUrl = videos[0].url;
    if (!videoUrl) {
      throw new Error('Missing video_url in succeeded webhook body');
    }

    log('Video generation succeeded: %s, videoUrl: %s', inferenceId, videoUrl);

    return {
      inferenceId,
      status: 'success' as const,
      videoUrl,
    };
  }

  const errorMessage = body.data?.task_status_msg || body.message || 'Video generation failed';

  log('Video generation failed: %s, error: %s', inferenceId, errorMessage);

  return { error: errorMessage, inferenceId, status: 'error' };
}
