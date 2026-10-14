# Native app theme palette

The actual native Settings window painted checked switches and selected theme cards with LUI's default blue, and dialogs with LUI's half-black scrim, despite receiving the app's theme snapshot. Native `Theme_vars.color_of` resolved bare renderer token names through the independent LUI palette before consulting the app's CSS variables.

Regression-first validation: the new native scene test painted real SwitchControl and Dialog nodes through Lui_paint with the production Theme_vars resolver. It failed on the checked-switch primary color before implementation. Runtime inspection of master confirmed unchecked switches use `--input` in both light and dark modes; the corresponding regression failed before that alias was corrected. Master dialog CSS uses `bg-background/90`. The same scene tests now pass in light and dark modes, including mode changes.

The fix maps native control tokens to app snapshot variables. It does not replace the native app with a web surface or add a widget extension. Native host + platform/contracts tests pass; the unchanged web UI recording suite passes 2066 checks.

Actual SDL verification: opening Settings via Ctrl+, changing to dark via a pointer press, inspecting the persisted `theme` and `system-theme?` preferences, and opening Editor. Checked controls now use the app teal primary color and the backdrop follows the light/dark background instead of black. Dialog layout, labels, icons, switch thumb geometry, checkbox sizing, custom accent delivery and other settings differences remain unresolved; this is not full settings parity.

Evidence: `native-editor-light-before.png`, `native-editor-light-after.png`, `native-editor-dark-after.png`, `master-editor-light.png`, `master-editor-dark.png`. Before states exist in the recorded native desktop trajectory and initial screenshot captures. A graceful close and restart preserved the dark theme; the relaunched actual SDL window rendered the same mode. The fixture was subsequently returned to light.
