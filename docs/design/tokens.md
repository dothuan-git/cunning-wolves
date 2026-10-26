# Design tokens

Tokens live in `apps/web/src/design/tokens.css` as a Tailwind CSS `@theme`. Each token becomes a utility: `--color-forest` gives `bg-forest`, `text-forest`, `border-forest` and so on.

`--color-*: initial` removes Tailwind's default palette, so a class like `bg-blue-500` simply doesn't exist. **Use tokens only.** No hex values or arbitrary values (`bg-[#…]`) in components.

## Current values (provisional until Phase 0)

| Token       | Value                             | Use                                                        |
| ----------- | --------------------------------- | ---------------------------------------------------------- |
| `forest`    | `#1f4d3a`                         | Main brand color, primary buttons                          |
| `lime`      | `#a3e635`                         | Highlight                                                  |
| `sunset`    | `#f97316`                         | Highlight                                                  |
| `paper`     | `#fbf8f1`                         | Page background                                            |
| `ink`       | `#2b2b2b`                         | Body text                                                  |
| `berry`     | `#b4234a`                         | Danger and errors only                                     |
| `white`     | `#ffffff`                         | Surfaces on top of `paper`                                 |
| `font-sans` | Be Vietnam Pro, then system fonts | All text. The font file isn't loaded yet; Phase 0 adds it. |

Spacing, radius and type scale use Tailwind's defaults until Phase 0 defines them.

## Adding or changing a token

1. Edit `tokens.css`, and update the table above in the same commit.
2. Check contrast: text tokens on `paper` and `white` must meet WCAG AA (4.5:1 for body text).
3. Changing a token value changes every screen. Run the `ui-checker` subagent afterwards.
