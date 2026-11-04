# Gypsy / Người gọi hồn

- **id:** `gypsy`
- **Team:** village
- **Wakes at night:** yes (460), after `magician` and before `pied-piper`
- **Card art:** `apps/web/src/assets/cards/gypsy.webp`

## Rule (vi)

Mỗi đêm quản trò có thể đọc cho bạn bốn câu hỏi: chọn một câu và một người trung gian để hỏi. Sáng hôm sau người đó hỏi to, và người chết đầu tiên trả lời "có" hoặc "không".

## Rule (en)

Each night the narrator may read you four questions: pick one and a player to ask it. Next morning that player asks it aloud, and the first dead player answers "yes" or "no".

## Narrator notes

At night a question button sits in the Gypsy's row. It opens four random questions from the app's pool of 24 questions, mostly from the expansion's Spiritualism cards (`packages/shared/src/roles/questions.ts`). The narrator reads them out and taps the one chosen, and it shows as a note in the player's history. The same four stay until one is picked; the next night then offers four others. The app does not record which player will ask it: write that in the night's note. See decision 0027.
