import type { AIChatModelCard } from '../types/aiModel';

const streamlakeModels: AIChatModelCard[] = [
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 262_144,
    description:
      'The latest high-performance model from the Kuaishou Kwaipilot team, designed for complex enterprise projects and SaaS integration. It excels in code-related scenarios and is compatible with various types of agent frameworks (Claude Code, OpenCode, KiloCode), natively supports OpenClaw, and is optimized specifically for front-end page aesthetics.',
    displayName: 'KAT-Coder-Pro-V2',
    enabled: true,
    id: 'KAT-Coder-Pro-V2',
    maxOutput: 81_920,
    pricing: {
      units: [
        { name: 'textInput', rate: 2.1, strategy: 'fixed', unit: 'millionTokens' },
        { name: 'textInput_cacheRead', rate: 0.42, strategy: 'fixed', unit: 'millionTokens' },
        { name: 'textOutput', rate: 8.4, strategy: 'fixed', unit: 'millionTokens' },
      ],
    },
    releasedAt: '2026-03-25',
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 262_144,
    description:
      'Designed for Agentic Coding, it comprehensively covers programming tasks and scenarios, achieving intelligent behavior emergence through large-scale reinforcement learning, significantly outperforming similar models in code writing performance.',
    displayName: 'KAT-Coder-Pro V1',
    id: 'KAT-Coder-Pro-V1',
    maxOutput: 32_768,
    pricing: {
      units: [
        { name: 'textInput', rate: 2.1, strategy: 'fixed', unit: 'millionTokens' },
        { name: 'textInput_cacheRead', rate: 0.42, strategy: 'fixed', unit: 'millionTokens' },
        { name: 'textOutput', rate: 8.4, strategy: 'fixed', unit: 'millionTokens' },
      ],
    },
    releasedAt: '2025-10-23',
    type: 'chat',
  },
  {
    contextWindowTokens: 131_072,
    description:
      'KAT-Coder-Exp-72B is the RL innovation experimental version in the KAT-Coder series, achieving a remarkable performance of 74.6% on the SWE-Bench verified benchmark, setting a new record for open-source models. It focuses on Agentic Coding and currently only supports the SWE-Agent scaffold, but can also be used for simple conversations.',
    displayName: 'KAT-Coder-Exp-72B-1010',
    id: 'KAT-Coder-Exp-72B-1010',
    maxOutput: 32_768,
    pricing: {
      units: [
        { name: 'textInput', rate: 0, strategy: 'fixed', unit: 'millionTokens' },
        { name: 'textInput_cacheRead', rate: 0, strategy: 'fixed', unit: 'millionTokens' },
        { name: 'textOutput', rate: 0, strategy: 'fixed', unit: 'millionTokens' },
      ],
    },
    releasedAt: '2025-10-15',
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 131_072,
    description:
      'A lightweight version within the KAT-Coder series. Specifically designed for Agentic Coding, it comprehensively covers programming tasks and scenarios. Leveraging large-scale agent-based reinforcement learning, it enables emergent intelligent behaviors and significantly outperforms comparable models in coding performance.',
    displayName: 'KAT-Coder-Air V1',
    enabled: true,
    id: 'KAT-Coder-Air-V1',
    maxOutput: 32_768,
    pricing: {
      units: [
        { name: 'textInput', rate: 0, strategy: 'fixed', unit: 'millionTokens' },
        { name: 'textInput_cacheRead', rate: 0, strategy: 'fixed', unit: 'millionTokens' },
        { name: 'textOutput', rate: 0, strategy: 'fixed', unit: 'millionTokens' },
      ],
    },
    releasedAt: '2025-10-15',
    type: 'chat',
  },
];

export const allModels = [...streamlakeModels];

export default allModels;
