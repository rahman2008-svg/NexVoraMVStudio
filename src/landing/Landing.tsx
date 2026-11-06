import { AudioLines, Download, FileAudio, Film, Github, Lock, Sparkles, Type, Wand2, Waves } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguagePicker } from '../components/LanguagePicker';
import { companyName, developer, licensesUrl, privacyUrl, sourceArchiveUrl, studioVersion, upstreamUrl } from '../domain/about';

const features = [
  { icon: Sparkles, key: 'f1' }, { icon: Wand2, key: 'f2' }, { icon: Waves, key: 'f3' },
  { icon: Type, key: 'f4' }, { icon: Film, key: 'f5' }, { icon: Lock, key: 'f6' },
] as const;
const steps = [{ icon: FileAudio, key: 's1' }, { icon: Wand2, key: 's2' }, { icon: Download, key: 's3' }] as const;

export function Landing({ open, returning }: { open: () => void; returning: boolean }) {
  const { t } = useTranslation();
  const cta = returning ? t('nx.landing.resume') : t('nx.landing.open');
  return <div className="nx-landing">
    <div className="nx-aurora" aria-hidden="true"/>
    <header className="nx-nav">
      <a className="nx-brand" href="#top" aria-label="NexVora MV Studio"><span className="brand-symbol"><AudioLines size={20}/></span><strong>NexVora<span>MV Studio</span></strong></a>
      <nav aria-label="Sections"><a href="#features">{t('nx.landing.nav.features')}</a><a href="#workflow">{t('nx.landing.nav.workflow')}</a><a href="#developer">{t('nx.landing.nav.developer')}</a></nav>
      <div className="nx-nav-actions"><LanguagePicker/><button className="primary" onClick={open}>{cta}</button></div>
    </header>
    <main id="top">
      <section className="nx-hero">
        <p className="nx-eyebrow">{t('nx.landing.eyebrow')}</p>
        <h1>{t('nx.landing.title')}</h1>
        <p className="nx-sub">{t('nx.landing.subtitle')}</p>
        <div className="nx-cta"><button className="primary nx-cta-main" onClick={open}><Film size={17}/>{cta}</button><a className="nx-ghost" href="#features">{t('nx.landing.seeFeatures')}</a></div>
        <ul className="nx-badges"><li>{t('nx.landing.badge1')}</li><li>{t('nx.landing.badge2')}</li><li>{t('nx.landing.badge3')}</li></ul>
        <div className="nx-demo" aria-hidden="true"><span className="nx-demo-line a">We follow the light</span><span className="nx-demo-line b">আলোর পথে হাঁটি</span><span className="nx-demo-bars">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 9) * 0.11}s` }}/>)}</span></div>
      </section>
      <section id="features" className="nx-section"><h2>{t('nx.landing.features')}</h2>
        <div className="nx-grid">{features.map(({ icon: Icon, key }) => <article key={key} className="nx-card"><span className="nx-icon"><Icon size={20}/></span><h3>{t(`nx.landing.${key}.t`)}</h3><p>{t(`nx.landing.${key}.b`)}</p></article>)}</div></section>
      <section id="workflow" className="nx-section"><h2>{t('nx.landing.workflow')}</h2>
        <ol className="nx-steps">{steps.map(({ icon: Icon, key }, i) => <li key={key} className="nx-card"><span className="nx-step">{i + 1}</span><Icon size={20}/><h3>{t(`nx.landing.${key}.t`)}</h3><p>{t(`nx.landing.${key}.b`)}</p></li>)}</ol></section>
      <section id="developer" className="nx-section nx-dev"><h2>{t('nx.landing.devTitle')}</h2><p>{t('nx.landing.devBody')}</p>
        <div className="nx-dev-links">{developer.whatsapp.map(item => <a key={item.url} href={item.url} target="_blank" rel="noreferrer">WhatsApp {item.label}</a>)}<a href={developer.facebook} target="_blank" rel="noreferrer">Facebook</a><a href={developer.instagram} target="_blank" rel="noreferrer">Instagram</a></div>
        <button className="primary" onClick={open}>{cta}</button></section>
    </main>
    <footer className="nx-footer"><span>{'\u00a9'} 2026 {companyName}. {t('nx.dev.developedBy')} · v{studioVersion}</span><span>{t('nx.landing.footer')} · <a href={sourceArchiveUrl}>{t('nx.about.sourceZip')}</a> · <a href={upstreamUrl} target="_blank" rel="noreferrer"><Github size={12}/> UseSuno</a> · <a href={privacyUrl}>{t('about.privacy')}</a> · <a href={licensesUrl}>{t('about.notices')}</a></span></footer>
  </div>;
}
