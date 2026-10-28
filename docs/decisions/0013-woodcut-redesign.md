# 0013 — Woodcut redesign with taste-skill

Date: 2026-10-28. Status: accepted. Supersedes the visual system of 0012 (palette, type, surfaces, ornaments). The narrator and card interactions from 0012 (one-tap status with Undo, the wake guide, hold to end a phase, hold to peek) and the rules of 0007 and 0010 are unchanged.

## Context

Thuan asked for a redesign that does not look generic, using the third-party taste-skill (`design-taste-frontend` v2.1.5, installed in his user skills, not in this repo). Its inspector measured the Medieval light screens as a "yellow-cream" palette with glowing buttons, a heavy gilt ring and dark card borders. Its house rules ban card shadows at rest, hairlines with ornaments, decorative shapes such as the pennant banners, and glass (the footer's backdrop blur). Thuan chose a layout and look change that keeps every flow, keeps the folklore world as the subject, uses his own generated art and public-domain woodcuts, and keeps one light ground (no dark night theme).

## Choice

- **Direction:** dealt by the skill ("The sentence is the layout", seed 1608751046). The idea is the 16th-century werewolf broadside printed from wood: black ink on putty paper, condensed wood-type titles, real art set large, and color only where the game has it.
- **Palette:** the dealt "Putty and black" proportions. Its teal accent is replaced by the art's own hues: lapis from the card back for the village and madder from the wolf seal for the wolves. Ground `#dedad3`, panel `#e9e7e3`, field `#f5f4f2`, ink `#0a0a0a`, muted `#5c5852`. Alive is neutral, and only a death is marked. Danger is vermilion, used only for destructive actions.
- **Type:** Barlow Condensed 600 for titles, role names and the wake line, and Barlow 400/500 for text. Both are self-hosted with Latin, Latin Extended and Vietnamese subsets. Sizes are 13 / 16 / 20 / 26 / 32. Display leading stays at 1.08 or more so stacked Vietnamese diacritics stay clear.
- **Surfaces:** panels are set apart from the page by a tone step only, with no border and no shadow. One radius of 2px for panels and controls. The primary button is a flat ink fill. Only what floats (sheets, dialogs, the Undo bar) casts a shadow. The footer is opaque.
- **Signature:** at night the narrator's wake line ("Seer wakes up") is the largest text on the screen. The role's card art sits inside the sentence as if it were a word, and the wake order is a row of role names under it.
- **Home:** the app's name at poster size on two lines, with a crop of Lucas Cranach the Elder's woodcut _The Werewolf_ (about 1512, The Met, CC0) between them. Only the top of the print is used (the house, the castle, the villagers); the lower half is graphic.
- **Art:** the seer, villager and wolf card art, the card back, the fallback figure and the two faction emblems come from Thuan's generated images. The hooded fallback figure replaces the SVG placeholder for roles without art. The tabletop seal and village panorama are removed.
- **Credits:** the woodcut's credit is in the menu sheet.

## Why

- **The subject, not the theme:** the skill's study found that what separates strong work from forgettable work is an idea taken from the subject itself. Woodcut broadsides are the printed matter of werewolf folklore, and their condensed wood type and black-on-paper printing carry the medieval feel without ornaments.
- **Tone steps instead of boxes:** removing borders and shadows lets the panels sit on the paper the way print does, and leaves the faction hues as the only color.
- **A wake line read aloud:** the narrator says that sentence to the room. Setting it largest makes the narrator's next words the first thing they see in a dim room.

## Consequences

- **Home title exception:** the home title is 74px at 390px wide, above the skill's 32px app-title limit. It is the one poster-size moment and appears on no other screen. The inspector warns about it (`app-title-size`) and nothing else on that screen.
- **Tests:** the e2e focus color follows the new lapis. The concealed-card test checks the seer's own art rather than the placeholder.
- **Ignored folder:** the skill's working files live in `.taste-skill/`, which is ignored by git.
- **Mixed art:** the generated engravings are one family; the woodcut is a real print in a different hand and appears only on home. Roles without art (the witch, for now) show the hooded fallback figure.
