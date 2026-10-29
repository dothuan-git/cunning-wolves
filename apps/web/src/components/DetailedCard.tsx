import type { Locale, PoolRole } from '@werewolf/shared';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';
import { RoleFace } from './RoleFace';

// How long the closing animation runs before the dialog is removed.
const CLOSE_MS = 160;

/**
 * The detailed card: a role card enlarged in the middle of the phone, with its rule. Tapping the
 * dimmed background or pressing Escape closes it. The Close button is only for screen readers and
 * keyboards. `count` shows how many of this role are in the game.
 *
 * For the narrator, `editRule` makes the rule editable: tapping it turns it into a text box that
 * saves as it is typed (emptied, it goes back to what it was), and
 * `quantity` adds a stepper under the card; taking the last copy off closes it.
 */
export function DetailedCard({
  role,
  count,
  editRule,
  quantity,
  onClose,
}: {
  role: PoolRole;
  count?: number;
  editRule?: { value: string; onChange: (value: string) => void; label: string };
  quantity?: {
    value: number;
    canIncrease: boolean;
    onDecrease: () => void;
    onIncrease: () => void;
    decreaseLabel: string;
    increaseLabel: string;
  };
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'vi' ? 'vi' : 'en';
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  // The rule reads as text until it is tapped; then it is a text box until it loses focus.
  const [editingRule, setEditingRule] = useState(false);
  const ruleBefore = useRef('');
  const hintId = useId();
  const ruleBox = useRef<HTMLTextAreaElement>(null);

  // The text box is exactly as tall as its text, like the rule it replaces, so the card's art keeps
  // its size when editing starts. The caret starts at the end.
  useLayoutEffect(() => {
    const box = ruleBox.current;
    if (!box) return;
    box.style.height = 'auto';
    box.style.height = `${String(box.scrollHeight + box.offsetHeight - box.clientHeight)}px`;
  }, [editingRule, editRule?.value]);

  useLayoutEffect(() => {
    const box = ruleBox.current;
    if (editingRule && box) box.setSelectionRange(box.value.length, box.value.length);
  }, [editingRule]);

  /** Plays the closing animation, then asks the screen to remove the dialog. */
  function requestClose() {
    if (closing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, CLOSE_MS);
  }

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      window.clearTimeout(closeTimer.current);
      dialog?.close();
      queueMicrotask(() => {
        if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={role.name[locale]}
      data-closing={closing}
      data-editing={Boolean(editRule ?? quantity)}
      onCancel={(event) => {
        // Keep the dialog open while it animates out.
        event.preventDefault();
        requestClose();
      }}
      // Anything that is not the card or its controls is the background, the dialog's own empty
      // space included.
      onClick={(event) => {
        if (!(event.target instanceof Element) || !event.target.closest('[data-keep]')) {
          requestClose();
        }
      }}
      className="detailed-dialog m-auto max-h-none max-w-none overflow-visible border-0 bg-transparent p-0 backdrop:bg-ink/70"
    >
      <div
        data-keep
        className="detailed-card relative overflow-hidden rounded-playing border border-field-border bg-ivory shadow-float"
      >
        <RoleFace
          role={role}
          count={count}
          rule={
            editRule &&
            (editingRule ? (
              <div className="pt-3 text-center">
                <textarea
                  ref={ruleBox}
                  aria-label={editRule.label}
                  aria-describedby={hintId}
                  value={editRule.value}
                  rows={1}
                  maxLength={500}
                  autoFocus
                  onChange={(event) => {
                    editRule.onChange(event.target.value);
                  }}
                  onBlur={() => {
                    if (!editRule.value.trim()) editRule.onChange(ruleBefore.current);
                    setEditingRule(false);
                  }}
                  className="block w-full resize-none rounded-control border border-line bg-field p-2 text-center font-sans text-body text-pretty text-ink transition-colors"
                />
                <p key="editing" id={hintId} className="name-pop mt-1 text-caption text-muted">
                  {t('card.editDone')}
                </p>
              </div>
            ) : (
              <div className="pt-3 text-center">
                <button
                  type="button"
                  aria-describedby={hintId}
                  onClick={() => {
                    ruleBefore.current = editRule.value;
                    setEditingRule(true);
                  }}
                  className="press block w-full rounded-control border border-transparent p-2 text-body text-pretty text-ink hover:bg-field focus-visible:outline-2 focus-visible:outline-village"
                >
                  {editRule.value}
                </button>
                <p key="reading" id={hintId} className="name-pop mt-1 text-caption text-muted">
                  {t('card.tapToEdit')}
                </p>
              </div>
            ))
          }
        />
      </div>
      {quantity && (
        <div
          data-keep
          className="mx-auto mt-3 flex w-fit items-center rounded-full bg-field text-ink shadow-float"
        >
          <Button
            variant="quiet"
            size="icon"
            className="press rounded-full"
            disabled={quantity.value <= 0}
            aria-label={quantity.decreaseLabel}
            onClick={() => {
              quantity.onDecrease();
              // The last copy gone means the role is out of the game: nothing left to show.
              if (quantity.value <= 1) requestClose();
            }}
          >
            <Icon name="minus" />
          </Button>
          <span
            key={quantity.value}
            aria-live="polite"
            className="count-pop min-w-10 text-center font-display text-role font-semibold tabular-nums"
          >
            {quantity.value}
          </span>
          <Button
            variant="quiet"
            size="icon"
            className="press rounded-full"
            disabled={!quantity.canIncrease}
            aria-label={quantity.increaseLabel}
            onClick={quantity.onIncrease}
          >
            <Icon name="plus" />
          </Button>
        </div>
      )}
      <button type="button" onClick={requestClose} className="sr-only">
        {t('common.close')}
      </button>
    </dialog>
  );
}
