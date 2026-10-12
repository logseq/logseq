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
  return *p == c ? -1 : (int)(p - b64_alphabet);
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
    ((void (*)(id, SEL, unsigned long))objc_msgSend)(
        w, sel_registerName("setStyleMask:"),
        mask | (1L << 15) /* NSWindowStyleMaskFullSizeContentView */);
    ((void (*)(id, SEL, int))objc_msgSend)(
        w, sel_registerName("setTitlebarAppearsTransparent:"), 1);
    ((void (*)(id, SEL, long))objc_msgSend)(
        w, sel_registerName("setTitleVisibility:"),
        1L /* NSWindowTitleHidden */);
    ((void (*)(id, SEL, int))objc_msgSend)(
        w, sel_registerName("setMovableByWindowBackground:"), 1);
  }
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

/* Clear opaqueness on a CALayer and any CAMetalLayer sublayers: the
   sidebar hole needs the drawable's alpha channel to reach the window
   server. SDL hosts the CAMetalLayer as the content view's own layer;
   walk one level of sublayers too in case a driver nests it. */
static void make_layers_transparent(id layer) {
  if (layer == nil) return;
  const char *name = object_getClassName(layer);
  if (name != NULL) {
    ((void (*)(id, SEL, int))objc_msgSend)(
        layer, sel_registerName("setOpaque:"), 0);
    /* setOpaque:NO still leaves an opaque backgroundColor fill that
       shows through the hole — NULL it too. */
    ((void (*)(id, SEL, void *))objc_msgSend)(
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
          l, sel_registerName("setOpaque:"), 0);
      ((void (*)(id, SEL, void *))objc_msgSend)(
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
   visible=false hides the effect while the sidebar is collapsed. */
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
    if (effect == nil) {
      Class effcls = objc_getClass("NSVisualEffectView");
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
      ((void (*)(id, SEL, int))objc_msgSend)(
          win, sel_registerName("setOpaque:"), 0);
      /* A non-opaque window still fills behind the effect with its
         backgroundColor; clear it or the material samples an opaque
         dark base instead of the desktop. */
      Class nscolor = objc_getClass("NSColor");
      if (nscolor != Nil) {
        id clear = ((id (*)(Class, SEL))objc_msgSend)(
            nscolor, sel_registerName("clearColor"));
        if (clear != nil)
          ((void (*)(id, SEL, id))objc_msgSend)(
              win, sel_registerName("setBackgroundColor:"), clear);
      }
    }
      /* The material follows the app theme, not the window's
         effective appearance (an SDL window doesn't track the app's
         own light/dark switch). BehindWindow materials resolve
         their tint from the view's effective appearance, so pin
         the appearance on the effect AND its window — the window
         default is Aqua and can override the view pin. */
      Class appcls = objc_getClass("NSAppearance");
      if (appcls != Nil) {
        id ap = ((id (*)(Class, SEL, id))objc_msgSend)(
            appcls, sel_registerName("appearanceNamed:"),
            menu_nsstr(vib_dark ? "NSAppearanceNameDarkAqua"
                                : "NSAppearanceNameAqua"));
        if (ap != nil) {
          ((void (*)(id, SEL, id))objc_msgSend)(
              effect, sel_registerName("setAppearance:"), ap);
          ((void (*)(id, SEL, id))objc_msgSend)(
              win, sel_registerName("setAppearance:"), ap);
        }
      }
    /* SDL or a driver update may re-opaque the metal layer; keep it
       transparent while the effect lives. */
    id layer =
        ((id (*)(id, SEL))objc_msgSend)(cv, sel_registerName("layer"));
    make_layers_transparent(layer);
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
#endif
