/* C stubs for the OCaml native host executable.

   In-process twin of native/logseq_lui_bridge.c's outbound channel:
   instead of bouncing to function pointers the host installs,
   the wakeup and platform-request trampolines call back into OCaml
   through named values the Bridge module registers at startup. The
   js-name shims the linked library references (atob, require,
   loadDictFile, loadIconNames) keep the same behavior as the bridge
   copy. */

#include <caml/alloc.h>
#include <caml/callback.h>
#include <caml/fail.h>
#include <caml/memory.h>
#include <caml/mlvalues.h>

#include <stdlib.h>
#include <stdbool.h>
#include <SDL.h>
#include <SDL_syswm.h>

CAMLprim value logseq_native_performance_time(value unit_v) {
  CAMLparam1(unit_v);
  CAMLreturn(caml_copy_double((double)SDL_GetPerformanceCounter() /
                             (double)SDL_GetPerformanceFrequency()));
}

typedef struct {
  double *regions;
  size_t count;
  Uint32 window_id;
  SDL_threadID thread;
  int watching;
  int repainting;
} LogseqWindowState;

static const char *logseq_window_key = "logseq-native-window";

static LogseqWindowState *logseq_window_state(SDL_Window *window) {
  LogseqWindowState *state = SDL_GetWindowData(window, logseq_window_key);
  if (!state) {
    state = calloc(1, sizeof(*state));
    if (!state) caml_raise_out_of_memory();
    state->window_id = SDL_GetWindowID(window);
    state->thread = SDL_ThreadID();
    SDL_SetWindowData(window, logseq_window_key, state);
  }
  return state;
}

static SDL_HitTestResult logseq_hit_test(SDL_Window *window,
                                       const SDL_Point *point, void *userdata) {
  (void)window;
  const LogseqWindowState *state = userdata;

  for (size_t i = 0; i < state->count; i += 5) {
    const double *r = state->regions + i;
    if (point->x >= r[1] && point->y >= r[2] &&
        point->x < r[1] + r[3] && point->y < r[2] + r[4])
      return r[0] == 1.0 ? SDL_HITTEST_DRAGGABLE : SDL_HITTEST_NORMAL;
  }
  return SDL_HITTEST_NORMAL;
}

CAMLprim value logseq_native_drag_regions(value id, value regions) {
  CAMLparam2(id, regions);
  SDL_Window *window = SDL_GetWindowFromID(Int_val(id));
  if (!window) caml_invalid_argument("Native drag regions require a live window");
  size_t count = Wosize_val(regions) / Double_wosize;
  if (count % 5) caml_invalid_argument("Invalid native drag rectangles");
  LogseqWindowState *state = logseq_window_state(window);
  double *copy = count ? malloc(count * sizeof(double)) : NULL;
  if (count && !copy) caml_raise_out_of_memory();
  for (size_t i = 0; i < count; i++) copy[i] = Double_field(regions, i);
  free(state->regions);
  state->regions = copy;
  state->count = count;
  if (SDL_SetWindowHitTest(window, count ? logseq_hit_test : NULL,
                          count ? state : NULL) < 0)
    caml_failwith(SDL_GetError());
  if (!count && !state->watching) {
    SDL_SetWindowData(window, logseq_window_key, NULL);
    free(state);
  }
  CAMLreturn(Val_unit);
}

static int logseq_expose_watch(void *userdata, SDL_Event *event) {
  LogseqWindowState *state = userdata;
  if (SDL_ThreadID() == state->thread && !state->repainting &&
      event->type == SDL_WINDOWEVENT && event->window.windowID == state->window_id &&
      event->window.event == SDL_WINDOWEVENT_EXPOSED) {
    const value *callback = caml_named_value("logseq_native_expose");
    state->repainting = 1;
    value result = caml_callback_exn(*callback, Val_unit);
    state->repainting = 0;
    if (Is_exception_result(result)) caml_fatal_error("Native resize repaint failed");
  }
  return 0;
}

CAMLprim value logseq_native_watch_expose(value id, value enabled) {
  CAMLparam2(id, enabled);
  SDL_Window *window = SDL_GetWindowFromID(Int_val(id));
  if (!window) caml_invalid_argument("Native expose watch requires a live window");
  LogseqWindowState *state = logseq_window_state(window);
  if (Bool_val(enabled) && !state->watching) {
    state->watching = 1;
    SDL_AddEventWatch(logseq_expose_watch, state);
  } else if (!Bool_val(enabled) && state->watching) {
    SDL_DelEventWatch(logseq_expose_watch, state);
    state->watching = 0;
  }
  CAMLreturn(Val_unit);
}

/* OCaml-internal: native_embed.ml's `external wakeup` lands here. The
   host loop polls Bridge.pending_wakeup once per frame; a flag is all
   the main thread needs (the host's <=16ms pump cadence). */
CAMLprim void logseq_lui_wakeup(void) {
  const value *cb = caml_named_value("ocaml_host_wakeup");
  if (cb != NULL) {
    value res = caml_callback_exn(*cb, Val_unit);
    (void)Is_exception_result(res);
  }
}

/* OCaml-internal: native_embed.ml's `external platform_request` lands
   here with a "name\npayload" envelope; Bridge queues it for the main
   loop's per-frame drain. */
CAMLprim void logseq_lui_platform_request(value payload) {
  CAMLparam1(payload);
  const value *cb = caml_named_value("ocaml_host_platform_request");
  if (cb != NULL) {
    value res = caml_callback_exn(*cb, payload);
    (void)Is_exception_result(res);
  }
  CAMLreturn0;
}

