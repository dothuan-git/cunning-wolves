import { cleanName, isValidName, NAME_MAX, ROOM_NAME_MAX } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ScreenLayout } from '../../components/ScreenLayout';
import { TextField } from '../../components/TextField';

const SUGGESTIONS = [
  'roomNames.suggestion1',
  'roomNames.suggestion2',
  'roomNames.suggestion3',
  'roomNames.suggestion4',
  'roomNames.suggestion5',
  'roomNames.suggestion6',
  'roomNames.suggestion7',
  'roomNames.suggestion8',
  'roomNames.suggestion9',
  'roomNames.suggestion10',
  'roomNames.suggestion11',
  'roomNames.suggestion12',
] as const;

/** A random suggestion index, never the same as `current`. */
function nextSuggestion(current: number, random: () => number = Math.random): number {
  const step = 1 + Math.floor(random() * (SUGGESTIONS.length - 1));
  return (current + step) % SUGGESTIONS.length;
}

export function NameEntryScreen({
  mode,
  roomName,
  initialName = '',
  nameError,
  formError,
  busy = false,
  onContinue,
  onBack,
}: {
  /** create: also names the new room; join: enters an existing one */
  mode: 'create' | 'join';
  /** The room being joined, shown in the intro */
  roomName?: string;
  initialName?: string;
  /** From the room, e.g. the name is taken */
  nameError?: string;
  /** From the room or the network, about the form as a whole */
  formError?: string;
  busy?: boolean;
  onContinue: (name: string, roomName: string) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [suggestion, setSuggestion] = useState(() => nextSuggestion(-1));
  // null until typed in: until then the field follows the suggestion, in the current language.
  const [typedRoom, setTypedRoom] = useState<string | null>(null);
  const [invalidName, setInvalidName] = useState(false);
  const [invalidRoom, setInvalidRoom] = useState(false);
  // A server error belongs to what was sent; hide it once the name is edited.
  const [editedSinceError, setEditedSinceError] = useState(false);
  const room = typedRoom ?? t(SUGGESTIONS[suggestion] ?? SUGGESTIONS[0]);
  const create = mode === 'create';
  const shownNameError = invalidName
    ? t('nameEntry.error')
    : editedSinceError
      ? undefined
      : nameError;

  return (
    <ScreenLayout
      title={t(create ? 'rooms.create' : 'screens.nameEntry')}
      action={
        <Button variant="quiet" size="compact" onClick={onBack}>
          <Icon name="arrow" />
          {t('common.back')}
        </Button>
      }
      footer={
        <Button type="submit" form="name-entry" disabled={busy} className="press">
          {t(create ? 'nameEntry.createSubmit' : 'nameEntry.submit')}
        </Button>
      }
    >
      <p className="text-body text-muted">
        {create ? t('nameEntry.createIntro') : t('nameEntry.joinIntro', { room: roomName ?? '' })}
      </p>
      <form
        id="name-entry"
        className="panel grid gap-4 p-3.5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const cleanedName = cleanName(name);
          const cleanedRoom = cleanName(room);
          const nameOk = isValidName(cleanedName, NAME_MAX);
          const roomOk = !create || isValidName(cleanedRoom, ROOM_NAME_MAX);
          setInvalidName(!nameOk);
          setInvalidRoom(!roomOk);
          if (!nameOk || !roomOk) return;
          setEditedSinceError(false);
          onContinue(cleanedName, cleanedRoom);
        }}
      >
        {create && (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                label={t('nameEntry.roomLabel')}
                maxLength={ROOM_NAME_MAX}
                hint={t('nameEntry.roomHint')}
                error={invalidRoom ? t('nameEntry.roomError') : undefined}
                value={room}
                onChange={(event) => {
                  setTypedRoom(event.target.value);
                  setInvalidRoom(false);
                }}
              />
            </div>
            {/* Lines up with the input: the label above it is one control line high. */}
            <Button
              variant="secondary"
              size="icon"
              className="press mt-7"
              aria-label={t('nameEntry.shuffle')}
              onClick={() => {
                setSuggestion(nextSuggestion(suggestion));
                setTypedRoom(null);
                setInvalidRoom(false);
              }}
            >
              <Icon name="shuffle" />
            </Button>
          </div>
        )}
        <TextField
          label={t('nameEntry.label')}
          autoComplete="nickname"
          maxLength={NAME_MAX}
          placeholder={t('nameEntry.placeholder')}
          hint={t('nameEntry.hint')}
          error={shownNameError}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setInvalidName(false);
            setEditedSinceError(true);
          }}
        />
        {formError && (
          <p role="alert" className="name-pop text-caption text-danger">
            {formError}
          </p>
        )}
      </form>
    </ScreenLayout>
  );
}
