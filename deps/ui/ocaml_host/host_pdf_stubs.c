#include <caml/mlvalues.h>
#include <caml/alloc.h>
#include <caml/memory.h>
#include <caml/intext.h>
#include <caml/fail.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#if defined(__APPLE__)
#include <objc/objc.h>
#include <objc/message.h>
#include <objc/runtime.h>
#include <CoreGraphics/CoreGraphics.h>
#include <CoreFoundation/CoreFoundation.h>
#include <ImageIO/ImageIO.h>

typedef struct { double x; double y; } host_point_t;
typedef struct { double width; double height; } host_size_t;
typedef struct { host_point_t origin; host_size_t size; } host_rect_t;

static id pdf_class(const char *name) { return (id)objc_getClass(name); }
static SEL pdf_sel(const char *name) { return sel_registerName(name); }
static id pdf_id0(id obj, const char *name) {
  return ((id (*)(id, SEL))objc_msgSend)(obj, pdf_sel(name));
}
static id pdf_id1(id obj, const char *name, id arg) {
  return ((id (*)(id, SEL, id))objc_msgSend)(obj, pdf_sel(name), arg);
}
static unsigned long pdf_ulong0(id obj, const char *name) {
  return ((unsigned long (*)(id, SEL))objc_msgSend)(obj, pdf_sel(name));
}
static host_rect_t pdf_rect1long(id obj, const char *name, long arg) {
  return ((host_rect_t (*)(id, SEL, long))objc_msgSend)(obj, pdf_sel(name), arg);
}
static host_rect_t pdf_rect1id(id obj, const char *name, id arg) {
  return ((host_rect_t (*)(id, SEL, id))objc_msgSend)(obj, pdf_sel(name), arg);
}
static id pdf_string(const char *utf8) {
  return ((id (*)(id, SEL, const char *))objc_msgSend)(
      pdf_class("NSString"), pdf_sel("stringWithUTF8String:"), utf8);
}
static const char *pdf_utf8(id s) {
  if (!s) return "";
  return ((const char *(*)(id, SEL))objc_msgSend)(s, pdf_sel("UTF8String"));
}
static id pdf_document(const char *path) {
  id url = ((id (*)(id, SEL, id))objc_msgSend)(
      pdf_class("NSURL"), pdf_sel("fileURLWithPath:"), pdf_string(path));
  if (!url) return nil;
  id doc = ((id (*)(id, SEL))objc_msgSend)(pdf_class("PDFDocument"), pdf_sel("alloc"));
  return ((id (*)(id, SEL, id))objc_msgSend)(doc, pdf_sel("initWithURL:"), url);
}
static id pdf_page(id doc, long page_index) {
  return ((id (*)(id, SEL, unsigned long))objc_msgSend)(
      doc, pdf_sel("pageAtIndex:"), (unsigned long)page_index);
}
static void pdf_autorelease_pool_open(id *pool) {
  *pool = ((id (*)(id, SEL))objc_msgSend)(pdf_class("NSAutoreleasePool"), pdf_sel("new"));
}
static void pdf_autorelease_pool_close(id pool) {
  if (pool) pdf_id0(pool, "drain");
}
#endif

#if !defined(__APPLE__)
#if defined(_WIN32)
#include <windows.h>
#else
#include <dlfcn.h>
#endif

typedef struct {
  void *handle;
  void (*init)(void);
  void *(*load_document)(const char *, const char *);
  void (*close_document)(void *);
  int (*page_count)(void *);
  int (*page_size)(void *, int, double *, double *);
  void *(*load_page)(void *, int);
  void (*close_page)(void *);
  void *(*bitmap_create)(int, int, int, void *, int);
  void (*bitmap_fill)(void *, int, int, int, int, unsigned long);
  void (*render)(void *, void *, int, int, int, int, int, int);
  void *(*bitmap_buffer)(void *);
  void (*bitmap_destroy)(void *);
  void *(*text_load)(void *);
  void (*text_close)(void *);
  int (*text_count)(void *);
  unsigned int (*text_unicode)(void *, int);
  int (*text_char_box)(void *, int, double *, double *, double *, double *);
} pdfium_api;

static pdfium_api pdfium;
static int pdfium_state = 0;

static void *pdfium_sym(void *handle, const char *name) {
#if defined(_WIN32)
  return (void *)GetProcAddress((HMODULE)handle, name);
#else
  return dlsym(handle, name);
#endif
}

