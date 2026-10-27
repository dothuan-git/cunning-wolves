# Design tokens

Approved Village ink tokens live in `apps/web/src/design/tokens.css` as a Tailwind `@theme`. `--color-*: initial` removes the default palette. Components use named tokens, not arbitrary hex values. See [direction.md](direction.md).

## Colors

| Token          | Value     | Use                                                        |
| -------------- | --------- | ---------------------------------------------------------- |
| `paper`        | `#faf9f4` | Light ivory page background and browser theme color        |
| `surface`      | `#fffefa` | Cards, fields, text on dark actions                        |
| `ink`          | `#2b3032` | Main copy and names                                        |
| `muted`        | `#626761` | Secondary copy/status                                      |
| `line`         | `#d9d6ce` | Decorative separators/card edges; not field identification |
| `field-border` | `#8d9188` | Editable field boundaries                                  |
| `forest`       | `#283f35` | Primary actions and selected language                      |
| `village`      | `#345b7a` | Village headings/icons and keyboard focus                  |
| `werewolf`     | `#913d46` | Wolf headings/icons                                        |
| `ochre`        | `#87642f` | Sparse decoration; not the witch faction color             |
| `danger`       | `#a12e32` | Errors/destructive intent with explanatory text            |

Faction red and danger red are separate semantic tokens. Faction labels, role names, and error messages carry meaning independently of color. Old lime, sunset, berry, and white tokens are retired.

## Typography

| Token          | Value                             | Use                                                       |
| -------------- | --------------------------------- | --------------------------------------------------------- |
| `font-display` | Cormorant Unicase, Georgia, serif | Short manuscript-inspired headings/role names; weight 500 |
| `font-sans`    | Be Vietnam Pro, system sans-serif | Body/utility text 400; selected/emphasized labels 500     |
| `text-title`   | 32px / 1.2                        | Home title                                                |
| `text-heading` | 28px / 1.25                       | Screen/night headings and vertical card title             |
| `text-role`    | 18px / 1.4                        | Compact narrator role headings                            |
| `text-body`    | 16px / 1.625                      | Body, descriptions, editable text                         |
| `text-control` | 14px / 1.5                        | Buttons, player labels, status                            |
| `text-caption` | 13px / 1.5                        | Secondary captions                                        |

Sizes are rem-based and follow user font-size settings. Input text stays at least 16px to avoid phone focus zoom. Avoid display type in note fields and long instructions.

`apps/web/src/design/fonts.css` loads local WOFF2 Latin, Latin Extended, and Vietnamese subsets with `font-display: swap`. Files and OFL licenses live in `apps/web/public/fonts/`; no runtime Google Fonts request. Only the above weights are bundled. See [font provenance](../decisions/0006-village-ink-visual-direction.md).

## Shape, depth, and spacing

| Token/convention  | Value                           | Use                                                 |
| ----------------- | ------------------------------- | --------------------------------------------------- |
| `rounded-control` | 6px                             | Buttons and fields                                  |
| `rounded-card`    | 12px                            | Role card                                           |
| `shadow-card`     | Two soft ink shadows, 8% and 4% | Card elevation                                      |
| `shadow-field`    | Inset 0 1px 2px ink at 4%       | Field depth                                         |
| Border            | 1px                             | Separators/controls                                 |
| Page gutters      | 24px (`px-6`)                   | Phone layout                                        |
| Touch targets     | At least 48×48px                | Actions; compact labels/icons sit within the target |
| Focus             | 2px village outline, 4px offset | Keyboard focus                                      |

Use Tailwind's 4px spacing steps. Keep primary actions near the thumb without obscuring scroll content. Artwork supplies the visual richness; avoid multiplying decorative boxes.

## Verification

- Text on paper/surface must meet 4.5:1 contrast; field borders/focus indicators must meet 3:1 against adjacent surfaces.
- Check both languages at 390×844, keyboard focus, long content, and reduced motion after a visual change.
- Compare card/narrator implementations to `mockups/approved-village-ink.png`, using the production sizes above rather than oversized generated lettering.
- Keep this document, `tokens.css`, and the `apps/web/index.html` theme color synchronized.
