'use client';

import { chainRewriteGenerationPrompt } from '@lobechat/prompts';
import { ActionIcon } from '@lobehub/ui';
import { Sparkles } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { conversationSelectors, useConversationStore } from '@/features/Conversation';
import { chatService } from '@/services/chat';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors, userGeneralSettingsSelectors } from '@/store/user/selectors';
import { merge } from '@/utils/merge';

const RewritePromptAction = memo(() => {
  const { t } = useTranslation('chat');
  const [isRewriting, setIsRewriting] = useState(false);

  const rewriteConfig = useUserStore(systemAgentSelectors.queryRewrite);
  const [editor, inputMessage] = useConversationStore((s) => [
    conversationSelectors.editor(s),
    conversationSelectors.inputMessage(s),
  ]);

  const handleRewritePrompt = useCallback(async () => {
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
  }, [editor, inputMessage, rewriteConfig]);

  return (
    <ActionIcon
      disabled={!rewriteConfig.enabled || !inputMessage?.trim()}
      icon={Sparkles}
      loading={isRewriting}
      size={{ blockSize: 28, size: 16 }}
      title={
        isRewriting
          ? t('pageCopilot.status.rewritingPrompt')
          : t('pageCopilot.actions.rewritePrompt')
      }
      onClick={handleRewritePrompt}
    />
  );
});

RewritePromptAction.displayName = 'RewritePromptAction';

export default RewritePromptAction;
