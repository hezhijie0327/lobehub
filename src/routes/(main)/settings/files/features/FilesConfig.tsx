'use client';

import { type FormGroupItemType } from '@lobehub/ui';
import { Form, Skeleton } from '@lobehub/ui';
import { Select } from '@lobehub/ui/base-ui';
import isEqual from 'fast-deep-equal';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FORM_STYLE } from '@/const/layoutTokens';
import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { useEnabledEmbeddingModels } from '@/hooks/useEnabledEmbeddingModels';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';

const FilesConfigSetting = memo(() => {
  const { t } = useTranslation('setting');
  const [form] = Form.useForm();
  const { filesConfig } = useUserStore(settingsSelectors.currentSettings, isEqual);
  const [setSettings, isUserStateInit] = useUserStore((s) => [s.setSettings, s.isUserStateInit]);
  const [loading, setLoading] = useState(false);

  const embeddingModels = useEnabledEmbeddingModels();
  const chatModels = useEnabledChatModels();

  if (!isUserStateInit) return <Skeleton active paragraph={{ rows: 3 }} title={false} />;

  const embeddingModelOptions = embeddingModels.flatMap((provider) =>
    provider.children.map((model) => ({
      label: `${provider.name} / ${model.displayName || model.id}`,
      value: `${provider.id}/${model.id}`,
    })),
  );

  const rerankModelOptions = chatModels.flatMap((provider) =>
    provider.children.map((model) => ({
      label: `${provider.name} / ${model.displayName || model.id}`,
      value: `${provider.id}/${model.id}`,
    })),
  );

  const queryModeOptions = [
    { label: t('filesConfig.queryMode.fullText'), value: 'full_text' },
    { label: t('filesConfig.queryMode.semantic'), value: 'semantic' },
    { label: t('filesConfig.queryMode.hybrid'), value: 'hybrid' },
  ];

  const embeddingConfig: FormGroupItemType = {
    children: [
      {
        children: (
          <Select
            options={embeddingModelOptions}
            placeholder={t('filesConfig.embeddingModel.placeholder')}
            value={
              filesConfig?.embeddingModel
                ? `${filesConfig.embeddingModel.provider}/${filesConfig.embeddingModel.model}`
                : undefined
            }
            onChange={async (value: string) => {
              setLoading(true);
              const [provider, model] = value.split('/');
              await setSettings({
                filesConfig: {
                  ...filesConfig,
                  embeddingModel: { model, provider },
                },
              });
              setLoading(false);
            }}
          />
        ),
        desc: t('filesConfig.embeddingModel.desc'),
        label: t('filesConfig.embeddingModel.title'),
        layout: 'horizontal',
        minWidth: undefined,
      },
    ],
    title: t('filesConfig.embeddingGroup.title'),
  };

  const queryConfig: FormGroupItemType = {
    children: [
      {
        children: (
          <Select
            options={queryModeOptions}
            placeholder={t('filesConfig.queryMode.placeholder')}
            value={filesConfig?.queryMode}
            onChange={async (value: string) => {
              setLoading(true);
              await setSettings({
                filesConfig: {
                  ...filesConfig,
                  queryMode: value,
                },
              });
              setLoading(false);
            }}
          />
        ),
        desc: t('filesConfig.queryMode.desc'),
        label: t('filesConfig.queryMode.title'),
        layout: 'horizontal',
        minWidth: undefined,
      },
    ],
    title: t('filesConfig.queryGroup.title'),
  };

  const rerankConfig: FormGroupItemType = {
    children: [
      {
        children: (
          <Select
            options={rerankModelOptions}
            placeholder={t('filesConfig.rerankModel.placeholder')}
            value={
              filesConfig?.rerankerModel
                ? `${filesConfig.rerankerModel.provider}/${filesConfig.rerankerModel.model}`
                : undefined
            }
            onChange={async (value: string) => {
              setLoading(true);
              const [provider, model] = value.split('/');
              await setSettings({
                filesConfig: {
                  ...filesConfig,
                  rerankerModel: { model, provider },
                },
              });
              setLoading(false);
            }}
          />
        ),
        desc: t('filesConfig.rerankModel.desc'),
        label: t('filesConfig.rerankModel.title'),
        layout: 'horizontal',
        minWidth: undefined,
      },
    ],
    title: t('filesConfig.rerankGroup.title'),
  };

  return (
    <Form
      collapsible={false}
      form={form}
      initialValues={filesConfig}
      items={[embeddingConfig, queryConfig, rerankConfig]}
      itemsType={'group'}
      variant={'filled'}
      {...FORM_STYLE}
    />
  );
});

export default FilesConfigSetting;
