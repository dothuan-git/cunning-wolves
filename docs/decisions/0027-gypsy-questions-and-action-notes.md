# 0027 — Gypsy questions and action notes

Date: 2026-11-04. Status: accepted; amends decisions 0010 and 0025.

## Context

The Gypsy reads four questions a night from the New Moon expansion's Spiritualism cards, which the app did not hold, so the narrator had nothing to read from. Thuan asked for a pool of questions in the app, four offered at random, and a new four once one is picked.

Thuan also asked for each narrator action to leave a note, so one night can show several rows: a role change, a picked question and the narrator's own note. `GameState.newRoles` can't do that: it holds only the role a player plays now, so going back to the dealt role erases the history.

## Choice

- **The questions are the expansion's.** `packages/shared/src/roles/questions.ts` holds 24 yes-or-no questions as data like the role pool: 16 of the 20 on the five Spiritualism cards of New Moon and 8 of our own. Four of the expansion's are left out: two about the Sheriff, which this app has no role for, and two (a smoker, living where we play) that players who have just met can't answer. Ours stay to what can be seen or what the dead player saw in the nights, and to three seating questions (across from me, three on my left, three on my right), because a question about one neighbor is a near-copy of the three-player one. For the expansion’s questions, the English follows the wording of two independent sources that agree on all 20: a scan of the cards ([Scribd](https://www.scribd.com/document/746631062/new-Moon)) and a summary of the booklet ([Gray's Bluemoon](http://graysbluemoon.blogspot.com/2010/08/werewolves-of-millers-hollow-new-moon.html)). The Vietnamese is our own translation, because no official one was found. The expansion’s questions are its own text, used here at Thuan’s request. A first version had 40 originals, replaced once the official list was found.
- **A flat pool, not cards.** The expansion groups them four to a card and discards the whole card after one use, so the Gypsy can act five times at most. Thuan chose a single pool instead: any four at a time, one question leaves per pick, and there is no five-use limit. Some questions ask about what is visible on the real people in the room, or need the Witch or Seer in the game; the narrator skips what doesn't fit.
- **One deck per game.** Start game shuffles every question id into `GameState.questionDeck`, after the cards are dealt so the deal is unchanged. Every game gets a deck, because a player can become the Gypsy later. The top four are on offer. They stay until one is picked. On the night after a pick, the four go to the bottom without the picked one, so the other three return only after the whole deck has been through.
- **`pickQuestion { playerId, questionId }`**, master only: at night, for a player who plays the Gypsy now, alive when the night began (as for a note), and only a question on offer. `null` takes the pick back, even from a player who no longer plays the Gypsy, so a pick made while someone was the Gypsy by mistake can be undone. Two Gypsies share the offer and keep a pick each.
- **`GameState.actions`** is an ordered log of notes, each with a player, a phase and either a role or a question. The room stores ids, and the phone builds the text, so a note follows the phone's language. `newRoles` stays as the current state that groups the narrator's panels; `actions` is the history, and the summary's journal reads it instead of `newRoles`.
- **Mistakes leave no trace.** A new choice replaces this player's note of the same kind in this phase. A role change that lands back on the role the phase began with removes the note. A later phase adds a new note, including one for going back to the dealt role.
- **A phase can have many rows.** A player's history lists a phase's action notes in order, then the night's note, then `Died`. This ends the "one row per night" rule of decision 0010, so a death now always shows, even on a night with a note.
- **Storage.** A new `action_notes` table, and `question_deck` as one row of joined ids. `saveRoom` rewrites the whole room on every action, so a row per question would double the rows written. A game saved before this change loads with no notes and an empty deck, and an empty deck hides the question button.
- **Showing the question.** The asker must hear the question, and Thuan doesn't want to touch players' phones or let them see the narrator's page. This night's pick has an eye button that opens `QuestionCard`, a full-screen card with only the question and a Close button: no names (the sheet's title has the Gypsy's name, the card's has none), no roles, and nothing of the page behind it. It is local to the narrator's phone and sends nothing.

## Why

Keeping the deck in the room means a refresh shows the same four questions and a pick can be checked against them. A deck is also less code than tracking what has been seen: rotating it handles repeats and running out, with no special case.

A log of ids is the smallest thing that keeps the history and works in both languages. Storing finished sentences would freeze them in whichever language the narrator was using.

The Gypsy also names a player to ask the question. Thuan asked to record the question only, so that stays in the night's note.
