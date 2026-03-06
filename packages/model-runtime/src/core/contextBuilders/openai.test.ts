import { imageUrlToBase64 } from '@lobechat/utils';
import type OpenAI from 'openai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OpenAIChatMessage } from '../../types';
import { parseDataUri } from '../../utils/uriParser';
import {
  convertImageUrlToFile,
  convertMessageContent,
  convertOpenAIMessages,
  convertOpenAIResponseInputs,
} from './openai';

// 模拟依赖
vi.mock('@lobechat/utils', () => ({
  imageUrlToBase64: vi.fn(),
}));
vi.mock('../../utils/uriParser');

describe('convertMessageContent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the same content if not image_url type', async () => {
    const content = { type: 'text', text: 'Hello' } as OpenAI.ChatCompletionContentPart;
    const result = await convertMessageContent(content);
    expect(result).toEqual(content);
  });

  it('should convert image URL to base64 when necessary', async () => {
    // 设置环境变量
    process.env.LLM_VISION_IMAGE_USE_BASE64 = '1';

    const content = {
      type: 'image_url',
      image_url: { url: 'https://example.com/image.jpg' },
    } as OpenAI.ChatCompletionContentPart;

    vi.mocked(parseDataUri).mockReturnValue({ type: 'url', base64: null, mimeType: null });
    vi.mocked(imageUrlToBase64).mockResolvedValue({
      base64: 'base64String',
      mimeType: 'image/jpeg',
    });

    const result = await convertMessageContent(content);

    expect(result).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,base64String' },
    });

    expect(parseDataUri).toHaveBeenCalledWith('https://example.com/image.jpg');
    expect(imageUrlToBase64).toHaveBeenCalledWith('https://example.com/image.jpg');
  });

  it('should not convert image URL when not necessary', async () => {
    process.env.LLM_VISION_IMAGE_USE_BASE64 = undefined;

    const content = {
      type: 'image_url',
      image_url: { url: 'https://example.com/image.jpg' },
    } as OpenAI.ChatCompletionContentPart;

    vi.mocked(parseDataUri).mockReturnValue({ type: 'url', base64: null, mimeType: null });

    const result = await convertMessageContent(content);

    expect(result).toEqual(content);
    expect(imageUrlToBase64).not.toHaveBeenCalled();
  });

  it('should convert image URL when forceImageBase64 is true', async () => {
    process.env.LLM_VISION_IMAGE_USE_BASE64 = undefined;

    const content = {
      type: 'image_url',
      image_url: { url: 'https://example.com/image.jpg' },
    } as OpenAI.ChatCompletionContentPart;

    vi.mocked(parseDataUri).mockReturnValue({ type: 'url', base64: null, mimeType: null });
    vi.mocked(imageUrlToBase64).mockResolvedValue({
      base64: 'forcedBase64',
      mimeType: 'image/jpeg',
    });

    const result = await convertMessageContent(content, { forceImageBase64: true });

    expect(result).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,forcedBase64' },
    });

    expect(imageUrlToBase64).toHaveBeenCalledWith('https://example.com/image.jpg');
  });
});

