import { useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { setLocale } from '../../i18n';
import { useLocale } from '../../i18n/useLocale';
import { RoomListScreen } from '../../screens/home/RoomListScreen';
import { MasterLobbyScreen } from '../../screens/master-lobby/MasterLobbyScreen';
import { MyCardScreen } from '../../screens/my-card/MyCardScreen';
import { NameEntryScreen } from '../../screens/name-entry/NameEntryScreen';
import { NarratorScreen } from '../../screens/narrator/NarratorScreen';
import { nextPhase } from '../../screens/narrator/phase';
import { PlayerLobbyScreen } from '../../screens/player-lobby/PlayerLobbyScreen';
import { RulesReviewScreen } from '../../screens/rules-review/RulesReviewScreen';
import { SetupScreen } from '../../screens/setup/SetupScreen';
import { SummaryScreen } from '../../screens/summary/SummaryScreen';
import type { Phase } from '../../screens/types';
import { ComponentsPreview } from './ComponentsPreview';
import { exampleGroups, examplePlayers, exampleRoles, manyRoles, seer, villager } from './fixtures';
import { isPreviewState, isScreen, SCREEN_IDS, SCREEN_LABELS, SCREEN_STATES } from './screens';
import type { PreviewState, ScreenId } from './screens';

function readLocation() {
  const query = new URLSearchParams(window.location.search);
  const screen = query.get('screen');
  const state = query.get('state');
  return {
    screen: isScreen(screen) ? screen : 'home',
    state: isPreviewState(state) ? state : 'default',
    locale: query.get('lang'),
    capture: query.get('capture') === '1',
  } as const;
}

function PreviewScene({
  screen,
  state,
  onNavigate,
}: {
  screen: ScreenId;
  state: PreviewState;
  onNavigate: (screen: ScreenId) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [phase, setPhase] = useState<Phase>(() =>
    state === 'morning' ? { kind: 'morning', number: 2 } : { kind: 'night', number: 2 },
  );
  // Sample notes follow the language; typed edits are kept separately and win.
  const [noteEdits, setNoteEdits] = useState<Record<number, Record<string, string>>>({});
  const sampleNotes: Record<number, Record<string, string>> = {
    1: {
      linh:
        state === 'long'
          ? `${t('preview.noteSeer')} ${t('preview.noteWitch')} `.repeat(4).trim()
          : t('preview.noteSeer'),
      minh: t('preview.noteWolves'),
      ha: t('preview.noteWitch'),
    },
    2: state === 'morning' ? { linh: t('preview.noteSeer2'), minh: t('preview.noteWolves2') } : {},
  };
  const [deaths, setDeaths] = useState(() => {
    const sample: Record<string, Phase> = {};
    if (state === 'dead') sample.linh = { kind: 'morning', number: 1 };
    if (state === 'morning') sample.linh = { kind: 'night', number: 2 };
    return sample;
  });
  const [listState, setListState] = useState(state);
  const roomName = t('preview.room');
  // A full table: the sample players and twelve more.
  const crowd = [
    'Bảo',
    'Châu',
    'Dũng',
    'Giang',
    'Khoa',
    'Lan',
    'Nam',
    'Oanh',
    'Phúc',
    'Quỳnh',
    'Sơn',
    'Trang',
  ].map((name) => ({ id: `guest-${name}`, name }));
  const players =
    state === 'long'
      ? examplePlayers.map((player, index) =>
          index === 0 ? { ...player, name: 'Nguyễn Hoàng Minh Phương' } : player,
        )
      : state === 'many'
        ? [...examplePlayers, ...crowd.map((guest) => ({ ...guest, role: villager }))]
        : examplePlayers;
  switch (screen) {
    case 'home':
      return (
        <RoomListScreen
          rooms={
            listState === 'empty'
              ? []
              : [
                  {
                    id: 'mill',
                    name: roomName,
                    master: 'Thuan',
                    count: 6,
                    status: 'lobby',
                    isOpen: true,
                  },
                  {
                    id: 'inn',
                    name: t('preview.otherRoom'),
                    master: 'Mai',
                    count: 8,
                    status: 'playing',
                    isOpen: false,
                  },
                ]
          }
          status={listState === 'loading' ? 'loading' : listState === 'error' ? 'error' : 'ready'}
          onCreate={() => {
            onNavigate('name-entry');
          }}
          onJoin={() => {
            onNavigate('name-entry');
          }}
          onRetry={() => {
            setListState('default');
          }}
        />
      );
    case 'name-entry':
      return (
        <NameEntryScreen
          onContinue={() => {
            onNavigate('master-lobby');
          }}
          onBack={() => {
            onNavigate('home');
          }}
        />
      );
    case 'master-lobby':
      return (
        <MasterLobbyScreen
          roomName={roomName}
          players={state === 'empty' ? [] : players}
          onPrepare={() => {
            onNavigate('setup');
          }}
        />
      );
    case 'player-lobby':
      return (
        <PlayerLobbyScreen
          roomName={roomName}
          players={players.map(({ id, name }) => ({ id, name }))}
          roles={exampleRoles}
          selfId={players[0]?.id ?? ''}
          reconnecting={state === 'loading'}
          removed={state === 'removed'}
          onLeave={() => {
            onNavigate('home');
          }}
        />
      );
    case 'setup':
      return (
        <SetupScreen
          roles={exampleRoles}
          initialSlots={
            state === 'empty'
              ? [null, null, null, null, null, null]
              : ['seer', 'werewolf', 'werewolf', 'witch', 'villager', null]
          }
          onReady={() => {
            onNavigate('rules-review');
          }}
        />
      );
    case 'rules-review':
      return (
        <RulesReviewScreen
          roles={(state === 'many' ? manyRoles : exampleRoles).map((role) => ({
            role,
            count:
              examplePlayers.filter((player) => player.role.id === role.id).length ||
              (role.team === 'werewolf' ? 1 : 2),
          }))}
        />
      );
    case 'my-card': {
      const role =
        state === 'long'
          ? {
              ...seer,
              name: {
                vi: 'Người canh giữ ngọn đèn cuối làng',
                en: 'Keeper of the last village lantern',
              },
              rule: {
                vi: (seer.rule.vi + ' ').repeat(5).trim(),
                en: (seer.rule.en + ' ').repeat(5).trim(),
              },
            }
          : seer;
      return <MyCardScreen key={state} role={role} initiallyRevealed={state !== 'hidden'} />;
    }
    case 'narrator':
      return (
        <NarratorScreen
          groups={exampleGroups.map((group) => ({
            ...group,
            players: group.players.map(
              (player) => players.find((item) => item.id === player.id) ?? player,
            ),
          }))}
          phase={phase}
          notes={Object.fromEntries(
            Array.from({ length: phase.number }, (_, index) => [
              index + 1,
              { ...sampleNotes[index + 1], ...noteEdits[index + 1] },
            ]),
          )}
          deaths={deaths}
          onPlayerNote={(night, id, text) => {
            setNoteEdits((current) => ({
              ...current,
              [night]: { ...current[night], [id]: text },
            }));
          }}
          onTogglePlayer={(id) => {
            setDeaths((current) =>
              id in current
                ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== id))
                : { ...current, [id]: phase },
            );
          }}
          onEndPhase={() => {
            setPhase(nextPhase);
          }}
          onFinish={() => {
            onNavigate('summary');
          }}
        />
      );
    case 'summary':
      return (
        <SummaryScreen
          roomName={roomName}
          initialTab={state === 'notes' || state === 'empty' ? 'notes' : 'roles'}
          onHome={() => {
            onNavigate('home');
          }}
          players={players}
          nights={2}
          journal={
            state === 'empty'
              ? []
              : [
                  {
                    phase: { kind: 'night', number: 1 },
                    notes: [
                      { id: 'linh', name: 'Linh', text: t('preview.noteSeer') },
                      { id: 'minh', name: 'Minh', text: t('preview.noteWolves') },
                      { id: 'ha', name: 'Hà', text: t('preview.noteWitch') },
                    ],
                    deaths: [],
                  },
                  {
                    phase: { kind: 'morning', number: 1 },
                    notes: [],
                    deaths: [{ id: 'huy', name: 'Huy' }],
                  },
                  {
                    phase: { kind: 'night', number: 2 },
                    notes: [
                      { id: 'linh', name: 'Linh', text: t('preview.noteSeer2') },
                      { id: 'minh', name: 'Minh', text: t('preview.noteWolves2') },
                    ],
                    deaths: [{ id: 'linh', name: 'Linh' }],
                  },
                ]
          }
          onPlayAgain={() => {
            onNavigate('master-lobby');
          }}
        />
      );
    case 'components':
      return <ComponentsPreview key={locale} />;
  }
}

