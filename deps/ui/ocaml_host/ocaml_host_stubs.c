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
#endif
