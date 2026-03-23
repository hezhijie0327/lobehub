import createDebug from 'debug';
import type { ClientOptions } from 'openai';

import type { LobeRuntimeAI } from '../../core/BaseAI';
import { AgentRuntimeErrorType } from '../../types/error';
import type { CreateImagePayload, CreateImageResponse } from '../../types/image';
import type { CreateVideoPayload, CreateVideoResponse } from '../../types/video';
import { AgentRuntimeError } from '../../utils/createError';
import { createKelingImage } from './createImage';
import { createKelingVideo } from './video/createVideo';

const log = createDebug('lobe-image:keling');
const videoLog = createDebug('lobe-video:keling');

export class LobeKelingAI implements LobeRuntimeAI {
  baseURL?: string;
  private apiKey: string;
  private secretKey: string;

  constructor({ apiKey, baseURL, secretKey }: ClientOptions & { secretKey?: string } = {}) {
    if (!apiKey) {
      throw AgentRuntimeError.createError(AgentRuntimeErrorType.InvalidProviderAPIKey);
    }

    if (!secretKey) {
      throw AgentRuntimeError.createError(AgentRuntimeErrorType.InvalidProviderAPIKey, {
        message: 'Keling requires both apiKey and secretKey',
      });
    }

    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseURL = baseURL || undefined;

    log('Keling AI initialized with apiKey: %s', apiKey.slice(0, 8) + '...');
  }

  async createImage(payload: CreateImagePayload): Promise<CreateImageResponse> {
    const { model, params } = payload;
    log('Creating image with model: %s and params: %O', model, params);

    try {
      return await createKelingImage(payload, {
        apiKey: this.apiKey,
        baseURL: this.baseURL,
        provider: 'keling',
        secretKey: this.secretKey,
      });
    } catch (error) {
      log('Error in createImage: %O', error);

      if (error instanceof Error && 'status' in error && (error as any).status === 401) {
        throw AgentRuntimeError.createError(AgentRuntimeErrorType.InvalidProviderAPIKey, {
          error,
        });
      }

      if (error instanceof Error && error.message.includes('secretKey')) {
        throw AgentRuntimeError.createError(AgentRuntimeErrorType.InvalidProviderAPIKey, {
          error,
        });
      }

      throw AgentRuntimeError.createError(AgentRuntimeErrorType.ProviderBizError, { error });
    }
  }

  async createVideo(payload: CreateVideoPayload): Promise<CreateVideoResponse> {
    const { model, params } = payload;
    videoLog('Creating video with model: %s and params: %O', model, params);

    try {
      return await createKelingVideo(payload, {
        apiKey: this.apiKey,
        baseURL: this.baseURL,
        provider: 'keling',
        secretKey: this.secretKey,
      });
    } catch (error) {
      videoLog('Error in createVideo: %O', error);

      if (error instanceof Error && 'status' in error && (error as any).status === 401) {
        throw AgentRuntimeError.createError(AgentRuntimeErrorType.InvalidProviderAPIKey, {
          error,
        });
      }

      throw AgentRuntimeError.createError(AgentRuntimeErrorType.ProviderBizError, { error });
    }
  }
}

export default LobeKelingAI;
