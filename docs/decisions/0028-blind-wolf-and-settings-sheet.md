# 0028 — Blind wolf and one settings sheet

Date: 2026-11-11. Status: accepted; amends decisions 0014 and 0020.

## Context

Thuan asked for a **Blind wolf** switch in the narrator's settings. When it is on, every player still gets the card screen (the card back, the deal-in toss, Back to the roles), but nobody can flip their card to see their role.

Thuan also asked for a more compact settings menu, mainly the timer. There were two copies of the menu: `RoomSettingsSheet` for Setup and the rules review, and a sheet written inside the narrator page. The timer took about three rows: a typed "seconds" field with a hint, plus a countdown row during the game. The typed length was saved when the sheet closed, but the switches saved straight away.

## Choice

- **`RoomSettings.blindWolf`**, off by default. It goes through `setSettings` like the timer and sound, so the narrator can change it in lobby, reveal and playing. Play again keeps it, like every setting.
- **The room withholds the card.** While Blind wolf is on and the room is playing, a dealt player's view has `card: null` and a new `cardLocked: true`. Turning it off sends the card on the next view, and turning it on takes it back. After Finish the reveal shows every card as before. The setting itself stays in the master-only `setup`; a locked player only learns that their card is locked. To keep the card off every phone, the narrator turns it on before Start game: turned on later, it can't take back a card that was already sent.
- **Storage.** A new one-row table, `blind_wolf`. A room saved before it has no row and loads with Blind wolf off; the `settings` table is unchanged.
- **The phone.** `RoomScreen` shows the card screen when there is a card or a locked one, so switching the lock doesn't deal the card in again. Without a role, `RoleCard` draws only the back and its flip button is disabled. `MyCardScreen` turns a card that was showing face down, so unlocking later never shows it at once, and its hint says the narrator has locked the cards.
- **One sheet.** The narrator page uses `RoomSettingsSheet` too, passing its countdown (`countdown`). The countdown and its chime stay on the narrator page, so the timer keeps running while the sheet is shut. The sheet is one ruled list: language, the timer, sound, Blind wolf (with a line on what it does, through a new `SwitchRow` `hint`), then the wake order and Delete room.
- **Timer presets.** Thuan chose six buttons: Off, 1:00, 1:30, 2:00, 3:00 and 5:00. They replace the typed field and its hint. During the game the timer's title row also holds the countdown, with play/pause and reset icon buttons. The room still accepts any whole number of seconds up to an hour, so a room saved with another length keeps working, with no button picked.
- **Every control saves when it is used**, and shows the change straight away. The room's next view replaces it, so a refused change goes back.
- **`setSettings` carries only what changed** (`SettingsChange`, a partial `RoomSettings`), and the room keeps the rest. Before, it carried every setting from the phone's copy. With quick taps, that copy can be a view behind: tapping a timer after turning Blind wolf back on could send the old Blind wolf off and hand every player their card. A message with no setting, or a setting of the wrong type, is refused.

## Why

Hiding the card only on the phone would still send the role to it, where devtools or the page source can read it. The rules say a phone renders only what the room sent for it, so the room doesn't send it.

The presets fit on one row on a phone, need no keyboard (a number keyboard covers half the sheet), and need no hint about what 0 means. A custom length was rarely needed.

A single sheet keeps the menus before and during the game the same, and removes the second copy of every setting. With one way of saving, the timer doesn't wait for the sheet to close while the switches next to it save straight away.