static const char b64_alphabet[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static int b64_val(char c) {
  const char *p = b64_alphabet;
  while (*p && *p != c) p++;
  return *p == c ? (int)(p - b64_alphabet) : -1;
}

/* Same base64 decode as the bridge copy — used by transit/img data on
   the native path. */
CAMLprim value atob(value input) {
  CAMLparam1(input);
  CAMLlocal1(out);
  mlsize_t n = caml_string_length(input);
  const char *src = String_val(input);
  char *buf = malloc(n + 1);
  if (buf == NULL) caml_failwith("atob: oom");
  mlsize_t w = 0;
  for (mlsize_t i = 0; i < n;) {
    int vals[4] = {0, 0, 0, 0};
    int pad = 0;
    for (int k = 0; k < 4; k++) {
      if (i >= n) {
        pad = 4 - k;
        vals[k] = 0;
      } else if (src[i] == '=') {
        pad++;
        vals[k] = 0;
        i++;
      } else {
        int v = b64_val(src[i]);
        if (v < 0) {
          free(buf);
          caml_failwith("atob: bad base64");
        }
        vals[k] = v;
        i++;
      }
    }
    buf[w++] = (char)((vals[0] << 2) | (vals[1] >> 4));
    if (pad < 2) buf[w++] = (char)((vals[1] << 4) | (vals[2] >> 2));
    if (pad < 1) buf[w++] = (char)((vals[2] << 6) | vals[3]);
  }
  out = caml_alloc_initialized_string(w, buf);
  free(buf);
  CAMLreturn(out);
}

CAMLprim value require(value arg) {
  caml_failwith("require: lazy-asset chunks are web-only on native");
  return Val_unit;
}

CAMLprim value loadDictFile(value arg, value name) {
  caml_failwith("loadDictFile: dicts are compiled in on native");
  return Val_unit;
}

CAMLprim value loadIconNames(value arg) {
  caml_failwith("loadIconNames: icon names are compiled in on native");
  return Val_unit;
}

#if defined(__APPLE__)
#include <objc/objc.h>
#include <objc/message.h>
#include <objc/runtime.h>
#include <CoreGraphics/CoreGraphics.h>
#include <IOSurface/IOSurface.h>
#include <libproc.h>
#include <sys/resource.h>
#include <unistd.h>

CAMLprim value logseq_native_memory_usage(value unit_v) {
  CAMLparam1(unit_v);
  CAMLlocal1(out);
  struct rusage_info_v4 usage = {0};
  if (proc_pid_rusage(getpid(), RUSAGE_INFO_V4, (rusage_info_t *)&usage) != 0)
    caml_failwith("Cannot read native process memory usage");
  out = caml_alloc_tuple(3);
  Store_field(out, 0, Val_long(usage.ri_phys_footprint));
  Store_field(out, 1, Val_long(usage.ri_resident_size));
  Store_field(out, 2, Val_long(usage.ri_lifetime_max_phys_footprint));
  CAMLreturn(out);
}

CAMLprim value logseq_native_window_presentable(value id_v) {
  SDL_Window *window = SDL_GetWindowFromID(Int_val(id_v));
  if (!window) caml_invalid_argument("Presentation requires a live window");
  SDL_SysWMinfo info; SDL_VERSION(&info.version);
  if (!SDL_GetWindowWMInfo(window, &info)) caml_failwith(SDL_GetError());
  id native_window = (id)info.info.cocoa.window;
  unsigned long state = ((unsigned long (*)(id, SEL))objc_msgSend)(native_window,
                                                   sel_registerName("occlusionState"));
  return Val_bool((state & (1UL << 1)) != 0);
}

/* A bare binary never goes through LaunchServices so the NSApp can end
   up registered-but-inactive: raise_window reorders the window yet the
   server still routes clicks only after the process activates, which on
   its own can swallow the first click (or all of them). Activating the
   shared application once after window creation restores input
   routing. */
CAMLprim void logseq_native_activate(void) {
  Class cls = objc_getClass("NSApplication");
  if (cls == Nil) return;
  SEL shared = sel_registerName("sharedApplication");
  id app = ((id (*)(Class, SEL))objc_msgSend)(cls, shared);
  if (app == nil) return;
  SEL policy = sel_registerName("setActivationPolicy:");
  ((void (*)(id, SEL, long))objc_msgSend)(
      app, policy, 0L /* NSApplicationActivationPolicyRegular */);
  /* finishLaunching is a no-op once the app has launched; for an
     unbundled binary it completes the registration user events
     require. */
  SEL finish = sel_registerName("finishLaunching");
  ((void (*)(id, SEL))objc_msgSend)(app, finish);
  SEL activate = sel_registerName("activateIgnoringOtherApps:");
  ((void (*)(id, SEL, int))objc_msgSend)(app, activate, 1);
}

/* macOS main menu. SDL only installs its minimal default menu, so the
   host builds a real NSMenu bar: every item carries a command tag and
   fires the single LogseqMenuTarget action, which forwards the tag to
   the "ocaml_host_menu_command" named value registered in
   logseq_native.ml. OCaml owns the whole dispatch table — Edit
   commands are re-injected as real SDL key events so they behave
   identically to the keyboard, app commands reuse the app's menu-*
   platform_event contract, and OS verbs go back out through
   logseq_native_app_op below. */

/* Command tags — keep in sync with menu_command in logseq_native.ml. */
enum {
  kMenuAbout = 1,
  kMenuHide,
  kMenuHideOthers,
  kMenuShowAll,
  kMenuQuit,
  kMenuUndo,
  kMenuRedo,
  kMenuCut,
  kMenuCopy,
  kMenuPaste,
  kMenuSelectAll,
  kMenuFullScreen,
  kMenuToggleSidebar,
  kMenuReload,
  kMenuMinimize,
  kMenuZoom,
  kMenuClose,
  kMenuHelp
};

static id logseq_menu_target = nil;

static void logseq_menu_action(id self, SEL _cmd, id sender) {
  (void)self;
  (void)_cmd;
  long tag = ((long (*)(id, SEL))objc_msgSend)(sender,
                                               sel_registerName("tag"));
  const value *cb = caml_named_value("ocaml_host_menu_command");
  if (cb != NULL) {
    value res = caml_callback_exn(*cb, Val_long(tag));
    (void)Is_exception_result(res);
  }
}

static id menu_nsstr(const char *s) {
  return ((id(*)(id, SEL, const char *))objc_msgSend)(
      (id)objc_getClass("NSString"),
      sel_registerName("stringWithUTF8String:"), s);
}

static id menu_alloc(Class cls) {
  return ((id(*)(Class, SEL))objc_msgSend)(cls, sel_registerName("alloc"));
}

static id new_menu(const char *title) {
  return ((id(*)(id, SEL, id))objc_msgSend)(
      menu_alloc(objc_getClass("NSMenu")),
      sel_registerName("initWithTitle:"), menu_nsstr(title));
}

static void menu_add_sep(id menu) {
  id sep = ((id(*)(id, SEL))objc_msgSend)(
      (id)objc_getClass("NSMenuItem"), sel_registerName("separatorItem"));
  ((void (*)(id, SEL, id))objc_msgSend)(
      menu, sel_registerName("addItem:"), sep);
}

static id menu_add_item(id menu, const char *title, const char *key,
                        unsigned long mods, long tag) {
  id item = ((id(*)(id, SEL, id, SEL, id))objc_msgSend)(
      menu_alloc(objc_getClass("NSMenuItem")),
      sel_registerName("initWithTitle:action:keyEquivalent:"),
      menu_nsstr(title), sel_registerName("logseqMenuAction:"),
      menu_nsstr(key));
  ((void (*)(id, SEL, unsigned long))objc_msgSend)(
      item, sel_registerName("setKeyEquivalentModifierMask:"), mods);
  ((void (*)(id, SEL, id))objc_msgSend)(
      item, sel_registerName("setTarget:"), logseq_menu_target);
  ((void (*)(id, SEL, long))objc_msgSend)(
      item, sel_registerName("setTag:"), tag);
  ((void (*)(id, SEL, id))objc_msgSend)(
      menu, sel_registerName("addItem:"), item);
  ((void (*)(id, SEL))objc_msgSend)(item, sel_registerName("release"));
  return item;
}

static id menu_add_submenu(id main, const char *title) {
  id item = ((id(*)(id, SEL, id, SEL, id))objc_msgSend)(
      menu_alloc(objc_getClass("NSMenuItem")),
      sel_registerName("initWithTitle:action:keyEquivalent:"),
      menu_nsstr(title), (SEL)NULL, menu_nsstr(""));
  id sub = new_menu(title);
  ((void (*)(id, SEL, id))objc_msgSend)(
      item, sel_registerName("setSubmenu:"), sub);
  ((void (*)(id, SEL, id))objc_msgSend)(
      main, sel_registerName("addItem:"), item);
  ((void (*)(id, SEL))objc_msgSend)(item, sel_registerName("release"));
  ((void (*)(id, SEL))objc_msgSend)(sub, sel_registerName("release"));
  return sub;
}

CAMLprim void logseq_native_install_menus(void) {
  id pool = ((id(*)(id, SEL))objc_msgSend)(
      menu_alloc(objc_getClass("NSAutoreleasePool")),
      sel_registerName("init"));
  Class appcls = objc_getClass("NSApplication");
  id app = appcls == Nil
               ? nil
               : ((id(*)(Class, SEL))objc_msgSend)(
                     appcls, sel_registerName("sharedApplication"));
  if (app != nil) {
    if (logseq_menu_target == nil) {
      Class t = objc_allocateClassPair(objc_getClass("NSObject"),
                                       "LogseqMenuTarget", 0);
      class_addMethod(t, sel_registerName("logseqMenuAction:"),
                      (IMP)logseq_menu_action, "v@:@");
      objc_registerClassPair(t);
      logseq_menu_target =
          ((id(*)(Class, SEL))objc_msgSend)(t, sel_registerName("new"));
    }

    const unsigned long modShift = 1UL << 17, modCtrl = 1UL << 18,
                        modOpt = 1UL << 19, modCmd = 1UL << 20;

    id main = new_menu("");

    id appm = menu_add_submenu(main, "Logseq");
    menu_add_item(appm, "About Logseq", "", 0, kMenuAbout);
    menu_add_sep(appm);
    menu_add_item(appm, "Hide Logseq", "h", modCmd, kMenuHide);
    menu_add_item(appm, "Hide Others", "h", modCmd | modOpt,
                  kMenuHideOthers);
    menu_add_item(appm, "Show All", "", 0, kMenuShowAll);
    menu_add_sep(appm);
    menu_add_item(appm, "Quit Logseq", "q", modCmd, kMenuQuit);

    id edit = menu_add_submenu(main, "Edit");
    menu_add_item(edit, "Undo", "z", modCmd, kMenuUndo);
    menu_add_item(edit, "Redo", "z", modCmd | modShift, kMenuRedo);
    menu_add_sep(edit);
    menu_add_item(edit, "Cut", "x", modCmd, kMenuCut);
    menu_add_item(edit, "Copy", "c", modCmd, kMenuCopy);
    menu_add_item(edit, "Paste", "v", modCmd, kMenuPaste);
    menu_add_item(edit, "Select All", "a", modCmd, kMenuSelectAll);

    id view = menu_add_submenu(main, "View");
    menu_add_item(view, "Enter Full Screen", "f", modCtrl | modCmd,
                  kMenuFullScreen);
    menu_add_sep(view);
    /* No key equivalent: the app's own binding is the "t l" sequence,
       which a single NSMenuItem accelerator cannot express. */
    menu_add_item(view, "Toggle Left Sidebar", "", 0,
                  kMenuToggleSidebar);
    menu_add_item(view, "Reload Page", "r", modCmd, kMenuReload);

    id winm = menu_add_submenu(main, "Window");
    menu_add_item(winm, "Minimize", "m", modCmd, kMenuMinimize);
    menu_add_item(winm, "Zoom", "", 0, kMenuZoom);
    menu_add_sep(winm);
    menu_add_item(winm, "Close", "w", modCmd, kMenuClose);
    ((void (*)(id, SEL, id))objc_msgSend)(
        app, sel_registerName("setWindowsMenu:"), winm);

    id help = menu_add_submenu(main, "Help");
    menu_add_item(help, "Logseq Documentation", "", 0, kMenuHelp);
    ((void (*)(id, SEL, id))objc_msgSend)(
        app, sel_registerName("setHelpMenu:"), help);

    ((void (*)(id, SEL, id))objc_msgSend)(
        app, sel_registerName("setMainMenu:"), main);
    ((void (*)(id, SEL))objc_msgSend)(main, sel_registerName("release"));
  }
  ((void (*)(id, SEL))objc_msgSend)(pool, sel_registerName("drain"));
}

/* AppKit verbs the menu routes back out of the OCaml dispatch — they
   act on NSApp (hide/about) or the key window (miniaturize/zoom/
   close/fullscreen), addressed by small op ids so one stub covers
   them all. */
CAMLprim void logseq_native_app_op(value tag) {
  Class appcls = objc_getClass("NSApplication");
  if (appcls == Nil) return;
  id app = ((id(*)(Class, SEL))objc_msgSend)(
      appcls, sel_registerName("sharedApplication"));
  if (app == nil) return;
  id win = ((id(*)(id, SEL))objc_msgSend)(app,
                                         sel_registerName("keyWindow"));
  if (win == nil)
    win = ((id(*)(id, SEL))objc_msgSend)(app,
                                        sel_registerName("mainWindow"));
  id target = nil;
  SEL op = NULL;
  switch (Long_val(tag)) {
  case 0: target = app; op = sel_registerName("orderFrontStandardAboutPanel:"); break;
  case 1: target = app; op = sel_registerName("hide:"); break;
  case 2: target = app; op = sel_registerName("hideOtherApplications:"); break;
  case 3: target = app; op = sel_registerName("unhideAllApplications:"); break;
  case 4: target = win; op = sel_registerName("performMiniaturize:"); break;
  case 5: target = win; op = sel_registerName("performZoom:"); break;
  case 6: target = win; op = sel_registerName("performClose:"); break;
  case 7: target = win; op = sel_registerName("toggleFullScreen:"); break;
  default: return;
  }
  if (target == nil) return;
  ((void (*)(id, SEL, id))objc_msgSend)(target, op, nil);
}

/* Blend the app header into the title bar: content covers the full
   window and the title bar becomes transparent and untitled, like
   Electron's `titleBarStyle: hiddenInset`. The app's .cp__header row
   renders where the title bar sits; the traffic-light buttons overlay
   its left edge (the view reserves ~76px for them). */
CAMLprim void logseq_native_titlebar_blend(void) {
  Class nswin = objc_getClass("NSWindow");
  Class cls = objc_getClass("NSApplication");
  if (nswin == Nil || cls == Nil) return;
  SEL shared = sel_registerName("sharedApplication");
  id app = ((id (*)(Class, SEL))objc_msgSend)(cls, shared);
  if (app == nil) return;
  id windows =
      ((id (*)(id, SEL))objc_msgSend)(app, sel_registerName("windows"));
  if (windows == nil) return;
  unsigned long count =
      ((unsigned long (*)(id, SEL))objc_msgSend)(
          windows, sel_registerName("count"));
  for (unsigned long i = 0; i < count; i++) {
    id w = ((id (*)(id, SEL, unsigned long))objc_msgSend)(
        windows, sel_registerName("objectAtIndex:"), i);
    if (w == nil) continue;
    unsigned long mask = ((unsigned long (*)(id, SEL))objc_msgSend)(
        w, sel_registerName("styleMask"));
    if (!(mask & 1L /* NSWindowStyleMaskTitled */)) continue;
    id content = ((id (*)(id, SEL))objc_msgSend)(w, sel_registerName("contentView"));
    id responder = ((id (*)(id, SEL))objc_msgSend)(content, sel_registerName("nextResponder"));
    ((void (*)(id, SEL, unsigned long))objc_msgSend)(
        w, sel_registerName("setStyleMask:"),
        mask | (1L << 15) /* NSWindowStyleMaskFullSizeContentView */);
    /* AppKit rewrites the responder chain when the style mask changes.
       Preserve SDL's listener so mouse presses continue reaching SDL. */
    ((void (*)(id, SEL, id))objc_msgSend)(content, sel_registerName("setNextResponder:"), responder);
    ((void (*)(id, SEL, int))objc_msgSend)(
        w, sel_registerName("setTitlebarAppearsTransparent:"), 1);
    ((void (*)(id, SEL, long))objc_msgSend)(
        w, sel_registerName("setTitleVisibility:"),
        1L /* NSWindowTitleHidden */);
    ((void (*)(id, SEL, int))objc_msgSend)(
        w, sel_registerName("setMovableByWindowBackground:"), 0);
  }
}

CAMLprim value logseq_native_input_chain(value id_v) {
  SDL_SysWMinfo info;
  SDL_VERSION(&info.version);
  if (!SDL_GetWindowWMInfo(SDL_GetWindowFromID(Int_val(id_v)), &info))
    caml_failwith(SDL_GetError());
  id window = (id)info.info.cocoa.window;
  id listener = ((id (*)(id, SEL))objc_msgSend)(window, sel_registerName("delegate"));
  id content = ((id (*)(id, SEL))objc_msgSend)(window, sel_registerName("contentView"));
  id next = ((id (*)(id, SEL))objc_msgSend)(content, sel_registerName("nextResponder"));
  id window_next = ((id (*)(id, SEL))objc_msgSend)(window, sel_registerName("nextResponder"));
  return Val_bool(next == listener && window_next == listener);
}
CAMLprim value logseq_native_sidebar_hit(value id_v) {
  SDL_SysWMinfo info; SDL_VERSION(&info.version);
  if (!SDL_GetWindowWMInfo(SDL_GetWindowFromID(Int_val(id_v)), &info)) caml_failwith(SDL_GetError());
  id window = (id)info.info.cocoa.window;
  id content = ((id (*)(id, SEL))objc_msgSend)(window, sel_registerName("contentView"));
  id frame = ((id (*)(id, SEL))objc_msgSend)(content, sel_registerName("superview"));
  id children = ((id (*)(id, SEL))objc_msgSend)(frame, sel_registerName("subviews"));
  unsigned long count = ((unsigned long (*)(id, SEL))objc_msgSend)(children, sel_registerName("count"));
  for (unsigned long index = 0; index < count; index++) {
    id view = ((id (*)(id, SEL, unsigned long))objc_msgSend)(children, sel_registerName("objectAtIndex:"), index);
    if (((int (*)(id, SEL, Class))objc_msgSend)(view, sel_registerName("isKindOfClass:"), objc_getClass("NSVisualEffectView"))) {
      typedef struct { double x,y; } Point;
      Point point = {20.,20.};
      id hit = ((id (*)(id, SEL, Point))objc_msgSend)(view, sel_registerName("hitTest:"), point);
      return Val_bool(hit != nil);
    }
  }
  caml_failwith("Sidebar material is missing");
}

CAMLprim value logseq_native_window_opaque(value id_v) {
  SDL_SysWMinfo info; SDL_VERSION(&info.version);
  if (!SDL_GetWindowWMInfo(SDL_GetWindowFromID(Int_val(id_v)), &info)) caml_failwith(SDL_GetError());
  id window = (id)info.info.cocoa.window;
  return Val_bool(((int (*)(id, SEL))objc_msgSend)(window, sel_registerName("isOpaque")));
}

CAMLprim value logseq_native_has_sidebar_material(value id_v) {
  SDL_SysWMinfo info; SDL_VERSION(&info.version);
  if (!SDL_GetWindowWMInfo(SDL_GetWindowFromID(Int_val(id_v)), &info)) caml_failwith(SDL_GetError());
  Class material = objc_getClass("LogseqSidebarMaterial");
  if (material == Nil) return Val_false;
  id window = (id)info.info.cocoa.window;
  id content = ((id (*)(id, SEL))objc_msgSend)(window, sel_registerName("contentView"));
  id frame = ((id (*)(id, SEL))objc_msgSend)(content, sel_registerName("superview"));
  id children = ((id (*)(id, SEL))objc_msgSend)(frame, sel_registerName("subviews"));
  unsigned long count = ((unsigned long (*)(id, SEL))objc_msgSend)(children, sel_registerName("count"));
  for (unsigned long index = 0; index < count; index++) {
    id view = ((id (*)(id, SEL, unsigned long))objc_msgSend)(children, sel_registerName("objectAtIndex:"), index);
    if (((int (*)(id, SEL, Class))objc_msgSend)(view, sel_registerName("isKindOfClass:"), material)) return Val_true;
  }
  return Val_false;
}
/* Register every font file in a directory with CoreText so Lui_text's
   named-family lookup (CTFontDescriptorCreateMatchingFontDescriptor)
   resolves them. The app ships Inter as TTFs; without registration the
   system has no "Inter" family and every glyph falls back to the system
   font, breaking parity with the web build.

   CoreText/CoreFoundation are already loaded into the process (lui_text
   links them), so resolve the entry points lazily instead of growing
   the link surface. */
#include <dlfcn.h>
#include <dirent.h>
#include <string.h>

CAMLprim void logseq_native_register_fonts(value dir_v) {
  CAMLparam1(dir_v);
  const char *dir = String_val(dir_v);
  /* CFURLCreateFromFileSystemRepresentation(allocator, buffer,
     bufLen, isDirectory) */
  typedef void *(*url_create_fn)(const void *, const unsigned char *,
                                 long, int);
  typedef unsigned char (*register_fn)(void *, long, void **);
  static url_create_fn url_create = NULL;
  static register_fn reg = NULL;
  static int looked_up = 0;
  if (!looked_up) {
    looked_up = 1;
    url_create = (url_create_fn)dlsym(
        RTLD_DEFAULT, "CFURLCreateFromFileSystemRepresentation");
    reg = (register_fn)dlsym(RTLD_DEFAULT,
                             "CTFontManagerRegisterFontsForURL");
  }
  if (url_create == NULL || reg == NULL) CAMLreturn0;
  DIR *d = opendir(dir);
  if (d == NULL) CAMLreturn0;
  struct dirent *ent;
  char path[4096];
  while ((ent = readdir(d)) != NULL) {
    const char *name = ent->d_name;
    size_t n = strlen(name);
    int ok_ext = n > 4 && (strcmp(name + n - 4, ".ttf") == 0 ||
                           strcmp(name + n - 4, ".otf") == 0 ||
                           strcmp(name + n - 4, ".ttc") == 0);
    if (!ok_ext) continue;
    int len = snprintf(path, sizeof path, "%s/%s", dir, name);
    if (len <= 0 || (size_t)len >= sizeof path) continue;
    void *url = url_create(NULL /* kCFAllocatorDefault */,
                           (const unsigned char *)path,
                           (long)strlen(path), 0 /* not a directory */);
    if (url == NULL) continue;
    reg(url, 1L /* kCTFontManagerScopeProcess */, NULL);
    typedef void (*release_fn)(void *);
    release_fn release = (release_fn)dlsym(RTLD_DEFAULT, "CFRelease");
    if (release != NULL) release(url);
  }
  closedir(d);
  CAMLreturn0;
}

/* AppKit rects are passed/returned by value; the ABI shape is two
   point/size structs of doubles. Declared locally so this file stays
   plain C — Foundation headers require an Objective-C translation
   unit. */
typedef struct {
  double x, y, w, h;
} ls_nsrect;

/* Only the visible sidebar needs transparent composition. Restore
   opaque layers when it closes so the complete window does not keep
   paying for alpha composition and material backing surfaces. */
static void set_layers_transparency(id layer, int transparent) {
  if (layer == nil) return;
  const char *name = object_getClassName(layer);
  if (name != NULL) {
    ((void (*)(id, SEL, int))objc_msgSend)(
        layer, sel_registerName("setOpaque:"), !transparent);
    /* setOpaque:NO still leaves an opaque backgroundColor fill that
       shows through the hole — NULL it too. */
    if (transparent) ((void (*)(id, SEL, void *))objc_msgSend)(
        layer, sel_registerName("setBackgroundColor:"), NULL);
  }
  id sub = ((id (*)(id, SEL))objc_msgSend)(
      layer, sel_registerName("sublayers"));
  if (sub == nil) return;
  unsigned long count = ((unsigned long (*)(id, SEL))objc_msgSend)(
      sub, sel_registerName("count"));
  for (unsigned long i = 0; i < count; i++) {
    id l = ((id (*)(id, SEL, unsigned long))objc_msgSend)(
        sub, sel_registerName("objectAtIndex:"), i);
    if (l == nil) continue;
    const char *ln = object_getClassName(l);
    if (ln != NULL && strstr(ln, "CAMetalLayer") != NULL) {
      ((void (*)(id, SEL, int))objc_msgSend)(
          l, sel_registerName("setOpaque:"), !transparent);
      if (transparent) ((void (*)(id, SEL, void *))objc_msgSend)(
          l, sel_registerName("setBackgroundColor:"), NULL);
    }
  }
}

/* App theme (light/dark) drives the material's appearance pin — set
   once per frame alongside sidebar_vibrancy. */
static int vib_dark = 0;
CAMLprim value logseq_native_sidebar_theme(value vdark) {
  CAMLparam1(vdark);
  vib_dark = Bool_val(vdark);
  CAMLreturn(Val_unit);
}

typedef struct { double x,y; } LogseqPoint;
static id logseq_material_hit_test(id view, SEL selector, LogseqPoint point) {
  (void)view; (void)selector; (void)point;
  return nil;
}

static Class logseq_material_class(void) {
  Class cls = objc_getClass("LogseqSidebarMaterial");
  if (!cls) {
    cls = objc_allocateClassPair(objc_getClass("NSVisualEffectView"), "LogseqSidebarMaterial", 0);
    class_addMethod(cls, sel_registerName("hitTest:"), (IMP)logseq_material_hit_test, "@@:{CGPoint=dd}");
    objc_registerClassPair(cls);
  }
  return cls;
}


/* Immutable IOSurface bands go directly to the window compositor. The
   renderer can reuse its staging pixels as soon as the copy completes. */
typedef struct {
  IOSurfaceRef image, background;
  id layers[3];
  int left, right;
  uint32_t pixel;
  bool ready, changed;
} LogseqSoftwareBand;

typedef struct {
  id view;
  LogseqSoftwareBand *bands;
  int w, h, rows, count;
  size_t owned_bytes;
} LogseqSoftwareSurface;

static const char *logseq_software_key = "logseq-native-software-surface";

static SDL_Window *logseq_software_window(value id_v) {
  SDL_Window *window = SDL_GetWindowFromID(Int_val(id_v));
  if (!window) caml_invalid_argument("Software presentation requires a live window");
  return window;
}

static int logseq_software_flipped(id view, SEL selector) {
  (void)view; (void)selector;
  return 1;
}

static int logseq_software_opaque(id view, SEL selector) {
  (void)selector;
  id window = ((id (*)(id, SEL))objc_msgSend)(view, sel_registerName("window"));
  return ((int (*)(id, SEL))objc_msgSend)(window, sel_registerName("isOpaque"));
}

static void logseq_software_update(id view, SEL selector) {
  (void)view; (void)selector;
}

static Class logseq_software_class(void) {
  Class cls = objc_getClass("LogseqSoftwareView");
  if (!cls) {
    cls = objc_allocateClassPair(objc_getClass("NSView"), "LogseqSoftwareView", 0);
    class_addMethod(cls, sel_registerName("isFlipped"), (IMP)logseq_software_flipped, "B@:");
    class_addMethod(cls, sel_registerName("wantsUpdateLayer"), (IMP)logseq_software_flipped, "B@:");
    class_addMethod(cls, sel_registerName("updateLayer"), (IMP)logseq_software_update, "v@:");
    class_addMethod(cls, sel_registerName("isOpaque"), (IMP)logseq_software_opaque, "B@:");
    class_addMethod(cls, sel_registerName("hitTest:"), (IMP)logseq_material_hit_test,
                    "@@:{CGPoint=dd}");
    objc_registerClassPair(cls);
  }
  return cls;
}

static void logseq_software_drop_images(LogseqSoftwareSurface *surface, LogseqSoftwareBand *band) {
  if (band->image) {
    surface->owned_bytes -= IOSurfaceGetAllocSize(band->image);
    CFRelease(band->image);
  }
  if (band->background) {
    surface->owned_bytes -= IOSurfaceGetAllocSize(band->background);
    CFRelease(band->background);
  }
}

static void logseq_software_clear(LogseqSoftwareSurface *surface) {
  for (int i=0; i<surface->count; i++) {
    LogseqSoftwareBand *band = &surface->bands[i];
    for (int part=0; part<3; part++)
      ((void (*)(id, SEL))objc_msgSend)(band->layers[part], sel_registerName("removeFromSuperlayer"));
    logseq_software_drop_images(surface, band);
  }
  free(surface->bands);
  surface->bands = NULL;
  surface->count = 0; surface->owned_bytes = 0;
}

static IOSurfaceRef logseq_software_band(int w, int h) {
  CFMutableDictionaryRef properties = CFDictionaryCreateMutable(NULL, 0,
      &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
  CFStringRef keys[] = {kIOSurfaceWidth, kIOSurfaceHeight, kIOSurfaceBytesPerElement,
                       kIOSurfaceBytesPerRow, kIOSurfacePixelFormat};
  int64_t values[] = {w, h, 4, IOSurfaceAlignProperty(kIOSurfaceBytesPerRow, (size_t)w*4),
                     0x42475241};
  for (int i=0; i<5; i++) {
    CFNumberRef number = CFNumberCreate(NULL, kCFNumberSInt64Type, &values[i]);
    CFDictionarySetValue(properties, keys[i], number);
    CFRelease(number);
  }
  IOSurfaceRef image = IOSurfaceCreate(properties);
  CFRelease(properties);
  if (!image) caml_failwith("Cannot create software IOSurface band");
  return image;
}

static IOSurfaceRef logseq_software_image(int w, int h, const unsigned char *source, size_t stride) {
  IOSurfaceRef image = logseq_software_band(w, h);
  if (IOSurfaceLock(image, 0, NULL)) {
    CFRelease(image);
    caml_failwith("Cannot lock software IOSurface band");
  }
  unsigned char *destination = IOSurfaceGetBaseAddress(image);
  size_t row_bytes = IOSurfaceGetBytesPerRow(image);
  for (int y=0; y<h; y++)
    memcpy(destination + row_bytes*y, source + stride*y, (size_t)w*4);
  if (IOSurfaceUnlock(image, 0, NULL)) {
    CFRelease(image);
    caml_failwith("Cannot unlock software IOSurface band");
  }
  return image;
}

static uint32_t logseq_software_pixel(const unsigned char *source) {
  uint32_t pixel;
  memcpy(&pixel, source, sizeof(pixel));
  return pixel;
}

CAMLprim value logseq_native_software_begin(value id_v, value dimensions) {
  CAMLparam2(id_v, dimensions);
  SDL_Window *window = logseq_software_window(id_v);
  int w = Int_val(Field(dimensions,0)), h = Int_val(Field(dimensions,1));
  int rows = Int_val(Field(dimensions,2));
  if (w <= 0 || h <= 0 || rows <= 0) caml_invalid_argument("Invalid software surface size");
  extern void *objc_autoreleasePoolPush(void);
  extern void objc_autoreleasePoolPop(void *);
  void *pool = objc_autoreleasePoolPush();
  LogseqSoftwareSurface *surface = SDL_GetWindowData(window, logseq_software_key);
  if (!surface) {
    SDL_SysWMinfo info; SDL_VERSION(&info.version);
    if (!SDL_GetWindowWMInfo(window, &info)) caml_failwith(SDL_GetError());
    surface = calloc(1, sizeof(*surface));
    if (!surface) caml_raise_out_of_memory();
    id native_window = (id)info.info.cocoa.window;
    id content = ((id (*)(id, SEL))objc_msgSend)(native_window, sel_registerName("contentView"));
    ls_nsrect bounds = ((ls_nsrect (*)(id, SEL))objc_msgSend)(content, sel_registerName("bounds"));
    id view = ((id (*)(Class, SEL))objc_msgSend)(logseq_software_class(), sel_registerName("alloc"));
    view = ((id (*)(id, SEL, ls_nsrect))objc_msgSend)(view, sel_registerName("initWithFrame:"), bounds);
    ((void (*)(id, SEL, unsigned long))objc_msgSend)(view, sel_registerName("setAutoresizingMask:"), 2 | 16);
    id layer = ((id (*)(Class, SEL))objc_msgSend)(objc_getClass("CALayer"), sel_registerName("layer"));
    ((void (*)(id, SEL, id))objc_msgSend)(view, sel_registerName("setLayer:"), layer);
    ((void (*)(id, SEL, int))objc_msgSend)(view, sel_registerName("setWantsLayer:"), 1);
    ((void (*)(id, SEL, id))objc_msgSend)(content, sel_registerName("addSubview:"), view);
    surface->view = view;
    SDL_SetWindowData(window, logseq_software_key, surface);
  }
  if (surface->w != w || surface->h != h || surface->rows != rows) {
    logseq_software_clear(surface);
    surface->w = w; surface->h = h; surface->rows = rows;
    surface->count = (h + rows - 1) / rows;
    surface->bands = calloc(surface->count, sizeof(LogseqSoftwareBand));
    if (!surface->bands) caml_raise_out_of_memory();
    id root = ((id (*)(id, SEL))objc_msgSend)(surface->view, sel_registerName("layer"));
    for (int i=0; i<surface->count; i++) {
      for (int part=0; part<3; part++) {
        id layer = ((id (*)(Class, SEL))objc_msgSend)(objc_getClass("CALayer"), sel_registerName("layer"));
        ((void (*)(id, SEL, id))objc_msgSend)(root, sel_registerName("addSublayer:"), layer);
        surface->bands[i].layers[part] = layer;
      }
    }
  }
  objc_autoreleasePoolPop(pool);
  CAMLreturn(Val_unit);
}

CAMLprim value logseq_native_software_tile(value id_v, value band_v) {
  CAMLparam2(id_v, band_v);
  LogseqSoftwareSurface *surface = SDL_GetWindowData(logseq_software_window(id_v), logseq_software_key);
  if (!surface) caml_invalid_argument("Software surface is not initialized");
  int y0 = Int_val(Field(band_v,0)), h = Int_val(Field(band_v,1));
  int stride = Int_val(Field(band_v,2));
  value pixels = Field(band_v,3);
  if (y0 < 0 || y0 >= surface->h || y0 % surface->rows || h <= 0 ||
      h != (surface->h - y0 < surface->rows ? surface->h - y0 : surface->rows) ||
      stride != surface->w * 4 || caml_string_length(pixels) < (size_t)stride * h)
    caml_invalid_argument("Invalid software image band");
  const unsigned char *source = (const unsigned char *)Bytes_val(pixels);
  /* A row majority is a cheap background candidate. Any candidate is
     lossless: the retained middle contains every pixel that differs. */
  uint32_t pixel = 0;
  int balance = 0;
  for (int x=0; x<surface->w; x++) {
    uint32_t current = logseq_software_pixel(source + (size_t)x*4);
    if (!balance) { pixel = current; balance = 1; }
    else balance += current == pixel ? 1 : -1;
  }
  int left = surface->w, right = 0;
  for (int y=0; y<h && (left || right < surface->w); y++) {
    const unsigned char *row = source + (size_t)stride*y;
    int x = 0;
    while (x < left && logseq_software_pixel(row + (size_t)x*4) == pixel) x++;
    left = x;
    x = surface->w;
    while (x > right && logseq_software_pixel(row + (size_t)(x-1)*4) == pixel) x--;
    right = x;
  }
  if (left == surface->w) right = left;
  LogseqSoftwareBand *band = &surface->bands[y0 / surface->rows];
  IOSurfaceRef image = right > left
    ? logseq_software_image(right-left, h, source + (size_t)left*4, stride) : NULL;
  IOSurfaceRef background = NULL;
  if (left || right < surface->w) {
    if (band->background && band->pixel == pixel) {
      background = band->background;
      CFRetain(background);
    } else background = logseq_software_image(1, 1, (const unsigned char *)&pixel, 4);
  }
  logseq_software_drop_images(surface, band);
  band->image = image; band->background = background;
  band->left = left; band->right = right; band->pixel = pixel;
  band->ready = true; band->changed = true;
  if (image) surface->owned_bytes += IOSurfaceGetAllocSize(image);
  if (background) surface->owned_bytes += IOSurfaceGetAllocSize(background);
  CAMLreturn(Val_unit);
}

CAMLprim value logseq_native_software_present(value id_v) {
  CAMLparam1(id_v);
  LogseqSoftwareSurface *surface = SDL_GetWindowData(logseq_software_window(id_v), logseq_software_key);
  if (!surface) caml_invalid_argument("Software surface is not initialized");
  for (int i=0; i<surface->count; i++)
    if (!surface->bands[i].ready) caml_invalid_argument("Software frame is incomplete");
  extern void *objc_autoreleasePoolPush(void);
  extern void objc_autoreleasePoolPop(void *);
  void *pool = objc_autoreleasePoolPush();
  Class transaction = objc_getClass("CATransaction");
  ((void (*)(Class, SEL))objc_msgSend)(transaction, sel_registerName("begin"));
  ((void (*)(Class, SEL, int))objc_msgSend)(transaction, sel_registerName("setDisableActions:"), 1);
  ls_nsrect bounds = ((ls_nsrect (*)(id, SEL))objc_msgSend)(surface->view, sel_registerName("bounds"));
  double scale_y = bounds.h / surface->h;
  double scale_x = bounds.w / surface->w;
  for (int i=0; i<surface->count; i++) {
    LogseqSoftwareBand *band = &surface->bands[i];
    int height = surface->h - i*surface->rows;
    if (height > surface->rows) height = surface->rows;
    int edges[] = {0, band->left, band->right, surface->w};
    for (int part=0; part<3; part++) {
      ls_nsrect rect = {edges[part]*scale_x, i*surface->rows*scale_y,
                       (edges[part+1]-edges[part])*scale_x, height*scale_y};
      id layer = band->layers[part];
      ((void (*)(id, SEL, ls_nsrect))objc_msgSend)(layer, sel_registerName("setFrame:"), rect);
      ((void (*)(id, SEL, double))objc_msgSend)(layer, sel_registerName("setContentsScale:"), 1./scale_x);
      if (band->changed) ((void (*)(id, SEL, id))objc_msgSend)(layer, sel_registerName("setContents:"),
          (id)(part == 1 ? band->image : band->background));
    }
    band->changed = false;
  }
  ((void (*)(Class, SEL))objc_msgSend)(transaction, sel_registerName("commit"));
  ((void (*)(Class, SEL))objc_msgSend)(transaction, sel_registerName("flush"));
  objc_autoreleasePoolPop(pool);
  CAMLreturn(Val_unit);
}

CAMLprim value logseq_native_software_owned_bytes(value id_v) {
  LogseqSoftwareSurface *surface = SDL_GetWindowData(logseq_software_window(id_v), logseq_software_key);
  return Val_long(surface ? surface->owned_bytes : 0);
}

CAMLprim value logseq_native_software_read(value id_v) {
  CAMLparam1(id_v); CAMLlocal1(out);
  LogseqSoftwareSurface *surface = SDL_GetWindowData(logseq_software_window(id_v), logseq_software_key);
  if (!surface) caml_invalid_argument("Software surface is not initialized");
  for (int i=0; i<surface->count; i++)
    if (!surface->bands[i].ready) caml_invalid_argument("Software frame is incomplete");
  out = caml_alloc_string((size_t)surface->w * surface->h * 4);
  for (int index=0; index<surface->count; index++) {
    LogseqSoftwareBand *band = &surface->bands[index];
    int height = surface->h - index*surface->rows;
    if (height > surface->rows) height = surface->rows;
    const unsigned char *source = NULL;
    size_t row_bytes = 0;
    if (band->image) {
      if (IOSurfaceLock(band->image, kIOSurfaceLockReadOnly, NULL))
        caml_failwith("Cannot read software IOSurface band");
      source = IOSurfaceGetBaseAddress(band->image);
      row_bytes = IOSurfaceGetBytesPerRow(band->image);
    }
    for (int y=0; y<height; y++) {
      unsigned char *row = (unsigned char *)Bytes_val(out)
        + ((size_t)index*surface->rows+y)*surface->w*4;
      for (int x=0; x<surface->w; x++) memcpy(row+(size_t)x*4, &band->pixel, 4);
      if (source) memcpy(row+(size_t)band->left*4, source+row_bytes*y,
                         (size_t)(band->right-band->left)*4);
    }
    if (band->image && IOSurfaceUnlock(band->image, kIOSurfaceLockReadOnly, NULL))
      caml_failwith("Cannot finish reading software IOSurface band");
  }
  CAMLreturn(out);
}

/* Diagnostic readback through Core Animation's actual layer composition. */
CAMLprim value logseq_native_software_composite(value id_v) {
  CAMLparam1(id_v); CAMLlocal1(out);
  LogseqSoftwareSurface *surface = SDL_GetWindowData(logseq_software_window(id_v), logseq_software_key);
  if (!surface) caml_invalid_argument("Software surface is not initialized");
  out = caml_alloc_string((size_t)surface->w * surface->h * 4);
  memset(Bytes_val(out), 0, caml_string_length(out));
  CGColorSpaceRef color = CGColorSpaceCreateDeviceRGB();
  CGContextRef context = CGBitmapContextCreate(Bytes_val(out), surface->w, surface->h, 8,
      (size_t)surface->w * 4, color, kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little);
  CGColorSpaceRelease(color);
  if (!context) caml_failwith("Cannot create software composition readback");
  id layer = ((id (*)(id, SEL))objc_msgSend)(surface->view, sel_registerName("layer"));
  ls_nsrect bounds = ((ls_nsrect (*)(id, SEL))objc_msgSend)(layer, sel_registerName("bounds"));
  CGContextTranslateCTM(context, 0, surface->h);
  CGContextScaleCTM(context, surface->w / bounds.w, -surface->h / bounds.h);
  ((void (*)(id, SEL, CGContextRef))objc_msgSend)(layer, sel_registerName("renderInContext:"), context);
  CGContextRelease(context);
  CAMLreturn(out);
}

CAMLprim value logseq_native_software_hit(value id_v) {
  LogseqSoftwareSurface *surface = SDL_GetWindowData(logseq_software_window(id_v), logseq_software_key);
  if (!surface) caml_invalid_argument("Software surface is not initialized");
  LogseqPoint point = {2.,2.};
  id hit = ((id (*)(id, SEL, LogseqPoint))objc_msgSend)(surface->view, sel_registerName("hitTest:"), point);
  return Val_bool(hit != nil);
}

CAMLprim value logseq_native_software_dispose(value id_v) {
  SDL_Window *window = logseq_software_window(id_v);
  LogseqSoftwareSurface *surface = SDL_GetWindowData(window, logseq_software_key);
  if (surface) {
    logseq_software_clear(surface);
    ((void (*)(id, SEL))objc_msgSend)(surface->view, sel_registerName("removeFromSuperview"));
    ((void (*)(id, SEL))objc_msgSend)(surface->view, sel_registerName("release"));
    SDL_SetWindowData(window, logseq_software_key, NULL);
    free(surface);
  }
  return Val_unit;
}

/* macOS sidebar vibrancy: an NSVisualEffectView with the .sidebar
   material composited BEHIND the SDL content view. SDL assumes the
   content view IS its metal view (a subview inside it would draw above
   the drawable), so the effect view goes into the window's frame view
   as a sibling ordered below the content view, and the framebuffer
   punches a transparent hole over the sidebar column so the material
   shows through.

   The host calls this once per layout while the metal renderer is
   active. x/y/w/h are window points in the frame view's coordinate
   space (origin bottom-left; the caller already flipped y).
   Collapsing the sidebar releases its material and restores opaque
   window composition. */
CAMLprim value logseq_native_sidebar_vibrancy(value vx, value vy,
                                              value vw, value vh,
                                              value vvisible) {
  CAMLparam5(vx, vy, vw, vh, vvisible);
  static id effect = nil;
  static int frame_init = 0;
  static double lx = 0, ly = 0, lw = 0, lh = 0;
  double x = Double_val(vx), y = Double_val(vy);
  double w = Double_val(vw), h = Double_val(vh);
  int visible = Int_val(vvisible) != 0;
  /* Called once per layout — the windows/layer walks below hand out
     autoreleased NSArrays, and this host has no Cocoa run loop
     draining a pool per turn, so drain them ourselves. */
  extern void *objc_autoreleasePoolPush(void);
  extern void objc_autoreleasePoolPop(void *);
  void *pool = objc_autoreleasePoolPush();
  Class cls = objc_getClass("NSApplication");
  if (cls == Nil) goto done;
  id app = ((id (*)(Class, SEL))objc_msgSend)(
      cls, sel_registerName("sharedApplication"));
  if (app == nil) goto done;
  id windows =
      ((id (*)(id, SEL))objc_msgSend)(app, sel_registerName("windows"));
  if (windows == nil) goto done;
  unsigned long count =
      ((unsigned long (*)(id, SEL))objc_msgSend)(
          windows, sel_registerName("count"));
  for (unsigned long i = 0; i < count; i++) {
    id win = ((id (*)(id, SEL, unsigned long))objc_msgSend)(
        windows, sel_registerName("objectAtIndex:"), i);
    if (win == nil) continue;
    unsigned long mask = ((unsigned long (*)(id, SEL))objc_msgSend)(
        win, sel_registerName("styleMask"));
    if (!(mask & 1L /* NSWindowStyleMaskTitled */)) continue;
    id cv = ((id (*)(id, SEL))objc_msgSend)(
        win, sel_registerName("contentView"));
    if (cv == nil) continue;
    id frame = ((id (*)(id, SEL))objc_msgSend)(
        cv, sel_registerName("superview"));
    if (frame == nil) continue;
    ((void (*)(id, SEL, int))objc_msgSend)(
        win, sel_registerName("setOpaque:"), !visible);
    Class nscolor = objc_getClass("NSColor");
    if (nscolor != Nil) {
      id background = ((id (*)(Class, SEL))objc_msgSend)(
          nscolor, sel_registerName(visible ? "clearColor" : "windowBackgroundColor"));
      ((void (*)(id, SEL, id))objc_msgSend)(
          win, sel_registerName("setBackgroundColor:"), background);
    }
    id layer = ((id (*)(id, SEL))objc_msgSend)(cv, sel_registerName("layer"));
    set_layers_transparency(layer, visible);
    id appearance = nil;
    Class appcls = objc_getClass("NSAppearance");
    if (appcls != Nil) {
      appearance = ((id (*)(Class, SEL, id))objc_msgSend)(
          appcls, sel_registerName("appearanceNamed:"),
          menu_nsstr(vib_dark ? "NSAppearanceNameDarkAqua" : "NSAppearanceNameAqua"));
      if (appearance != nil) ((void (*)(id, SEL, id))objc_msgSend)(
          win, sel_registerName("setAppearance:"), appearance);
    }
    if (!visible) {
      if (effect != nil) {
        ((void (*)(id, SEL))objc_msgSend)(effect, sel_registerName("removeFromSuperview"));
        ((void (*)(id, SEL))objc_msgSend)(effect, sel_registerName("release"));
        effect = nil;
        frame_init = 0;
      }
      break;
    }
    if (effect == nil) {
      Class effcls = logseq_material_class();
      if (effcls == Nil) break;
      ls_nsrect r = {x, y, w, h};
      effect = ((id (*)(id, SEL, ls_nsrect))objc_msgSend)(
          ((id (*)(Class, SEL))objc_msgSend)(
              effcls, sel_registerName("alloc")),
          sel_registerName("initWithFrame:"), r);
      if (effect == nil) break;
      /* NSVisualEffectMaterialSidebar, BehindWindow, Active. */
      ((void (*)(id, SEL, long))objc_msgSend)(
          effect, sel_registerName("setMaterial:"), 7L);
      ((void (*)(id, SEL, long))objc_msgSend)(
          effect, sel_registerName("setBlendingMode:"), 0L);
      ((void (*)(id, SEL, long))objc_msgSend)(
          effect, sel_registerName("setState:"), 1L);
      /* width+height sizable keeps it glued between layout updates. */
      ((void (*)(id, SEL, long))objc_msgSend)(
          effect, sel_registerName("setAutoresizingMask:"),
          2L | 16L);
      ((void (*)(id, SEL, id, long, id))objc_msgSend)(
          frame, sel_registerName("addSubview:positioned:relativeTo:"),
          effect, -1L /* NSWindowBelow */, cv);
    }
    if (appearance != nil) ((void (*)(id, SEL, id))objc_msgSend)(
        effect, sel_registerName("setAppearance:"), appearance);
    if (visible && (!frame_init || x != lx || y != ly || w != lw ||
                    h != lh)) {
      ls_nsrect r = {x, y, w, h};
      ((void (*)(id, SEL, ls_nsrect))objc_msgSend)(
          effect, sel_registerName("setFrame:"), r);
      lx = x; ly = y; lw = w; lh = h; frame_init = 1;
    }
    ((void (*)(id, SEL, int))objc_msgSend)(
        effect, sel_registerName("setHidden:"), visible ? 0 : 1);
    break;
  }
done:
  objc_autoreleasePoolPop(pool);
  CAMLreturn(Val_unit);
}

/* ============ in-app native NSMenu popup (experiment) ============

   The app serializes its overlay menus to a JSON spec (see
   popups_state's cm_native_spec) and hands it here through the
   "native-menu-popup" host request; we build a real NSMenu whose items
   carry custom views drawing the Logseq chrome (18px tabler icons,
   color dots, right-aligned kbd keycaps, group headers, composite
   swatch/heading rows) and run it modally through
   +[NSMenu popUpContextMenu:withEvent:forView:]. The picked
   tag (or -1 on dismiss) is returned to OCaml, which emits
   "native-menu-select" — the same host→app event channel the menubar
   uses.

   Items with custom views lose key equivalents (AppKit ignores them);
   the LUI overlay didn't have any either. A menu taller than the
   spec's max_h falls into the single-scroll-item layout: one
   NSMenuItem whose view is an NSScrollView holding every row — clicks
   land on the row views themselves (each keeps its own spec tag) and
   a "sub" row re-pops a fresh NSMenu where the row sat. */

#include <caml/signals.h>
#include <math.h>
#include <string.h>

extern void *objc_autoreleasePoolPush(void);
extern void objc_autoreleasePoolPop(void *);

/* ---- minimal JSON reader for the host-generated spec ---- */

typedef struct {
  double x, y;
} mp_pt;

typedef struct jsv jsv;
struct jsv {
  int t; /* 'o','a','s','n','b','0' null */
  char *s;
  double n;
  jsv **k;
  int nk;
};

static void js_ws(const char **p) {
  while (**p == ' ' || **p == '\t' || **p == '\n' || **p == '\r')
    (*p)++;
}

static jsv *js_new(int t) {
  jsv *v = calloc(1, sizeof(jsv));
  v->t = t;
  return v;
}

static void js_push(jsv *o, jsv *kid) {
  o->k = realloc(o->k, sizeof(jsv *) * (o->nk + 1));
  o->k[o->nk++] = kid;
}

static void js_utf8(char **b, int *n, int *cap, unsigned cp) {
  if (*n + 4 >= *cap) {
    *cap += 64;
    *b = realloc(*b, *cap);
  }
  if (cp < 0x80) (*b)[(*n)++] = (char)cp;
  else if (cp < 0x800) {
    (*b)[(*n)++] = (char)(0xc0 | (cp >> 6));
    (*b)[(*n)++] = (char)(0x80 | (cp & 63));
  } else if (cp < 0x10000) {
    (*b)[(*n)++] = (char)(0xe0 | (cp >> 12));
    (*b)[(*n)++] = (char)(0x80 | ((cp >> 6) & 63));
    (*b)[(*n)++] = (char)(0x80 | (cp & 63));
  } else {
    (*b)[(*n)++] = (char)(0xf0 | (cp >> 18));
    (*b)[(*n)++] = (char)(0x80 | ((cp >> 12) & 63));
    (*b)[(*n)++] = (char)(0x80 | ((cp >> 6) & 63));
    (*b)[(*n)++] = (char)(0x80 | (cp & 63));
  }
}

static unsigned js_hex4(const char **p) {
  unsigned v = 0;
  for (int i = 0; i < 4; i++) {
    char c = **p;
    v <<= 4;
    if (c >= '0' && c <= '9') v += c - '0';
    else if (c >= 'a' && c <= 'f') v += c - 'a' + 10;
    else if (c >= 'A' && c <= 'F') v += c - 'A' + 10;
    if (*p) (*p)++;
  }
  return v;
}

static jsv *js_parse(const char **p);

static char *js_string(const char **p) {
  (*p)++; /* opening quote */
  char *b = malloc(64);
  int n = 0, cap = 64;
  while (**p && **p != '"') {
    char c = **p;
    if (c == '\\') {
      (*p)++;
      c = **p;
      switch (c) {
      case 'n': js_utf8(&b, &n, &cap, '\n'); break;
      case 't': js_utf8(&b, &n, &cap, '\t'); break;
      case 'r': js_utf8(&b, &n, &cap, '\r'); break;
      case 'b': js_utf8(&b, &n, &cap, '\b'); break;
      case 'f': js_utf8(&b, &n, &cap, '\f'); break;
      case 'u': {
        (*p)++;
        js_utf8(&b, &n, &cap, js_hex4(p));
        continue;
      }
      default: js_utf8(&b, &n, &cap, (unsigned char)c); break;
      }
      (*p)++;
    } else {
      if (n + 1 >= cap) {
        cap += 64;
        b = realloc(b, cap);
      }
      b[n++] = c;
      (*p)++;
    }
  }
  if (**p == '"') (*p)++;
  if (n + 1 >= cap) {
    cap += 1;
    b = realloc(b, cap);
  }
  b[n] = 0;
  return b;
}

static jsv *js_parse(const char **p) {
  js_ws(p);
  char c = **p;
  if (c == '{') {
    jsv *o = js_new('o');
    (*p)++;
    js_ws(p);
    while (**p && **p != '}') {
      jsv *kv = js_new('s');
      kv->s = js_string(p);
      js_ws(p);
      if (**p == ':') (*p)++;
      js_push(o, kv);
      js_push(o, js_parse(p));
      js_ws(p);
      if (**p == ',') {
        (*p)++;
        js_ws(p);
      }
    }
    if (**p == '}') (*p)++;
    return o;
  }
  if (c == '[') {
    jsv *a = js_new('a');
    (*p)++;
    js_ws(p);
    while (**p && **p != ']') {
      js_push(a, js_parse(p));
      js_ws(p);
      if (**p == ',') {
        (*p)++;
        js_ws(p);
      }
    }
    if (**p == ']') (*p)++;
    return a;
  }
  if (c == '"') {
    jsv *s = js_new('s');
    s->s = js_string(p);
    return s;
  }
  if (!strncmp(*p, "true", 4)) {
    *p += 4;
    jsv *v = js_new('b');
    v->n = 1;
    return v;
  }
  if (!strncmp(*p, "false", 5)) {
    *p += 5;
    return js_new('b');
  }
  if (!strncmp(*p, "null", 4)) {
    *p += 4;
    return js_new('0');
  }
  jsv *v = js_new('n');
  v->n = strtod(*p, (char **)p);
  return v;
}

static void js_free(jsv *v) {
  if (!v) return;
  for (int i = 0; i < v->nk; i++) js_free(v->k[i]);
  free(v->k);
  free(v->s);
  free(v);
}

static jsv *js_get(jsv *o, const char *key) {
  if (!o || o->t != 'o') return NULL;
  for (int i = 0; i + 1 < o->nk; i += 2)
    if (o->k[i]->t == 's' && o->k[i]->s && !strcmp(o->k[i]->s, key))
      return o->k[i + 1];
  return NULL;
}

static const char *js_str(jsv *o, const char *key) {
  jsv *v = js_get(o, key);
  return (v && v->t == 's') ? v->s : NULL;
}

static double js_num(jsv *o, const char *key, double d) {
  jsv *v = js_get(o, key);
  return (v && (v->t == 'n' || v->t == 'b')) ? v->n : d;
}

static int js_bool(jsv *o, const char *key, int d) {
  jsv *v = js_get(o, key);
  return (v && v->t == 'b') ? (int)v->n : d;
}

/* ---- ObjC runtime conveniences ---- */

static id mp_alloc(const char *cls) {
  return menu_alloc(objc_getClass(cls));
}

static id mp_new(const char *cls) {
  /* +new lives on the class object, not an instance */
  return ((id(*)(id, SEL))objc_msgSend)((id)objc_getClass(cls),
                                       sel_registerName("new"));
}

static id mp_str(const char *s) { return menu_nsstr(s ? s : ""); }

static void mp_set(id v, const void *key, id val) {
  objc_setAssociatedObject(v, key, val, 1 /* retain nonatomic */);
}

static id mp_get(id v, const void *key) {
  return objc_getAssociatedObject(v, key);
}

static char k_mp_kind, k_mp_label, k_mp_caps, k_mp_icon, k_mp_dot,
    k_mp_cells, k_mp_tag, k_mp_subspec, k_mp_hover, k_mp_hotcell,
    k_mp_ta;

static id mp_num(long v) {
  return ((id(*)(id, SEL, long))objc_msgSend)(
      (id)objc_getClass("NSNumber"), sel_registerName("numberWithLong:"),
      v);
}

static id mp_font(double sz) {
  id f = ((id(*)(id, SEL, id, double))objc_msgSend)(
      (id)objc_getClass("NSFont"), sel_registerName("fontWithName:size:"),
      mp_str("Inter"), sz);
  if (f == nil)
    f = ((id(*)(id, SEL, double))objc_msgSend)(
        (id)objc_getClass("NSFont"), sel_registerName("menuFontOfSize:"),
        sz);
  return f;
}

static id mp_attr(id font, id color) {
  static id attr_font = NULL, attr_color = NULL;
  if (attr_font == NULL) {
    attr_font = *(id *)dlsym(RTLD_DEFAULT, "NSFontAttributeName");
    attr_color =
        *(id *)dlsym(RTLD_DEFAULT, "NSForegroundColorAttributeName");
  }
  id objs[2] = {font, color};
  id keys[2] = {attr_font, attr_color};
  return ((id(*)(id, SEL, id *, id *, unsigned long))objc_msgSend)(
      (id)objc_getClass("NSDictionary"),
      sel_registerName("dictionaryWithObjects:forKeys:count:"), objs,
      keys, 2UL);
}

static id mp_label_color(void) {
  return ((id(*)(id, SEL))objc_msgSend)(
      (id)objc_getClass("NSColor"), sel_registerName("labelColor"));
}

static id mp_dim_color(void) {
  return ((id(*)(id, SEL))objc_msgSend)(
      (id)objc_getClass("NSColor"),
      sel_registerName("secondaryLabelColor"));
}

static id mp_alpha(id color, double a) {
  return ((id(*)(id, SEL, double))objc_msgSend)(
      color, sel_registerName("colorWithAlphaComponent:"), a);
}

static id mp_white(double w, double a) {
  return ((id(*)(id, SEL, double, double))objc_msgSend)(
      (id)objc_getClass("NSColor"),
      sel_registerName("colorWithWhite:alpha:"), w, a);
}

static id mp_hex_color(const char *hex) {
  if (hex == NULL || hex[0] != '#') return nil;
  unsigned v = (unsigned)strtoul(hex + 1, NULL, 16);
  return ((id(*)(id, SEL, double, double, double, double))objc_msgSend)(
      (id)objc_getClass("NSColor"),
      sel_registerName("colorWithSRGBRed:green:blue:alpha:"),
      ((v >> 16) & 255) / 255.0, ((v >> 8) & 255) / 255.0,
      (v & 255) / 255.0, 1.0);
}

static double mp_text_w(id s, id attrs) {
  typedef struct {
    double w, h;
  } sz;
  sz r = ((sz(*)(id, SEL, id))objc_msgSend)(
      s, sel_registerName("sizeWithAttributes:"), attrs);
  return r.w;
}

static void mp_draw(id s, double x, double y, id attrs) {
  struct {
    double x, y;
  } pt = {x, y};
  ((void (*)(id, SEL, typeof(pt), id))objc_msgSend)(
      s, sel_registerName("drawAtPoint:withAttributes:"), pt, attrs);
}

static id mp_icon(jsv *o) {
  const char *b64 = js_str(o, "icon_rgba");
  int w = (int)js_num(o, "icon_w", 0), h = (int)js_num(o, "icon_h", 0);
  if (b64 == NULL || w <= 0 || h <= 0) return nil;
  mlsize_t n = strlen(b64);
  unsigned char *px = malloc(w * h * 4);
  int pad = 0;
  unsigned acc = 0, bits = 0;
  mlsize_t oi = 0;
  for (mlsize_t i = 0; i < n && oi < (mlsize_t)(w * h * 4); i++) {
    char c = b64[i];
    if (c == '=') {
      pad++;
      continue;
    }
    int v = b64_val(c);
    if (v < 0) continue;
    acc = (acc << 6) | (unsigned)v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      px[oi++] = (unsigned char)((acc >> bits) & 0xff);
    }
  }
  (void)pad;
  if (oi < (mlsize_t)(w * h * 4)) {
    free(px);
    return nil;
  }
  id rep = ((id(*)(id, SEL, unsigned char **, long, long, long, long,
                   int, int, id, long, long))objc_msgSend)(
      mp_alloc("NSBitmapImageRep"),
      sel_registerName("initWithBitmapDataPlanes:pixelsWide:pixelsHigh:"
                       "bitsPerSample:samplesPerPixel:hasAlpha:isPlanar:"
                       "colorSpaceName:bytesPerRow:bitsPerPixel:"),
      NULL, (long)w, (long)h, 8L, 4L, 1, 0,
      mp_str("NSDeviceRGBColorSpace"), (long)(w * 4), 32L);
  if (rep == nil) {
    free(px);
    return nil;
  }
  unsigned char *dst = ((unsigned char *(*)(id, SEL))objc_msgSend)(
      rep, sel_registerName("bitmapData"));
  memcpy(dst, px, (size_t)(w * h * 4));
  free(px);
  typedef struct {
    double w, h;
  } sz;
  sz s = {w / 2.0, h / 2.0};
  id img = ((id(*)(id, SEL, sz))objc_msgSend)(
      mp_alloc("NSImage"), sel_registerName("initWithSize:"), s);
  ((void (*)(id, SEL, id))objc_msgSend)(
      img, sel_registerName("addRepresentation:"), rep);
  ((void (*)(id, SEL))objc_msgSend)(rep, sel_registerName("release"));
  return img;
}

/* ---- the row view ----

   One NSView subclass renders every spec row kind: "i" selectable
   item, "s" submenu parent (chevron), "h" group header, "r" composite
   cell row, "l" separator line. Highlight comes from a tracking area
   (uniform across standalone items and scroll-item rows) OR'd with
   the enclosing item's highlighted state for standalone items. */

static long mp_sel = -1;
static jsv *mp_repop = NULL;
static double mp_repop_x = 0, mp_repop_y = 0;
static id mp_current_menu = NULL;

static int mp_responds(id o, const char *sel) {
  return o != nil &&
         ((int (*)(id, SEL, SEL))objc_msgSend)(
             o, sel_registerName("respondsToSelector:"),
             sel_registerName(sel));
}

static void mp_cancel(id self) {
  (void)self;
  id menu = mp_current_menu;
  if (menu == nil) return;
  ((void (*)(id, SEL))objc_msgSend)(
      menu, sel_registerName("cancelTracking"));
  ((void (*)(id, SEL))objc_msgSend)(
      menu, sel_registerName("cancelTrackingWithoutAnimation"));
}

static int mp_flag(id v, const void *key) {
  id n = mp_get(v, key);
  return n != nil &&
         ((int (*)(id, SEL))objc_msgSend)(n, sel_registerName("intValue"));
}

static void mp_set_flag(id v, const void *key, int b) {
  mp_set(v, key, b ? mp_num(1) : nil);
}

static long mp_cell_tag(id self, double x) {
  id cells = mp_get(self, &k_mp_cells);
  if (cells == nil) return -1;
  unsigned long n = ((unsigned long (*)(id, SEL))objc_msgSend)(
      cells, sel_registerName("count"));
  if (n == 0) return -1;
  typedef struct {
    double x, y, w, h;
  } R;
  R b = ((R(*)(id, SEL))objc_msgSend)(self, sel_registerName("bounds"));
  double pad = 14.0, cw = 30.0;
  double gap = 8.0;
  if (n > 1)
    gap = fmax(4.0, (b.w - 2 * pad - n * cw) / (double)(n - 1));
  double cx = pad;
  for (unsigned long i = 0; i < n; i++) {
    if (x >= cx - 2 && x <= cx + cw + 2) {
      id cell = ((id(*)(id, SEL, unsigned long))objc_msgSend)(
          cells, sel_registerName("objectAtIndex:"), i);
      id t = ((id(*)(id, SEL, id))objc_msgSend)(
          cell, sel_registerName("objectForKey:"), mp_str("tag"));
      return t != nil ? ((long (*)(id, SEL))objc_msgSend)(
                 t, sel_registerName("longValue"))
                      : -1;
    }
    cx += cw + gap;
  }
  return -1;
}

static void row_mouseUp(id self, SEL _cmd, id ev) {
  (void)_cmd;
  const char *kind = "";
  id ks = mp_get(self, &k_mp_kind);
  if (ks != nil)
    kind = ((const char *(*)(id, SEL))objc_msgSend)(
        ks, sel_registerName("UTF8String"));
  struct {
    double x, y;
  } pw = {0, 0}, pl = {0, 0};
  pw = ((typeof(pw) (*)(id, SEL))objc_msgSend)(
      ev, sel_registerName("locationInWindow"));
  pl = ((typeof(pl) (*)(id, SEL, typeof(pw), id))objc_msgSend)(
      self, sel_registerName("convertPoint:fromView:"), pw, nil);

  long tag = -1;
  id sub = NULL;
  if (!strcmp(kind, "r")) {
    tag = mp_cell_tag(self, pl.x);
  } else if (!strcmp(kind, "i") || !strcmp(kind, "s")) {
    id t = mp_get(self, &k_mp_tag);
    if (t != nil)
      tag = ((long (*)(id, SEL))objc_msgSend)(
          t, sel_registerName("longValue"));
    if (!strcmp(kind, "s"))
      sub = mp_get(self, &k_mp_subspec);
  }
  if (tag < 0 && sub == NULL) return; /* disabled/header/sep: keep menu */

  /* for a scroll-mode "sub" row, capture its screen rect so the
     replacement popup can open where the row sat */
  if (sub != NULL) {
    typedef struct {
      double x, y, w, h;
    } R;
    R b = ((R(*)(id, SEL))objc_msgSend)(self,
                                       sel_registerName("bounds"));
    R ws = ((R(*)(id, SEL, R, id))objc_msgSend)(
        self, sel_registerName("convertRect:toView:"), b, nil);
    id win = ((id(*)(id, SEL))objc_msgSend)(self,
                                           sel_registerName("window"));
    R sc = ((R(*)(id, SEL, R))objc_msgSend)(
        win, sel_registerName("convertRectToScreen:"), ws);
    mp_repop_x = sc.x + sc.w - 4;
    mp_repop_y = sc.y + sc.h + 4; /* screen coords: y up, top = y+h */
    mp_repop = ((jsv *(*)(id, SEL))objc_msgSend)(
        sub, sel_registerName("pointerValue"));
  } else {
    mp_sel = tag;
  }
  mp_cancel(self);
}

static void row_track(id self, SEL _cmd, id ev, int inside) {
  (void)_cmd;
  (void)ev;
  mp_set_flag(self, &k_mp_hover, inside);
  if (!inside) mp_set(self, &k_mp_hotcell, nil);
  ((void (*)(id, SEL, int))objc_msgSend)(
      self, sel_registerName("setNeedsDisplay:"), 1);
}

static void row_mouseEntered(id self, SEL _cmd, id ev) {
  row_track(self, _cmd, ev, 1);
}
static void row_mouseExited(id self, SEL _cmd, id ev) {
  row_track(self, _cmd, ev, 0);
}

static void row_mouseMoved(id self, SEL _cmd, id ev) {
  (void)_cmd;
  struct {
    double x, y;
  } pw = {0, 0}, pl = {0, 0};
  pw = ((typeof(pw) (*)(id, SEL))objc_msgSend)(
      ev, sel_registerName("locationInWindow"));
  pl = ((typeof(pl) (*)(id, SEL, typeof(pw), id))objc_msgSend)(
      self, sel_registerName("convertPoint:fromView:"), pw, nil);
  const char *kind = "";
  id ks = mp_get(self, &k_mp_kind);
  if (ks != nil)
    kind = ((const char *(*)(id, SEL))objc_msgSend)(
        ks, sel_registerName("UTF8String"));
  if (!strcmp(kind, "r")) {
    /* mark the hovered cell index via tag scan */
    id cells = mp_get(self, &k_mp_cells);
    long hot = -1;
    if (cells != nil) {
      unsigned long n = ((unsigned long (*)(id, SEL))objc_msgSend)(
          cells, sel_registerName("count"));
      typedef struct {
        double x, y, w, h;
      } R;
      R b = ((R(*)(id, SEL))objc_msgSend)(self,
                                         sel_registerName("bounds"));
      double pad = 14.0, cw = 30.0, gap = 8.0;
      if (n > 1) gap = fmax(4.0, (b.w - 2 * pad - n * cw) / (n - 1));
      double cx = pad;
      for (unsigned long i = 0; i < n; i++) {
        if (pl.x >= cx - 2 && pl.x <= cx + cw + 2) hot = (long)i;
        cx += cw + gap;
      }
    }
    id old = mp_get(self, &k_mp_hotcell);
    long ov = old != nil ? ((long (*)(id, SEL))objc_msgSend)(
                      old, sel_registerName("longValue"))
                         : -1;
    if (ov != hot) {
      mp_set(self, &k_mp_hotcell, hot >= 0 ? mp_num(hot) : nil);
      ((void (*)(id, SEL, int))objc_msgSend)(
          self, sel_registerName("setNeedsDisplay:"), 1);
    }
  } else {
    row_track(self, _cmd, ev, 1);
  }
}

static void row_didMove(id self, SEL _cmd) {
  (void)_cmd;
  id ta = mp_get(self, &k_mp_ta);
  if (ta != nil) {
    ((void (*)(id, SEL, id))objc_msgSend)(
        self, sel_registerName("removeTrackingArea:"), ta);
    mp_set(self, &k_mp_ta, nil);
  }
  typedef struct {
    double x, y, w, h;
  } R;
  R b = ((R(*)(id, SEL))objc_msgSend)(self, sel_registerName("bounds"));
  ta = ((id(*)(id, SEL, R, unsigned long, id, id))objc_msgSend)(
      mp_alloc("NSTrackingArea"),
      sel_registerName("initWithRect:options:owner:userInfo:"), b,
      0x01UL | 0x04UL | 0x80UL | 0x200UL
      /* EnteredAndExited|Moved|ActiveAlways|InVisibleRect */,
      self, nil);
  ((void (*)(id, SEL, id))objc_msgSend)(
      self, sel_registerName("addTrackingArea:"), ta);
  ((void (*)(id, SEL))objc_msgSend)(ta, sel_registerName("release"));
  mp_set(self, &k_mp_ta, ta);
}

static void mp_fill_round(id color, double x, double y, double w,
                          double h, double r) {
  typedef struct {
    double x, y, w, h;
  } R;
  R rr = {x, y, w, h};
  id bp = ((id(*)(id, SEL, R, double, double))objc_msgSend)(
      (id)objc_getClass("NSBezierPath"),
      sel_registerName("bezierPathWithRoundedRect:xRadius:yRadius:"),
      rr, r, r);
  ((void (*)(id, SEL))objc_msgSend)(color, sel_registerName("set"));
  ((void (*)(id, SEL))objc_msgSend)(bp, sel_registerName("fill"));
}

static void mp_oval(id color, double x, double y, double w, double h,
                    int fill) {
  typedef struct {
    double x, y, w, h;
  } R;
  R rr = {x, y, w, h};
  id bp = ((id(*)(id, SEL, R))objc_msgSend)(
      (id)objc_getClass("NSBezierPath"),
      sel_registerName("bezierPathWithOvalInRect:"), rr);
  ((void (*)(id, SEL))objc_msgSend)(color, sel_registerName("set"));
  ((void (*)(id, SEL))objc_msgSend)(
      bp, sel_registerName(fill ? "fill" : "stroke"));
}

static void row_drawRect(id self, SEL _cmd, ls_nsrect dirty) {
  (void)_cmd;
  (void)dirty;
  typedef struct {
    double x, y, w, h;
  } R;
  R b = ((R(*)(id, SEL))objc_msgSend)(self, sel_registerName("bounds"));
  const char *kind = "i";
  id ks = mp_get(self, &k_mp_kind);
  if (ks != nil)
    kind = ((const char *(*)(id, SEL))objc_msgSend)(
        ks, sel_registerName("UTF8String"));

  int hl = mp_flag(self, &k_mp_hover);
  if (!hl) {
    id item = ((id(*)(id, SEL))objc_msgSend)(
        self, sel_registerName("enclosingMenuItem"));
    if (item != nil)
      hl = ((int (*)(id, SEL))objc_msgSend)(
          item, sel_registerName("isHighlighted"));
  }
  id dark_bg = mp_white(vib_dark ? 1.0 : 0.0, vib_dark ? 0.10 : 0.06);

  if (!strcmp(kind, "h")) {
    /* group header: dimmed 11pt label at left inset */
    id label = mp_get(self, &k_mp_label);
    if (label != nil)
      mp_draw(label, 12.0, (b.h - 14.0) / 2.0 - 1.0,
              mp_attr(mp_font(11.0), mp_dim_color()));
    return;
  }
  if (!strcmp(kind, "l")) {
    /* separator line */
    id c = mp_white(vib_dark ? 1.0 : 0.0, vib_dark ? 0.14 : 0.10);
    mp_fill_round(c, 12.0, b.h / 2.0 - 0.5, b.w - 24.0, 1.0, 0);
    return;
  }
  if (!strcmp(kind, "r")) {
    /* composite cell row — swatches / heading icons evenly spread */
    id cells = mp_get(self, &k_mp_cells);
    if (cells == nil) return;
    unsigned long n = ((unsigned long (*)(id, SEL))objc_msgSend)(
        cells, sel_registerName("count"));
    double pad = 14.0, cw = 30.0, gap = 8.0;
    if (n > 1) gap = fmax(4.0, (b.w - 2 * pad - n * cw) / (n - 1));
    id hot = mp_get(self, &k_mp_hotcell);
    long hv = hot != nil ? ((long (*)(id, SEL))objc_msgSend)(
                      hot, sel_registerName("longValue"))
                         : -1;
    double cx = pad;
    for (unsigned long i = 0; i < n; i++) {
      id cell = ((id(*)(id, SEL, unsigned long))objc_msgSend)(
          cells, sel_registerName("objectAtIndex:"), i);
      const char *ck = "swatch";
      id cks = ((id(*)(id, SEL, id))objc_msgSend)(
          cell, sel_registerName("objectForKey:"), mp_str("k"));
      if (cks != nil)
        ck = ((const char *(*)(id, SEL))objc_msgSend)(
            cks, sel_registerName("UTF8String"));
      if ((long)i == hv)
        mp_fill_round(dark_bg, cx - 3.0, (b.h - 24.0) / 2.0 - 3.0,
                      cw + 6.0, 24.0 + 6.0, 6.0);
      double cy = (b.h - 18.0) / 2.0;
      if (!strcmp(ck, "swatch")) {
        id col = ((id(*)(id, SEL, id))objc_msgSend)(
            cell, sel_registerName("objectForKey:"), mp_str("color"));
        if (col != nil) mp_oval(col, cx + 6.0, cy, 18.0, 18.0, 1);
      } else if (!strcmp(ck, "x")) {
        mp_oval(mp_dim_color(), cx + 6.0, cy, 18.0, 18.0, 0);
        /* minus glyph */
        mp_draw(mp_str("-"), cx + 12.0, cy + 3.0,
                mp_attr(mp_font(11.0), mp_dim_color()));
      } else if (!strcmp(ck, "icon")) {
        id img = ((id(*)(id, SEL, id))objc_msgSend)(
            cell, sel_registerName("objectForKey:"), mp_str("icon"));
        if (img != nil) {
          R dr = {cx + 6.0, cy, 18.0, 18.0}, fr = {0, 0, 0, 0};
          ((void (*)(id, SEL, R, R, unsigned long, double))objc_msgSend)(
              img,
              sel_registerName("drawInRect:fromRect:operation:fraction:"),
              dr, fr, 2UL /* source-over */, 1.0);
        }
      }
      cx += cw + gap;
    }
    return;
  }

  /* "i" / "s": selectable row — 18px icon at x+8, label at x+30, kbd
     keycaps right-aligned, optional chevron */
  if (hl)
    mp_fill_round(dark_bg, 4.0, 2.0, b.w - 8.0, b.h - 4.0, 6.0);

  int enabled = 1;
  {
    id en = objc_getAssociatedObject(self, (const void *)"mp_enabled");
    if (en != nil)
      enabled = ((int (*)(id, SEL))objc_msgSend)(
          en, sel_registerName("intValue"));
  }
  id label_col = mp_label_color();
  if (!enabled) label_col = mp_alpha(label_col, 0.35);

  id img = mp_get(self, &k_mp_icon);
  if (img != nil) {
    R dr = {8.0, (b.h - 18.0) / 2.0, 18.0, 18.0}, fr = {0, 0, 0, 0};
    ((void (*)(id, SEL, R, R, unsigned long, double))objc_msgSend)(
        img,
        sel_registerName("drawInRect:fromRect:operation:fraction:"), dr,
        fr, 2UL, enabled ? 1.0 : 0.5);
  }
  id dot = mp_get(self, &k_mp_dot);
  if (dot != nil) mp_oval(dot, 12.0, (b.h - 10.0) / 2.0, 10.0, 10.0, 1);

  id label = mp_get(self, &k_mp_label);
  if (label != nil)
    mp_draw(label, 30.0, (b.h - 17.0) / 2.0 - 1.0,
            mp_attr(mp_font(13.0), label_col));

  /* right edge: chevron for sub rows, else kbd keycaps */
  if (!strcmp(kind, "s")) {
    id c = mp_dim_color();
    ((void (*)(id, SEL))objc_msgSend)(c, sel_registerName("set"));
    typedef struct { double x, y; } PT;
    id bp = mp_new("NSBezierPath");
    ((void (*)(id, SEL, PT))objc_msgSend)(
        bp, sel_registerName("moveToPoint:"),
        (PT){b.w - 14.0, b.h / 2.0 - 5.0});
    ((void (*)(id, SEL, PT))objc_msgSend)(
        bp, sel_registerName("lineToPoint:"),
        (PT){b.w - 8.0, b.h / 2.0});
    ((void (*)(id, SEL, PT))objc_msgSend)(
        bp, sel_registerName("lineToPoint:"),
        (PT){b.w - 14.0, b.h / 2.0 + 5.0});
    ((void (*)(id, SEL))objc_msgSend)(bp, sel_registerName("closePath"));
    ((void (*)(id, SEL))objc_msgSend)(bp, sel_registerName("fill"));
  } else {
    id caps = mp_get(self, &k_mp_caps);
    if (caps != nil) {
      unsigned long n = ((unsigned long (*)(id, SEL))objc_msgSend)(
          caps, sel_registerName("count"));
      id kf = mp_font(11.0);
      id kc = mp_dim_color();
      id attrs = mp_attr(kf, kc);
      /* measure right-to-left */
      double widths[16];
      double total = 0;
      for (unsigned long i = 0; i < n && i < 16; i++) {
        id cap = ((id(*)(id, SEL, unsigned long))objc_msgSend)(
            caps, sel_registerName("objectAtIndex:"), i);
        widths[i] = mp_text_w(cap, attrs) + 8.0;
        total += widths[i] + 3.0;
      }
      double x = b.w - 10.0 - (total > 0 ? total - 3.0 : 0);
      for (unsigned long i = 0; i < n && i < 16; i++) {
        id cap = ((id(*)(id, SEL, unsigned long))objc_msgSend)(
            caps, sel_registerName("objectAtIndex:"), i);
        double ch = 18.0, cy = (b.h - ch) / 2.0;
        mp_fill_round(mp_white(vib_dark ? 1.0 : 0.0,
                               vib_dark ? 0.10 : 0.04),
                      x, cy, widths[i], ch, 3.0);
        mp_draw(cap, x + 4.0, cy + 2.5, attrs);
        x += widths[i] + 3.0;
      }
    }
  }
}

static void mp_ensure_rowclass(void) {
  static int done = 0;
  if (done) return;
  done = 1;
  Class t = objc_allocateClassPair(objc_getClass("NSView"),
                                   "LogseqMenuRowView", 0);
  class_addMethod(t, sel_registerName("drawRect:"), (IMP)row_drawRect,
                  "v@:{_NSRect={_NSPoint=dd}{_NSSize=dd}}");
  class_addMethod(t, sel_registerName("mouseUp:"), (IMP)row_mouseUp,
                  "v@:@");
  class_addMethod(t, sel_registerName("mouseMoved:"),
                  (IMP)row_mouseMoved, "v@:@");
  class_addMethod(t, sel_registerName("mouseEntered:"),
                  (IMP)row_mouseEntered, "v@:@");
  class_addMethod(t, sel_registerName("mouseExited:"),
                  (IMP)row_mouseExited, "v@:@");
  class_addMethod(t, sel_registerName("viewDidMoveToWindow"),
                  (IMP)row_didMove, "v@:");
  objc_registerClassPair(t);
}

static id mp_row_view(jsv *it, double w, double h, int scroll_mode) {
  mp_ensure_rowclass();
  ls_nsrect fr = {0, 0, w, h};
  id v = ((id(*)(id, SEL, ls_nsrect))objc_msgSend)(
      mp_alloc("LogseqMenuRowView"), sel_registerName("initWithFrame:"),
      fr);
  const char *t = js_str(it, "t");
  const char *kind = "i";
  if (t != NULL) {
    if (!strcmp(t, "header")) kind = "h";
    else if (!strcmp(t, "row")) kind = "r";
    else if (!strcmp(t, "sub")) kind = "s";
    else if (!strcmp(t, "sep")) kind = "l";
    else kind = "i";
  }
  mp_set(v, &k_mp_kind, mp_str(kind));
  const char *label = js_str(it, "label");
  if (label != NULL) mp_set(v, &k_mp_label, mp_str(label));
  jsv *caps = js_get(it, "kbd");
  if (caps != NULL && caps->t == 'a' && caps->nk > 0) {
    id arr = mp_new("NSMutableArray");
    for (int i = 0; i < caps->nk; i++)
      if (caps->k[i]->t == 's')
        ((void (*)(id, SEL, id))objc_msgSend)(
            arr, sel_registerName("addObject:"), mp_str(caps->k[i]->s));
    mp_set(v, &k_mp_caps, arr);
  }
  id img = mp_icon(it);
  if (img != nil) mp_set(v, &k_mp_icon, img);
  const char *dot = js_str(it, "dot");
  if (dot != NULL) {
    id c = mp_hex_color(dot);
    if (c != nil) mp_set(v, &k_mp_dot, c);
  }
  if (js_bool(it, "chev", 0)) mp_set(v, &k_mp_kind, mp_str("s"));
  if (!strcmp(kind, "s")) {
    jsv *items = js_get(it, "items");
    if (items != NULL) {
      id pv = ((id(*)(id, SEL, void *))objc_msgSend)(
          (id)objc_getClass("NSValue"),
          sel_registerName("valueWithPointer:"), items);
      mp_set(v, &k_mp_subspec, pv);
    }
    /* a submenu parent is still selectable-visual; a leaf tag only
       when it isn't a real submenu (scroll mode re-pops instead) */
    mp_set(v, &k_mp_tag, mp_num((long)js_num(it, "tag", -1)));
  }
  if (!strcmp(kind, "i"))
    mp_set(v, &k_mp_tag, mp_num((long)js_num(it, "tag", -1)));
  {
    id en = mp_num(js_bool(it, "enabled", 1));
    objc_setAssociatedObject(v, (const void *)"mp_enabled", en, 1);
  }
  jsv *cells = js_get(it, "cells");
  if (cells != NULL && cells->t == 'a') {
    id arr = mp_new("NSMutableArray");
    for (int i = 0; i < cells->nk; i++) {
      jsv *c = cells->k[i];
      id dict = mp_new("NSMutableDictionary");
      const char *ck = js_str(c, "k");
      if (ck == NULL) ck = "swatch";
      ((void (*)(id, SEL, id, id))objc_msgSend)(
          dict, sel_registerName("setObject:forKey:"), mp_str(ck),
          mp_str("k"));
      ((void (*)(id, SEL, id, id))objc_msgSend)(
          dict, sel_registerName("setObject:forKey:"),
          mp_num((long)js_num(c, "tag", -1)), mp_str("tag"));
      const char *col = js_str(c, "color");
      if (col != NULL) {
        id cc = mp_hex_color(col);
        if (cc != nil)
          ((void (*)(id, SEL, id, id))objc_msgSend)(
              dict, sel_registerName("setObject:forKey:"), cc,
              mp_str("color"));
      }
      id ci = mp_icon(c);
      if (ci != nil)
        ((void (*)(id, SEL, id, id))objc_msgSend)(
            dict, sel_registerName("setObject:forKey:"), ci,
            mp_str("icon"));
      ((void (*)(id, SEL, id))objc_msgSend)(
          arr, sel_registerName("addObject:"), dict);
      ((void (*)(id, SEL))objc_msgSend)(dict,
                                       sel_registerName("release"));
    }
    mp_set(v, &k_mp_cells, arr);
  }
  (void)scroll_mode;
  return v;
}

/* ---- measure + build ---- */

static double mp_item_h(jsv *it) {
  const char *t = js_str(it, "t");
  if (t != NULL) {
    if (!strcmp(t, "header")) return 20.0;
    if (!strcmp(t, "sep")) return 10.0;
    if (!strcmp(t, "row")) return js_num(it, "h", 38.0);
  }
  return 32.0;
}

static double mp_item_w(jsv *it, id attrs, id kattrs) {
  const char *t = js_str(it, "t");
  if (t == NULL) return 200.0;
  if (!strcmp(t, "sep")) return 200.0;
  if (!strcmp(t, "header")) {
    const char *l = js_str(it, "label");
    return 12.0 + (l ? mp_text_w(mp_str(l), kattrs) : 0) + 12.0;
  }
  if (!strcmp(t, "row")) {
    jsv *cells = js_get(it, "cells");
    int n = cells != NULL && cells->t == 'a' ? cells->nk : 1;
    return 28.0 + n * 30.0 + (n - 1) * 8.0;
  }
  const char *l = js_str(it, "label");
  double w = 30.0 + (l ? mp_text_w(mp_str(l), attrs) : 0) + 18.0;
  jsv *caps = js_get(it, "kbd");
  if (caps != NULL && caps->t == 'a' && caps->nk > 0) {
    w += 10.0;
    for (int i = 0; i < caps->nk; i++)
      if (caps->k[i]->t == 's')
        w += mp_text_w(mp_str(caps->k[i]->s), kattrs) + 11.0;
  }
  if (!strcmp(t, "sub")) w += 14.0;
  return w;
}

static void mp_fill_item(id menu, jsv *it, double w, int scroll_ok);

/* submenu parents: real NSMenu submenus in the standard layout, a
   chevron row that re-pops a fresh menu in scroll mode */
static void mp_add_item(id menu, jsv *it, double w, int scroll_mode) {
  const char *t = js_str(it, "t");
  if (t != NULL && !strcmp(t, "sep") && !scroll_mode) {
    menu_add_sep(menu);
    return;
  }
  double h = mp_item_h(it);
  id v = mp_row_view(it, w, h, scroll_mode);
  /* a native submenu needs the label on the item itself for
     accessibility; views still paint the row */
  id item = ((id(*)(id, SEL, id, SEL, id))objc_msgSend)(
      mp_alloc("NSMenuItem"),
      sel_registerName("initWithTitle:action:keyEquivalent:"),
      mp_str(js_str(it, "label")), (SEL)NULL, mp_str(""));
  long tag = (long)js_num(it, "tag", -1);
  ((void (*)(id, SEL, long))objc_msgSend)(
      item, sel_registerName("setTag:"), tag);
  if (!js_bool(it, "enabled", 1))
    ((void (*)(id, SEL, int))objc_msgSend)(
        item, sel_registerName("setEnabled:"), 0);
  ((void (*)(id, SEL, id))objc_msgSend)(
      item, sel_registerName("setView:"), v);
  if (t != NULL && !strcmp(t, "sub") && !scroll_mode) {
    id sub = new_menu(js_str(it, "label"));
    jsv *items = js_get(it, "items");
    if (items != NULL && items->t == 'a')
      for (int i = 0; i < items->nk; i++)
        mp_fill_item(sub, items->k[i], w, 0);
    ((void (*)(id, SEL, id))objc_msgSend)(
        item, sel_registerName("setSubmenu:"), sub);
    ((void (*)(id, SEL))objc_msgSend)(sub, sel_registerName("release"));
  }
  ((void (*)(id, SEL, id))objc_msgSend)(
      menu, sel_registerName("addItem:"), item);
  ((void (*)(id, SEL))objc_msgSend)(item, sel_registerName("release"));
  ((void (*)(id, SEL))objc_msgSend)(v, sel_registerName("release"));
}

static void mp_fill_item(id menu, jsv *it, double w, int scroll_ok) {
  mp_add_item(menu, it, w, 0);
  (void)scroll_ok;
}

/* scroll layout: every spec row becomes a LogseqMenuRowView inside one
   NSScrollView item — the tracker forwards events to them like any
   custom view */
static id mp_scroll_item(jsv *items, double w, double maxh) {
  mp_ensure_rowclass();
  double total = 0;
  for (int i = 0; i < items->nk; i++) total += mp_item_h(items->k[i]);
  if (total < 1) total = 1;
  ls_nsrect fr = {0, 0, w, total};
  id doc = ((id(*)(id, SEL, ls_nsrect))objc_msgSend)(
      mp_alloc("NSView"), sel_registerName("initWithFrame:"), fr);
  double y = total;
  for (int i = 0; i < items->nk; i++) {
    jsv *it = items->k[i];
    double h = mp_item_h(it);
    y -= h;
    const char *t = js_str(it, "t");
    id v;
    if (t != NULL && !strcmp(t, "sep")) {
      ls_nsrect lf = {12, y + h / 2.0 - 0.5, w - 24, 1.0};
      v = mp_row_view(it, w, h, 1);
      (void)lf;
    } else {
      v = mp_row_view(it, w, h, 1);
    }
    ls_nsrect rf = {0, y, w, h};
    ((void (*)(id, SEL, ls_nsrect))objc_msgSend)(
        v, sel_registerName("setFrame:"), rf);
    ((void (*)(id, SEL, id))objc_msgSend)(
        doc, sel_registerName("addSubview:"), v);
    ((void (*)(id, SEL))objc_msgSend)(v, sel_registerName("release"));
  }
  ls_nsrect sf = {0, 0, w, maxh};
  id scroll = ((id(*)(id, SEL, ls_nsrect))objc_msgSend)(
      mp_alloc("NSScrollView"), sel_registerName("initWithFrame:"), sf);
  ((void (*)(id, SEL, id))objc_msgSend)(
      scroll, sel_registerName("setDocumentView:"), doc);
  /* non-flipped documentView starts scrolled to its bottom */
  {
    mp_pt top = {0, total};
    ((void (*)(id, SEL, mp_pt))objc_msgSend)(
        doc, sel_registerName("scrollPoint:"), top);
  }
  ((void (*)(id, SEL, int))objc_msgSend)(
      scroll, sel_registerName("setHasVerticalScroller:"), 1);
  ((void (*)(id, SEL, int))objc_msgSend)(
      scroll, sel_registerName("setDrawsBackground:"), 0);
  ((void (*)(id, SEL))objc_msgSend)(doc, sel_registerName("release"));
  id item = ((id(*)(id, SEL, id, SEL, id))objc_msgSend)(
      mp_alloc("NSMenuItem"),
      sel_registerName("initWithTitle:action:keyEquivalent:"),
      mp_str(""), (SEL)NULL, mp_str(""));
  ((void (*)(id, SEL, id))objc_msgSend)(
      item, sel_registerName("setView:"), scroll);
  ((void (*)(id, SEL))objc_msgSend)(scroll, sel_registerName("release"));
  return item;
}

static void mp_pin_appearance(id view) {
  if (!mp_responds(view, "setAppearance:")) return;
  Class appcls = objc_getClass("NSAppearance");
  if (appcls == Nil) return;
  id ap = ((id(*)(Class, SEL, id))objc_msgSend)(
      appcls, sel_registerName("appearanceNamed:"),
      mp_str(vib_dark ? "NSAppearanceNameDarkAqua"
                      : "NSAppearanceNameAqua"));
  if (ap != nil)
    ((void (*)(id, SEL, id))objc_msgSend)(
        view, sel_registerName("setAppearance:"), ap);
}

static void mp_pin_appearance_deep(id view) {
  if (view == nil) return;
  mp_pin_appearance(view);
  if (!mp_responds(view, "subviews")) return;
  id subs = ((id(*)(id, SEL))objc_msgSend)(
      view, sel_registerName("subviews"));
  if (subs == nil) return;
  unsigned long n = ((unsigned long (*)(id, SEL))objc_msgSend)(
      subs, sel_registerName("count"));
  for (unsigned long i = 0; i < n; i++)
    mp_pin_appearance_deep(((id(*)(id, SEL, unsigned long))objc_msgSend)(
        subs, sel_registerName("objectAtIndex:"), i));
}

/* NSMenu isn't an NSView — pin the appearance on every item's view so
   semantic colors (labelColor etc.) follow the app theme */
static void mp_pin_menu_appearance(id menu) {
  mp_pin_appearance(menu); /* NSMenu has setAppearance: on recent SDKs;
                              the respondsToSelector check keeps it
                              safe everywhere */
  if (!mp_responds(menu, "itemArray")) return;
  id items = ((id(*)(id, SEL))objc_msgSend)(
      menu, sel_registerName("itemArray"));
  if (items == nil) return;
  unsigned long n = ((unsigned long (*)(id, SEL))objc_msgSend)(
      items, sel_registerName("count"));
  for (unsigned long i = 0; i < n; i++) {
    id item = ((id(*)(id, SEL, unsigned long))objc_msgSend)(
        items, sel_registerName("objectAtIndex:"), i);
    id v = ((id(*)(id, SEL))objc_msgSend)(
        item, sel_registerName("view"));
    if (v != nil) mp_pin_appearance_deep(v);
    id sub = ((id(*)(id, SEL))objc_msgSend)(
        item, sel_registerName("submenu"));
    if (sub != nil) mp_pin_menu_appearance(sub);
  }
}

/* build an NSMenu for a spec items array; scroll_mode forces the
   single-scroll-item layout */
static id mp_build(jsv *items, double w, int scroll_mode, double maxh) {
  id menu = new_menu("");
  ((void (*)(id, SEL, double))objc_msgSend)(
      menu, sel_registerName("setMinimumWidth:"), w);
  if (scroll_mode) {
    id item = mp_scroll_item(items, w, maxh);
    ((void (*)(id, SEL, id))objc_msgSend)(
        menu, sel_registerName("addItem:"), item);
    ((void (*)(id, SEL))objc_msgSend)(item,
                                     sel_registerName("release"));
    return menu;
  }
  for (int i = 0; i < items->nk; i++)
    mp_fill_item(menu, items->k[i], w, 1);
  /* NSMenu appearance drives the window chrome (padding around the
     items); label/secondary colors inside views follow the per-view
     appearance pin applied by mp_pin_appearance_deep below */
  return menu;
}

static double mp_measure_w(jsv *items, id attrs, id kattrs) {
  double w = 200.0;
  for (int i = 0; i < items->nk; i++) {
    double iw = mp_item_w(items->k[i], attrs, kattrs);
    if (iw > w) w = iw;
  }
  if (w > 340.0) w = 340.0;
  return w;
}

static id mp_key_win(void) {
  id app = ((id(*)(id, SEL))objc_msgSend)(
      (id)objc_getClass("NSApplication"),
      sel_registerName("sharedApplication"));
  id win = ((id(*)(id, SEL))objc_msgSend)(app,
                                         sel_registerName("keyWindow"));
  if (win == nil)
    win = ((id(*)(id, SEL))objc_msgSend)(
        app, sel_registerName("mainWindow"));
  return win;
}

/* convert an app top-left-origin point into a window point */
static mp_pt mp_win_pt(id cv, double app_x, double app_top_y) {
  typedef struct {
    double x, y, w, h;
  } R;
  R vb = ((R(*)(id, SEL))objc_msgSend)(cv, sel_registerName("bounds"));
  int flipped = ((int (*)(id, SEL))objc_msgSend)(
      cv, sel_registerName("isFlipped"));
  double vy = flipped ? app_top_y : vb.h - app_top_y;
  mp_pt pv = {app_x, vy};
  return ((mp_pt(*)(id, SEL, mp_pt, id))objc_msgSend)(
      cv, sel_registerName("convertPoint:toView:"), pv, nil);
}

/* run the menu synchronously at a window point; synthesizes a
   right-mouse event for popUpContextMenu:withEvent:forView: */
static void mp_show_popup(id menu, mp_pt wpt, id win, id cv) {
  long wnum = win ? (long)((long(*)(id, SEL))objc_msgSend)(
                        win, sel_registerName("windowNumber"))
                  : 0;
  id ev = ((id(*)(id, SEL, unsigned long, mp_pt, unsigned long, double,
                  long, id, long, long, float))objc_msgSend)(
      (id)objc_getClass("NSEvent"),
      sel_registerName("mouseEventWithType:location:modifierFlags:"
                       "timestamp:windowNumber:context:eventNumber:"
                       "clickCount:pressure:"),
      3ul /* NSRightMouseDown */, wpt, 0ul, 0.0, wnum, nil, 0l, 1l,
      1.0f);
  ((int (*)(id, SEL, id, id, id))objc_msgSend)(
      (id)objc_getClass("NSMenu"),
      sel_registerName("popUpContextMenu:withEvent:forView:"), menu,
      ev, cv);
}

static int mp_popup(jsv *root) {
  jsv *items = js_get(root, "items");
  if (items == NULL || items->t != 'a' || items->nk == 0) return -1;
  double cx = js_num(root, "cx", 0);
  double cy = js_num(root, "cy", 0);
  double atop = js_num(root, "atop", cy);
  int flip = js_bool(root, "flip", 0);
  double maxh = js_num(root, "max_h", 400.0);

  id attrs = mp_attr(mp_font(13.0), mp_label_color());
  id kattrs = mp_attr(mp_font(11.0), mp_dim_color());
  double w = mp_measure_w(items, attrs, kattrs);

  double total = 0;
  for (int i = 0; i < items->nk; i++) total += mp_item_h(items->k[i]);
  int scroll_mode = total > maxh;

  mp_sel = -1;
  mp_repop = NULL;
  for (;;) {
    id menu = mp_build(items, w, scroll_mode, maxh);
    if (menu == nil) return -1;
    mp_pin_menu_appearance(menu);
    ((void (*)(id, SEL))objc_msgSend)(menu,
                                     sel_registerName("sizeToFit"));
    typedef struct {
      double w, h;
    } SZ;
    SZ ms = ((SZ(*)(id, SEL))objc_msgSend)(menu,
                                          sel_registerName("size"));
    double menu_h = scroll_mode ? maxh + 10.0 : ms.h;
    double top_y = flip ? atop - menu_h : cy;
    id win = mp_key_win();
    id cv = win ? ((id(*)(id, SEL))objc_msgSend)(
                      win, sel_registerName("contentView"))
                : nil;
    mp_repop = NULL;
    mp_current_menu = menu;
    if (cv != nil) {
      mp_pt pw = mp_win_pt(cv, cx - w / 2.0, top_y);
      mp_show_popup(menu, pw, win, cv);
    }
    mp_current_menu = NULL;
    ((void (*)(id, SEL))objc_msgSend)(menu,
                                     sel_registerName("release"));
    if (mp_sel >= 0 || mp_repop == NULL) break;
    /* a scroll-mode "sub" row asked for a fresh popup where it sat */
    items = mp_repop;
    id menu2 = mp_build(items, mp_measure_w(items, attrs, kattrs), 0,
                        maxh);
    mp_pin_menu_appearance(menu2);
    ((void (*)(id, SEL))objc_msgSend)(menu2,
                                     sel_registerName("sizeToFit"));
    mp_pt rsp = {mp_repop_x, mp_repop_y};
    mp_pt rwp = ((mp_pt(*)(id, SEL, mp_pt))objc_msgSend)(
        win, sel_registerName("convertPointFromScreen:"), rsp);
    mp_current_menu = menu2;
    mp_show_popup(menu2, rwp, win, cv);
    mp_current_menu = NULL;
    ((void (*)(id, SEL))objc_msgSend)(menu2,
                                     sel_registerName("release"));
    break;
  }
  return (int)mp_sel;
}

/* OCaml entry: json spec string -> selected tag (or -1) */
CAMLprim value logseq_native_menu_popup(value spec_v) {
  CAMLparam1(spec_v);
  const char *src = String_val(spec_v);
  const char *p = src;
  jsv *root = js_parse(&p);
  int sel = -1;
  if (root != NULL) {
    caml_enter_blocking_section();
    void *pool = objc_autoreleasePoolPush();
    sel = mp_popup(root);
    objc_autoreleasePoolPop(pool);
    caml_leave_blocking_section();
  }
  if (root != NULL) js_free(root);
  CAMLreturn(Val_int(sel));
}

#elif defined(__linux__)

CAMLprim value logseq_native_memory_usage(value unit_v) {
  (void)unit_v;
  caml_failwith("Physical footprint inspection requires macOS");
}

CAMLprim value logseq_native_window_presentable(value id_v) {
  SDL_Window *window = SDL_GetWindowFromID(Int_val(id_v));
  if (!window) caml_invalid_argument("Presentation requires a live window");
  Uint32 flags = SDL_GetWindowFlags(window);
  return Val_bool(!(flags & (SDL_WINDOW_HIDDEN | SDL_WINDOW_MINIMIZED)));
}

CAMLprim value logseq_native_sidebar_hit(value id_v) {
  (void)id_v;
  caml_failwith("logseq_native: AppKit material inspection requires macOS");
}

CAMLprim value logseq_native_input_chain(value id_v) {
  (void)id_v;
  caml_failwith("logseq_native: AppKit responder inspection requires macOS");
}


CAMLprim value logseq_native_software_begin(value id, value dimensions) {
  (void)id; (void)dimensions; caml_failwith("CoreGraphics presentation requires macOS");
}
CAMLprim value logseq_native_software_tile(value id, value tile) {
  (void)id; (void)tile; caml_failwith("CoreGraphics presentation requires macOS");
}
CAMLprim value logseq_native_software_present(value id) {
  (void)id; caml_failwith("CoreGraphics presentation requires macOS");
}
CAMLprim value logseq_native_software_owned_bytes(value id) {
  (void)id; caml_failwith("CoreGraphics presentation requires macOS");
}
CAMLprim value logseq_native_software_read(value id) {
  (void)id; caml_failwith("CoreGraphics presentation requires macOS");
}
CAMLprim value logseq_native_software_composite(value id) {
  (void)id; caml_failwith("Software composition readback requires macOS");
}
CAMLprim value logseq_native_software_hit(value id) {
  (void)id; caml_failwith("CoreGraphics presentation requires macOS");
}
CAMLprim value logseq_native_software_dispose(value id) {
  (void)id; return Val_unit;
}

#include <fontconfig/fontconfig.h>

/* SDL and the window manager own activation and decorations on Linux.
   AppKit-only chrome has no corresponding work on this host. */
CAMLprim value logseq_native_activate(value unit) {
  (void)unit;
  return Val_unit;
}

CAMLprim value logseq_native_titlebar_blend(value unit) {
  (void)unit;
  return Val_unit;
}

CAMLprim value logseq_native_register_fonts(value directory) {
  CAMLparam1(directory);
  FcConfig *config = FcConfigGetCurrent();
  if (config == NULL ||
      !FcConfigAppFontAddDir(config, (const FcChar8 *)String_val(directory))) {
    caml_failwith("logseq_native: unable to register bundled fonts");
  }
  CAMLreturn(Val_unit);
}

CAMLprim value logseq_native_sidebar_theme(value dark) {
  (void)dark;
  return Val_unit;
}

CAMLprim value logseq_native_sidebar_vibrancy(value x, value y, value w,
                                            value h, value visible) {
  (void)x;
  (void)y;
  (void)w;
  (void)h;
  (void)visible;
  return Val_unit;
}

CAMLprim value logseq_native_window_opaque(value window) {
  (void)window;
  caml_failwith("logseq_native: AppKit window inspection requires macOS");
}

CAMLprim value logseq_native_has_sidebar_material(value window) {
  (void)window;
  caml_failwith("logseq_native: AppKit material inspection requires macOS");
}

/* Linux renders menus through LUI. These entry points must never be
   reached when the host advertises its Linux capabilities. */
CAMLprim value logseq_native_install_menus(value unit) {
  (void)unit;
  caml_failwith("logseq_native: AppKit menus require macOS");
}

CAMLprim value logseq_native_app_op(value tag) {
  (void)tag;
  caml_failwith("logseq_native: AppKit application actions require macOS");
}

CAMLprim value logseq_native_menu_popup(value spec) {
  (void)spec;
  caml_failwith("logseq_native: AppKit menu popups require macOS");
}

#endif
