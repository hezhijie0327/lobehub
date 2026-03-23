import { imageUrlToBase64 } from '@lobechat/utils';
import createDebug from 'debug';

import { AgentRuntimeErrorType } from '../../types/error';
import type { CreateImagePayload, CreateImageResponse } from '../../types/image';
import type { TaskResult } from '../../utils/asyncifyPolling';
import { asyncifyPolling } from '../../utils/asyncifyPolling';
import { AgentRuntimeError } from '../../utils/createError';
import { parseDataUri } from '../../utils/uriParser';
import { createJWT } from './jwt';
import type {
  KelingGenerationsRequest,
  KelingModelId,
  KelingMultiImage2ImageRequest,
  KelingOmniImageRequest,
  KelingQueryResponse,
  KelingRequest,
  KelingSubmitResponse,
} from './types';
import { KELING_ENDPOINTS, KELING_MULTI_IMAGE_ENDPOINT, KelingTaskStatus } from './types';

const log = createDebug('lobe-image:keling');

const BASE_URL = 'https://api-beijing.klingai.com';

interface KelingCreateImageOptions {
  apiKey: string;
  baseURL?: string;
  provider: string;
  secretKey: string;
}

async function convertImageToBase64(imageUrl: string): Promise<string> {
  try {
    const { type } = parseDataUri(imageUrl);

    if (type === 'base64') {
      const base64Match = imageUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (base64Match) {
        return base64Match[1];
      }
      throw new Error('Invalid base64 format');
    }

    if (type === 'url') {
      const { base64 } = await imageUrlToBase64(imageUrl);
      return base64;
    }

    throw new Error(`Invalid image URL format: ${imageUrl}`);
  } catch (error) {
    log('Error converting image to base64: %O', error);
    throw error;
  }
}

async function buildOmniImageRequest(
  model: KelingModelId,
  params: CreateImagePayload['params'],
): Promise<KelingOmniImageRequest> {
  log('Building omni-image request for model: %s', model);

  const payload: KelingOmniImageRequest = {
    model_name: 'kling-image-o1',
    prompt: params.prompt || '',
  };

  if (params.aspectRatio) {
    payload.aspect_ratio = params.aspectRatio;
  }

  const p = params as any;
  if (p.n) {
    payload.n = p.n as number;
  }

  if (params.resolution) {
    payload.resolution = params.resolution as '2k' | '1k';
  }

  if (p.imageUrls && p.imageUrls.length > 0) {
    payload.image_list = await Promise.all(
      p.imageUrls.slice(0, 4).map(async (url: string) => ({
        image: await convertImageToBase64(url),
      })),
    );
  }

  if (p.elementIds && p.elementIds.length > 0) {
    payload.element_list = p.elementIds.map((id: number) => ({ element_id: id }));
  }

  return payload;
}

async function buildGenerationsRequest(
  model: KelingModelId,
  params: CreateImagePayload['params'],
): Promise<KelingGenerationsRequest> {
  log('Building generations request for model: %s', model);

  const payload: KelingGenerationsRequest = {
    model_name: 'kling-v2-1',
    prompt: params.prompt || '',
  };

  const p = params as any;
  if (p.negativePrompt) {
    payload.negative_prompt = p.negativePrompt;
  }

  if (p.n) {
    payload.n = p.n as number;
  }

  if (params.imageUrl) {
    payload.image = await convertImageToBase64(params.imageUrl);
  }

  return payload;
}

async function buildMultiImage2ImageRequest(
  model: KelingModelId,
  params: CreateImagePayload['params'],
): Promise<KelingMultiImage2ImageRequest> {
  log('Building multi-image2image request for model: %s', model);

  const payload: KelingMultiImage2ImageRequest = {
    model_name: 'kling-v2-1',
    prompt: params.prompt || '',
  };

  const p = params as any;
  if (p.negativePrompt) {
    payload.negative_prompt = p.negativePrompt;
  }

  if (p.n) {
    payload.n = p.n as number;
  }

  if (params.aspectRatio) {
    payload.aspect_ratio = params.aspectRatio;
  }

  if (p.imageUrls && p.imageUrls.length >= 2) {
    payload.subject_image_list = await Promise.all(
      p.imageUrls.slice(0, 2).map(async (url: string) => ({
        subject_image: await convertImageToBase64(url),
      })),
    );

    if (p.imageUrls.length > 2) {
      payload.scene_image = await convertImageToBase64(p.imageUrls[2]);
    }

    if (p.imageUrls.length > 3) {
      payload.style_image = await convertImageToBase64(p.imageUrls[3]);
    }
  } else if (params.imageUrl) {
    payload.scene_image = await convertImageToBase64(params.imageUrl);
  }

  return payload;
}

