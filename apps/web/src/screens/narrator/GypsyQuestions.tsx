import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { Modal, ModalDone } from '../../components/Modal';
import { useLocale } from '../../i18n/useLocale';
import type { QuestionItem } from '../types';

/** Opens the Gypsy's questions; ink once one is picked tonight. */
export function QuestionButton({
  name,
  picked,
  disabled = false,
  onOpen,
}: {
  name: string;
  picked: boolean;
  disabled?: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t('player.pickQuestion', { name })}
      aria-haspopup="dialog"
      disabled={disabled}
      onClick={onOpen}
      className={`press flex min-h-12 min-w-12 shrink-0 items-center justify-center px-2 disabled:cursor-not-allowed disabled:opacity-45 ${picked ? 'text-ink' : 'text-muted hover:text-ink'}`}
    >
      <Icon name="question" />
    </button>
  );
}

/** Tonight's questions; each tap goes straight to the room, and tapping the pick clears it. */
export function QuestionSheet({
  name,
  questions,
  picked,
  clearOnly,
  disabled,
  onPick,
  onClose,
}: {
  name: string;
  questions: readonly QuestionItem[];
  /** The question id picked tonight */
  picked: string | undefined;
  /** The player no longer plays the Gypsy, so their pick can only be taken back */
  clearOnly: boolean;
  disabled: boolean;
  /** null: no pick */
  onPick: (questionId: string | null) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <Modal
      sheet
      title={t('narrator.questionTitle', { name })}
      footer={<ModalDone />}
      onClose={onClose}
    >
      <ul className="divide-y divide-line">
        {questions.map((question) => {
          const chosen = question.id === picked;
          return (
            <li key={question.id}>
              <button
                type="button"
                aria-pressed={chosen}
                disabled={disabled || (clearOnly && !chosen)}
                onClick={() => {
                  onPick(chosen ? null : question.id);
                }}
                className={`press flex min-h-12 w-full items-start justify-between gap-3 py-3 text-left text-body disabled:cursor-not-allowed disabled:opacity-45 ${chosen ? 'font-medium' : ''}`}
              >
                <span className="min-w-0 break-words">{question.text[locale]}</span>
                <Icon name="check" className={`mt-0.5 ${chosen ? '' : 'invisible'}`} />
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
