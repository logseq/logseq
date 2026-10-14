# Native window damage repaint

The actual OpenGL window retained pixels from an independently owned setup dialog after that dialog was dismissed. A resize restored the correct native content. The SDL adapter ignored Exposed/Restored/Shown events, so window-system damage without a store mutation never requested a new frame.

The native event policy now requests paint invalidation and one coalesced redraw for those three events. Focus-only and hidden events do not force continuous redraw. The focused policy regression first failed for Exposed; native build/platform/contracts checks and the 2072-check UI suite pass after the repair.

Actual verification used the same 1280 x 900 native OpenGL window and a disposable 420 x 180 Tk cover window. Closing the cover through a real Alt+F4 gesture exposed the native surface without resizing or changing app data. The restored capture is byte-identical to the baseline:

`365c3bc28c68d9dcf4f75ba2f41fb4924144e488bc4b6a09ff3c12168c7c8cb3`

The covered and uncovered screenshots are retained here. This establishes the Linux uncover path; macOS restoration and other minimize/focus states are not declared verified by it.
