import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';
import { Modal } from './Modal';
import seal from '../assets/tabletop/wolf-seal.png';
import { LanguageSwitch } from './LanguageSwitch';

export function ScreenLayout({
  title,
  children,
  footer,
  action,
  compact = false,
  headerTools,
  onOpenMenu,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  headerTools?: ReactNode;
  onOpenMenu?: () => void;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-3" data-design-screen>
      <header className={`tabletop-heading pb-1.5 ${compact ? 'mb-4' : 'mb-5'}`}>
        <div className="flex min-h-12 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={seal} alt="" aria-hidden="true" className="size-7 shrink-0 object-contain" />
            <h1 className="min-w-0 font-display text-heading font-semibold">{title}</h1>
          </div>
          <div className="-mr-3 flex shrink-0 items-center">
            {headerTools}
            {action}
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
          </div>
        </div>
      </header>
      <div className={`flex min-w-0 flex-1 flex-col ${compact ? 'gap-3 pb-4' : 'gap-4 pb-6'}`}>
        {children}
      </div>
      {footer && (
        <footer className="screen-footer sticky bottom-0 z-10 grid gap-2 bg-paper/95 pt-3 backdrop-blur-sm">
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
          <div className="flex items-center justify-between text-control">
            <span>{t('language.label')}</span>
            <LanguageSwitch compact />
          </div>
        </Modal>
      )}
    </main>
  );
}
