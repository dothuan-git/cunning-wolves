# Roles

One file per pool role: `docs/roles/<id>.md`. Add roles with the `add-role` skill, which also updates the pool data, wake order and tests.

## Template

```markdown
# <English name> / <Vietnamese name>

- **id:** `<id>`
- **Team:** village | werewolf | solo
- **Wakes at night:** no | yes, after `<role id>` and before `<role id>`; every night | Night 1 only | even nights
- **Marks:** none | `<mark id>` (what it records), …
- **Card art:** `apps/web/src/assets/cards/<id>.webp` (or "missing")

## Rule (vi)

<Vietnamese rule text, exactly as shown in the app>

## Rule (en)

<English rule text, exactly as shown in the app>

## Narrator notes

<Optional: how the narrator runs this role at night>
```
