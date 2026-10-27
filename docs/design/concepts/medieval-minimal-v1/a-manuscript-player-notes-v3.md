# Manuscript typography and player notes — v3

Approved by Thuan on 2026-10-27 and promoted to `../../mockups/approved-village-ink.png`. The current specification lives in `../../direction.md`; the notes and prompts below preserve exploration history.

Discussion mockup generated with built-in image_gen on 2026-10-27. Output: a-manuscript-player-notes-v3.png. Not implemented in the app.

## User requirements

- Replace generic typography with a more aesthetic type direction.
- One comment field per player instead of per role, including separate fields for players sharing a role.
- Cleaner narrator layout with smaller role headers.
- Wolf faction red; village faction blue. Both the seer and witch in this example use village blue.
- Retain the approved light background, colorful engraved artwork, centered character, vertical upper-right role name, and bottom-centered description.

## Design interpretation and implementation follow-up

- Display typography explores medieval manuscript letterforms; exact font family and Vietnamese coverage still require selection and verification. Generated lettering is not a verified installed font.
- Keep utility text simple and readable. Refine actual type sizes in a phone-sized rendered prototype; generated headings remain somewhat larger than requested.
- Preserve the general night comment field in addition to per-player comments.
- Per-player notes are a requested change from the existing per-role rule in docs/game-rules.md. Update game rules and shared data shape when implementing this behavior; keep narrator notes private to the master.
- Faction color is supplementary to labels, not the sole identifier.

## Initial layout edit prompt

Use case: ui-mockup. Edit the supplied Cunning Wolves two-screen mockup. Preserve the approved LIGHT near-white ivory background, colorful hand-tinted wood engraving character and landscape, card composition and subtle material depth. This is a specific typography and narrator-layout revision. Produce the full two-screen board, straight-on high resolution, title "Village ink · Typography & player notes".
TYPOGRAPHY CHANGE IS CRITICAL: original generic Times-style heavy serif is rejected. Visibly replace it with distinctive graceful humanist CALLIGRAPHIC SERIF lettering: Renaissance book hand, gently angled pen strokes, flared wedge serifs, lively narrow letterforms, restrained asymmetric curves, moderate contrast, elegant regular weight rather than bold. Think finely drawn literary lettering, not Times New Roman, not Roman monument capitals, not cursive wedding script, not blackletter. Heading accents and Vietnamese diacritics must be correct. The vertical role title should demonstrate this new aesthetic clearly. Use that display style sparingly on screen titles, vertical role name, and small role headings. For utility labels, player names, comments and buttons use a clean light humanist sans-serif with comfortable reading. No heavy bold anywhere. Body text 14–16px equivalent, screen heading 22px, night heading 26px, narrator role headings only 15–16px equivalent (MUCH smaller than original). Render role description in a readable literary regular-weight serif, modest 16–17px equivalent, not large display type. New typography should look noticeably different from the input.
LEFT SCREEN: retain centered seer illustration exactly, with blue cloak, burgundy underdress, gold embroidery, village, orb; all the illustration's colors and ink detail. Header "Lá bài của bạn", action "Ẩn bài". Keep "Tiên tri" rotated 90 degrees clockwise at top RIGHT of card; use new calligraphic serif, dark slate BLUE. Bottom centered text "Mỗi đêm, chọn một người để biết họ có phải là Sói hay không." Small text outside below card "Chỉ bạn được xem lá bài này". Do not redesign or simplify artwork.
RIGHT SCREEN: redesign for a clean, compact narrator log; use more whitespace strategically, remove gratuitous icons and redundant pill backgrounds. Top row "Quản trò" and small text action "Kết thúc". Compact night switcher: delicate chevron, "Đêm 2", delicate chevron. Under it "8 người còn sống". Tiny quiet legend near top using two colored dots and text "Phe Dân" in slate blue #345B7A and "Phe Sói" in wine red #913D46. Party color rule must apply consistently: BOTH Tiên tri and Phù thủy are village faction BLUE; Sói is wolf faction RED. No gold witch heading.
Then three role GROUPS separated only by fine rules, not large enclosing cards. Each group has a small role icon and small regular-weight role title:

