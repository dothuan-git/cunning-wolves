# Roles

One file per pool role: `docs/roles/<id>.md`. Add roles with the `add-role` skill, which also updates the pool data, wake order and tests.

## Template

```markdown
# <English name> / <Vietnamese name>

- **id:** `<id>`
- **Team:** village | werewolf | solo
- **Balance:** +N or −N (official, Ultimate Werewolf: Ultimate Edition rulebook | fan list (werewolf-brain) | estimate, compared with the <role>)
- **Wakes at night:** no | yes, after `<role id>` and before `<role id>`; every night | Night 1 only | even nights
- **Changes roles:** yes: the narrator can give a player another role while it is dealt (only for a role in `ROLE_CHANGERS`; leave the line out otherwise)
- **Card art:** `apps/web/src/assets/cards/<id>.webp` (or "missing")

## Rule (vi)

<Vietnamese rule text, exactly as shown in the app>

## Rule (en)

<English rule text, exactly as shown in the app>

## Narrator notes

<Optional: how the narrator runs this role at night>
```

## Balance values

Every pool role has a balance value (`balance` in `packages/shared/src/roles/pool.ts`), shown in the bottom right corner of its card. Above 0 helps the village, below 0 helps the werewolves, and a fair deck adds up to about 0. Setup shows each faction's total and the whole game's; the app never uses the value to decide anything.

The values come from three places, and each role doc says which:

- **Official:** the value printed in the _Ultimate Werewolf: Ultimate Edition_ rulebook (Bézier Games, 2015, pages 15–21; [copy of the rulebook](https://board-game-rules.com/wp-content/uploads/2025/01/ultimate-werewolf-ultimate-edition_Official-Rules.pdf)). Bézier prints it in the card's lower left corner. Where a fan list disagrees (Cupid, Pacifist, Drunk, Lone Wolf, Vampire), the printed value wins. The Extreme edition balances games another way, and its numbers may differ.
- **Fan list:** the fan-made [werewolf-brain](https://unpkg.com/werewolf-brain/src/data/cards.json) card data, for Ultimate Werewolf roles whose printed value we could not read.
- **Estimate:** the Millers Hollow, The Village and app-made roles. Asmodee publishes no balance values, so each gets the value of the closest official role (Masons at +2 for the Two Sisters, for example), and its doc names that role. Change an estimate freely; keep it a whole number from −10 to +10.