const PHONE = { width: 390, height: 844 } as const;
const WIDE_QUERY = '(min-width: 40rem)';

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
}

export default function PreviewApp() {
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useState(readLocation);
  const [revision, setRevision] = useState(0);
  // On a wide screen the scene renders in a phone-sized frame, so its width is obvious.
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches);
  const framed = wide && !location.capture;
  const frameQuery = new URLSearchParams({
    screen: location.screen,
    state: location.state,
    lang: i18n.language,
    capture: '1',
  });
  useEffect(() => {
    if (location.locale === 'vi' || location.locale === 'en') setLocale(location.locale);
  }, [location.locale]);
  useEffect(() => {
    const onPopState = () => {
      setLocation(readLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  function navigate(screen: ScreenId, state: PreviewState = 'default') {
    const query = new URLSearchParams({ screen, state, lang: i18n.language });
    if (location.capture) query.set('capture', '1');
    window.history.pushState(null, '', `/design?${query.toString()}`);
    setLocation(readLocation());
    window.scrollTo(0, 0);
  }

  return (
    <>
      {!location.capture && (
        <details className="border-b border-line bg-surface px-5" aria-label={t('preview.title')}>
          <summary className="mx-auto min-h-12 max-w-3xl cursor-pointer py-3 text-caption text-muted">
            {t('preview.title')}
          </summary>
          <div className="mx-auto grid max-w-3xl gap-3 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-heading">{t('preview.title')}</h2>
              <a
                href="/"
                className="inline-flex min-h-12 items-center text-control text-village underline underline-offset-4"
              >
                {t('preview.back')}
              </a>
            </div>
            <p className="text-control text-muted">{t('preview.notice')}</p>
            <div className="flex flex-wrap gap-3">
              <label className="grid flex-1 gap-1 text-caption">
                {t('preview.screen')}
                <select
                  aria-label={t('preview.screen')}
                  className="min-h-12 min-w-0 rounded-control border border-field-border bg-paper px-3 text-body"
                  value={location.screen}
                  onChange={(event) => {
                    if (isScreen(event.target.value)) navigate(event.target.value);
                  }}
                >
                  {SCREEN_IDS.map((screen) => (
                    <option key={screen} value={screen}>
                      {t(SCREEN_LABELS[screen])}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid flex-1 gap-1 text-caption">
                {t('preview.state')}
                <select
                  aria-label={t('preview.state')}
                  className="min-h-12 min-w-0 rounded-control border border-field-border bg-paper px-3 text-body"
                  value={location.state}
                  onChange={(event) => {
                    if (isPreviewState(event.target.value))
                      navigate(location.screen, event.target.value);
                  }}
                >
                  {SCREEN_STATES[location.screen].map((state) => (
                    <option key={state} value={state}>
                      {t(`preview.${state}`)}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="quiet"
                onClick={() => {
                  setRevision((value) => value + 1);
                }}
              >
                {t('preview.reset')}
              </Button>
            </div>
          </div>
        </details>
      )}
      {framed ? (
        <figure className="grid justify-items-center gap-2 px-5 py-6">
          <figcaption className="text-caption text-muted">{t('preview.frame', PHONE)}</figcaption>
          <div className="rounded-4xl bg-ink p-2.5 shadow-float">
            <iframe
              key={`${frameQuery.toString()}-${String(revision)}`}
              title={t('preview.frame', PHONE)}
              src={`/design?${frameQuery.toString()}`}
              className="block h-211 w-97.5 rounded-3xl bg-paper"
            />
          </div>
        </figure>
      ) : (
        <div className="mx-auto w-full max-w-[390px]">
          <PreviewScene
            key={`${location.screen}-${location.state}-${String(revision)}`}
            screen={location.screen}
            state={location.state}
            onNavigate={navigate}
          />
        </div>
      )}
    </>
  );
}
