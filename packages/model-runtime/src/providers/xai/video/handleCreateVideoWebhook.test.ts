import { describe, expect, it } from 'vitest';

import type { HandleCreateVideoWebhookPayload } from '../../../types/video';
import { handleXAIVideoWebhook } from './handleCreateVideoWebhook';

describe('handleXAIVideoWebhook', () => {
  describe('pending status', () => {
    it('should return pending when status is pending', async () => {
      const payload: HandleCreateVideoWebhookPayload = {
        body: {
          request_id: 'req-123',
          status: 'pending',
        },
      };

      const result = await handleXAIVideoWebhook(payload);

      expect(result).toEqual({ status: 'pending' });
    });
  });

  describe('success status', () => {
    it('should return success with videoUrl when status is done', async () => {
      const payload: HandleCreateVideoWebhookPayload = {
        body: {
          request_id: 'req-123',
          status: 'done',
          model: 'grok-imagine-video',
          video: {
            url: 'https://vidgen.x.ai/video.mp4',
            duration: 5,
            respect_moderation: true,
          },
        },
      };

      const result = await handleXAIVideoWebhook(payload);

      expect(result).toEqual({
        inferenceId: 'req-123',
        model: 'grok-imagine-video',
        status: 'success',
        videoUrl: 'https://vidgen.x.ai/video.mp4',
      });
    });

    it('should throw when status is done but video URL is missing', async () => {
      const payload: HandleCreateVideoWebhookPayload = {
        body: {
          request_id: 'req-123',
          status: 'done',
          video: {
            duration: 5,
          },
        },
      };

      await expect(handleXAIVideoWebhook(payload)).rejects.toThrow(
        'Missing video URL in done webhook body',
      );
    });
  });

  describe('error status', () => {
    it('should return error when status is expired', async () => {
      const payload: HandleCreateVideoWebhookPayload = {
        body: {
          request_id: 'req-123',
          status: 'expired',
        },
      };

      const result = await handleXAIVideoWebhook(payload);

      expect(result).toEqual({
        error: 'Video generation task expired',
        inferenceId: 'req-123',
        status: 'error',
      });
    });
  });

  describe('error handling', () => {
    it('should throw when request_id is missing', async () => {
      const payload: HandleCreateVideoWebhookPayload = {
        body: {
          status: 'done',
          video: {
            url: 'https://example.com/video.mp4',
          },
        },
      };

      await expect(handleXAIVideoWebhook(payload)).rejects.toThrow(
        'Missing request_id in webhook body',
      );
    });
  });
});