static int pdfium_load(void) {
  if (pdfium_state) return pdfium_state > 0;
  const char *custom = getenv("PDFIUM_LIBRARY");
#if defined(_WIN32)
  const char *fallback = "pdfium.dll";
#else
  const char *fallback = "libpdfium.so";
#endif
  void *h = NULL;
  if (custom && *custom) {
#if defined(_WIN32)
    h = (void *)LoadLibraryA(custom);
#else
    h = dlopen(custom, RTLD_NOW | RTLD_LOCAL);
#endif
  }
  if (!h) {
#if defined(_WIN32)
    h = (void *)LoadLibraryA(fallback);
#else
    h = dlopen(fallback, RTLD_NOW | RTLD_LOCAL);
#endif
  }
  if (!h) { pdfium_state = -1; return 0; }
#define PDFIUM_SYM(field, symbol) \
  do { \
    *(void **)(&pdfium.field) = pdfium_sym(h, symbol); \
    if (!pdfium.field) { pdfium_state = -1; return 0; } \
  } while (0)
  memset(&pdfium, 0, sizeof(pdfium));
  pdfium.handle = h;
  PDFIUM_SYM(init, "FPDF_InitLibrary");
  PDFIUM_SYM(load_document, "FPDF_LoadDocument");
  PDFIUM_SYM(close_document, "FPDF_CloseDocument");
  PDFIUM_SYM(page_count, "FPDF_GetPageCount");
  PDFIUM_SYM(page_size, "FPDF_GetPageSizeByIndex");
  PDFIUM_SYM(load_page, "FPDF_LoadPage");
  PDFIUM_SYM(close_page, "FPDF_ClosePage");
  PDFIUM_SYM(bitmap_create, "FPDFBitmap_CreateEx");
  PDFIUM_SYM(bitmap_fill, "FPDFBitmap_FillRect");
  PDFIUM_SYM(render, "FPDF_RenderPageBitmap");
  PDFIUM_SYM(bitmap_buffer, "FPDFBitmap_GetBuffer");
  PDFIUM_SYM(bitmap_destroy, "FPDFBitmap_Destroy");
  PDFIUM_SYM(text_load, "FPDFText_LoadPage");
  PDFIUM_SYM(text_close, "FPDFText_ClosePage");
  PDFIUM_SYM(text_count, "FPDFText_CountChars");
  PDFIUM_SYM(text_unicode, "FPDFText_GetUnicode");
  PDFIUM_SYM(text_char_box, "FPDFText_GetCharBox");
#undef PDFIUM_SYM
  pdfium.init();
  pdfium_state = 1;
  return 1;
}

static void pdfium_utf8_append(char **cur, size_t *rem, unsigned int u) {
  unsigned char bytes[4];
  int len;
  if (u < 0x80) { bytes[0] = (unsigned char)u; len = 1; }
  else if (u < 0x800) {
    bytes[0] = 0xc0 | (u >> 6); bytes[1] = 0x80 | (u & 0x3f); len = 2;
  } else if (u < 0x10000) {
    bytes[0] = 0xe0 | (u >> 12); bytes[1] = 0x80 | ((u >> 6) & 0x3f);
    bytes[2] = 0x80 | (u & 0x3f); len = 3;
  } else {
    bytes[0] = 0xf0 | (u >> 18); bytes[1] = 0x80 | ((u >> 12) & 0x3f);
    bytes[2] = 0x80 | ((u >> 6) & 0x3f); bytes[3] = 0x80 | (u & 0x3f); len = 4;
  }
  if ((size_t)len + 1 >= *rem) return;
  memcpy(*cur, bytes, (size_t)len);
  *cur += len; *rem -= (size_t)len;
  **cur = 0;
}
#endif

CAMLprim value logseq_pdf_open(value path_v) {
  CAMLparam1(path_v);
#if defined(__APPLE__)
  id pool; pdf_autorelease_pool_open(&pool);
  id doc = pdf_document(String_val(path_v));
  if (doc) doc = pdf_id0(doc, "retain");
  pdf_autorelease_pool_close(pool);
  CAMLreturn(caml_copy_nativeint((intnat)doc));
#else
  void *doc = NULL;
  if (pdfium_load()) doc = pdfium.load_document(String_val(path_v), NULL);
  CAMLreturn(caml_copy_nativeint((intnat)doc));
#endif
}

