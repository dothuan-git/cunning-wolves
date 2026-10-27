# Role artwork

Every role card and thumbnail uses `RoleArtwork`. Until final art is supplied, all missing images use `placeholder.svg`, the same neutral hooded figure.

## Adding final art

1. Save artwork here as `<role-id>.webp` (PNG, JPEG, and SVG also work).
2. Set the role's `image` field to that filename in the shared role pool when that role is defined.
3. Restart the dev server/build if a new file is not discovered immediately.
4. Check the full card and setup/rules thumbnails in both languages.

Example: `seer.webp` replaces the seer's placeholder without changing the component. Other roles keep the shared placeholder until their own files exist. A failed optional image also falls back to the placeholder.

Use a portrait composition around 240:340 or a higher-resolution equivalent. Keep the character centered and leave room around its silhouette. Role names, faction labels, and descriptions are rendered as accessible UI text: do not bake them into artwork.

The Phase 0 preview fixtures use example filenames only. They do not add roles to the production pool. Final role names/rules and artwork are separate follow-up work.
