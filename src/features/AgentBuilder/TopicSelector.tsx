import { ActionIcon, type DropdownItem, DropdownMenu, Flexbox, Icon } from '@lobehub/ui';
import { App } from 'antd';
import { createStaticStyles } from 'antd-style';
import dayjs from 'dayjs';
import { Clock3Icon, MoreHorizontalIcon, PlusIcon, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DESKTOP_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import NavHeader from '@/features/NavHeader';
import { mutate } from '@/libs/swr';
import { topicService } from '@/services/topic';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/slices/topic/selectors';
import { topicMapKey } from '@/store/chat/utils/topicMapKey';

const styles = createStaticStyles(({ css, cssVar }) => ({
  time: css`
    margin-inline-start: 6px;
    font-size: 12px;
    color: ${cssVar.colorTextTertiary};
  `,
  title: css`
    overflow: hidden;

    font-size: 14px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

interface TopicSelectorProps {
  agentId: string;
}

const TopicSelector = memo<TopicSelectorProps>(({ agentId }) => {
  const { t } = useTranslation(['common', 'topic']);
  const { modal } = App.useApp();

  // Fetch topics for the agent builder
  const useFetchTopics = useChatStore((s) => s.useFetchTopics);

  useFetchTopics(true, { agentId });

  const [activeTopicId, switchTopic, topics] = useChatStore((s) => [
    s.activeTopicId,
    s.switchTopic,
    topicSelectors.getTopicsByAgentId(agentId)(s),
  ]);

  // Find active topic from the agent's topics list directly
  const activeTopic = useMemo(
    () => topics?.find((topic) => topic.id === activeTopicId),
    [topics, activeTopicId],
  );

  const handleDeleteTopic = useCallback(
    (topicId: string, topicTitle: string) => {
      modal.confirm({
        cancelText: t('cancel', { ns: 'common' }),
        centered: true,
        content: t('actions.confirmRemoveTopic', {
          ns: 'topic',
          title: topicTitle,
        }),
        okButtonProps: { danger: true },
        okText: t('delete', { ns: 'common' }),
        onOk: async () => {
          await topicService.removeTopic(topicId);
          const containerKey = topicMapKey({ agentId });
          await mutate(
            (key) =>
              Array.isArray(key) && key[0] === 'SWR_USE_FETCH_TOPIC' && key[1] === containerKey,
            undefined,
            { revalidate: true },
          );
        },
        title: t('delete', { ns: 'common' }),
      });
    },
    [agentId, modal, t],
  );

  const items = useMemo<DropdownItem[]>(
    () =>
      (topics || []).map((topic) => {
        const displayTime =
          dayjs().diff(dayjs(topic.updatedAt), 'd') < 7
            ? dayjs(topic.updatedAt).fromNow()
            : dayjs(topic.updatedAt).format('YYYY-MM-DD');

        const topicActions: DropdownItem[] = [
          {
            danger: true,
            icon: <Icon icon={Trash2} />,
            key: `delete-${topic.id}`,
            label: t('delete', { ns: 'common' }),
            onClick: () => {
              handleDeleteTopic(topic.id, topic.title);
            },
          },
        ];

        return {
          extra: (
            <span
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <DropdownMenu items={topicActions} placement="bottomRight">
                <ActionIcon icon={MoreHorizontalIcon} size={'small'} />
              </DropdownMenu>
            </span>
          ),
          key: topic.id,
          label: (
            <Flexbox horizontal align="center" gap={4} justify="space-between" width="100%">
              <span className={styles.title}>{topic.title}</span>
              <span className={styles.time}>{displayTime}</span>
            </Flexbox>
          ),
          onClick: () => {
            switchTopic(topic.id);
          },
        };
      }),
    [topics, switchTopic, styles, t, handleDeleteTopic],
  );
  const isEmpty = !topics || topics.length === 0;

  return (
    <NavHeader
      showTogglePanelButton={false}
      left={
        activeTopic?.title ? <span className={styles.title}>{activeTopic.title}</span> : undefined
      }
      right={
        <>
          <ActionIcon
            icon={PlusIcon}
            size={DESKTOP_HEADER_ICON_SIZE}
            title={t('actions.addNewTopic', { ns: 'topic' })}
            onClick={() => switchTopic()}
          />
          <DropdownMenu
            items={items}
            placement="bottomRight"
            popupProps={{ style: { maxHeight: 400, minWidth: 280, overflowY: 'auto' } }}
            triggerProps={{ disabled: isEmpty }}
          >
            <ActionIcon disabled={isEmpty} icon={Clock3Icon} />
          </DropdownMenu>
        </>
      }
    />
  );
});

TopicSelector.displayName = 'TopicSelector';

export default TopicSelector;
