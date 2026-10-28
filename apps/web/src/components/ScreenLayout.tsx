import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { LanguageSwitch } from './LanguageSwitch';

export function ScreenLayout({
  title,
  children,
  footer,
  action,
  compact = false,
  headerTools,
  onOpenMenu,
  hero,
  fixed = false,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  headerTools?: ReactNode;
  onOpenMenu?: () => void;
  /** Replaces the title row with the screen's own first block, which must hold the h1. */
  hero?: ReactNode;
  /** Fills the screen height with no page scroll; the content must fit or size itself. */
  fixed?: boolean;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = (
    <Button
      variant="quiet"
      size="icon"
      aria-label={t('common.menu')}
      onClick={
        onOpenMenu ??
        (() => {
          setMenuOpen(true);
        })
      }
    >
      <Icon name="more" />
    </Button>
  );
  return (
    <main
      className={`page mx-auto flex w-full max-w-md flex-col pt-3 pl-5 ${fixed ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}
      data-design-screen
    >
      {hero ? (
        <header className={`relative ${compact ? 'mb-4' : 'mb-6'}`}>
          <div className="page-edge-absolute absolute top-0 z-10 flex items-center">
            {headerTools}
            {action}
            {menu}
          </div>
          {hero}
        </header>
      ) : (
        <header className={compact ? 'mb-3' : 'mb-5'}>
          <div className="flex min-h-12 items-center justify-between gap-2">
            <h1 className="min-w-0 font-display text-heading font-semibold">{title}</h1>
            <div className="page-edge flex shrink-0 items-center">
              {headerTools}
              {action}
              {menu}
            </div>
          </div>
        </header>
      )}
      <div
        className={`flex min-w-0 flex-1 flex-col ${fixed ? `min-h-0 gap-3 ${footer ? '' : 'screen-footer'}` : compact ? 'gap-3 pb-4' : 'gap-4 pb-6'}`}
      >
        {children}
      </div>
      {footer && (
        <footer className="screen-footer sticky bottom-0 z-10 grid gap-2 bg-paper pt-3">
          {footer}
        </footer>
      )}
      {menuOpen && (
        <Modal
          title={t('common.menu')}
          onClose={() => {
            setMenuOpen(false);
          }}
          sheet
        >
          <div className="grid gap-5">
            <div className="flex items-center justify-between text-control">
              <span>{t('language.label')}</span>
              <LanguageSwitch compact />
            </div>
            <section className="grid gap-1">
              <h3 className="text-control font-medium">{t('credits.title')}</h3>
              <p className="text-caption text-muted">{t('credits.woodcut')}</p>
            </section>
          </div>
        </Modal>
      )}
    </main>
  );
}
