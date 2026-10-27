# 0010 — One narrator list with night and morning phases

Date: 2026-10-27. Status: accepted. Supersedes the night switcher and the general night note in decision 0007.

## Context

The narrator page showed one night at a time: each night had its own blank fields, a night switcher went back to earlier nights, and each night had one general note. Thuan wanted the whole game on one screen, with each player's notes reading top to bottom like a log, and a morning step to record deaths after each night.

## Choice

- Play alternates **Night 1 → Morning 1 → Night 2 → …** until Finish game. End night moves to the morning; End morning starts the next night. There is no going back to an earlier phase.
- One list for the whole game, grouped by role in wake order. Roles that never wake (Villager) come last so their players can still be marked dead.
- Each night, every player who was alive when the night started gets one note field. A player marked dead during that night keeps that night's field. Mornings have no notes.
- Earlier notes stay under the player as text labelled with their night (`Night 1: …`). Tapping one edits it. Empty notes are not shown.
- Deaths can be marked or undone at night and in the morning. A death records the phase it was marked in, shows in the player's history (`Morning 1: Died`), and is removed when undone. A death is always recorded at the current phase.
- No general night note.
- The game summary's Night journal lists each phase with its player notes and deaths; phases with nothing recorded are skipped.

Data shape (implemented in the narrator phase): the room's current `phase {kind: 'night' | 'morning', number}`; per night `playerComments {deviceId: text}`; at most one `death {deviceId, phase}` per player.

## Why

A running list keeps every player's story visible without switching screens, which matches how narrators keep a paper notebook. Tap-to-edit and undoable deaths cover mistakes, so the night switcher is no longer needed. Recording morning deaths is the one day-phase fact the narrator needs; votes stay out of scope.

## Consequences

- Decision 0007's per-player identity rules still apply: notes are keyed by night and device ID, players sharing a role have separate notes, and editing a note never changes a status.
- An accidental End morning cannot be undone; deaths marked afterwards are recorded under the new night.
- The list grows by about one line per player per night. No collapsing for now.