CAMLprim value logseq_pdf_close(value doc_v) {
  CAMLparam1(doc_v);
#if defined(__APPLE__)
  id doc = (id)Nativeint_val(doc_v);
  if (doc) {
    id pool; pdf_autorelease_pool_open(&pool);
    pdf_id0(doc, "release");
    pdf_autorelease_pool_close(pool);
  }
#else
  void *doc = (void *)Nativeint_val(doc_v);
  if (doc && pdfium_load()) pdfium.close_document(doc);
#endif
  CAMLreturn(Val_unit);
}

CAMLprim value logseq_pdf_page_count(value doc_v) {
  CAMLparam1(doc_v);
  long count = 0;
#if defined(__APPLE__)
  id doc = (id)Nativeint_val(doc_v);
  if (doc) {
    id pool; pdf_autorelease_pool_open(&pool);
    count = (long)pdf_ulong0(doc, "pageCount");
    pdf_autorelease_pool_close(pool);
  }
#else
  void *doc = (void *)Nativeint_val(doc_v);
  if (doc && pdfium_load()) count = pdfium.page_count(doc);
#endif
  CAMLreturn(Val_long(count));
}

CAMLprim value logseq_pdf_page_size(value doc_v, value page_v) {
  CAMLparam2(doc_v, page_v);
  CAMLlocal1(out);
  double w = 0, h = 0;
#if defined(__APPLE__)
  id doc = (id)Nativeint_val(doc_v);
  if (doc) {
    id pool; pdf_autorelease_pool_open(&pool);
    id page = pdf_page(doc, Long_val(page_v));
    if (page) {
      host_rect_t r = pdf_rect1long(page, "boundsForBox:", 1); /* crop box */
      w = r.size.width; h = r.size.height;
    }
    pdf_autorelease_pool_close(pool);
  }
#else
  void *doc = (void *)Nativeint_val(doc_v);
  if (doc && pdfium_load())
    pdfium.page_size(doc, (int)Long_val(page_v), &w, &h);
#endif
  out = caml_alloc_tuple(2);
  Store_field(out, 0, caml_copy_double(w));
  Store_field(out, 1, caml_copy_double(h));
  CAMLreturn(out);
}

