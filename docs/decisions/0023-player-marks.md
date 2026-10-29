# 0023 — Player marks, a third faction and wake nights

## Context

The narrator page only knew Alive and Dead, and a role was either village or werewolf. Thuan wants every role of the _Werewolves of Millers Hollow_ family, including third-faction and team-changing ones (Cupid, Accursed Wolf-Father, Wild Child, Pied Piper, White Wolf…). Each of those leaves something on a player that the narrator must remember: a title, a used potion, an infection, a lover. Some roles also wake only on Night 1 or every other night.

## Choice

- **Marks.** A mark is pool data in `packages/shared/src/roles/marks.ts` (`MARKS`): an id, a `{ vi, en }` label, the roles whose presence offers it (`from`; empty means every game), whether only those roles' holders can carry it (`holdersOnly`), and whether only one player carries it at a time (`single`: marking another player moves it). `marksFor(roleId, dealt)` says which marks a player may carry.
- The room keeps `GameState.marks` (player id → mark id → the phase it was marked in), stored in its own `marks` table so older rooms load with none. One master-only action, `toggleMark { playerId, mark }`, puts a mark on in the current phase or takes it off. It is refused for a mark the game doesn't offer that player. Marks reach the master view only, and seated players after Finish, like deaths.
- **This change ships flag marks for the current pool:** Sheriff (every game, single), Second vote used (Stuttering Judge), Power lost (Fox, Big Bad Wolf), Heal and Kill potion used (Witch), Extra life used (Elder), Can't vote (Village Idiot), and Rusted (Knight, on any player).
- **Narrator page:** Dead stays a one-tap pill. Beside it, a tag button with the mark count opens a sheet of the marks this player may carry, as switches. Carried marks show as chips under the name. The summary shows them on the Roles tab and in the journal phase they were made in.
- **Third faction:** `Team` gains `solo`, for roles that win on their own. Its hue is weld ochre (`solo` / `solo-wash`); until it has an emblem, the hooded fallback figure stands in. Setup, the rules review and the summary list it after the wolves and the village, and a custom role can belong to it.
- **Wake nights:** each pool role has `wakeNights`: `every`, `first` (Night 1 only) or `even`. On a night a role doesn't wake, the narrator page lists it with the roles that never wake. The Stuttering Judge is `first`.
- A player's own phone never changes because of a mark; the narrator tells them in person.

## Why

- Two kinds of mark (a flag now, a link between two players next) cover every role in the family with one mechanism, instead of special code per role. Adding a role's marks is data.
- Links (Lovers, the Wild Child's model), marks that move a player to the wolves (Infected, Wild Child turned, Wolf-hound) and the roles that need them come in the next changes, together with those roles, so each mechanism is tested with the role that uses it.
- Keeping Dead as its own pill keeps the most frequent action at one tap in a dark room; a dropdown would hide it and could hold only one status.
- The app still never resolves abilities: a mark is a record, and nothing happens automatically when one is made.
- Roles that swap cards (Thief, Actor, Devoted Servant) need extra cards in the deck and a different deal. They stay out of this change.
