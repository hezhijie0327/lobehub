import createDebug from 'debug';
import type { ClientOptions } from 'openai';

import type { LobeRuntimeAI } from '../../core/BaseAI';
import { AgentRuntimeErrorType } from '../../types/error';
import type { CreateImagePayload, CreateImageResponse } from '../../types/image';
import { AgentRuntimeError } from '../../utils/createError';
import { createKelingImage } from './createImage';

const log = createDebug('lobe-image:keling');

export class LobeKelingAI implements LobeRuntimeAI {
  baseURL?: string;
  private accessKey: string;
  private secretKey: string;

  constructor({ apiKey, baseURL, secretKey }: ClientOptions & { secretKey?: string } = {}) {
    if (!apiKey) {
      throw AgentRuntimeError.createError(AgentRuntimeErrorType.InvalidProviderAPIKey);
    }

    if (!secretKey) {
      throw AgentRuntimeError.createError(AgentRuntimeErrorType.InvalidProviderAPIKey, {
        message: 'Keling requires both accessKey and secretKey',
      });
    }

    this.accessKey = apiKey;
    this.secretKey = secretKey;
    this.baseURL = baseURL || undefined;

    log('Keling AI initialized with accessKey: %s', apiKey.slice(0, 8) + '...');
  }

  async createImage(payload: CreateImagePayload): Promise<CreateImageResponse> {
    const { model, params } = payload;
    log('Creating image with model: %s and params: %O', model, params);

    try {
      return await createKelingImage(payload, {
        accessKey: this.accessKey,
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
}

export default LobeKelingAI;
