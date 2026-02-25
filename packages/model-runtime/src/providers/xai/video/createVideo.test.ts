import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateVideoOptions } from '../../../core/openaiCompatibleFactory';
import type { CreateVideoPayload } from '../../../types/video';
import { createXAIVideo } from './createVideo';

vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn()),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createXAIVideo', () => {
  let payload: CreateVideoPayload;
  let options: CreateVideoOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    payload = {
      model: 'grok-imagine-video',
      params: {
        prompt: 'a beautiful sunset over ocean',
      },
    };

    options = {
      apiKey: 'test-api-key',
      provider: 'xai',
    };
  });

  describe('successful creation', () => {
    it('should return inferenceId on success', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ request_id: 'req-abc-123' }),
        ok: true,
      });

      const result = await createXAIVideo(payload, options);

      expect(result).toEqual({ inferenceId: 'req-abc-123' });
    });

    it('should send minimal body with only prompt', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ request_id: 'req-1' }),
        ok: true,
      });

      await createXAIVideo(payload, options);

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.prompt).toBe('a beautiful sunset over ocean');
      expect(body.model).toBe('grok-imagine-video');
      // Should not include optional params
      expect(body.aspect_ratio).toBeUndefined();
      expect(body.duration).toBeUndefined();
      expect(body.resolution).toBeUndefined();
    });
  });

  describe('image support', () => {
    it('should add image when imageUrl is provided', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ request_id: 'req-1' }),
        ok: true,
      });

      payload.params.imageUrl = 'https://example.com/start.jpg';

      await createXAIVideo(payload, options);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.image).toEqual({
        url: 'https://example.com/start.jpg',
      });
    });
  });

  describe('optional params', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ request_id: 'req-1' }),
        ok: true,
      });
    });

    it('should map aspectRatio to body.aspect_ratio', async () => {
      payload.params.aspectRatio = '9:16';
      await createXAIVideo(payload, options);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.aspect_ratio).toBe('9:16');
    });

    it('should map duration to body.duration', async () => {
      payload.params.duration = 10;
      await createXAIVideo(payload, options);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.duration).toBe(10);
    });

    it('should map resolution to body.resolution', async () => {
      payload.params.resolution = '720p';
      await createXAIVideo(payload, options);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.resolution).toBe('720p');
    });
  });

  describe('client config', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ request_id: 'req-1' }),
        ok: true,
      });
    });

    it('should use default baseURL', async () => {
      await createXAIVideo(payload, options);

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toBe('https://api.x.ai/v1/videos/generations');
    });

    it('should use custom baseURL when provided', async () => {
      options.baseURL = 'https://custom-endpoint.com/v1';
      await createXAIVideo(payload, options);

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toBe('https://custom-endpoint.com/v1/videos/generations');
    });

    it('should send Authorization Bearer header', async () => {
      await createXAIVideo(payload, options);

      const fetchHeaders = mockFetch.mock.calls[0][1].headers;
      expect(fetchHeaders['Authorization']).toBe('Bearer test-api-key');
      expect(fetchHeaders['Content-Type']).toBe('application/json');
    });
  });

  describe('error handling', () => {
    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded'),
      });

      await expect(createXAIVideo(payload, options)).rejects.toThrow(
        'XAI video API error: 429 Rate limit exceeded',
      );
    });

    it('should throw when response has no request_id', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({}),
        ok: true,
      });

      await expect(createXAIVideo(payload, options)).rejects.toThrow(
        'Invalid response: missing request_id',
      );
    });
  });
});
