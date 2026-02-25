import createDebug from 'debug';

import type { CreateVideoOptions } from '../../../core/openaiCompatibleFactory';
import type { CreateVideoPayload } from '../../../types/video';
import { asyncifyPolling } from '../../../utils/asyncifyPolling';

const log = createDebug('lobe-video:xai');

interface XAIVideoGenerationResponse {
  request_id: string;
}

interface XAIVideoStatusResponse {
  code?: string;
  error?: string;
  model?: string;
  video?: {
    url?: string;
    duration?: number;
    respect_moderation?: boolean;
  };
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
}

interface PollingResult {
  error?: string;
  status: 'pending' | 'done' | 'failed';
  videoUrl?: string;
}

/**
 * Query XAI video generation status by request_id
 */
async function queryVideoStatus(
  requestId: string,
  apiKey: string,
  baseURL: string,
): Promise<XAIVideoStatusResponse> {
  const response = await fetch(`${baseURL}/videos/${requestId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('XAI video status query error: %s %s', response.status, errorText);
    throw new Error(`XAI video status query error: ${response.status} ${errorText}`);
  }

  return (await response.json()) as XAIVideoStatusResponse;
}

/**
 * XAI video generation implementation with polling
 * API docs: https://docs.x.ai/docs/video-generation
 * Returns both inferenceId and videoUrl (for async processing)
 */
export async function createXAIVideo(
  payload: CreateVideoPayload,
  options: CreateVideoOptions,
): Promise<{ inferenceId: string; videoUrl: string }> {
  const { model, params } = payload;
  const { apiKey, provider } = options;
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

  // Step 1: Submit video generation request
  const response = await fetch(`${baseURL}/videos/generations`, {
    body: JSON.stringify(body),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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

  const requestId = data.request_id;

  // Step 2: Poll for video generation status
  const videoData = await asyncifyPolling<PollingResult, { inferenceId: string; videoUrl: string }>(
    {
      checkStatus: (pollingResult: PollingResult) => {
        if (pollingResult.status === 'done' && pollingResult.videoUrl) {
          log('Video generation succeeded: %s', requestId);
          return {
            data: { inferenceId: requestId, videoUrl: pollingResult.videoUrl },
            status: 'success',
          };
        }

        if (pollingResult.error) {
          log('Video generation failed: %s, error: %s', requestId, pollingResult.error);
          return {
            error: new Error(pollingResult.error),
            status: 'failed',
          };
        }

        return { status: 'pending' };
      },
      logger: {
        debug: (message: any, ...args: any[]) => log(message, ...args),
        error: (message: any, ...args: any[]) => log(message, ...args),
      },
      maxConsecutiveFailures: 10,
      maxRetries: 60, // 60 retries = up to 5 minutes
      pollingQuery: () =>
        queryVideoStatus(requestId, apiKey, baseURL).then((response) => ({
          error: response.error,
          status: response.video?.url ? 'done' : 'pending',
          videoUrl: response.video?.url,
        })),
    },
  );

  return videoData;
}
