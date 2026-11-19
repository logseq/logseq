(* Vendored JS libraries wired into the render path: KaTeX (katex.min.js +
   mhchem.min.js, lazy-loaded like cljs extensions/latex) and highlight.js
   (highlight.min.js, a defer script tag in index.html) for code blocks,
   plus youtube-timestamp seek. Emitted DOM is identical to the cljs
   hiccup; a sync document MutationObserver scan (the doc-scan fixup
   channel) calls the libs on fresh elements before paint. *)

open Promise_ext
module D = Web_dom

external el_text_content : D.el -> string = "textContent" [@@mel.get]

(* ---------- katex ---------- *)

type lib_state =
  | Idle
  | Loading
  | Ready
  | Failed

let katex_state = ref Idle

(* element id -> displayMode for .latex/.latex-inline nodes awaiting
   render; entries are dropped as the scan renders them *)
let pending_display : (string, bool) Hashtbl.t = Hashtbl.create 8

let katex_register_pending id display =
  Hashtbl.replace pending_display id display

let katex_ready () : bool =
  [%mel.raw "!!(window.katex && window.katex.render)"]

let katex_render : D.el -> string -> bool -> unit =
  [%mel.raw
    "function (el, tex, display) {\n\
    \  try {\n\
    \    window.katex.render(tex, el,\n\
    \      {displayMode: display, throwOnError: false, strict: false});\n\
    \  } catch (e) { console.error(e) }\n\
    \  }"]

let inject_script : string -> unit Js.Promise.t =
  [%mel.raw
    "function (src) {\n\
    \  return new Promise(function (ok, bad) {\n\
    \    var s = document.createElement('script');\n\
    \    s.src = src; s.onload = function () { ok() }; s.onerror = bad;\n\
    \    (document.head || document.documentElement).appendChild(s);\n\
    \  })\n\
    \  }"]

let hljs_ready () : bool = [%mel.raw "!!window.hljs"]

let youtube_driver : Js.Json.t = [%mel.raw {|
  (() => {
    const players = new WeakMap();
    let loading = false;
    const isYoutube = frame => /youtube(?:-nocookie)?\.com\/embed\//.test(frame.src || '');
    const register = frame => {
      if (!isYoutube(frame) || players.has(frame)) return;
      if (window.YT && typeof window.YT.Player === 'function') {
        players.set(frame, null);
        new window.YT.Player(frame, {events: {
          onReady: event => players.set(frame, event.target)
        }});
      } else if (!loading) {
        loading = true;
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (previous) previous();
          Array.from(document.getElementsByTagName('iframe')).forEach(register);
        };
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onerror = error => console.error('YouTube player API failed', error);
        (document.head || document.documentElement).appendChild(script);
      }
    };
    const read = () => {
      const target = document.activeElement;
      if (!target) return undefined;
      let last = null;
      for (const frame of document.getElementsByTagName('iframe')) {
        if (isYoutube(frame) && (frame.compareDocumentPosition(target) & 4)) last = frame;
      }
      if (!last) return undefined;
      const player = players.get(last);
      if (!player || typeof player.getCurrentTime !== 'function') return null;
      const seconds = player.getCurrentTime();
      return Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : null;
    };
    return {register, read};
  })()
|}]

external youtube_register_js : Js.Json.t -> D.el -> unit = "register" [@@mel.send]
external youtube_read_js : Js.Json.t -> int Js.Nullable.t Js.Undefined.t = "read" [@@mel.send]

let register_youtube frame = youtube_register_js youtube_driver frame

let video_timestamp () =
  match Js.Undefined.toOption (youtube_read_js youtube_driver) with
  | None -> Runtime.No_video
  | Some value ->
      (match Js.Nullable.toOption value with
       | None -> Runtime.Player_pending
       | Some seconds -> Runtime.Playback_time seconds)