describe('convertOpenAIMessages', () => {
  it('should convert string content messages', async () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ] as OpenAI.ChatCompletionMessageParam[];

    const result = await convertOpenAIMessages(messages);

    expect(result).toEqual(messages);
  });

  it('should convert array content messages', async () => {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } },
        ],
      },
    ] as OpenAI.ChatCompletionMessageParam[];

    vi.spyOn(Promise, 'all');
    vi.mocked(parseDataUri).mockReturnValue({ type: 'url', base64: null, mimeType: null });
    vi.mocked(imageUrlToBase64).mockResolvedValue({
      base64: 'base64String',
      mimeType: 'image/jpeg',
    });

    process.env.LLM_VISION_IMAGE_USE_BASE64 = '1';

    const result = await convertOpenAIMessages(messages);

    expect(result).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Hello' },
          {
            type: 'image_url',
            image_url: { url: 'data:image/jpeg;base64,base64String' },
          },
        ],
      },
    ]);

    expect(Promise.all).toHaveBeenCalledTimes(2); // 一次用于消息数组，一次用于内容数组

    process.env.LLM_VISION_IMAGE_USE_BASE64 = undefined;
  });
  it('should convert array content messages', async () => {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } },
        ],
      },
    ] as OpenAI.ChatCompletionMessageParam[];

    vi.spyOn(Promise, 'all');
    vi.mocked(parseDataUri).mockReturnValue({ type: 'url', base64: null, mimeType: null });
    vi.mocked(imageUrlToBase64).mockResolvedValue({
      base64: 'base64String',
      mimeType: 'image/jpeg',
    });

    const result = await convertOpenAIMessages(messages);

    expect(result).toEqual(messages);

    expect(Promise.all).toHaveBeenCalledTimes(2); // 一次用于消息数组，一次用于内容数组
  });

  it('should filter out reasoning field from messages', async () => {
    const messages = [
      {
        role: 'assistant',
        content: 'Hello',
        reasoning: { content: 'some reasoning', duration: 100 },
      },
      { role: 'user', content: 'Hi' },
    ] as any;

    const result = await convertOpenAIMessages(messages);

    expect(result).toEqual([
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Hi' },
    ]);
    // Ensure reasoning field is removed
    expect((result[0] as any).reasoning).toBeUndefined();
  });

  it('should preserve reasoning_content field from messages (for DeepSeek compatibility)', async () => {
    const messages = [
      {
        role: 'assistant',
        content: 'Hello',
        reasoning_content: 'some reasoning content',
      },
      { role: 'user', content: 'Hi' },
    ] as any;

    const result = await convertOpenAIMessages(messages);

    expect(result).toEqual([
      { role: 'assistant', content: 'Hello', reasoning_content: 'some reasoning content' },
      { role: 'user', content: 'Hi' },
    ]);
    // Ensure reasoning_content field is preserved
    expect((result[0] as any).reasoning_content).toBe('some reasoning content');
  });

  it('should filter out reasoning but preserve reasoning_content field', async () => {
    const messages = [
      {
        role: 'assistant',
        content: 'Hello',
        reasoning: { content: 'some reasoning', duration: 100 },
        reasoning_content: 'some reasoning content',
      },
    ] as any;

    const result = await convertOpenAIMessages(messages);

    expect(result).toEqual([
      { role: 'assistant', content: 'Hello', reasoning_content: 'some reasoning content' },
    ]);
    // Ensure reasoning object is removed but reasoning_content is preserved
    expect((result[0] as any).reasoning).toBeUndefined();
    expect((result[0] as any).reasoning_content).toBe('some reasoning content');
  });
});

