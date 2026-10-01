(* window.marked + window.DOMPurify — cljs handler/plugin.cljs
   markdown-to-html (window.marked.parse) plus security.cljs
   sanitize-html with sanitization-options
   {ADD_TAGS [iframe], ADD_ATTR [is], ALLOW_UNKNOWN_PROTOCOLS true}.
   The Electron-only RETURN_DOM iframe-src rewrite does not apply on
   web. Both shims guard the window globals so the path also survives a
   missing vendored script tag; cljs markdown-to-html falls back to the
   raw input when marked throws. *)

let marked_parse : string -> string Js.Undefined.t =
  [%mel.raw
    "function (s) { \
       var m = window.marked; \
       if (!m || typeof m.parse !== 'function') return undefined; \
       try { return m.parse(s); } \
       catch (e) { console.error(e); return undefined; } \
     }"]

(* cljs resolve-dompurify: the bundle exposes either a ready instance or
   a factory that takes the window *)
let purify_sanitize : string -> string Js.Undefined.t =
  [%mel.raw
    "function (html) { \
       var d = window.DOMPurify; \
       if (!d) return undefined; \
       var i = d.default || d; \
       if (typeof i === 'function') i = i(window); \
       if (!i || typeof i.sanitize !== 'function') return undefined; \
       return i.sanitize(html, {ADD_TAGS: ['iframe'], ADD_ATTR: ['is'], \
         ALLOW_UNKNOWN_PROTOCOLS: true}); \
     }"]

let markdown_to_html s =
  match Js.Undefined.toOption (marked_parse s) with
  | Some html -> (
      match Js.Undefined.toOption (purify_sanitize html) with
      | Some clean -> clean
      | None -> html)
  | None -> s
