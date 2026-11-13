# Picker keyboard parity review

This source-only review compares frozen master `29fd2edd015e12963742b985ce6d2311c074e09b`
with App `86032100b3` and LUI `f29b2473621f7a07293bbf884f135d22126d4928`, using
the pinned public NSH source `adc186db7213f3ccd1eacaa836cc721e9779fd14`.
No compiler, native process or test was run during this review. Existing native
wheel/state-change passes do not qualify the keyboard paths below.

## Query-first Escape

Master `src/main/frontend/components/icon.cljs:449–460` stops the search field's
Escape. A nonblank query calls `reset-q!`; a blank query hides the popup.
`reset-q!` at lines415–424 clears results and selection mode, returns focus to
the input and scrolls the result owner to zero. Left/Right stay with the text
caret while the input is focused.

Before this correction, `Icon_picker.picker_view` supplies only `on_text` to
`Ui_components.search_row`; that helper supplies no typed input dismissal
callback. The outer `Properties_popup` layer alone owns dismissal, so the App
does not implement the required query-clear decision.

The correction forwards an optional `on_dismiss` through the existing helper.
The picker uses its current state/search-generation owner: nonempty Escape
invalidates search completions, clears results/query and increments the existing
input/viewport reset key; blank Escape invokes the existing close callback.
The search row now has an explicit keyed scope over `(tab, reset)`: changing a
row key inside the prior reactive branch was insufficient to retire its inner
`in` input. Query/color changes retain this scope, while tab/reset changes
dispose the complete prior search owner and install the new autofocus input.
This is necessary because canonical input cancellation closes one draft until
actual edit or fresh focus. A controlled text patch alone intentionally cannot
rearm that draft (`lui/platform/nsh/src/inputs.rs:request_dismiss`). No shared
cancellation behavior, global key binding, queue or SDK API changes.

The existing shared production-view target checks both normal and empty-result
query clearing, retained picker/tab/preset, retired filtered viewport/input,
autofocus on the new owner and blank close without a choice. Its event dispatch
is canonical behavior coverage, not native focus evidence.

The separate ignored native scenario is
`deps/ui/_build/nsh-native-picker-wheel/keyboard-escape.test.ts`, with
`run-keyboard-escape.sh`, `keyboard-escape-launch.py` and its own README. It
requires the next real key after Escape to enter the freshly cleared search
without another click or focus helper, then requires blank Escape to close.
The successful wheel/state-change fixture sources are unchanged. This scenario
is prepared but unexecuted; native focus/second-Escape success remains pending.

## Grid arrow navigation remains a separate concrete gap

Master's `select-observer` at lines291–345 owns a flat, nine-column selection
across sections, pads incomplete sections, focuses its first cell when selection
mode begins, moves Left/Right or Tab by one and Up/Down by nine, activates the
current item on Enter and returns to the search input outside its item range.
The search field enters selection mode on Down or Tab. This is explicit product
logic; ordinary button Tab traversal does not establish parity.

Current `Icon_picker.picker_view` has no active item/selection-mode owner, no
`on_navigate`/`on_submit` search handler and no item navigation callbacks. Its
canonical cells are ordinary retained semantic Buttons. This proves a missing
App route from keys to the product selection logic, but does not prove a
particular platform's default Tab or arrow result without native input evidence.

Existing public seams are real but do not yet constitute that design:

- Canonical text constructors expose `on_navigate` for Previous/Next; the NSH
  lowering binds only unmodified Up/Down while that input is focused and not
  composing (`lui/platform/nsh/src/inputs.rs:navigation`). It does not provide
  Left/Right/Tab grid events.
- NSH `ElementRef::focus` is public and respects hidden/disabled/focusable
  admission (`crates/nsh-core/src/element/element_ref.rs:186`); it is not a
  complete App grid selection or virtualization policy by itself.
- NSH's public `EmojiPicker` already owns focused grid keys, composition-aware
  bindings, virtualized reveal and query-first Escape
  (`crates/nsh-base/src/emoji_picker/mod.rs`). Its catalog is NSH's Unicode
  emoji data, and its `render_item` customizes presentation of `EmojiEntry`;
  this is not an arbitrary Tabler-icon catalog input. Replacing the combined
  picker with that component without checking stored emoji-mart IDs, mixed
  sections and custom icon data would change the product contract.

Before implementation, choose an existing canonical/public component route that
can preserve the complete item order, section padding, caret behavior, visible
focus and offscreen reveal without a second geometry/cache owner. Then qualify
real Down→first item, Right/Down/Up/Left, Enter persisted exact choice, boundary
return to input, filtered/empty results, tab resets and composition. No SDK
change, guessed focus API or grid-navigation implementation is included here.