describe('convertOpenAIResponseInputs', () => {
  it('应该正确转换普通文本消息', async () => {
    const messages: OpenAIChatMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    const result = await convertOpenAIResponseInputs(messages);

    expect(result).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]);
  });

  it('应该正确转换带有工具调用的消息', async () => {
    const messages: OpenAIChatMessage[] = [
      {
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: 'call_123',
            type: 'function',
            function: {
              name: 'test_function',
              arguments: '{"key": "value"}',
            },
          },
        ],
      },
    ];

    const result = await convertOpenAIResponseInputs(messages);

    expect(result).toEqual([
      {
        arguments: 'test_function',
        call_id: 'call_123',
        name: 'test_function',
        type: 'function_call',
      },
    ]);
  });

  it('应该正确转换工具响应消息', async () => {
    const messages: OpenAIChatMessage[] = [
      {
        role: 'tool',
        content: 'Function result',
        tool_call_id: 'call_123',
      },
    ];

    const result = await convertOpenAIResponseInputs(messages);

    expect(result).toEqual([
      {
        call_id: 'call_123',
        output: 'Function result',
        type: 'function_call_output',
      },
    ]);
  });

  it('应该正确转换包含图片的消息', async () => {
    const messages: OpenAIChatMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Here is an image' },
          {
            type: 'image_url',
            image_url: {
              url: 'data:image/jpeg;base64,test123',
            },
          },
        ],
      },
    ];

    const result = await convertOpenAIResponseInputs(messages);

    expect(result).toEqual([
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Here is an image' },
          {
            type: 'input_image',
            image_url: 'data:image/jpeg;base64,test123',
          },
        ],
      },
    ]);
  });

  it('应该正确处理混合类型的消息序列', async () => {
    const messages: OpenAIChatMessage[] = [
      { role: 'user', content: 'I need help with a function' },
      {
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: 'call_456',
            type: 'function',
            function: {
              name: 'get_data',
              arguments: '{}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: '{"result": "success"}',
        tool_call_id: 'call_456',
      },
    ];

    const result = await convertOpenAIResponseInputs(messages);

    expect(result).toEqual([
      { role: 'user', content: 'I need help with a function' },
      {
        arguments: 'get_data',
        call_id: 'call_456',
        name: 'get_data',
        type: 'function_call',
      },
      {
        call_id: 'call_456',
        output: '{"result": "success"}',
        type: 'function_call_output',
      },
    ]);
  });

  it('should extract reasoning.content into a separate reasoning item', async () => {
    const messages: OpenAIChatMessage[] = [
      { content: 'system prompts', role: 'system' },
      { content: '你好', role: 'user' },
      {
        content: 'hello',
        role: 'assistant',
        reasoning: { content: 'reasoning content', duration: 2706 },
      },
      { content: '杭州天气如何', role: 'user' },
    ];

    const result = await convertOpenAIResponseInputs(messages);

    expect(result).toEqual([
      { content: 'system prompts', role: 'developer' },
      { content: '你好', role: 'user' },
      { summary: [{ text: 'reasoning content', type: 'summary_text' }], type: 'reasoning' },
      { content: 'hello', role: 'assistant' },
      { content: '杭州天气如何', role: 'user' },
    ]);
  });

  it('should handle openai and claude mixed message', async () => {
    // See: https://github.com/lobehub/lobehub/pull/12017
    const messages: OpenAIChatMessage[] = [
      {
        content: 'system prompts',
        role: 'system',
      },
      {
        content: '你是谁',
        role: 'user',
      },
      {
        content: [
          {
            signature: 'E',
            thinking: 'thoughts',
            type: 'thinking',
          },
          {
            text: '我是 Claude',
            type: 'text',
          },
        ],
        role: 'assistant',
        reasoning: {
          content: 'The user is asking',
          duration: 110,
          // @ts-expect-error: ignore
          signature: 'E',
        },
      },
    ];
    const result = await convertOpenAIResponseInputs(messages);
    expect(result).toEqual([
      { content: 'system prompts', role: 'developer' },
      { content: '你是谁', role: 'user' },
      {
        summary: [{ text: 'The user is asking', type: 'summary_text' }],
        type: 'reasoning',
      },
      {
        content: [{ text: '我是 Claude', type: 'output_text' }],
        role: 'assistant',
      },
    ]);
  });

  it('should handle encrypted reasoning content with id', async () => {
    const messages: OpenAIChatMessage[] = [
      { content: 'system prompts', role: 'system' },
      {
        content: 'What is meaning of life?',
        role: 'user',
      },
      {
        content: '42',
        role: 'assistant',
        reasoning: {
          encryptedContent:
            'bvV88j99ILvgfHRTHCUSJtw+ISji6txJzPdZNbcSVuDk4OMG2Z9r5wOBBwjd3u3Hhm9XtpCWJO1YgTOlpgbn+g7DZX+pOagYYrCFUpQ19XkWz6Je8bHG9JcSDoGDqNgRbDbAUO8at6RCyqgPupJj5ArBDCt73fGQLTC4G3S0JMK9LsPiWz6GPj6qyzYoRzkj4R6bntRm74E4h8Y+z6u6B7+ixPSv8s1EFs8c+NUAB8TNKZZpXZquj2LXfx1xAie85Syl7qLqxLNtDG1dNBhBnHpYoE4gQzwyXqywf5pF2Q2imzPNzGQhurK+6gaNWgZbxRmjhdsW6TnzO5Kk6pzb5qpfgfcEScQeYHSj5GpD+yDUCNlhdbzhhWnEErH+wuBPpTG6UQhiC7m7yrJ7IY2E8K/BeUPlUvkhMaMwb4dA279pWMJdchNJ+TAxca+JVc80pXMG/PmrQUNJU9qdXRLbNmQbRadBNwV2qkPfgggL3q0yNd7Un9P+atmP3B9keBILif3ufsBDtVUobEniiyGV7YVDvQ/fQRVs7XDxJiOKkogjjQySyHgpjseO8iG5xtb9mrz6B3mDvv2aAuyDL6MHZRM7QDVPjUbgNMzDm5Sm3J7IhtzfR+3eMDws3qeTsxOt1KOslu983Btv1Wx37b5HJqX1pQU1dae/kOSJ7MifFd6wMkQtQBDgVoG3ka9wq5Vxq9Ki8bDOOMcwA2kUXhCcY3TZCXJfDWSKPTcCoNCYIv5LT2NFVdamiSfLIyeOjBNz459BfMvAoOZShFViQyc5YwjnReUQPQ8a18jcz8GoAK1O99e0h91oYxIgDV52EfS+IYrzqvJOEQbKQinB+LJwkPbBEp7ZtgAtiNBzm985hNgLfiBaVFWcRYwI3tNBCT1vkw2YI0NEEG0yOF29x+u64XzqyP1CX1pU6sGXEFn3RPdfYibf6bt/Y1BRqBL5l0CrXWsgDw02SqIFta8OvJ7Iwmq40/4acE/Ew6eWO/z2MHkWgqSpwGNjn7MfeKkTi44foZjfNqN9QOFQt6VG2tY+biKZDo0h9DAftae8Q2Xs2UDvsBYOm7YEahVkput6/uKzxljpXlz269qHk6ckvdN9hKLbaTO3/IZPCCPQ5a/a/sWn/1VOJj72sDk+23RNjBf0FL6bJMXZI5aQdtxbF1zij9mWcP9nJ9FHhj53ytuf1NiKl5xU8ZsaoKmCAJcXUz1n2FZvyWlqvgPYiszc7R8Y5dF6QbW2mlKnXzVy6qRMHNeQqGhCEncyT5nPNSdK5QlUwLokAIg',
          id: 'rs_51abe1aa-599b-80b6-57c8-dddc6263362f_us-east-1',
        },
      },
    ];
    const result = await convertOpenAIResponseInputs(messages);
    expect(result).toEqual([
      { content: 'system prompts', role: 'developer' },
      { content: 'What is meaning of life?', role: 'user' },
      {
        encrypted_content:
          'bvV88j99ILvgfHRTHCUSJtw+ISji6txJzPdZNbcSVuDk4OMG2Z9r5wOBBwjd3u3Hhm9XtpCWJO1YgTOlpgbn+g7DZX+pOagYYrCFUpQ19XkWz6Je8bHG9JcSDoGDqNgRbDbAUO8at6RCyqgPupJj5ArBDCt73fGQLTC4G3S0JMK9LsPiWz6GPj6qyzYoRzkj4R6bntRm74E4h8Y+z6u6B7+ixPSv8s1EFs8c+NUAB8TNKZZpXZquj2LXfx1xAie85Syl7qLqxLNtDG1dNBhBnHpYoE4gQzwyXqywf5pF2Q2imzPNzGQhurK+6gaNWgZbxRmjhdsW6TnzO5Kk6pzb5qpfgfcEScQeYHSj5GpD+yDUCNlhdbzhhWnEErH+wuBPpTG6UQhiC7m7yrJ7IY2E8K/BeUPlUvkhMaMwb4dA279pWMJdchNJ+TAxca+JVc80pXMG/PmrQUNJU9qdXRLbNmQbRadBNwV2qkPfgggL3q0yNd7Un9P+atmP3B9keBILif3ufsBDtVUobEniiyGV7YVDvQ/fQRVs7XDxJiOKkogjjQySyHgpjseO8iG5xtb9mrz6B3mDvv2aAuyDL6MHZRM7QDVPjUbgNMzDm5Sm3J7IhtzfR+3eMDws3qeTsxOt1KOslu983Btv1Wx37b5HJqX1pQU1dae/kOSJ7MifFd6wMkQtQBDgVoG3ka9wq5Vxq9Ki8bDOOMcwA2kUXhCcY3TZCXJfDWSKPTcCoNCYIv5LT2NFVdamiSfLIyeOjBNz459BfMvAoOZShFViQyc5YwjnReUQPQ8a18jcz8GoAK1O99e0h91oYxIgDV52EfS+IYrzqvJOEQbKQinB+LJwkPbBEp7ZtgAtiNBzm985hNgLfiBaVFWcRYwI3tNBCT1vkw2YI0NEEG0yOF29x+u64XzqyP1CX1pU6sGXEFn3RPdfYibf6bt/Y1BRqBL5l0CrXWsgDw02SqIFta8OvJ7Iwmq40/4acE/Ew6eWO/z2MHkWgqSpwGNjn7MfeKkTi44foZjfNqN9QOFQt6VG2tY+biKZDo0h9DAftae8Q2Xs2UDvsBYOm7YEahVkput6/uKzxljpXlz269qHk6ckvdN9hKLbaTO3/IZPCCPQ5a/a/sWn/1VOJj72sDk+23RNjBf0FL6bJMXZI5aQdtxbF1zij9mWcP9nJ9FHhj53ytuf1NiKl5xU8ZsaoKmCAJcXUz1n2FZvyWlqvgPYiszc7R8Y5dF6QbW2mlKnXzVy6qRMHNeQqGhCEncyT5nPNSdK5QlUwLokAIg',
        id: 'rs_51abe1aa-599b-80b6-57c8-dddc6263362f_us-east-1',
        status: 'completed',
        summary: [],
        type: 'reasoning',
      },
      {
        content: '42',
        role: 'assistant',
      },
    ]);
  });
});

