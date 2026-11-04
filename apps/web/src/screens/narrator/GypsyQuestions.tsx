import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { useModalClose } from '../../components/modalClose';
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

/** One tappable, numbered list of questions; a tap sends the pick and closes the sheet. */
function QuestionList({
  questions,
  picked,
  clearOnly,
  disabled,
  onPick,
}: {
  questions: readonly QuestionItem[];
  picked: string | undefined;
  clearOnly: boolean;
  disabled: boolean;
  onPick: (questionId: string | null) => void;
}) {
  const locale = useLocale();
  const close = useModalClose();
  return (
    <ol className="flex min-h-full flex-col justify-center divide-y divide-line">
      {questions.map((question, index) => {
        const chosen = question.id === picked;
        return (
          <li key={question.id}>
            <button
              type="button"
              aria-pressed={chosen}
              disabled={disabled || (clearOnly && !chosen)}
              onClick={() => {
                onPick(chosen ? null : question.id);
                close();
              }}
              className="press flex min-h-12 w-full items-start gap-3 py-4 text-left font-display text-role font-semibold disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="text-muted tabular-nums">{index + 1}.</span>
              <span className="min-w-0 flex-1 break-words">{question.text[locale]}</span>
              <Icon name="check" className={chosen ? '' : 'invisible'} />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Tonight's questions; a tap picks one and closes, and tapping the pick clears it. */
export function QuestionSheet({
  questions,
  picked,
  clearOnly,
  disabled,
  onPick,
  onClose,
}: {
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
  return (
    <Modal fullScreen title={t('narrator.questionTitle')} onClose={onClose}>
      <QuestionList
        questions={questions}
        picked={picked}
        clearOnly={clearOnly}
        disabled={disabled}
        onPick={onPick}
      />
    </Modal>
  );
}

/**
 * The question alone, over the whole screen, for the narrator to hold up to the player who asks
 * it. It shows no name and no role, and nothing of the page behind it.
 */
export function QuestionCard({
  question,
  onClose,
}: {
  question: QuestionItem;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <Modal fullScreen hideTitle title={t('narrator.questionCard')} onClose={onClose}>
      <div className="grid min-h-full place-items-center">
        <p className="text-center font-display text-title font-semibold break-words">
          {question.text[locale]}
        </p>
      </div>
    </Modal>
  );
}