(* highlightElement with an explicit language: declared data-lang wins
   (unknown languages -> no-highlight per blockLanguage), none -> the
   same highlightAuto path cljs's bare <code data-lang> takes *)
let hljs_highlight : D.el -> string -> unit =
  [%mel.raw
    "function (el, lang) {\n\
    \  var h = window.hljs;\n\
    \  if (!h || el.dataset.highlighted) return;\n\
    \  var text = el.textContent;\n\
    \  if (!text || el.children.length > 0) return;\n\
    \  var res;\n\
    \  if (lang) {\n\
    \    if (!h.getLanguage(lang)) { el.dataset.highlighted = 'no-highlight'; return }\n\
    \    try { res = h.highlight(text, {language: lang, ignoreIllegals: true}) }\n\
    \    catch (e) { return }\n\
    \  } else {\n\
    \    res = h.highlightAuto(text);\n\
    \  }\n\
    \  el.innerHTML = res.value;\n\
    \  el.dataset.highlighted = 'yes';\n\
    \  el.classList.add('hljs');\n\
    \  el.classList.add('language-' + res.language);\n\
    \  }"]

(* ---------- scans ---------- *)

(* katex absent: keep .katex + raw tex (the pre-wiring stub's shape) *)
let katex_fallback el tex =
  D.el_set_class el "katex";
  D.el_set_text_content el tex

let rec render_katex_one el =
  match D.el_query el ".opacity-0" with
  | None -> () (* already rendered: katex replaced the holder *)
  | Some holder -> (
      let tex = el_text_content holder in
      let id = D.el_id el in
      let display =
        match Hashtbl.find_opt pending_display id with
        | Some d -> d
        (* logseq-katex mounts are always spans — data-display is the
           tag-independent fallback *)
        | None -> D.el_get_attr el "data-display" = Some "true"
      in
      match !katex_state with
      | Failed -> katex_fallback el tex
      | Ready ->
          if katex_ready () then (
            Hashtbl.remove pending_display id;
            katex_render el tex display)
      | Idle | Loading -> load_katex ())

and render_scan roots =
  D.for_each_touched roots "iframe" register_youtube;
  List.iter
    (fun sel -> D.for_each_touched roots sel render_katex_one)
    [ ".latex"; ".latex-inline" ];
  D.for_each_touched roots "pre.CodeMirror-line" highlight_one;
  D.for_each_touched roots "pre.code code[data-lang]" (fun el ->
    hljs_highlight el "")

and highlight_one el =
  if not (hljs_ready ()) then ()
  else
    match
      (D.el_get_attr el "contenteditable", D.el_get_attr el "data-highlighted")
    with
    | Some _, _ | _, Some _ -> ()
    | None, None ->
        let lang =
          match D.el_closest el ".CodeMirror" with
          | Some cm -> Option.value (D.el_get_attr cm "data-lang") ~default:""
          | None -> ""
        in
        hljs_highlight el lang

(* cljs load-and-render!: katex.min.js first, then mhchem.min.js, render
   once both are in. mhchem failure still renders (cljs p/finally). *)
and load_katex () =
  match !katex_state with
  | Idle ->
      katex_state := Loading;
      let load =
        let* () = inject_script "./js/katex.min.js" in
        let* () =
          Js.Promise.catch
            (fun _ -> Js.Promise.resolve ())
            (inject_script "./js/mhchem.min.js")
        in
        katex_state := Ready;
        render_scan [ D.document_element ];
        Js.Promise.resolve ()
      in
      let (_ : unit Js.Promise.t) =
        Js.Promise.catch
          (fun _ ->
            katex_state := Failed;
            render_scan [ D.document_element ];
            Js.Promise.resolve ())
          load
      in
      ()
  | _ -> ()

(* ---------- youtube-timestamp seek ----------

   Seeking uses the documented postMessage command interface
   (works with ?enablejsapi=1). Target iframe:
   the last youtube embed preceding the link in document order. *)
let yt_seek : D.el -> unit =
  [%mel.raw
    "function (anchor) {\n\
    \  var frames = document.getElementsByTagName('iframe'), last = null;\n\
    \  for (var i = 0; i < frames.length; i++) {\n\
    \    var f = frames[i], src = f.getAttribute('src') || '';\n\
    \    var yt = src.indexOf('youtube.com') >= 0 ||\n\
    \      src.indexOf('youtube-nocookie.com') >= 0;\n\
    \    if (yt && (f.compareDocumentPosition(anchor) & 4)) last = f;\n\
    \  }\n\
    \  var label = anchor.querySelector('.youtube-timestamp-label');\n\
    \  var t = label ? label.textContent : '';\n\
    \  var sec = 0;\n\
    \  t.split(':').forEach(function (p) { sec = sec * 60 + (parseInt(p, 10) || 0) });\n\
    \  if (last && last.contentWindow) {\n\
    \    try {\n\
    \      last.contentWindow.postMessage(\n\
    \        JSON.stringify({event: 'command', func: 'seekTo', args: [sec, true]}),\n\
    \        '*');\n\
    \    } catch (e) {}\n\
    \  }\n\
    \  }"]

let on_doc_click ev =
  match D.ev_target ev with
  | Some t -> (
      match D.el_closest t "a.youtube-timestamp" with
      | Some anchor ->
          D.ev_prevent_default ev;
          D.ev_stop_propagation ev;
          yt_seek anchor
      | None -> ())
  | None -> ()

let installed = State_cell.Once.make ()

let ensure () =
  State_cell.Once.run installed (fun () ->
      Runtime.video_timestamp := video_timestamp;
      D.register_doc_scan ~sync:true render_scan;
      D.add_document_listener "click" on_doc_click true)
