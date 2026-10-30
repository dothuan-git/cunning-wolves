# Role artwork

Every role card and thumbnail uses `RoleArtwork`. A role without its own file shows the fallback figure, [`../art/card-art-fallback.webp`](../art/card-art-fallback.webp). Thumbnails crop full-length art to the head and shoulders, so keep the head in the top third. Art on a transparent background works best: cards and thumbnails show it on the paper tones.

## Adding art

1. Save the art here as `<role-id>.webp`, 720px wide, portrait 2:3 (PNG, JPEG and SVG also work). The file name is the role's `image` field in `packages/shared/src/roles/pool.ts`.
2. Restart the dev server/build if a new file is not discovered immediately.
3. Update the role's `Card art` line in `docs/roles/<id>.md`.
4. Check the full card and setup/rules thumbnails in both languages.

Role names, faction labels and descriptions are rendered as accessible UI text: do not bake them into artwork. A failed optional image also falls back to the fallback figure.
