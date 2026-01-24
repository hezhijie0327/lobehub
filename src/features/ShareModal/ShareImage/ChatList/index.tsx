import { Flexbox } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { memo } from 'react';

import { ConversationProvider, MessageItem } from '@/features/Conversation';
import { useChatStore } from '@/store/chat';
import { dbMessageSelectors } from '@/store/chat/selectors';

const ChatList = memo(() => {
  const messages = useChatStore(dbMessageSelectors.activeDbMessages, isEqual);
  const ids = messages.map((m) => m.id);
  const agentId = useChatStore((s) => s.activeAgentId);
  const topicId = useChatStore((s) => s.activeTopicId);

  return (
    <ConversationProvider
      context={{ agentId, topicId }}
      hasInitMessages={true}
      messages={messages}
      skipFetch={true}
    >
      <Flexbox
        height={'100%'}
        style={{ padding: 24, pointerEvents: 'none', position: 'relative' }}
        width={'100%'}
      >
        {ids.map((id, index) => (
          <MessageItem id={id} index={index} key={id} />
        ))}
      </Flexbox>
    </ConversationProvider>
  );
});

export default ChatList;