1. Small BLUE eye + "Tiên tri".
   Player row "Linh" (neutral charcoal) on left, tiny neutral "Còn sống" and fine ellipsis right.
   DIRECTLY under Linh a compact, subtly inset near-white SINGLE-LINE editable comment field with fine warm-gray border and placeholder "Ghi chú cho Linh…".
2. Small RED wolf + "Sói".
   Player row "Minh", quiet "Còn sống", ellipsis. Immediately BELOW Minh a separate SINGLE-LINE field "Ghi chú cho Minh…".
   Player row "An", quiet "Còn sống", ellipsis. Immediately BELOW An a separate SINGLE-LINE field "Ghi chú cho An…".
3. Small BLUE wand + "Phù thủy".
   Player row "Hà", quiet "Còn sống", ellipsis. Immediately BELOW Hà a separate SINGLE-LINE field "Ghi chú cho Hà…".
   CRITICAL: exactly FOUR independent player comment fields, one for EACH Linh, Minh, An, Hà. Minh and An MUST have separate fields, even though same role. ZERO role-level comment fields; NEVER render "Ghi chú cho Sói" or "Ghi chú cho Tiên tri". All four fields visible.
   After groups, small neutral label "Ghi chú đêm" with a fifth, general night note field "Thêm ghi chú…".
   Bottom anchored main action "Kết thúc đêm", dark forest-green slim refined rectangle with slightly softened corners, understated sans label, no giant moon icon. Keep touch-friendly row spacing, but visually compact; all listed contents fit neatly in the screen. Roughly 390x844 logical screen dimensions. Fine separators only between role groups. Do not use colored full-section fills. No ornate new border decorations, no big pills or chunky status badges. Preserve calm pale surface, subtle shadows, and adult medieval minimalism. Render Vietnamese text exactly.

## Final typography edit prompt

Edit this exact supplied two-screen UI mockup. Single targeted correction: typography. The previous font change failed because the display type still looks like Times New Roman. Make the font change VISUALLY OBVIOUS.
Replace display lettering in "Lá bài của bạn", "Quản trò", "Đêm 2", vertical "Tiên tri" on the role card, and narrator role labels "Tiên tri", "Sói", "Phù thủy" with elegant MEDIEVAL SEMI-UNCIAL manuscript lettering: distinctive rounded uncial e and d shapes, broad lightly angular bowl shapes, wedge-cut stroke terminals, subtly curved long stems, calligraphic flared construction inspired by Cormorant Unicase / refined insular manuscript letterforms. Medium-light ink weight, no bold, no blackletter, no ordinary Times, no conventional editorial serif. This is bespoke display lettering with visibly medieval DNA but restrained and clean. Vietnamese accents still accurately rendered and readable. Do NOT just preserve original font. Use restrained small-cap/uncial-like forms where appropriate while maintaining exact recognizable words. Keep vertical card title rotated clockwise at upper right, same location.
Make the narrator role headings visibly SMALLER, approximately 70 percent of their current size, with icons reduced to match. Make top headings 85 percent current size and "Đêm 2" 80 percent current size. This should create a quieter more refined hierarchy. Utility text (player names, notes, actions, status, legend) all light humanist SANS SERIF. Card description should use an elegant slightly calligraphic literary book serif, regular weight, comfortably readable, not the display uncial font.
Everything else must remain exactly as supplied: colorful woodcut seer illustration, pose, village, blue/burgundy/gold colors, pale ivory backgrounds, card details, vertical title placement, bottom centered card description, all narrator layout positions, exact four per-player note fields for Linh Minh An Hà, general night note, wolf faction wine red, BOTH seer and witch faction blue, fine separators and green bottom button. No new fields or decorations. Board title "Village ink · Manuscript type". Render full board at same proportions.
