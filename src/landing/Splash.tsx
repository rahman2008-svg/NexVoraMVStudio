import { useTranslation } from 'react-i18next';
// Same markup as the static splash in index.html, shown while the studio chunk loads.
export function Splash() {
  const { t } = useTranslation();
  return <div className="nx-splash" role="status"><span className="nx-splash-mark"><i/><i/><i/><i/><i/></span><strong>NexVora<span>MV Studio</span></strong><small>{t('nx.loading')}</small></div>;
}
