'use client';

import { chainRewriteGenerationPrompt } from '@lobechat/prompts';
import { Sparkles } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { chatService } from '@/services/chat';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors, userGeneralSettingsSelectors } from '@/store/user/selectors';
import { merge } from '@/utils/merge';

import { useChatInputStore } from '../../store';
import Action from '../components/Action';

const RewritePrompt = memo(() => {
  const { t } = useTranslation('chat');
  const [isRewriting, setIsRewriting] = useState(false);

  const rewriteConfig = useUserStore(systemAgentSelectors.promptRewrite);
  const [editor, getMarkdownContent] = useChatInputStore((s) => [s.editor, s.getMarkdownContent]);

  const handleRewritePrompt = useCallback(async () => {
    const inputMessage = getMarkdownContent();
    if (!inputMessage?.trim() || !editor) return;

    let rewrittenPrompt = '';

    await chatService.fetchPresetTaskResult({
      onError: () => {
        setIsRewriting(false);
      },
      onFinish: async (text) => {
        const nextPrompt = text.trim() || rewrittenPrompt.trim();
        if (!nextPrompt) return;

        editor.setDocument('markdown', nextPrompt);
      },
      onLoadingChange: setIsRewriting,
      onMessageHandle: (chunk) => {
        if (chunk.type === 'text') rewrittenPrompt += chunk.text;
      },
      params: merge(
        rewriteConfig,
        chainRewriteGenerationPrompt({
          locale: userGeneralSettingsSelectors.currentResponseLanguage(useUserStore.getState()),
          mode: 'text',
          prompt: inputMessage,
        }),
      ),
    });
  }, [editor, getMarkdownContent, rewriteConfig]);

  return (
    <Action
      disabled={!rewriteConfig.enabled || !getMarkdownContent()?.trim()}
      icon={Sparkles}
      loading={isRewriting}
      title={
        isRewriting
          ? t('pageCopilot.status.rewritingPrompt')
          : t('pageCopilot.actions.rewritePrompt')
      }
      onClick={handleRewritePrompt}
    />
  );
});

RewritePrompt.displayName = 'RewritePrompt';

export default RewritePrompt;