CAMLprim value logseq_pdf_render_ppm(value doc_v, value page_v, value scale_v) {
  CAMLparam3(doc_v, page_v, scale_v);
  CAMLlocal1(bytes_v);
  bytes_v = Val_unit;
#if defined(__APPLE__)
  id doc = (id)Nativeint_val(doc_v);
  long page_index = Long_val(page_v);
  double scale = Double_val(scale_v);
  if (!doc || scale <= 0) caml_invalid_argument("invalid PDF render request");
  id pool; pdf_autorelease_pool_open(&pool);
  id page = pdf_page(doc, page_index);
  if (!page) {
    pdf_autorelease_pool_close(pool);
    caml_invalid_argument("PDF page is unavailable");
  }
  host_rect_t crop = pdf_rect1long(page, "boundsForBox:", 1);
  size_t width = (size_t)(crop.size.width * scale + 0.5);
  size_t height = (size_t)(crop.size.height * scale + 0.5);
  if (width == 0 || height == 0 || width > 20000 || height > 20000) {
    pdf_autorelease_pool_close(pool);
    caml_invalid_argument("PDF raster size is invalid");
  }
  size_t stride = width * 4;
  unsigned char *pixels = (unsigned char *)calloc(height, stride);
  if (!pixels) {
    pdf_autorelease_pool_close(pool);
    caml_raise_out_of_memory();
  }
  CGColorSpaceRef space = CGColorSpaceCreateDeviceRGB();
  CGContextRef ctx = CGBitmapContextCreate(pixels, width, height, 8, stride, space,
      kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
  if (!ctx) {
    CGColorSpaceRelease(space); free(pixels);
    pdf_autorelease_pool_close(pool);
    caml_failwith("PDF raster context could not be created");
  }
  CGContextSetRGBFillColor(ctx, 1, 1, 1, 1);
  CGContextFillRect(ctx, CGRectMake(0, 0, (double)width, (double)height));
  CGContextScaleCTM(ctx, scale, scale);
  ((void (*)(id, SEL, long, CGContextRef))objc_msgSend)(
      page, pdf_sel("drawWithBox:toContext:"), 1, ctx);
  size_t rgb_len = width * height * 3;
  char header[64];
  int header_len = snprintf(header, sizeof(header), "P6\n%zu %zu\n255\n", width, height);
  bytes_v = caml_alloc_string((mlsize_t)(header_len + rgb_len));
  unsigned char *out = (unsigned char *)Bytes_val(bytes_v);
  memcpy(out, header, (size_t)header_len);
  unsigned char *dst = out + header_len;
  for (size_t i = 0; i < width * height; i++) {
    unsigned char *src = pixels + i * 4;
    /* BGRA memory produced by kCGBitmapByteOrder32Big premultiplied-last. */
    dst[0] = src[2]; dst[1] = src[1]; dst[2] = src[0];
    dst += 3;
  }
  CGContextRelease(ctx);
  CGColorSpaceRelease(space);
  free(pixels);
  pdf_autorelease_pool_close(pool);
#else
  void *doc = (void *)Nativeint_val(doc_v);
  long page_index = Long_val(page_v);
  double scale = Double_val(scale_v);
  if (!doc || scale <= 0 || !pdfium_load()) caml_invalid_argument("invalid PDF render request");
  void *page = pdfium.load_page(doc, (int)page_index);
  if (!page) caml_invalid_argument("PDF page is unavailable");
  double pw = 0, ph = 0;
  pdfium.page_size(doc, (int)page_index, &pw, &ph);
  size_t width = (size_t)(pw * scale + 0.5);
  size_t height = (size_t)(ph * scale + 0.5);
  if (width == 0 || height == 0 || width > 20000 || height > 20000) {
    pdfium.close_page(page);
    caml_invalid_argument("PDF raster size is invalid");
  }
  int stride = (int)(width * 4);
  void *bitmap = pdfium.bitmap_create((int)width, (int)height, 4, NULL, stride);
  if (!bitmap) {
    pdfium.close_page(page);
    caml_raise_out_of_memory();
  }
  pdfium.bitmap_fill(bitmap, 0, 0, (int)width, (int)height, 0xffffffffUL);
  pdfium.render(bitmap, page, 0, 0, (int)width, (int)height, 0, 1);
  unsigned char *pixels = (unsigned char *)pdfium.bitmap_buffer(bitmap);
  size_t rgb_len = width * height * 3;
  char header[64];
  int header_len = snprintf(header, sizeof(header), "P6\n%zu %zu\n255\n", width, height);
  bytes_v = caml_alloc_string((mlsize_t)(header_len + rgb_len));
  unsigned char *out = (unsigned char *)Bytes_val(bytes_v);
  memcpy(out, header, (size_t)header_len);
  unsigned char *dst = out + header_len;
  for (size_t i = 0; i < width * height; i++) {
    unsigned char *src = pixels + i * 4;
    dst[0] = src[2]; dst[1] = src[1]; dst[2] = src[0];
    dst += 3;
  }
  pdfium.bitmap_destroy(bitmap);
  pdfium.close_page(page);
#endif
  CAMLreturn(bytes_v);
}

static void json_escape_append(char **cursor, size_t *remaining, const char *text) {
  while (*text && *remaining > 2) {
    unsigned char c = (unsigned char)*text++;
    if (c == '"' || c == '\\') {
      if (*remaining < 3) break;
      (*cursor)[0] = '\\'; (*cursor)[1] = (char)c;
      *cursor += 2; *remaining -= 2;
    } else if (c == '\n') {
      if (*remaining < 3) break;
      (*cursor)[0] = '\\'; (*cursor)[1] = 'n';
      *cursor += 2; *remaining -= 2;
    } else if (c == '\r') {
      if (*remaining < 3) break;
      (*cursor)[0] = '\\'; (*cursor)[1] = 'r';
      *cursor += 2; *remaining -= 2;
    } else if (c < 0x20) {
      (*cursor)[0] = ' '; (*cursor)++; (*remaining)--;
    } else {
      (*cursor)[0] = (char)c; (*cursor)++; (*remaining)--;
    }
  }
  **cursor = 0;
}

CAMLprim value logseq_pdf_selection_json(value doc_v, value page_v,
    value x1_v, value y1_v, value x2_v, value y2_v) {
  CAMLparam5(doc_v, page_v, x1_v, y1_v, x2_v);
  CAMLxparam1(y2_v);
  CAMLlocal1(json_v);
#if !defined(__APPLE__)
  void *doc = (void *)Nativeint_val(doc_v);
  if (!doc || !pdfium_load()) caml_invalid_argument("PDF document is unavailable");
  int page_index = (int)Long_val(page_v);
  void *page = pdfium.load_page(doc, page_index);
  if (!page) caml_invalid_argument("PDF page is unavailable");
  double pw = 0, ph = 0;
  pdfium.page_size(doc, page_index, &pw, &ph);
  double x1 = Double_val(x1_v) * pw;
  double y1 = Double_val(y1_v) * ph;
  double x2 = Double_val(x2_v) * pw;
  double y2 = Double_val(y2_v) * ph;
  double sx1 = x1 < x2 ? x1 : x2, sx2 = x1 > x2 ? x1 : x2;
  double sy1 = y1 < y2 ? y1 : y2, sy2 = y1 > y2 ? y1 : y2;
  void *textpage = pdfium.text_load(page);
  if (!textpage) {
    pdfium.close_page(page);
    caml_failwith("PDF text page is unavailable");
  }
  int count = pdfium.text_count(textpage);
  size_t cap = 4096 + (size_t)(count > 0 ? count * 6 : 0);
  char *text = (char *)calloc(cap, 1);
  char *cur = text;
  size_t rem = cap;
  double bx1 = 0, by1 = 0, bx2 = 0, by2 = 0;
  double last_cy = 0, last_x1 = 0;
  int selected = 0;
  for (int i = 0; i < count; i++) {
    double left = 0, right = 0, bottom = 0, top = 0;
    if (!pdfium.text_char_box(textpage, i, &left, &right, &bottom, &top)) continue;
    double cx = (left + right) * 0.5;
    double cy_top = ph - top;
    double cy_bottom = ph - bottom;
    double cy = (cy_top + cy_bottom) * 0.5;
    if (cx < sx1 || cx > sx2 || cy < sy1 || cy > sy2) continue;
    if (selected && (cy - last_cy > 4.0 || left + 4.0 < last_x1)) {
      if (rem > 2) { *cur++ = '\n'; rem--; }
    }
    unsigned int u = pdfium.text_unicode(textpage, i);
    pdfium_utf8_append(&cur, &rem, u);
    double nx1 = left / pw, nx2 = right / pw;
    double ny1 = cy_top / ph, ny2 = cy_bottom / ph;
    if (!selected) {
      bx1 = nx1; bx2 = nx2; by1 = ny1; by2 = ny2;
    } else {
      if (nx1 < bx1) bx1 = nx1; if (nx2 > bx2) bx2 = nx2;
      if (ny1 < by1) by1 = ny1; if (ny2 > by2) by2 = ny2;
    }
    last_cy = cy; last_x1 = left; selected++;
  }
  size_t json_cap = 1024 + strlen(text) * 2;
  char *json = (char *)calloc(json_cap, 1);
  cur = json; rem = json_cap;
  cur += snprintf(cur, rem, "{\"text\":\""); rem = json_cap - (cur - json);
  json_escape_append(&cur, &rem, text);
  if (selected) {
    cur += snprintf(cur, rem,
        "\",\"bounding\":{\"x1\":%.6f,\"y1\":%.6f,\"x2\":%.6f,\"y2\":%.6f,\"w\":1.0,\"h\":1.0},\"rects\":[{\"x1\":%.6f,\"y1\":%.6f,\"x2\":%.6f,\"y2\":%.6f,\"w\":1.0,\"h\":1.0}]}",
        bx1, by1, bx2, by2, bx1, by1, bx2, by2);
  } else {
    cur += snprintf(cur, rem, "\",\"bounding\":null,\"rects\":[]}");
  }
  json_v = caml_copy_string(json);
  free(json);
  free(text);
  pdfium.text_close(textpage);
  pdfium.close_page(page);
#else
  id doc = (id)Nativeint_val(doc_v);
  if (!doc) caml_invalid_argument("PDF document is unavailable");
  id pool; pdf_autorelease_pool_open(&pool);
  id page = pdf_page(doc, Long_val(page_v));
  host_rect_t crop = pdf_rect1long(page, "boundsForBox:", 1);
  double pw = crop.size.width, ph = crop.size.height;
  double x1 = Double_val(x1_v) * pw;
  double y1 = Double_val(y1_v) * ph;
  double x2 = Double_val(x2_v) * pw;
  double y2 = Double_val(y2_v) * ph;
  /* UI coordinates are top-left; PDF crop coordinates are bottom-left. */
  host_rect_t rect;
  rect.origin.x = crop.origin.x + (x1 < x2 ? x1 : x2);
  rect.origin.y = crop.origin.y + ph - (y1 > y2 ? y1 : y2);
  rect.size.width = x1 > x2 ? x1 - x2 : x2 - x1;
  rect.size.height = y1 > y2 ? y1 - y2 : y2 - y1;
  if (rect.size.width < 1) rect.size.width = 1;
  if (rect.size.height < 1) rect.size.height = 1;
  id selection = ((id (*)(id, SEL, host_rect_t))objc_msgSend)(
      page, pdf_sel("selectionForRect:"), rect);
  const char *text = "";
  id lines = nil;
  if (selection) {
    id string = pdf_id0(selection, "string");
    text = string ? pdf_utf8(string) : "";
    lines = pdf_id0(selection, "selectionsByLine");
  }
  size_t cap = 4096 + strlen(text) * 2;
  unsigned long count = lines ? pdf_ulong0(lines, "count") : 0;
  cap += (size_t)count * 192;
  char *json = (char *)calloc(cap, 1);
  char *cur = json;
  size_t rem = cap;
  cur += snprintf(cur, rem, "{\"text\":\""); rem = cap - (cur - json);
  json_escape_append(&cur, &rem, text);
  cur += snprintf(cur, rem, "\",\"bounding\":");
  rem = cap - (cur - json);
  int wrote_rects = 0;
  double bx1 = 0, by1 = 0, bx2 = 0, by2 = 0;
  char *rects_at = cur;
  cur += snprintf(cur, rem, "null,\"rects\":["); rem = cap - (cur - json);
  for (unsigned long i = 0; i < count; i++) {
    id line = ((id (*)(id, SEL, unsigned long))objc_msgSend)(lines, pdf_sel("objectAtIndex:"), i);
    host_rect_t r = pdf_rect1id(line, "boundsForPage:", page);
    double lx1 = r.origin.x - crop.origin.x;
    double lx2 = lx1 + r.size.width;
    /* Convert each bottom-left PDF rect into top-left normalized coordinates. */
    double ly1 = ph - ((r.origin.y - crop.origin.y) + r.size.height);
    double ly2 = ly1 + r.size.height;
    double nx1 = lx1 / pw, ny1 = ly1 / ph, nx2 = lx2 / pw, ny2 = ly2 / ph;
    if (nx2 <= nx1 || ny2 <= ny1) continue;
    if (!wrote_rects) { bx1 = nx1; by1 = ny1; bx2 = nx2; by2 = ny2; }
    else {
      if (nx1 < bx1) bx1 = nx1; if (ny1 < by1) by1 = ny1;
      if (nx2 > bx2) bx2 = nx2; if (ny2 > by2) by2 = ny2;
    }
    cur += snprintf(cur, rem,
        "%s{\"x1\":%.6f,\"y1\":%.6f,\"x2\":%.6f,\"y2\":%.6f,\"w\":1.0,\"h\":1.0}",
        wrote_rects ? "," : "", nx1, ny1, nx2, ny2);
    rem = cap - (cur - json);
    wrote_rects++;
  }
  cur += snprintf(cur, rem, "]}"); rem = cap - (cur - json);
  if (wrote_rects) {
    char bounding[192];
    snprintf(bounding, sizeof(bounding),
        "{\"x1\":%.6f,\"y1\":%.6f,\"x2\":%.6f,\"y2\":%.6f,\"w\":1.0,\"h\":1.0}",
        bx1, by1, bx2, by2);
    size_t prefix_len = strlen("{\"text\":\"");
    (void)prefix_len;
    /* Replace the temporary null after the text field. */
    char *null_at = strstr(rects_at, "null,\"rects\"");
    if (null_at && strlen(bounding) + strlen(null_at + 4) + 16 < cap) {
      memmove(null_at + strlen(bounding), null_at + 4, strlen(null_at + 4) + 1);
      memcpy(null_at, bounding, strlen(bounding));
    }
  }
  json_v = caml_copy_string(json);
  free(json);
  pdf_autorelease_pool_close(pool);
#endif
  CAMLreturn(json_v);
}

CAMLprim value logseq_pdf_selection_json_bytecode(value *argv, int argn) {
  (void)argn;
  return logseq_pdf_selection_json(argv[0], argv[1], argv[2], argv[3], argv[4], argv[5]);
}