describe('convertImageUrlToFile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data URL handling', () => {
    it('should convert PNG data URL to File object correctly', async () => {
      const base64Data =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const dataUrl = `data:image/png;base64,${base64Data}`;

      const result = await convertImageUrlToFile(dataUrl);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'image.png');
      expect(result).toHaveProperty('type', 'image/png');
      expect(result).toHaveProperty('size');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should convert JPEG data URL to File object correctly', async () => {
      const base64Data =
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA9BQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
      const dataUrl = `data:image/jpeg;base64,${base64Data}`;

      const result = await convertImageUrlToFile(dataUrl);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'image.jpeg');
      expect(result).toHaveProperty('type', 'image/jpeg');
      expect(result).toHaveProperty('size');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should convert WebP data URL to File object correctly', async () => {
      const base64Data = 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAAAAJaQAA6g=';
      const dataUrl = `data:image/webp;base64,${base64Data}`;

      const result = await convertImageUrlToFile(dataUrl);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'image.webp');
      expect(result).toHaveProperty('type', 'image/webp');
      expect(result).toHaveProperty('size');
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('HTTP URL handling', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      // Mock global fetch using vi.stubGlobal for better isolation
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it('should convert HTTP URL to File object correctly', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'image/jpeg');

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        headers: mockHeaders,
      } satisfies Partial<Response>);

      const result = await convertImageUrlToFile('https://example.com/image.jpg');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.jpg');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'image.jpeg');
      expect(result).toHaveProperty('type', 'image/jpeg');
      expect(result).toHaveProperty('size');
      expect(result.size).toEqual(8);
    });

    it('should handle different content types from HTTP response headers', async () => {
      const testCases = [
        { contentType: 'image/jpeg', expectedExtension: 'jpeg' },
        { contentType: 'image/png', expectedExtension: 'png' },
        { contentType: 'image/webp', expectedExtension: 'webp' },
        { contentType: null, expectedExtension: 'png' }, // default fallback
      ];

      for (const testCase of testCases) {
        const mockArrayBuffer = new ArrayBuffer(8);
        const mockHeaders = new Headers();
        if (testCase.contentType) {
          mockHeaders.set('content-type', testCase.contentType);
        }

        mockFetch.mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockArrayBuffer),
          headers: mockHeaders,
        } satisfies Partial<Response>);

        const result = await convertImageUrlToFile('https://example.com/image.jpg');

        expect(result).toHaveProperty('name', `image.${testCase.expectedExtension}`);
        expect(result).toHaveProperty('type', testCase.contentType || 'image/png');

        vi.clearAllMocks();
      }
    });

    it('should throw error when HTTP request fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } satisfies Partial<Response>);

      await expect(convertImageUrlToFile('https://example.com/nonexistent.jpg')).rejects.toThrow(
        'Failed to fetch image from https://example.com/nonexistent.jpg: Not Found',
      );

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/nonexistent.jpg');
    });

    it('should throw error when network request fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(convertImageUrlToFile('https://example.com/image.jpg')).rejects.toThrow(
        'Network error',
      );

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.jpg');
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed data URL gracefully', async () => {
      const malformedDataUrl = 'data:invalid-format';

      // 这个测试可能会抛出错误，我们需要适当处理
      await expect(convertImageUrlToFile(malformedDataUrl)).rejects.toThrow();
    });
  });
});
