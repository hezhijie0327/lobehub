import { useTranslation } from 'react-i18next';

import SettingHeader from '@/routes/(main)/settings/features/SettingHeader';

import FilesConfig from './features/FilesConfig';

const Page = () => {
  const { t } = useTranslation('setting');
  return (
    <>
      <SettingHeader title={t('tab.files')} />
      <FilesConfig />
    </>
  );
};

export default Page;
