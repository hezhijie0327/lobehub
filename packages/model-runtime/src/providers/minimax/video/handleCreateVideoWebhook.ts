import createDebug from 'debug';

import {
  type HandleCreateVideoWebhookPayload,
  type HandleCreateVideoWebhookResult,
} from '../../../types/video';

const log = createDebug('lobe-video:minimax:webhook');

interface MiniMaxVideoWebhookBody {
  base_resp: {
    status_code: number;
    status_msg: string;
  };
  challenge?: string;
  data?: {
    video_url?: string;
  };
  file_id?: string;
  status?: 'Preparing' | 'Queueing' | 'Processing' | 'Success' | 'Fail';
  task_id?: string;
  video_url?: string;
}

export async function handleMiniMaxVideoWebhook(
  payload: HandleCreateVideoWebhookPayload,
): Promise<HandleCreateVideoWebhookResult> {
  const body = payload.body as MiniMaxVideoWebhookBody;

  log('Received MiniMax video webhook: %O', body);

  // Handle webhook challenge verification
  // MiniMax sends a challenge first, we must echo it back
  if (body.challenge) {
    log('Webhook challenge received, this is a verification request');
    // Return a special value that indicates this is a challenge
    // The webhook handler will check for this and return the challenge
    throw new Error('CHALLENGE:' + body.challenge);
  }

  // Check for API errors
  if (body.base_resp && body.base_resp.status_code !== 0) {
    throw new Error(`MiniMax API error: ${body.base_resp.status_msg}`);
  }

  const inferenceId = body.task_id;
  if (!inferenceId) {
    throw new Error('Missing task_id in webhook body');
  }

  // Skip intermediate statuses (Preparing, Queueing, Processing)
  if (body.status === 'Preparing' || body.status === 'Queueing' || body.status === 'Processing') {
    log('Video generation processing: %s (status: %s)', inferenceId, body.status);
    return { status: 'pending' };
  }

  // Handle failed status
  if (body.status === 'Fail') {
    const errorMessage = body.base_resp?.status_msg || 'Video generation failed';
    log('Video generation failed: %s, error: %s', inferenceId, errorMessage);
    return { error: errorMessage, inferenceId, status: 'error' };
  }

  // Handle success status
  if (body.status === 'Success') {
    const videoUrl = body.video_url || body.data?.video_url;

    if (!videoUrl) {
      // If no video_url in webhook, we need to use file_id to retrieve the video
      if (body.file_id) {
        log(
          'Video generation succeeded: %s, file_id: %s (video_url not in webhook)',
          inferenceId,
          body.file_id,
        );
        // Note: The calling code needs to handle this case
        // For now, we return success and let the handler know to retrieve via file_id
        // This is a limitation of the current implementation
        throw new Error('NEED_FILE_ID:' + body.file_id);
      }
      throw new Error('Missing video_url and file_id in success webhook body');
    }

    log('Video generation succeeded: %s, videoUrl: %s', inferenceId, videoUrl);

    return {
      inferenceId,
      status: 'success' as const,
      videoUrl,
    };
  }

  log('Unknown status: %s for inferenceId: %s', body.status, inferenceId);
  return { status: 'pending' };
}
