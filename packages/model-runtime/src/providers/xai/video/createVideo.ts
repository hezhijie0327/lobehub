import createDebug from 'debug';

import type { CreateVideoOptions } from '../../../core/openaiCompatibleFactory';
import type { CreateVideoPayload, CreateVideoResponse } from '../../../types/video';

const log = createDebug('lobe-video:xai');

interface XAIVideoGenerationResponse {
  request_id: string;
}

interface XAIVideoRequestBody {
  aspect_ratio?: string;
  duration?: number;
  image?: {
    url: string;
  };
  model: string;
  prompt: string;
  resolution?: '720p' | '480p';
  video_url?: string;
}

/**
 * XAI video generation implementation
 * API docs: https://docs.x.ai/docs/video-generation
 */
export async function createXAIVideo(
  payload: CreateVideoPayload,
  options: CreateVideoOptions,
): Promise<CreateVideoResponse> {
  const { model, params } = payload;
  const { prompt, imageUrl, aspectRatio, duration, resolution } = params;

  log('Creating video with XAI API - model: %s, params: %O', model, params);

  const baseURL = options.baseURL || 'https://api.x.ai/v1';

  // Build request body
  const body: XAIVideoRequestBody = {
    model,
    prompt,
  };

  if (aspectRatio !== undefined) {
    body.aspect_ratio = aspectRatio;
  }

  if (duration !== undefined && duration >= 1 && duration <= 15) {
    body.duration = duration;
  }

  if (imageUrl) {
    body.image = {
      url: imageUrl,
    };
  }

  if (resolution) {
    body.resolution = resolution as '720p' | '480p';
  }

  log('XAI video API request body: %s', JSON.stringify(body, null, 2));

  const response = await fetch(`${baseURL}/videos/generations`, {
    body: JSON.stringify(body),
    headers: {
      'Authorization': `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('XAI video API error: %s %s', response.status, errorText);
    throw new Error(`XAI video API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as XAIVideoGenerationResponse;

  log('XAI video API response: %O', data);

  if (!data?.request_id) {
    throw new Error('Invalid response: missing request_id');
  }

  return { inferenceId: data.request_id };
}
