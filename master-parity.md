# Master UX parity (refactor/lui)

Tracking LUI vs master (`9af1a190`) headless Chromium parity findings. Each group owns only its section.

## G3 — autocomplete & refs

| check | module | master behavior | LUI behavior | repro | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| pageref-open | 11 autocomplete | Empty `[[` popup lists 10 date shortcuts (Today … Next year) | Listed 34 date shortcuts | page `pageref-open`; edit end; type `[[` | low | fixed `135989e0bb` |
| pageref-down-enter | 11 autocomplete | `[[Exist` list is Exist \| Existing Page \| Existing Other (no New page when exact page exists); Down+Enter picks Existing Page | Always inserted New page Exist as 2nd row | page `pageref-down-enter`; type `[[Exist`, ArrowDown, Enter | med | fixed `d2f9f6071d` |
| pageref-ctrl-n-p | 11 autocomplete | ctrl+n/p walk Exist → Existing Page → Existing Other | Walked Exist → New page Exist → Existing Page | page `pageref-ctrl-n-p`; type `[[Exist`, Control+n/p | med | fixed `d2f9f6071d` |
| tag-open | 11 autocomplete | `#` popup lists built-in tags without Page | Also listed built-in Page class | page `tag-open`; type `#` | low | fixed `f7c7e893b1` |
| tag-filter | 11 autocomplete | Tag list is items only under `#ui__ac` (hint is sibling outside `#ui__ac`) | Hint text appeared inside `#ui__ac` | page `tag-filter`; type `#MyT` | low | fixed `789ca92986` |
| tag-new | 11 autocomplete | Same `#ui__ac` / hint sibling structure as master | Hint appeared inside `#ui__ac` | page `tag-new`; type `#NewTagX`, Enter | low | fixed `789ca92986` |
| tag-space-closes | 11 autocomplete | `#` popup has no Page | Included Page | page `tag-space-closes`; type `#` then space | low | fixed `f7c7e893b1` |
| tag-duplicate | 11 autocomplete | Same `#ui__ac` / hint sibling structure as master | Hint appeared inside `#ui__ac` | page `tag-duplicate`; add `#MyTag` twice | low | fixed `789ca92986` |
| slash-filter | 11 autocomplete | Filtering `/head` keeps group header Heading | Group headers dropped while filtering | page `slash-filter`; type `/head` | low | open — owned by G5 (slash popup) |
| slash-nomatch | 11 autocomplete | `/zzzzqq` with no match closes popup | Stayed open with raw i18n key | page `slash-nomatch`; type `/zzzzqq` | med | open — owned by G5 (slash popup) |
| slash-space-close | 11 autocomplete | `/` then space closes slash popup | Stayed open with full command list | page `slash-space-close`; type `/ ` | med | open — owned by G5 (slash popup) |
| slash-then-pageref | 11 autocomplete | After slash then `[[`, empty popup has 10 date items | Had 34 date items | page `slash-then-pageref`; type `/`, Backspace, `[[` | low | fixed `135989e0bb` |
| follow-link-sidebar | 13 refs/embeds | Ctrl+Shift+O inside `[[Linked Pg2]]` opens page in right sidebar | Nothing; sidebar stayed closed | caret inside ref; mod+shift+o | high | fixed `b4f17a0497` |

## G6 — chrome / sidebar / pages / assets / tags / views

| check | module | master behavior | LUI behavior | repro | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| nav-pages | 03 left sidebar | Click Pages navigates to All pages | Only highlighted; stayed on current route | left sidebar `.all-pages-nav` click | high | fixed `70cb570dfa` |
| nav-flashcards | 03 left sidebar / 26 flashcards | Empty deck shows "Time to create a card!" + `#Card` hint | Showed "No cards due" from stale `all_cards` / missing loading gate | `.flashcards-nav` / `g f` on empty graph | med | fixed `98946559ee` |
| header-buttons | 01 first-load | Web header has 4 icons (no back/forward) | Always mounted Electron back/forward (6 icons) | open graph on web | low | fixed `35aa45ed55` |
| create-graph-empty-name | 01 onboarding | Create graph Sync row gated on `rtc-group?` only | Also showed Sync when `?rtc-test=true` while logged out | create-graph dialog, logged-out web | low | fixed `a469fa089f` |
| favorite-click / recent | 03 left sidebar | Favorites/recents navigate to `#/page/<uuid>` | Navigated to `#/page/<name>` | click favorite or recent item | low | fixed `fe8a15537b` |
| delete-page | 05 pages | After confirm, stay on page; show moved-to-recycle | Navigated to journals/Home | page menu → Delete → Confirm | low | fixed `51098daff9` |
| drop-file-image | 10 drag and drop | Drop PNG on a block inserts after that block | Inserted at page end | drop PNG onto a block body | med | fixed `c76dd5cb2c` |
| class-page-add-object | 16 tags and classes | Class page `+ New` opens sidebar and table shows new row | Sidebar opened; table stayed stale until later sync | Class page Objects tab → `+ New` | med | fixed `9e1644ee13` |
| tag-chip / untag | 16 tags and classes | After class tagging, block title has no trailing space | Left trailing space from erased `#query` | type `#Tag`, choose class tag | low | fixed `cf1c12c604` |
