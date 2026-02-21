import createDebug from 'debug';

import { type CreateVideoOptions } from '../../../core/openaiCompatibleFactory';
import { type CreateVideoPayload, type CreateVideoResponse } from '../../../types/video';

const log = createDebug('lobe-video:minimax');

interface MiniMaxVideoResponse {
  base_resp: {
    status_code: number;
    status_msg: string;
  };
  data: {
    video_url?: string;
    task_id?: string;
  };
  task_id?: string;
  video_url?: string;
}

export async function createMiniMaxVideo(
  payload: CreateVideoPayload,
  options: CreateVideoOptions,
): Promise<CreateVideoResponse> {
  const { apiKey, baseURL, provider } = options;
  const { callbackUrl, model, params } = payload;
  const { duration, imageUrl, endImageUrl, prompt, resolution } = params;

  log('Creating video with MiniMax API - model: %s, params: %O', model, params);

  const endpoint = `${baseURL}/video_generation`;

  const body: Record<string, unknown> = {
    duration,
    model,
    prompt,
    resolution,
  };

  if (imageUrl) {
    body.first_frame_image = imageUrl;
  }

  if (endImageUrl) {
    body.last_frame_image = endImageUrl;
  }

  if (callbackUrl) {
    body.callback_url = callbackUrl;
  }

  log('MiniMax video API request body: %s', JSON.stringify(body, null, 2));

  const response = await fetch(endpoint, {
    body: JSON.stringify(body),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('MiniMax video API error: %s %s', response.status, errorText);
    throw new Error(`MiniMax video API error: ${response.status} ${errorText}`);
  }

  const data: MiniMaxVideoResponse = await response.json();

  log('MiniMax video API response: %O', data);

  if (data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax API error: ${data.base_resp.status_msg}`);
  }

  if (data.task_id) {
    return { inferenceId: data.task_id };
  }

  throw new Error('Invalid response: missing task_id');
}
