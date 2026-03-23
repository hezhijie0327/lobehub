import createDebug from 'debug';

import type { CreateVideoPayload, CreateVideoResponse } from '../../../types/video';

const log = createDebug('lobe-video:keling');

const BASE_URL = 'https://api-beijing.klingai.com';

interface KelingCreateVideoOptions {
  apiKey: string;
  baseURL?: string;
  provider: string;
  secretKey: string;
}

/**
 * Keling video generation implementation
 * Supports three API endpoints:
 * - /v1/videos/text2video: Text to video
 * - /v1/videos/image2video: Image to video (first-last frame)
 * - /v1/videos/multi-image2video: Multi-image to video
 * API docs: https://klingai.com/
 */
export async function createKelingVideo(
  payload: CreateVideoPayload,
  options: KelingCreateVideoOptions,
): Promise<CreateVideoResponse> {
  const { model, params } = payload;
  const { prompt, imageUrl, endImageUrl, aspectRatio, duration } = params;

  log('Creating video with Keling API - model: %s, params: %O', model, params);

  const baseURL = options.baseURL || BASE_URL;

  // Determine API endpoint based on input images
  const endpoint = determineEndpoint(model, { imageUrl, endImageUrl, params });

  // Build request body based on endpoint
  const body = buildRequestBody(model, {
    prompt,
    imageUrl,
    endImageUrl,
    aspectRatio,
    duration,
    params,
  });

  log('Keling video API endpoint: %s', endpoint);
  log('Keling video API request body: %s', JSON.stringify(body, null, 2));

  const authToken = `Bearer ${options.apiKey}:${options.secretKey}`;

  const response = await fetch(`${baseURL}${endpoint}`, {
    body: JSON.stringify(body),
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('Keling video API error: %s %s', response.status, errorText);
    throw new Error(`Keling video API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  log('Keling video API response: %O', data);

  if (data.code !== 0) {
    throw new Error(`Keling API error: ${data.message || 'Unknown error'}`);
  }

  if (!data?.data?.task_id) {
    throw new Error('Invalid response: missing task id');
  }

  return { inferenceId: data.data.task_id };
}

/**
 * Determine which API endpoint to use based on model and input
 */
function determineEndpoint(
  model: string,
  options: { imageUrl?: string | null; endImageUrl?: string | null; params: any },
): string {
  const { imageUrl, endImageUrl, params } = options;
  const p = params as any;

  // Multi-image to video (kling-v1-6 or multiple images)
  if (p.imageUrls && Array.isArray(p.imageUrls) && p.imageUrls.length > 1) {
    return '/v1/videos/multi-image2video';
  }

  // Image to video with first-last frame
  if (imageUrl && endImageUrl) {
    return '/v1/videos/image2video';
  }

  // Image to video with single image
  if (imageUrl && !endImageUrl) {
    // kling-v2-6 and later support image2video endpoint
    if (model.includes('v2') || model.includes('v3')) {
      return '/v1/videos/image2video';
    }
    // Fallback to multi-image2video for single image
    return '/v1/videos/multi-image2video';
  }

  // Default: text to video
  return '/v1/videos/text2video';
}

/**
 * Build request body based on endpoint type
 */
function buildRequestBody(
  model: string,
  options: {
    prompt: string;
    imageUrl?: string | null;
    endImageUrl?: string | null;
    aspectRatio?: string;
    duration?: number;
    params: any;
  },
): Record<string, unknown> {
  const { prompt, imageUrl, endImageUrl, aspectRatio, duration, params } = options;
  const p = params as any;

  const endpoint = determineEndpoint(model, { imageUrl, endImageUrl, params });

  // Common fields for all endpoints
  const commonBody: Record<string, unknown> = {
    model_name: model || 'kling-v2-6',
    prompt,
  };

  // Add mode and duration if provided
  if (p.mode) commonBody.mode = p.mode;
  if (duration !== undefined) commonBody.duration = String(duration);
  if (aspectRatio !== undefined) commonBody.aspect_ratio = aspectRatio;
  if (p.negativePrompt) commonBody.negative_prompt = p.negativePrompt;
  if (p.sound !== undefined) commonBody.sound = p.sound;

  // Endpoint-specific fields
  switch (endpoint) {
    case '/v1/videos/text2video': {
      // Text to video: no image fields needed
      return commonBody;
    }

    case '/v1/videos/image2video': {
      // Image to video (first-last frame)
      return {
        ...commonBody,
        image: imageUrl,
        ...(endImageUrl && { image_tail: endImageUrl }),
      };
    }

    case '/v1/videos/multi-image2video': {
      // Multi-image to video
      const imageList: Array<{ image: string }> = [];

      // Handle imageUrls array if provided
      if (p.imageUrls && Array.isArray(p.imageUrls)) {
        for (const url of p.imageUrls) {
          if (url) imageList.push({ image: url });
        }
      } else if (imageUrl) {
        // Fallback to single image
        imageList.push({ image: imageUrl });
        if (endImageUrl) {
          imageList.push({ image: endImageUrl });
        }
      }

      return {
        ...commonBody,
        image_list: imageList,
      };
    }

    default: {
      return commonBody;
    }
  }
}
