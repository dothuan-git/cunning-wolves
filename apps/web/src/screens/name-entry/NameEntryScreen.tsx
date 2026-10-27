import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';

export function NameEntryScreen({
  onContinue,
  onBack,
}: {
  onContinue: (name: string) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [invalid, setInvalid] = useState(false);
  return (
    <ScreenLayout
      title={t('screens.nameEntry')}
      action={
        <Button variant="quiet" size="compact" onClick={onBack}>
          <Icon name="arrow" />
          {t('common.back')}
        </Button>
      }
      footer={
        <Button type="submit" form="name-entry">
          {t('nameEntry.submit')}
        </Button>
      }
    >
      <p className="text-body text-muted">{t('nameEntry.intro')}</p>
      <form
        id="name-entry"
        className="folio p-3.5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const value = name.trim();
          if (value.length === 0 || value.length > 24) {
            setInvalid(true);
            return;
          }
          onContinue(value);
        }}
      >
        <TextField
          label={t('nameEntry.label')}
          autoComplete="nickname"
          maxLength={24}
          placeholder={t('nameEntry.placeholder')}
          hint={t('nameEntry.hint')}
          error={invalid ? t('nameEntry.error') : undefined}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setInvalid(false);
          }}
        />
      </form>
    </ScreenLayout>
  );
}