async function buildRequestPayload(
  model: KelingModelId,
  params: CreateImagePayload['params'],
  endpoint: string,
): Promise<KelingRequest> {
  switch (endpoint) {
    case KELING_ENDPOINTS['kling-image-o1']: {
      return buildOmniImageRequest(model, params);
    }
    case KELING_MULTI_IMAGE_ENDPOINT: {
      return buildMultiImage2ImageRequest(model, params);
    }
    default: {
      return buildGenerationsRequest(model, params);
    }
  }
}

async function generateAuthToken(apiKey: string, secretKey: string): Promise<string> {
  const token = await createJWT(apiKey, secretKey, 1800);
  return `Bearer ${token}`;
}

async function submitTask(
  endpoint: string,
  payload: KelingRequest,
  options: KelingCreateImageOptions,
): Promise<KelingSubmitResponse> {
  const url = `${options.baseURL || BASE_URL}${endpoint}`;
  const authToken = await generateAuthToken(options.apiKey, options.secretKey);

  log('Submitting task to: %s', url);

  const response = await fetch(url, {
    body: JSON.stringify(payload),
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }

    throw new Error(
      `Keling API error (${response.status}): ${errorData?.message || response.statusText}`,
    );
  }

  const data: KelingSubmitResponse = await response.json();
  log('Task submitted successfully with ID: %s', data.data.task_id);

  return data;
}

async function queryTaskStatus(
  taskId: string,
  endpoint: string,
  options: KelingCreateImageOptions,
): Promise<KelingQueryResponse> {
  const url = `${options.baseURL || BASE_URL}${endpoint}/${taskId}`;
  const authToken = await generateAuthToken(options.apiKey, options.secretKey);

  log('Querying task status for ID: %s', taskId);

  const response = await fetch(url, {
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }

    throw new Error(
      `Failed to query task status (${response.status}): ${errorData?.message || response.statusText}`,
    );
  }

  return response.json();
}

function getEndpointForModel(model: KelingModelId, params: CreateImagePayload['params']): string {
  if (model === 'kling-image-o1') {
    return KELING_ENDPOINTS['kling-image-o1'];
  }

  if (model === 'kling-v2-1') {
    const p = params as any;
    if (p.imageUrls && p.imageUrls.length >= 2) {
      return KELING_MULTI_IMAGE_ENDPOINT;
    }
    return KELING_ENDPOINTS['kling-v2-1'];
  }

  return KELING_ENDPOINTS['kling-v2-1'];
}

export async function createKelingImage(
  payload: CreateImagePayload,
  options: KelingCreateImageOptions,
): Promise<CreateImageResponse> {
  const { model, params } = payload;

  const endpoint = getEndpointForModel(model as KelingModelId, params);

  if (
    !Object.values(KELING_ENDPOINTS).includes(endpoint as any) &&
    endpoint !== KELING_MULTI_IMAGE_ENDPOINT
  ) {
    throw AgentRuntimeError.createImage({
      error: new Error(`Unsupported Keling model: ${model}`),
      errorType: AgentRuntimeErrorType.ModelNotFound,
      provider: options.provider,
    });
  }

  try {
    const requestPayload = await buildRequestPayload(model as KelingModelId, params, endpoint);

    const taskResponse = await submitTask(endpoint, requestPayload, options);
    const taskId = taskResponse.data.task_id;

    return await asyncifyPolling<KelingQueryResponse, CreateImageResponse>({
      backoffMultiplier: 1.5,
      checkStatus: (taskStatus: KelingQueryResponse): TaskResult<CreateImageResponse> => {
        log('Task %s status: %s', taskId, taskStatus.data.task_status);

        switch (taskStatus.data.task_status) {
          case KelingTaskStatus.Succeed: {
            const images =
              taskStatus.data.task_result?.images || taskStatus.data.task_result?.series_images;

            if (!images || images.length === 0) {
              return {
                error: new Error('Task succeeded but no image generated'),
                status: 'failed',
              };
            }

            const imageUrl = images[0].url;
            log('Image generated successfully: %s', imageUrl);

            return {
              data: { imageUrl },
              status: 'success',
            };
          }

          case KelingTaskStatus.Failed: {
            const errorMessage =
              taskStatus.data.task_status_msg ||
              `Image generation failed with status: ${taskStatus.data.task_status}`;

            return {
              error: new Error(errorMessage),
              status: 'failed',
            };
          }

          default: {
            return { status: 'pending' };
          }
        }
      },
      initialInterval: 1000,
      logger: {
        debug: (message: any, ...args: any[]) => log(message, ...args),
        error: (message: any, ...args: any[]) => log(message, ...args),
      },
      maxConsecutiveFailures: 5,
      maxInterval: 5000,
      maxRetries: 60,
      pollingQuery: () => queryTaskStatus(taskId, endpoint, options),
    });
  } catch (error) {
    log('Error in createKelingImage: %O', error);

    throw AgentRuntimeError.createImage({
      error: error as any,
      errorType: AgentRuntimeErrorType.ProviderBizError,
      provider: options.provider,
    });
  }
}
