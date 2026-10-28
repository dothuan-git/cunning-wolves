import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FactionLabel } from '../../components/FactionLabel';
import { PlayerChip } from '../../components/PlayerChip';
import { RoleArtwork } from '../../components/RoleArtwork';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';

export function ComponentsPreview() {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  return (
    <ScreenLayout title={t('preview.components')}>
      <p className="text-control text-muted">{t('preview.componentHint')}</p>
      <Card>
        <h2 className="mb-2 font-display text-heading font-medium">{t('components.type')}</h2>
        <p>{t('components.body')}</p>
        <div className="mt-3 flex gap-4">
          <FactionLabel team="village" />
          <FactionLabel team="werewolf" />
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Button>{t('components.primary')}</Button>
        <Button variant="secondary">{t('components.secondary')}</Button>
        <Button variant="quiet">{t('components.quiet')}</Button>
        <Button variant="danger">{t('components.danger')}</Button>
        <Button disabled className="col-span-2">
          {t('components.disabled')}
        </Button>
      </div>
      <TextField
        label={t('components.field')}
        hint={t('components.hint')}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      <TextField label={t('components.field')} error={t('components.error')} defaultValue="" />
      <section className="grid gap-3">
        <h2 className="font-display text-role">{t('components.states')}</h2>
        <PlayerChip name="Linh" />
        <PlayerChip name="Minh" dead />
      </section>
      <div className="h-40">
        <RoleArtwork />
      </div>
    </ScreenLayout>
  );
}
