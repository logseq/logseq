(* Inline markup parser: raw block-title text -> LUI elements.
   Mirrors the cljs renderer (components/block.cljs inline) — class names
   follow docs/e2e-contract.md exactly. *)

open Promise_ext
open Lui_elements
module D = Logseq_el
module U = I18n

(* Slice only the requested range. Melange String.sub first materializes
   the entire source, making repeated rich-text matches quadratic. Native
   Js.String.slice uses byte offsets; the web implementation uses UTF-16. *)
let sub s off len = Js.String.slice ~start:off ~end_:(off + len) s

(* positional substring index, -1 when absent — byte-compare, no
   allocation: Melange [String.sub] materializes the whole string per
   call, which made this scan O(n^2) on the web surface *)
let find_sub s i pat =
  let n = String.length s and m = String.length pat in
  if m = 0 then (if i >= 0 && i <= n then i else -1)
  else if i < 0 then -1
  else
    let c0 = String.unsafe_get pat 0 in
    let rec match_rest j k =
      k = m
      || (String.unsafe_get s (j + k) = String.unsafe_get pat k
          && match_rest j (k + 1))
    in
    let rec go j =
      if j + m > n then -1
      else if String.unsafe_get s j <> c0 then go (j + 1)
      else if match_rest j 1 then j
      else go (j + 1)
    in
    go i

(* .bracket's opacity:0.3 in lui-core.css is stylesheet chrome — the
   muted-foreground token carries the same soft look to native backends *)
let bracket s = text ~style_class:"bracket" ~foreground:"muted-foreground" ~value:s []

(* cljs page-reference wraps the anchor in .preview-ref-link —
   logseq-span hosts, not text: children of a text node never draw on
   hosts that treat text as a leaf (native) *)
let preview_link inner =
  D.el ~tag:"span"
    [ D.el ~tag:"span" ~style_class:"preview-ref-link" [ inner ] ]


(* ---------- emitters ---------- *)

(* a.page-ref/a.tag carry imperative hooks — data-ref/data-uuid are
   read by document-delegated clicks (sidebar_state.on_doc_click),
   hover previews (popups_view a[data-ref]) and cljs-parity selectors
   (a.tag[data-ref][data-uuid][draggable] > span; link's
   .lui-link-content satisfies the child span) *)
let page_link ~(tag : bool) ?label ?uuid_sig name =
  let name = String.trim name in
  let txt =
    match label with
    | Some l when String.trim l <> "" -> l
    | _ -> if tag then "#" ^ name else name
  in
  let cls = if tag then "relative tag" else "relative page-ref" in
  let base =
    [ ("data-ref", String.lowercase_ascii name)
    ; ("tabindex", "0")
    ; ("draggable", "true") ]
  in
  match uuid_sig with
  | None ->
      (* cljs anchors carry the label as a bare text child *)
      link ~url:"#" ~target:`self_ ~style_class:cls ~data_attrs:base
        ~text:txt []
  | Some u_sig ->
      (* cljs sets :data-uuid on the anchor once the page entity resolves;
         attrs apply is replace-semantic so emit the whole set *)
      link ~url:"#" ~target:`self_ ~style_class:cls ~text:txt
        ~data_attrs:
          (reactive
             (fun u ->
               if u = "" then base else ("data-uuid", u) :: base)
             u_sig)
        []

(* ---- pull memoization ----
   Every [[name]]/uuid anchor used to fire its own thread-api/pull per
   mount. Memoize name->uuid and uuid->(title, is-page) per repo; the
   worker's sync-db-changes broadcast drops the caches
   (worker_events.invalidate_pull_caches). Misses are not cached — a
   just-created entity resolves on the next broadcast+remount. *)

type pull_cache =
  { c_name_uuid : (string, string) Hashtbl.t
  ; c_uuid_meta : (string, string * bool) Hashtbl.t (* title, is-page *)
  ; c_macros : (string * string) list option ref (* config.edn :macros *)
  }

let pull_caches : (string, pull_cache) Hashtbl.t = Hashtbl.create 4

let repo_cache repo =
  match Hashtbl.find_opt pull_caches repo with
  | Some c -> c
  | None ->
      let c =
        { c_name_uuid = Hashtbl.create 256
        ; c_uuid_meta = Hashtbl.create 256
        ; c_macros = ref None
        }
      in
      Hashtbl.replace pull_caches repo c;
      c

module Uuid_gens = Stdlib.Map.Make (String)

(* republish key for keyed rows: a keyed item keeps its mount whenever
   the spliced/refetched record is structurally equal, so rows whose
   rendered text depends on a touched entity would paint stale resolved
   refs forever. Pair [(reset_gen, uuid_gens)] into the row's reactive key:
   [reset_gen] bumps on invalidate-all (remounts every row — a rare
   unknown-delta path), and each invalidated uuid carries a fresh
   generation so re-invalidating a previously-touched entity still
   remounts the rows that mention it *)
let invalidation_gen = ref 0
let reset_gen = ref 0
let invalidated_gens = ref Uuid_gens.empty

let invalidation () = (!reset_gen, !invalidated_gens)

let invalidate_pull_caches () =
  Hashtbl.reset pull_caches;
  incr reset_gen;
  invalidated_gens := Uuid_gens.empty

(* drop only the entities a tx touched — a broadcast used to reset every
   repo cache, so each op re-pulled every [[ref]]/anchor title on the
   page (the N+1 pull storm in the profile) *)
let invalidate_pull_uuids (uuids : string list) =
  match uuids with
  | [] -> ()
  | _ ->
      invalidated_gens :=
        List.fold_left
          (fun m u ->
            incr invalidation_gen;
            Uuid_gens.add u !invalidation_gen m)
          !invalidated_gens uuids;
      Hashtbl.iter
        (fun _repo (c : pull_cache) ->
          List.iter (Hashtbl.remove c.c_uuid_meta) uuids;
          (* name entries store the resolved uuid — remove ones whose
             target entity changed *)
          let names =
            Hashtbl.fold
              (fun name u acc ->
                if List.mem u uuids then name :: acc else acc)
              c.c_name_uuid []
          in
          List.iter (Hashtbl.remove c.c_name_uuid) names)
        pull_caches

(* uuids minted by a local title save (the [[name]] -> [[uuid]] rewrite):
   the save's own broadcast invalidates c_uuid_meta before the anchor's
   pull resolves, so the just-committed title is kept here — the pull
   still runs and replaces it with the committed form *)
let minted_meta : (string, string * bool) Hashtbl.t = Hashtbl.create 32

let prime_ref_metas (metas : (string * string) list) =
  List.iter
    (fun (name, u) -> Hashtbl.replace minted_meta u (name, true))
    metas;
  match (Runtime.model ()).Model.repo with
  | None -> ()
  | Some repo ->
      let cache = repo_cache repo in
      List.iter
        (fun (name, u) ->
          Hashtbl.replace cache.c_uuid_meta u (name, true);
          Hashtbl.replace cache.c_name_uuid
            (String.lowercase_ascii name) u)
        metas

(* same priming for an entity already pulled elsewhere (a resolved
   [[name]] -> uuid lookup) — caches only, no minted entry *)
let prime_pull_meta ~name ~uuid ~title ~is_page =
  match (Runtime.model ()).Model.repo with
  | None -> ()
  | Some repo ->
      let cache = repo_cache repo in
      Hashtbl.replace cache.c_name_uuid (String.lowercase_ascii name) uuid;
      Hashtbl.replace cache.c_uuid_meta uuid (title, is_page)

(* batch-fill both caches from a get-blocks response — a page's [[ref]]
   anchors then mount on hits instead of paying a thread-api/pull each *)
let prime_pull_caches repo (w : Wire.t) =
  let cache = repo_cache repo in
  List.iter
    (fun pair ->
      let uuid =
        match Wire.block_of_pair pair with
        | Some blk -> (
            match Wire.map_get_uuid blk "block/uuid" with
            | Some uuid ->
                let title =
                  Option.value
                    (Wire.map_get_string blk "block/title")
                    ~default:""
                in
                let is_page =
                  match Wire.map_get_string blk "block/name" with
                  | Some n -> String.trim n <> ""
                  | None -> false
                in
                Hashtbl.replace cache.c_uuid_meta uuid (title, is_page);
                Some uuid
            | None -> None)
        | None -> None
      in
      (* name-ref requests echo a plain-string id — seed name->uuid off
         it; a miss records "" so unresolvable [[names]] stop re-pulling
         on every mount *)
      (match Wire.get pair "id" with
       | Some (Wire.String s) when not (Wire.is_uuid_string s) ->
           Hashtbl.replace cache.c_name_uuid
             (String.lowercase_ascii s)
             (Option.value uuid ~default:"")
       | _ -> ()))
    (Wire.elems w)

(* resolved-meta signal behind [c_uuid_meta]: initialized synchronously
   on a cache hit (plain set — the mount's own flush publishes it), the
   pull fills + publishes on a miss *)
let uuid_meta_state context uuid ~fallback ?(miss = None) () =
  let st = Signal.state context.Lui_ui.ui_scheduler fallback in
  let sync = ref true in
  Render_state.with_repo (fun repo ->
      let cache = repo_cache repo in
      match Hashtbl.find_opt cache.c_uuid_meta uuid with
      | Some meta ->
          if !sync then Signal.set st meta
          else Runtime.signal_set st meta
      | None ->
          let minted = Hashtbl.find_opt minted_meta uuid in
          (match minted with
           | Some m ->
               if !sync then Signal.set st m
               else Runtime.signal_set st m
           | None -> ());
          (let* w =
            Runtime.invoke3 "thread-api/pull" (Wire.String repo)
              (Wire.String "[:block/title :block/name]")
              (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
          in
          (match Wire.map_get_string w "block/title" with
           | Some t when String.trim t <> "" ->
               let is_page =
                 match Wire.map_get_string w "block/name" with
                 | Some n -> String.trim n <> ""
                 | None -> false
               in
               let meta = (t, is_page) in
               Hashtbl.replace cache.c_uuid_meta uuid meta;
               Hashtbl.remove minted_meta uuid;
               Runtime.signal_set st meta
           | _ -> (
               (* keep the minted title when the pull can't confirm —
                  a deleted entity falls back to the caller's miss *)
               match miss, minted with
               | Some m, None -> Runtime.signal_set st m
               | _ -> ()));
          Js.Promise.resolve ())
          |> ignore);
  sync := false;
  st

(* name-based ref -> resolved entity uuid via thread-api/pull (empty string
   until the pull returns; cljs resolves through a react subscription) *)
let name_uuid_state context name =
  let st = Signal.state context.Lui_ui.ui_scheduler "" in
  let sync = ref true in
  Render_state.with_repo (fun repo ->
      let cache = repo_cache repo in
      let key = String.lowercase_ascii name in
      match Hashtbl.find_opt cache.c_name_uuid key with
      | Some u ->
          if !sync then Signal.set st u else Runtime.signal_set st u
      | None ->
          (let* w =
            Runtime.invoke3 "thread-api/pull" (Wire.String repo)
              (Wire.String "[:block/uuid]")
              (Wire.Array [ Wire.Keyword "block/name"; Wire.String key ])
          in
          (match Wire.map_get_uuid w "block/uuid" with
           | Some u ->
               Hashtbl.replace cache.c_name_uuid key u;
               Runtime.signal_set st u
           | None -> ());
          Js.Promise.resolve ())
          |> ignore);
  sync := false;
  st

let external_link href label_els =
  link ~url:href ~target:`blank ~style_class:"external-link" label_els

(* ((uuid)) (deprecated form) / #[[uuid]] -> resolved block title via
   thread-api/pull — lazy: the anchor mounts empty and fills when the
   pull returns *)
let block_ref_anchor uuid : t =
 fun context parent ->
  let st = uuid_meta_state context uuid ~fallback:(uuid, false) () in
  let title_sig = Signal.map fst (Signal.value st) in
  link ~url:"#" ~target:`self_ ~style_class:"relative page-ref"
    ~data_attrs:[ ("data-ref", uuid); ("tabindex", "0") ]
    ~text_signal:title_sig
    [] context parent

let block_ref uuid =
  D.el ~tag:"span" ~style_class:"page-reference"
    ~attrs:[ ("data-ref", uuid) ]
    [ block_ref_anchor uuid ]

(* cljs .as-plain-image-link / asset-container: a plain <img> sizes to
   its intrinsic dimensions; the `image` kind is a fixed-frame element
   (absolute-filled span) and collapses to 0x0 without explicit dims *)
let image_el ~src ~alt =
  D.el ~tag:"div" ~style_class:"asset-container image normalize"
    [ D.el ~tag:"img"
        ~attrs:
          [ ("src", src); ("alt", alt); ("loading", "lazy")
          ; ("referrerpolicy", "no-referrer") ]
        [] ]

(* cljs asset-link pdf branch: a ![alt](x.pdf) embed renders
   a.asset-ref.is-pdf whose click opens the in-app pdf viewer — an
   <img> cannot show a pdf. The opener is registered by the pdf
   extension at boot (Pdf.install): render_inline sits below the
   extension layer in the dep graph *)
let pdf_link_press : (src:string -> unit) ref = ref (fun ~src:_ -> ())

let pdf_link_el ~src ~alt : t =
  Ui_parts.pressable ~on_press:(fun _ -> !pdf_link_press ~src)
    (text ~style_class:"asset-ref is-pdf" ~value:alt [])

(* inline <code>/<b>/<i>/<em>/<mark>/<del>/<u>/<s>/<sub>/<sup>/
   <strong>/<kbd> styling comes from element-selector CSS
   (:not(pre) > code, mark {…}) — ~as_ retags the text kind *)
let code_span s = text ~as_:`Code ~value:s []

(* cljs extensions/latex: the logseq-katex extension slot carries the
   .latex/.latex-inline classes, a generated #ls-katex-* id, and a
   .opacity-0 child holding the raw tex; the Render_libs doc-scan
   lazy-loads katex.min.js + mhchem.min.js and calls katex.render into
   the slot. *)
let katex_el ~block ~display tex : t = Logseq_katex.el ~block ~display ~tex ()

(* cljs extensions/video/youtube parse-timestamp:
   ^(?:(\d+):)?([0-5]?\d):([0-5]?\d)$ or ^\d+$ (plain seconds) *)
let parse_timestamp s : int option =
  let digits s =
    s <> "" && String.for_all (fun c -> c >= '0' && c <= '9') s
  in
  let m_or_s v = String.length v <= 2 && digits v && int_of_string v <= 59 in
  if digits s then int_of_string_opt s
  else
    match String.split_on_char ':' s with
    | [ m; sec ] when m_or_s m && m_or_s sec ->
        Some ((int_of_string m * 60) + int_of_string sec)
    | [ h; m; sec ] when digits h && m_or_s m && m_or_s sec ->
        Some ((int_of_string h * 3600) + (int_of_string m * 60) + int_of_string sec)
    | _ -> None

(* cljs seconds->display: pad [h;m;s] to 2 digits, drop hours iff "00" *)
let seconds_display seconds =
  let pad v = if v < 10 then "0" ^ string_of_int v else string_of_int v in
  let h = pad (seconds / 3600)
  and m = pad (seconds / 60 mod 60)
  and s = pad (seconds mod 60) in
  if h = "00" then m ^ ":" ^ s else h ^ ":" ^ m ^ ":" ^ s

(* cljs youtube/timestamp: a.youtube-timestamp with the clock icon +
   seconds->display label; the click handler lives in Render_libs
   (delegated el_closest a.youtube-timestamp) *)
let timestamp_el seconds : t =
 fun context parent ->
  Render_libs.ensure ();
  link ~url:"#" ~target:`self_ ~style_class:"youtube-timestamp"
    [ text ~key:"yti" ~style_class:"youtube-timestamp-icon"
        [ icon ~name:(`app "youtube-timestamp-icon") [] ]
    ; text ~key:"ytl" ~style_class:"youtube-timestamp-label"
        ~value:(seconds_display seconds)
        [] ]
    context parent

(* emphasis is a logseq-<tag> host, not text ~as_: its children are the
   parsed run and may carry logseq-* nodes (emoji/katex/link labels),
   which a standard text node rejects on native (and whose children some
   backends never draw). try_html_tag pre-maps ins->u, s->del *)
let emph tag children = D.el ~tag children

let emoji_el name = Logseq_emoji.el ~name ()

(* ---------- <day> dates ---------- *)

let day_diff ~y ~m ~d =
  let open Js.Date in
  let utc_of y m d = utc ~year:y ~month:(m -. 1.0) ~date:d () in
  let now = fromFloat (now ()) in
  let t0 =
    utc_of (getFullYear now) (getMonth now +. 1.0) (getDate now)
  in
  let t1 = utc_of (float y) (float m) (float d) in
  int_of_float ((t1 -. t0) /. 86400000. +. 0.5)

let date_label y m d =
  match day_diff ~y ~m ~d with
  | 0 -> "Today"
  | -1 -> "Yesterday"
  | 1 -> "Tomorrow"
  | _ -> Dates.journal_title_ymd ~y ~m ~d

(* cljs components/block.cljs timestamp: span.timestamp keeps the
   literal <YYYY-MM-DD ...> text inline (active attr marks <..> vs [..]) *)
let timestamp_text_el ~literal =
  (* cljs span.timestamp[active] — the active attr has no readers *)
  text ~style_class:"timestamp" ~value:literal []

(* ---------- cloze ---------- *)

(* Cards review pre-reveals clozes (cljs {:show-cloze? true} on
   blocks-container). Consulted only at cloze mount time — Cards_state
   raises it while a revealed card subtree mounts; page subtrees that
   mount with it set get the same treatment, matching cljs where the
   flag is a shared render option. *)
let cloze_reveal_all = ref false

(* {{cloze answer\\cue}} — click/Enter/Space toggles span.cloze ->
   span.cloze-revealed showing the answer (cljs fsrs.cljs cloze-cp). *)
let cloze_el answer cue : t =
 fun context parent ->
  let open_ = Signal.state context.Lui_ui.ui_scheduler !cloze_reveal_all in
  let sig_ = Signal.value open_ in
  let hidden_text = match cue with Some c -> "(" ^ c ^ ")" | None -> "[...]" in
  (* keydown (Enter/Space) has no component equivalent — click toggles.
     role/button+tabindex+aria-pressed have no kind props *)
  (Ui_parts.pressable
     ~on_press:(fun _ ->
       Runtime.signal_set open_ (not (Runtime.signal_get open_)))
     (Ui_parts.class_signal sig_
        (fun o -> if o then "cloze cloze-revealed" else "cloze")
        (text
           ~value_signal:(Signal.map
                (fun o ->
                  if o then "[" ^ answer ^ "]" else hidden_text)
                sig_)
           [])))
    context parent

(* ---------- macros ---------- *)

let macro_args body =
  match String.index_opt body ' ' with
  | None -> (String.trim body, "")
  | Some i ->
      (String.lowercase_ascii (sub body 0 i)
      , String.trim (sub body (i + 1) (String.length body - i - 1)))

(* mldoc inline.ml macro_arg: a [[page ref]], [nested](link),
   ((block ref)) or "quoted" arg may contain commas — only the bare
   fallback splits at ',' *)
let split_macro_args args =
  let n = String.length args in
  let buf = Buffer.create n in
  let out = ref [] in
  let push () =
    let a = String.trim (Buffer.contents buf) in
    Buffer.clear buf;
    if a <> "" then out := a :: !out
  in
  let rec go i depth quoted =
    if i >= n then (
      push ();
      List.rev !out)
    else
      let c = String.unsafe_get args i in
      if quoted then (
        Buffer.add_char buf c;
        match c with
        | '\\' when i + 1 < n ->
            Buffer.add_char buf (String.unsafe_get args (i + 1));
            go (i + 2) depth quoted
        | '"' -> go (i + 1) depth false
        | _ -> go (i + 1) depth quoted)
      else
        match c with
        | '"' ->
            Buffer.add_char buf c;
            go (i + 1) depth true
        | '[' ->
            Buffer.add_char buf c;
            go (i + 1) (depth + 1) quoted
        | ']' ->
            Buffer.add_char buf c;
            let depth' = max 0 (depth - 1) in
            if depth' = 0 && i + 1 < n && args.[i + 1] = '(' then
              (* (url) tail of a nested link — commas inside are part
                 of the same argument *)
              go_link_tail (i + 1) 1
            else go (i + 1) depth' quoted
        | '(' when i + 1 < n && args.[i + 1] = '(' ->
            Buffer.add_string buf "((";
            go (i + 2) (depth + 1) quoted
        | ')' when i + 1 < n && args.[i + 1] = ')' ->
            Buffer.add_string buf "))";
            go (i + 2) (max 0 (depth - 1)) quoted
        | ',' when depth = 0 ->
            push ();
            go (i + 1) depth quoted
        | _ ->
            Buffer.add_char buf c;
            go (i + 1) depth quoted
  and go_link_tail i pd =
    if i >= n then (
      push ();
      List.rev !out)
    else
      match String.unsafe_get args i with
      | '(' ->
          Buffer.add_char buf '(';
          go_link_tail (i + 1) (pd + 1)
      | ')' ->
          Buffer.add_char buf ')';
          if pd = 1 then go (i + 1) 0 false else go_link_tail (i + 1) (pd - 1)
      | c ->
          Buffer.add_char buf c;
          go_link_tail (i + 1) pd
  in
  go 0 0 false

(* cljs macro-cp: when the args are ≥2 and the first opens a page ref
   while the last closes one, the whole list is a single (multi-ref)
   argument — e.g. {{embed [[a]], [[b]]}} *)
let macro_arguments arg_str =
  match split_macro_args arg_str with
  | (first :: _) as args
    when List.length args >= 2
         && Str_util.starts_with first "[["
         && Str_util.ends_with (List.nth args (List.length args - 1)) "]]" ->
      [ String.concat ", " args ]
  | args -> args

(* cljs macro->text *)
let macro_to_text name arguments =
  match arguments with
  | [] | [ "null" ] -> "{{" ^ name ^ "}}"
  | _ -> "{{" ^ name ^ " " ^ String.concat ", " arguments ^ "}}"

(* ---------- video embeds (cljs extensions/video.cljs) ---------- *)

let is_digit c = c >= '0' && c <= '9'

(* [\w-]+ at position j *)
let word_id_at s j =
  let n = String.length s in
  let rec stop i =
    if i < n then
      match String.unsafe_get s i with
      | 'a' .. 'z' | 'A' .. 'Z' | '0' .. '9' | '_' | '-' -> stop (i + 1)
      | _ -> i
    else i
  in
  match stop j - j with
  | len when len > 0 -> Some (sub s j len)
  | _ -> None

let is_word_id s =
  s <> "" && String.for_all (fun c ->
    (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
    || (c >= '0' && c <= '9') || c = '_' || c = '-') s

(* cljs common-util/url? — a scheme:// URL *)
let looks_like_url s =
  let n = String.length s in
  if n < 4 then false
  else
    match s.[0] with
    | 'a' .. 'z' | 'A' .. 'Z' ->
        let rec go i =
          i < n
          &&
          match String.unsafe_get s i with
          | ':' -> i + 2 < n && s.[i + 1] = '/' && s.[i + 2] = '/'
          | 'a' .. 'z' | 'A' .. 'Z' | '0' .. '9' | '+' | '-' | '.' ->
              go (i + 1)
          | _ -> false
        in
        go 1
    | _ -> false

(* -> (lowercased host, path incl. leading '/' or "") — the cljs video
   regexes allow //, http(s):// or bare host prefixes *)
let host_path_of_url url =
  let s = String.trim url in
  let s =
    if Str_util.starts_with_ci s "https://" then
      sub s 8 (String.length s - 8)
    else if Str_util.starts_with_ci s "http://" then
      sub s 7 (String.length s - 7)
    else if Str_util.starts_with s "//" then
      sub s 2 (String.length s - 2)
    else s
  in
  match String.index_opt s '/' with
  | Some i ->
      (String.lowercase_ascii (sub s 0 i)
      , sub s i (String.length s - i))
  | None -> (String.lowercase_ascii s, "")

(* cljs video regexes gate the host on (www|m)?\. style groups — a
   subdomain outside the listed set does not match *)
let host_is subs host domain =
  host = domain || List.exists (fun sub -> host = sub ^ "." ^ domain) subs

(* '?p=12' or '&p=12' — cljs bilibili-regex (\?p=(\d+)) *)
let query_digits url name =
  let digits_after j =
    let k = j + String.length name + 2 in
    let n = String.length url in
    let rec stop i =
      if i < n && is_digit (String.unsafe_get url i) then stop (i + 1)
      else i
    in
    match stop k - k with
    | len when len > 0 -> Some (sub url k len)
    | _ -> None
  in
  match find_sub url 0 ("?" ^ name ^ "=") with
  | j when j >= 0 -> digits_after j
  | _ -> (
      match find_sub url 0 ("&" ^ name ^ "=") with
      | j when j >= 0 -> digits_after j
      | _ -> None)

(* cljs video-start: [?&]t=(\d+) *)
let youtube_start url =
  match find_sub url 0 "t=" with
  | j when j > 0 && (url.[j - 1] = '?' || url.[j - 1] = '&') -> (
      let k = j + 2 in
      let n = String.length url in
      let rec stop i =
        if i < n && is_digit url.[i] then stop (i + 1) else i
      in
      match stop k - k with
      | len when len > 0 -> Some (sub url k len)
      | _ -> None)
  | _ -> None

type video_provider =
  | Vp_youtube
  | Vp_nocookie
  | Vp_bilibili of string option (* ?p= page *)
  | Vp_vimeo
  | Vp_loom

(* cljs get-matched-video: youtube / bilibili / vimeo / loom regexes —
   the id is the first [\w-]+ in the path segment (or after ?v= for
   youtube watch links) *)
let get_matched_video url =
  let host, path = host_path_of_url url in
  let id_after prefix =
    if Str_util.starts_with path prefix then
      word_id_at path (String.length prefix)
    else None
  in
  let path_seg_id () =
    if String.length path > 1 && path.[0] = '/' then word_id_at path 1
    else None
  in
  if
    List.exists
      (host_is [ "www"; "m" ] host)
      [ "youtube.com"; "youtu.be"; "y2u.be"; "youtube-nocookie.com" ]
  then
    let nocookie = host_is [ "www"; "m" ] host "youtube-nocookie.com" in
    let id =
      match List.find_map id_after [ "/shorts/"; "/embed/"; "/v/" ] with
      | Some id -> Some id
      | None -> (
          match path_seg_id () with
          | Some seg -> (
              (* /<seg>?v=<id> (e.g. /watch?v=) else the seg is the id *)
              let k = 1 + String.length seg in
              if
                Str_util.starts_with
                  (sub path k (String.length path - k))
                  "?v="
              then word_id_at path (k + 3)
              else Some seg)
          | None -> None)
    in
    (match id with
     | Some id -> Some ((if nocookie then Vp_nocookie else Vp_youtube), id)
     | None -> None)
  else if host_is [ "www" ] host "bilibili.com" then
    match
      match id_after "/video/" with
      | Some _ as id -> id
      | None -> path_seg_id ()
    with
    | Some id -> Some (Vp_bilibili (query_digits url "p"), id)
    | None -> None
  else if host_is [ "www" ] host "player.vimeo.com" || host_is [ "www" ] host "vimeo.com" then
    match
      match id_after "/video/" with
      | Some _ as id -> id
      | None -> path_seg_id ()
    with
    | Some id -> Some (Vp_vimeo, id)
    | None -> None
  else if host_is [ "www" ] host "loom.com" then
    match
      match id_after "/share/" with
      | Some _ as id -> id
      | None -> id_after "/embed/"
    with
    | Some id -> Some (Vp_loom, id)
    | None -> None
  else None

type provider_hint =
  [ `youtube | `bilibili | `vimeo | `loom ]

type video_embed =
  | Ve_youtube of string * string option (* id, start seconds *)
  | Ve_iframe of string (* src *)

(* cljs video/matched-video-embed + input-video provider-hint id
   fallbacks (youtube bare 11-char, bilibili ≤15 chars, vimeo digits;
   loom gets the same bare-id treatment) *)
let input_video input hint =
  let start = youtube_start input in
  match get_matched_video input with
  | Some (Vp_youtube, id) -> Some (Ve_youtube (id, start))
  | Some (Vp_nocookie, id) ->
      Some
        (Ve_iframe
           ("https://www.youtube-nocookie.com/embed/" ^ id
            ^ match start with Some s -> "?t=" ^ s | None -> ""))
  | Some (Vp_bilibili page, id) ->
      Some
        (Ve_iframe
           ("https://player.bilibili.com/player.html?bvid=" ^ id
            ^ "&high_quality=1&autoplay=0"
            ^ (match page with Some p -> "&p=" ^ p | None -> "")
            ^ match start with Some s -> "&t=" ^ s | None -> ""))
  | Some (Vp_vimeo, id) ->
      Some (Ve_iframe ("https://player.vimeo.com/video/" ^ id))
  | Some (Vp_loom, id) ->
      Some (Ve_iframe ("https://www.loom.com/embed/" ^ id))
  | None -> (
      match hint with
      | Some `youtube when String.length input = 11 ->
          Some (Ve_youtube (input, start))
      | Some `bilibili when String.length input <= 15 ->
          Some
            (Ve_iframe
               ("https://player.bilibili.com/player.html?bvid=" ^ input
                ^ "&high_quality=1&autoplay=0"))
      | Some `vimeo
        when input <> "" && String.for_all is_digit input ->
          Some (Ve_iframe ("https://player.vimeo.com/video/" ^ input))
      | Some `loom when is_word_id input ->
          Some (Ve_iframe ("https://www.loom.com/embed/" ^ input))
      | _ -> None)

(* cljs components/block/video.cljs video-width: a ", w=N" argument
   (positive int) *)
let video_width arguments =
  List.find_map
    (fun a ->
      if Str_util.starts_with a "w=" then
        let v = sub a 2 (String.length a - 2) in
        if v <> "" && String.for_all is_digit v then
          match int_of_string_opt v with
          | Some n when n > 0 -> Some n
          | _ -> None
        else None
      else None)
    arguments

(* TODO(component): <iframe> embeds are imperative (youtube
   enablejsapi postMessage seek, plugin-loaded src) — no iframe kind *)

(* cljs youtube-video iframe + attrs; enablejsapi=1 is required for the
   timestamp seek postMessage *)
let youtube_iframe id start =
  let src =
    "https://www.youtube.com/embed/" ^ id ^ "?enablejsapi=1"
    ^ match start with Some s -> "&start=" ^ s | None -> ""
  in
  D.el ~tag:"iframe"
    ~attrs:
      [ ("id", "youtube-player-" ^ id)
      ; ("allow-full-screen", "allowfullscreen")
      ; ( "allow"
        , "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" )
      ; ("referrer-policy", "strict-origin-when-cross-origin")
      ; ("referer", "https://logseq.com")
      ; ("frame-border", "0")
      ; ("src", src) ]
    []

(* cljs video-embed-cp :iframe attr set — shared by every non-youtube
   provider *)
let provider_iframe src =
  D.el ~tag:"iframe"
    ~attrs:
      [ ("allow-full-screen", "allowfullscreen")
      ; ( "allow"
        , "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" )
      ; ("framespacing", "0")
      ; ("frame-border", "no")
      ; ("border", "0")
      ; ("scrolling", "no")
      ; ("src", src) ]
    []

(* cljs block/video-inline-segments-cp .video-embed-block +
   video-embed-cp .video-embed-shell > .video-embed-frame[width,
   aspect-ratio] (embed-block kept for the e2e contract). The cljs
   resize handle rewrites , w=N in the block source — deferred: LUI has
   no editing-surface write path for it yet *)
let video_embed_shell ~macro_name ~macro_id ?width inner =
  let w = max 160 (Option.value ~default:560 width) in
  D.el ~tag:"div" ~style_class:"video-embed-block embed-block"
    ~attrs:
      [ ("data-video-macro-name", macro_name)
      ; ("data-video-macro-id", macro_id) ]
    [ D.el ~tag:"div" ~style_class:"video-embed-shell"
        [ D.el ~tag:"div" ~style_class:"video-embed-frame"
            ~attrs:
              [ ( "style"
                , "width:" ^ string_of_int w ^ "px;aspect-ratio:16 / 9" ) ]
            [ inner ] ] ]

(* cljs macro-video-cp: provider-hint names accept bare ids; {{video}}
   requires a real URL — the warning text is literally "{{video …}}" *)
let macro_video_el name arguments hint =
  match arguments with
  | url_or_id :: _ ->
      if hint <> None || looks_like_url url_or_id then
        let width = video_width arguments in
        match input_video url_or_id hint with
        | Some (Ve_youtube (id, start)) ->
            video_embed_shell ~macro_name:name ~macro_id:url_or_id ?width
              (youtube_iframe id start)
        | Some (Ve_iframe src) ->
            video_embed_shell ~macro_name:name ~macro_id:url_or_id ?width
              (provider_iframe src)
        | None -> D.txt ""
      else
        D.el ~tag:"span" ~style_class:"warning mr-1"
          ~attrs:[ ("title", U.t "block/invalid-url") ]
          ~text:(macro_to_text "video" arguments)
          []
  | [] ->
      if hint = None then
        D.el ~tag:"span" ~style_class:"warning mr-1"
          ~attrs:[ ("title", U.t "block/empty-url") ]
          ~text:(macro_to_text "video" arguments)
          []
      else D.txt ""

(* ---------- tweet embed (cljs ui/tweet-embed) ---------- *)

(* arg ≤15 chars is the id itself; else /status/(\d+) *)
let tweet_id_of arg =
  if String.length arg <= 15 then Some arg
  else
    match find_sub arg 0 "/status/" with
    | j when j >= 0 -> (
        let k = j + 8 in
        let n = String.length arg in
        let rec stop i =
          if i < n && is_digit (String.unsafe_get arg i) then stop (i + 1)
          else i
        in
        match stop k - k with
        | len when len > 0 -> Some (sub arg k len)
        | _ -> None)
    | _ -> None

(* cljs (theme= 'dark (state/sub :ui/theme)) — same resolution as
   settings_view current_mode: system-theme? (default desktop OS) then
   prefers-dark, else the stored "theme" *)
let dark_theme () =
  let system =
    match Platform.local_storage_get "system-theme?" with
    | Some v -> Platform.storage_unquote v = "true"
    | None -> Platform.desktop_os ()
  in
  if system then Web_dom.prefers_dark ()
  else
    match Platform.local_storage_get "theme" with
    | Some v -> Platform.storage_unquote v = "dark"
    | None -> false

let tweet_iframe id =
  let dark = dark_theme () in
  D.el ~tag:"iframe" ~style_class:"tweet-embed"
    ~attrs:
      [ ( "src"
        , "https://platform.twitter.com/embed/Tweet.html?id=" ^ id
          ^ if dark then "&theme=dark" else "" )
      ; ("style", "width:100%;min-height:240px;border:0")
      ; ("loading", "lazy")
      ; ("allow", "encrypted-media; picture-in-picture")
      ; ("allow-full-screen", "allowfullscreen") ]
    []

(* ---------- custom macros (cljs state/get-macros) ---------- *)

(* cljs state/built-in-macros *)
let builtin_macros =
  [ ("img", "[:img.$4 {:src \"$1\" :style {:width $2 :height $3}}]") ]

let macros_of_config (cfg : Wire.t) =
  let user =
    match Wire.get cfg "macros" with
    | Some (Wire.Map kvs) ->
        List.filter_map
          (fun (k, v) ->
            match k, Wire.as_string v with
            | (Wire.Keyword n | Wire.String n | Wire.Symbol n), Some c ->
                Some (n, c)
            | _ -> None)
          kvs
    | _ -> []
  in
  (* cljs get-macros: config map merged over the built-ins *)
  user
  @ List.filter (fun (n, _) -> not (List.mem_assoc n user)) builtin_macros

(* cljs macro-util/macro-subs — positional $1..$n replacement *)
let macro_subs content arguments =
  let rec go s i = function
    | [] -> s
    | a :: rest ->
        go
          (Str_util.replace_all s ~pat:("$" ^ string_of_int i) ~rep:a)
          (i + 1) rest
  in
  go content 1 arguments

(* config.edn :macros behind the same memoized-pull pattern — read once
   per repo, republished into each mount's signal *)
let macros_state context =
  let st = Signal.state context.Lui_ui.ui_scheduler [] in
  let sync = ref true in
  Render_state.with_repo (fun repo ->
      let cache = repo_cache repo in
      match !(cache.c_macros) with
      | Some ms ->
          if !sync then Signal.set st ms else Runtime.signal_set st ms
      | None ->
          ignore
            (let* cfg = Sdk_config.read_config repo in
             let ms = macros_of_config cfg in
             cache.c_macros := Some ms;
             if !sync then Signal.set st ms else Runtime.signal_set st ms;
             Js.Promise.resolve ()));
  sync := false;
  st

(* ---------- inline hiccup (cljs Inline_Hiccup + hiccup->html) ---------- *)

(* mldoc syntax/raw_html known_tags — the tag whitelist is checked at
   parse time before the vector is emitted *)
let hiccup_known_tags =
  [ "a"; "abbr"; "address"; "area"; "article"; "aside"; "audio"; "b"
  ; "base"; "bdi"; "bdo"; "blockquote"; "body"; "br"; "button"; "canvas"
  ; "caption"; "cite"; "code"; "col"; "colgroup"; "data"; "datalist"
  ; "dd"; "del"; "dfn"; "div"; "dl"; "dt"; "em"; "embed"; "fieldset"
  ; "figcaption"; "figure"; "footer"; "form"; "h1"; "h2"; "h3"; "h4"
  ; "h5"; "h6"; "head"; "header"; "hr"; "html"; "i"; "iframe"; "img"
  ; "input"; "ins"; "kbd"; "keygen"; "label"; "legend"; "li"; "link"
  ; "main"; "map"; "mark"; "meta"; "meter"; "nav"; "noscript"; "object"
  ; "ol"; "optgroup"; "option"; "output"; "p"; "param"; "pre"; "progress"
  ; "q"; "rb"; "rp"; "rt"; "rtc"; "ruby"; "s"; "samp"; "script"
  ; "section"; "select"; "small"; "source"; "span"; "strong"; "style"
  ; "sub"; "sup"; "table"; "tbody"; "td"; "template"; "textarea"
  ; "tfoot"; "th"; "thead"; "time"; "title"; "tr"; "track"; "u"; "ul"
  ; "var"; "video"; "details"; "summary"; "wbr" ]

(* cljs runs the emitted html through security/sanitize-html — the
   metadata/script-capable tags never come out *)
let hiccup_banned_tags =
  [ "script"; "style"; "link"; "meta"; "base"; "object"; "embed"
  ; "head"; "html"; "body"; "title"; "template"; "keygen"; "param" ]

let is_event_attr n =
  String.length n > 2 && n.[0] = 'o' && n.[1] = 'n'

let bad_url_attr n v =
  (n = "href" || n = "src" || n = "xlink:href" || n = "formaction")
  && Str_util.starts_with_ci (String.trim v) "javascript:"

(* 'tag#id.cls1.cls2' — hiccup id/class sugar *)
let split_tag_spec spec =
  let n = String.length spec in
  let m =
    let rec go i =
      if i >= n then n
      else match spec.[i] with '.' | '#' -> i | _ -> go (i + 1)
    in
    go 0
  in
  let tag = sub spec 0 m in
  let id = ref "" and cls = Buffer.create 8 in
  let rec go i =
    if i < n then (
      let j =
        let rec k j =
          if j >= n then n
          else match spec.[j] with '.' | '#' -> j | _ -> k (j + 1)
        in
        k (i + 1)
      in
      let piece = sub spec (i + 1) (j - i - 1) in
      (match spec.[i] with
       | '#' -> id := piece
       | '.' ->
           if Buffer.length cls > 0 then Buffer.add_char cls ' ';
           Buffer.add_string cls piece
       | _ -> ());
      go j)
  in
  go m;
  (tag, !id, Buffer.contents cls)

let hiccup_style (kvs : (Wire.t * Wire.t) list) =
  let buf = Buffer.create 32 in
  List.iter
    (fun (k, v) ->
      let name =
        match k with
        | Wire.Keyword s | Wire.String s | Wire.Symbol s -> Some s
        | _ -> None
      in
      let value =
        match v with
        | Wire.String s -> Some s
        | Wire.Int i -> Some (string_of_int i)
        | Wire.Int64 i -> Some (Int64.to_string i)
        | Wire.Float f -> Some (Printf.sprintf "%g" f)
        | Wire.Keyword s | Wire.Symbol s -> Some s
        | _ -> None
      in
      match name, value with
      | Some n, Some v ->
          if Buffer.length buf > 0 then Buffer.add_char buf ';';
          Buffer.add_string buf n;
          Buffer.add_char buf ':';
          Buffer.add_string buf v
      | _ -> ())
    kvs;
  Buffer.contents buf

let hiccup_attr_map kvs =
  let id = ref "" and cls = ref "" and attrs = ref [] in
  List.iter
    (fun (k, v) ->
      match k with
      | Wire.Keyword n | Wire.String n | Wire.Symbol n -> (
          match n, v with
          | _, _ when is_event_attr n -> ()
          | _, Wire.String s when bad_url_attr n s -> ()
          | "id", Wire.String s -> id := s
          | "class", (Wire.String s | Wire.Keyword s | Wire.Symbol s) ->
              cls := s
          | "style", Wire.Map style ->
              attrs := ("style", hiccup_style style) :: !attrs
          | _, Wire.String s -> attrs := (n, s) :: !attrs
          | _, Wire.Int i -> attrs := (n, string_of_int i) :: !attrs
          | _, Wire.Int64 i -> attrs := (n, Int64.to_string i) :: !attrs
          | _, Wire.Float f -> attrs := (n, Printf.sprintf "%g" f) :: !attrs
          | _, Wire.Bool true -> attrs := (n, "") :: !attrs
          | _, (Wire.Keyword s | Wire.Symbol s) ->
              attrs := (n, s) :: !attrs
          | _, (Wire.Bool false | Wire.Nil) -> ()
          | _ -> ())
      | _ -> ())
    kvs;
  (!id, !cls, List.rev !attrs)

let rec hiccup_node spec rest =
  let tag, spec_id, spec_cls = split_tag_spec spec in
  if
    (not (List.mem tag hiccup_known_tags))
    || List.mem tag hiccup_banned_tags
  then None
  else
    let rest, map_id, map_cls, attrs =
      match rest with
      | Wire.Map kvs :: tl ->
          let i, c, a = hiccup_attr_map kvs in
          (tl, i, c, a)
      | _ -> (rest, "", "", [])
    in
    let id = match map_id with "" -> spec_id | i -> i in
    let cls =
      match spec_cls, map_cls with
      | "", c | c, "" -> c
      | a, b -> a ^ " " ^ b
    in
    let attrs = if id = "" then attrs else ("id", id) :: attrs in
    Some
      (D.el ~tag ~style_class:cls ~attrs
         (List.concat_map hiccup_child rest))

and hiccup_child w =
  match w with
  | Wire.String s -> [ D.txt s ]
  | Wire.Int i -> [ D.txt (string_of_int i) ]
  | Wire.Int64 i -> [ D.txt (Int64.to_string i) ]
  | Wire.Float f -> [ D.txt (Printf.sprintf "%g" f) ]
  | Wire.Bool b -> [ D.txt (string_of_bool b) ]
  | Wire.Nil -> []
  | Wire.Keyword s -> [ D.txt (":" ^ s) ]
  | Wire.Symbol s -> [ D.txt s ]
  | Wire.Array (Wire.Keyword spec :: rest) -> (
      match hiccup_node spec rest with
      | Some e -> [ e ]
      | None -> [])
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      List.concat_map hiccup_child xs
  | _ -> []

(* cljs: read failure or a non-element form -> warning div *)
let hiccup_el literal =
  let warn () =
    D.el ~tag:"div" ~style_class:"warning"
      ~attrs:[ ("title", U.t "block/invalid-hiccup") ]
      ~text:literal []
  in
  match (try Edn.parse literal with _ -> Wire.Nil) with
  | Wire.Array (Wire.Keyword spec :: rest) -> (
      match hiccup_node spec rest with
      | Some e -> e
      | None -> warn ())
  | _ -> warn ()

(* cljs hiccup match_tag — balanced [..] scan; ']' inside a
   double-quoted string does not close *)
let hiccup_close s i =
  let n = String.length s in
  let rec go j depth quoted =
    if j >= n then -1
    else
      match String.unsafe_get s j with
      | _ when quoted -> (
          match String.unsafe_get s j with
          | '\\' when j + 1 < n -> go (j + 2) depth true
          | '"' -> go (j + 1) depth false
          | _ -> go (j + 1) depth true)
      | '"' -> go (j + 1) depth true
      | '[' -> go (j + 1) (depth + 1) quoted
      | ']' -> if depth = 1 then j else go (j + 1) (depth - 1) quoted
      | _ -> go (j + 1) depth quoted
  in
  go i 0 false

(* tag name ends at space / ] / . / # (mldoc take_till1) *)
let hiccup_tag_end s i =
  let n = String.length s in
  let rec go j =
    if j >= n then j
    else
      match String.unsafe_get s j with
      | ' ' | '\t' | '\n' | '\r' | ']' | '.' | '#' -> j
      | _ -> go (j + 1)
  in
  go i


(* ---------- matchers (return (element, chars consumed, run spec)) ---------- *)

(* Edit-mode run spec — how one matched construct's bytes decompose for
   the shared editor's run layer (deps/ui/src/editor/edit_runs.ml).
   Derived inside the same matchers as [parse] so the two can never
   disagree about what matched or how many bytes it consumed:
   - Rs_plain: the match renders as literal source text; no hidden markup.
   - Rs_atomic (display, cls): the whole byte range is one non-editable
     unit — a pill while the caret is outside, raw source while inside.
   - Rs_wrapped (open_len, close_len, re_parse, cls): open/close delimiter
     bytes around inner content; when [re_parse] the inner range
     tokenizes again (nested emphasis), otherwise it is literal (code). *)
type run_spec =
  | Rs_plain
  | Rs_atomic of string * string
  | Rs_wrapped of int * int * bool * string

(* One positioned match for the edit layer: [tok_start, tok_stop) are
   byte offsets into the scanned string. Gaps between tokens are plain
   text by definition. *)
type span_tok = { tok_start : int; tok_stop : int; tok_spec : run_spec }

(* refs: uuids/names of the enclosing reference chain (cljs :ref-set) —
   a ref whose target is in it renders nothing, breaking self- and
   cycle-references. self: uuid of the block/page whose title is being
   parsed; added to refs of any resolved ref's children. *)

let rec parse ?(refs = []) ?(self = "") s =
  let els = ref [] in
  let buf = Buffer.create 64 in
  let push e = els := e :: !els in
  let flush () =
    if Buffer.length buf > 0 then (
      push (D.txt (Buffer.contents buf));
      Buffer.clear buf)
  in
  let n = String.length s in
  let rec go i =
    if i >= n then (
      flush ();
      ())
    else
      match try_match ~refs ~self s i with
      | Some (e, len, _) ->
          flush ();
          push e;
          go (i + len)
      | None ->
          Buffer.add_char buf s.[i];
          go (i + 1)
  in
  go 0;
  List.rev !els

and try_match ~refs ~self s i : (t * int * run_spec) option =
  match s.[i] with
  | '[' -> try_bracket ~refs ~self s i
  | '#' -> try_hash ~refs ~self s i
  | '(' -> try_paren s i
  | '!' -> try_image s i
  | '`' -> try_code s i
  | '*' -> try_star ~refs ~self s i
  | '_' -> try_uscore ~refs ~self s i
  | '~' -> try_strike ~refs ~self s i
  | '^' -> try_hl ~refs ~self s i
  | '=' -> try_eq ~refs ~self s i
  | '$' -> try_math s i
  | '{' -> try_macro ~refs ~self s i
  | '<' -> try_lt ~refs ~self s i
  | ':' -> try_emoji s i
  | 'h' -> try_url s i
  (* a raw newline inside a text run collapses in inline flow — the
     br kind keeps the line break *)
  | '\n' -> Some (br [], 1, Rs_plain)
  | _ -> None

(* [[page]] / [label](url) *)
and try_bracket ~refs ~self s i =
  if Str_util.starts_at s i "[[" then
    match find_sub s (i + 2) "]]" with
    | j when j > i + 2 ->
        let inner = sub s (i + 2) (j - i - 2) in
        Some
          ( page_ref ~refs ~self inner
          , j + 2 - i
          , Rs_atomic (String.trim inner, "ed-page-ref") )
    | _ -> None
  else if Str_util.starts_at s i "[:" then try_hiccup ~refs ~self s i
  else
    match find_sub s (i + 1) "](" with
    | j when j > i + 1 -> (
        match find_sub s (j + 2) ")" with
        | k when k > j + 2 ->
            let label = sub s (i + 1) (j - i - 1) in
            let url = sub s (j + 2) (k - j - 2) in
            Some
              ( external_link url (parse ~refs ~self label)
              , k + 1 - i
              , Rs_atomic ((if label = "" then url else label), "ed-link") )
        | _ -> None)
    | _ -> None

(* span.page-reference[data-ref] with bracket spans around a.page-ref;
   uuid targets resolve via thread-api/pull and re-parse the resolved
   title (cljs page-reference/page-reference-content). *)
and page_ref ?(tag = false) ~refs ~self name =
  let name = String.trim name in
  if Wire.is_uuid_string name then
    if List.mem name refs then text []
    else if tag then resolved_tag_ref ~refs ~self name
    else resolved_ref ~refs ~self name
  else
    (* cljs data-ref is the resolved entity uuid, not the written name *)
    fun context parent ->
    let st = name_uuid_state context name in
    let uuid_sig = Signal.value st in
    if tag then
      preview_link (page_link ~tag:true ~uuid_sig name) context parent
    else
      D.el ~tag:"span" ~style_class:"page-reference"
        ~attrs_signal_v:
          (Logseq_el.attrs_signal uuid_sig
             (fun u -> [ ("data-ref", if u = "" then name else u) ]))
        [ bracket "[["
        ; preview_link (page_link ~tag:false ~uuid_sig name)
        ; bracket "]]" ]
        context parent

(* [[uuid]] — resolved via thread-api/pull.  cljs drops the
   .page-reference chrome when the uuid does not resolve: the row is just
   a bare a.page-ref.broken holding the literal [[uuid]] text.  Resolved
   pages render their title as plain text; block titles are re-parsed
   with the ref chain extended. *)
and resolved_ref ~refs ~self uuid : t =
 fun context parent ->
  let st =
    uuid_meta_state context uuid ~fallback:("", true)
      ~miss:(Some (uuid, true)) ()
  in
  let child_refs =
    self :: (match refs with [] -> [] | _ -> uuid :: refs)
  in
  (reactive
    (fun (title, is_page) ->
      (* data-ref/data-uuid/tabindex/draggable are delegated-event +
         dnd hooks (a.page-ref) *)
      if title = "" then
        (* pull in flight — keep the chrome so the row does not shift *)
        text ~style_class:"page-reference"
          ~data_attrs:[ ("data-ref", uuid) ] []
      else if title = uuid then
        link ~url:"#" ~target:`self_
          ~style_class:"relative page-ref broken"
          ~data_attrs:[ ("data-uuid", uuid); ("tabindex", "0")
                      ; ("draggable", "true") ]
          ~text:("[[" ^ uuid ^ "]]") []
      else
        D.el ~tag:"span" ~style_class:"page-reference"
          ~attrs:[ ("data-ref", String.lowercase_ascii title) ]
          [ bracket "[["
          ; preview_link
              (link ~url:"#" ~target:`self_
                 ~style_class:"relative page-ref"
                 ~data_attrs:[ ("data-uuid", uuid); ("tabindex", "0")
                             ; ("draggable", "true")
                             ; ("data-ref", String.lowercase_ascii title) ]
                 (if is_page then [ text ~value:title [] ]
                  else parse ~refs:child_refs ~self:uuid title))
          ; bracket "]]" ])
    (Signal.value st))
    context parent

(* #[[uuid]] — same lazy resolution, rendered as a .tag anchor *)
and resolved_tag_ref ~refs ~self uuid : t =
 fun context parent ->
  ignore (refs, self);
  let st = uuid_meta_state context uuid ~fallback:(uuid, false) () in
  let title_sig = Signal.value st in
  link ~url:"#" ~target:`self_ ~style_class:"relative tag"
    ~data_attrs:
      (reactive
         (fun (n, _) ->
           [ ("data-uuid", uuid); ("tabindex", "0")
           ; ("data-ref", String.lowercase_ascii n) ])
         title_sig)
    [ text ~value:(reactive (fun (n, _) -> "#" ^ n) title_sig) [] ]
    context parent

and macro_el ~refs ~self body =
  let name, arg_str = macro_args body in
  let arguments = macro_arguments arg_str in
  match name with
  | "cloze" -> (
      (* answer\\cue — cue is the last \\-separated segment *)
      match find_sub arg_str 0 "\\\\" with
      | j when j >= 0 ->
          let cue =
            String.trim
              (sub arg_str (j + 2) (String.length arg_str - j - 2))
          in
          cloze_el (String.trim (sub arg_str 0 j)) (Some cue)
      | _ -> cloze_el (String.trim arg_str) None)
  | "query" ->
      box ~style_class:"warning"
        [ text ~value:(U.t "block.macro/query-deprecated") [] ]
  | "namespace" ->
      box ~style_class:"warning"
        [ text
            ~value:(U.tf "block.macro/namespace-deprecated" [ U.t "library/title" ])
            [] ]
  | "embed" ->
      (* cljs: {{embed}} is deprecated — renders a warning, not an embed *)
      box ~style_class:"warning"
        [ text ~value:(U.t "block.macro/embed-deprecated") [] ]
  | "youtube" -> macro_video_el name arguments (Some `youtube)
  | "vimeo" -> macro_video_el name arguments (Some `vimeo)
  | "bilibili" -> macro_video_el name arguments (Some `bilibili)
  | "loom" -> macro_video_el name arguments (Some `loom)
  | "video" -> macro_video_el name arguments None
  | "youtube-timestamp" -> (
      (* cljs: parse failure renders nothing *)
      match arguments with
      | ts :: _ -> (
          match parse_timestamp ts with
          | Some seconds -> timestamp_el seconds
          | None -> D.txt "")
      | [] -> D.txt "")
  | "tweet" | "twitter" -> (
      match arguments with
      | arg :: _ -> (
          match tweet_id_of arg with
          | Some id -> tweet_iframe id
          | None -> D.txt "")
      | [] -> D.txt "")
  | _ -> macro_else_el ~refs ~self name arguments

(* cljs macro-else-cp + render-macro — user macros from config.edn
   :macros render their expanded content through the inline renderer;
   unknown names keep the literal {{name args}} inside a warning *)
and macro_else_el ~refs ~self name arguments : t =
 fun context parent ->
  let st = macros_state context in
  (reactive
     (fun ms ->
       match List.assoc_opt name ms with
       | Some content ->
           D.el ~tag:"div" ~style_class:"macro inline"
             ~attrs:[ ("data-macro-name", name) ]
             (parse ~refs ~self (macro_subs content arguments))
       | None ->
           D.el ~tag:"div" ~style_class:"macro"
             ~attrs:[ ("data-macro-name", name) ]
             [ D.el ~tag:"span" ~style_class:"warning"
                 ~attrs:
                   [ ( "title"
                     , U.tf "block.macro/unsupported-name" [ name ] ) ]
                 ~text:(macro_to_text name arguments)
                 [] ])
     (Signal.value st))
    context parent

(* [:tag {:attrs} children] — cljs Inline_Hiccup; the tag is checked
   against the raw-html whitelist before the vector is read *)
and try_hiccup ~refs ~self s i =
  ignore (refs, self);
  match hiccup_tag_end s (i + 2) with
  | te when te > i + 2 -> (
      let spec = sub s (i + 2) (te - i - 2) in
      let tag, _, _ = split_tag_spec spec in
      if
        List.mem tag hiccup_known_tags
        && not (List.mem tag hiccup_banned_tags)
      then
        match hiccup_close s i with
        | j when j > i ->
            let literal = sub s i (j + 1 - i) in
            Some (hiccup_el literal, j + 1 - i, Rs_atomic (literal, "ed-hiccup"))
        | _ -> None
      else None)
  | _ -> None

(* #[[page]] / #tag *)

(* #[[page]] / #tag *)
and try_hash ~refs ~self s i =
  if Str_util.starts_at s i "#[[" then
    match find_sub s (i + 3) "]]" with
    | j when j > i + 3 ->
        let inner = sub s (i + 3) (j - i - 3) in
        Some
          ( (if Wire.is_uuid_string inner
             then preview_link (resolved_tag_ref ~refs ~self inner)
             else page_ref ~tag:true ~refs ~self inner)
          , j + 2 - i
          , Rs_atomic ("#" ^ inner, "ed-tag") )
    | _ -> None
  else
    let n = String.length s in
    let is_tag_char c =
      (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
      || (c >= '0' && c <= '9')
      || List.mem c [ '-'; '_'; '/'; '?'; '&'; '='; '.' ]
    in
    let rec stop j =
      if j >= n || not (is_tag_char s.[j]) then j else stop (j + 1)
    in
    let j = stop (i + 1) in
    if j = i + 1 then None
    else
      let raw = sub s (i + 1) (j - i - 1) in
      (* strip trailing punctuation that is surely not part of the tag *)
      let k =
        let rec trim k =
          if k > 0 && List.mem raw.[k - 1] [ '.'; '?'; '!'; ','; ';' ]
          then trim (k - 1)
          else k
        in
        trim (String.length raw)
      in
      if k = 0 then None
      else if i > 0 && s.[i - 1] = '[' && j < n && s.[j] = ']' then
        (* [#A] priority marker — cljs renders it as literal text; the
           tag surfaces in .block-tags instead of an inline link *)
        None
      else
        let name = sub raw 0 k in
        let link : t =
         fun context parent ->
          let st = name_uuid_state context name in
          page_link ~tag:true ~uuid_sig:(Signal.value st) name context parent
        in
        Some (preview_link link, k + 1, Rs_atomic ("#" ^ name, "ed-tag"))

(* deprecated ((uuid)) block-ref form — cljs db-mode parses it to a
   Link/Block_ref but renders it back out as literal ((uuid)) text *)
and try_paren s i =
  ignore (s, i);
  None

(* ![alt](src) *)
and try_image s i =
  if Str_util.starts_at s i "![" then
    match find_sub s (i + 2) "](" with
    | j when j >= i + 2 -> (
        match find_sub s (j + 2) ")" with
        | k when k > j + 2 ->
            let alt = sub s (i + 2) (j - i - 2) in
            let src = sub s (j + 2) (k - j - 2) in
            let el =
              if
                Str_util.ends_with
                  (String.lowercase_ascii src) ".pdf"
              then pdf_link_el ~src ~alt
              else image_el ~src ~alt
            in
            Some (el, k + 1 - i, Rs_atomic (alt, "ed-image"))
        | _ -> None)
    | _ -> None
  else None

(* `code` *)
and try_code s i =
  match find_sub s (i + 1) "`" with
  | j when j > i + 1 ->
      Some
        ( code_span (sub s (i + 1) (j - i - 1))
        , j + 1 - i
        , Rs_wrapped (1, 1, false, "ed-code") )
  | _ -> None

(* **bold** / *italic* *)
and try_star ~refs ~self s i =
  if Str_util.starts_at s i "**" then
    match find_sub s (i + 2) "**" with
    | j when j > i + 2 ->
        Some
          ( emph "b" (parse ~refs ~self (sub s (i + 2) (j - i - 2)))
          , j + 2 - i
          , Rs_wrapped (2, 2, true, "ed-bold") )
    | _ -> None
  else
    match find_sub s (i + 1) "*" with
    | j when j > i + 1 ->
        Some
          ( emph "i" (parse ~refs ~self (sub s (i + 1) (j - i - 1)))
          , j + 1 - i
          , Rs_wrapped (1, 1, true, "ed-italic") )
    | _ -> None

(* __bold__ / _italic_ *)
and try_uscore ~refs ~self s i =
  if Str_util.starts_at s i "__" then
    match find_sub s (i + 2) "__" with
    | j when j > i + 2 ->
        Some
          ( emph "b" (parse ~refs ~self (sub s (i + 2) (j - i - 2)))
          , j + 2 - i
          , Rs_wrapped (2, 2, true, "ed-bold") )
    | _ -> None
  else
    match find_sub s (i + 1) "_" with
    | j when j > i + 1 ->
        Some
          ( emph "i" (parse ~refs ~self (sub s (i + 1) (j - i - 1)))
          , j + 1 - i
          , Rs_wrapped (1, 1, true, "ed-italic") )
    | _ -> None

(* ~~strike~~ *)
and try_strike ~refs ~self s i =
  if Str_util.starts_at s i "~~" then
    match find_sub s (i + 2) "~~" with
    | j when j > i + 2 ->
        Some
          ( emph "del" (parse ~refs ~self (sub s (i + 2) (j - i - 2)))
          , j + 2 - i
          , Rs_wrapped (2, 2, true, "ed-strike") )
    | _ -> None
  else None

(* ^^highlight^^ *)
and try_hl ~refs ~self s i =
  if Str_util.starts_at s i "^^" then
    match find_sub s (i + 2) "^^" with
    | j when j > i + 2 ->
        Some
          ( emph "mark" (parse ~refs ~self (sub s (i + 2) (j - i - 2)))
          , j + 2 - i
          , Rs_wrapped (2, 2, true, "ed-hl") )
    | _ -> None
  else None

(* ==highlight== — markdown delimiter for the same mldoc Highlight *)
and try_eq ~refs ~self s i =
  if Str_util.starts_at s i "==" then
    match find_sub s (i + 2) "==" with
    | j when j > i + 2 ->
        Some
          ( emph "mark" (parse ~refs ~self (sub s (i + 2) (j - i - 2)))
          , j + 2 - i
          , Rs_wrapped (2, 2, true, "ed-hl") )
    | _ -> None
  else None

(* $$..$$ / $..$ *)
and try_math s i =
  if Str_util.starts_at s i "$$" then
    match find_sub s (i + 2) "$$" with
    | j when j > i + 2 ->
        Some
          ( katex_el ~block:false ~display:true
              (sub s (i + 2) (j - i - 2))
          , j + 2 - i
          , Rs_atomic (sub s (i + 2) (j - i - 2), "ed-latex") )
    | _ -> None
  else
    match find_sub s (i + 1) "$" with
    | j when j > i + 1 ->
        Some
          ( katex_el ~block:false ~display:false
              (sub s (i + 1) (j - i - 1))
          , j + 1 - i
          , Rs_atomic (sub s (i + 1) (j - i - 1), "ed-latex") )
    | _ -> None

(* {{macro ...}} *)
and try_macro ~refs ~self s i =
  if Str_util.starts_at s i "{{" then
    match find_sub s (i + 2) "}}" with
    | j when j > i + 2 ->
        let body = sub s (i + 2) (j - i - 2) in
        Some
          ( macro_el ~refs ~self body
          , j + 2 - i
          , Rs_atomic ("{{" ^ fst (macro_args body) ^ "}}", "ed-macro") )
    | _ -> None
  else None

(* <tag>x</tag> / <day> / <br> *)
and try_lt ~refs ~self s i =
  match try_date s i with
  | Some hit -> Some hit
  | None -> (
      match try_html_tag ~refs ~self s i with
      | Some hit -> Some hit
      | None ->
          if Str_util.starts_at s i "<br>" then
            Some (br [], 4, Rs_atomic ("br", "ed-br"))
          else if Str_util.starts_at s i "<br/>" then
            Some (br [], 5, Rs_atomic ("br", "ed-br"))
          else None)

(* <2026-09-27 Sun ...> — date starting with a digit *)
and try_date s i =
  if i + 10 < String.length s
     && is_digit s.[i + 1] && is_digit s.[i + 2] && is_digit s.[i + 3]
     && is_digit s.[i + 4] && s.[i + 5] = '-' && is_digit s.[i + 6]
     && is_digit s.[i + 7] && s.[i + 8] = '-' && is_digit s.[i + 9]
     && is_digit s.[i + 10]
  then
    match find_sub s (i + 10) ">" with
    | j when j > i + 10 ->
        Some
          ( timestamp_text_el ~literal:(sub s i (j + 1 - i))
          , j + 1 - i
          , Rs_plain )
    | _ -> None
  else None

(* <u>x</u> <ins>x</ins> etc — small whitelist *)
and try_html_tag ~refs ~self s i =
  let open_tags =
    [ "u"; "ins"; "del"; "s"; "mark"; "b"; "i"; "em"; "strong"; "code"
    ; "sup"; "sub"; "small"; "kbd" ]
  in
  let try_one t =
    let open_len = String.length t + 2 in
    if Str_util.starts_at s i ("<" ^ t ^ ">") then
      let close = "</" ^ t ^ ">" in
      match find_sub s (i + open_len) close with
      | j when j >= i + open_len ->
          let inner = sub s (i + open_len) (j - i - open_len) in
          let dom_tag = match t with "ins" -> "u" | "s" -> "del" | x -> x in
          Some
            ( emph dom_tag (parse ~refs ~self inner)
            , j + String.length close - i
            , Rs_wrapped (open_len, String.length close, true, "ed-" ^ t) )
      | _ -> None
    else None
  in
  List.find_map try_one open_tags

(* :emoji: *)
and try_emoji s i =
  let n = String.length s in
  let is_name_char c =
    (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')
    || List.mem c [ '_'; '+'; '-' ]
  in
  let rec stop j = if j < n && is_name_char s.[j] then stop (j + 1) else j in
  let j = stop (i + 1) in
  if j < n && s.[j] = ':' && j - i - 1 >= 1 && j - i - 1 <= 32 then
    let name = sub s (i + 1) (j - i - 1) in
    Some (emoji_el name, j + 1 - i, Rs_atomic (":" ^ name ^ ":", "ed-emoji"))
  else None

(* s renders as one bare text node when no inline markup fires —
   callers use the result to emit ~text: (a direct DOM text node, like
   cljs) instead of span.lui-text children, which Playwright :text-is
   requires *)
and plain_text ?(refs = []) ?(self = "") s =
  let n = String.length s in
  let rec go i =
    if i >= n then Some s
    else
      match try_match ~refs ~self s i with
      | Some _ -> None
      | None -> go (i + 1)
  in
  go 0

(* bare http(s):// url *)
and try_url s i =
  if Str_util.starts_at s i "http://" || Str_util.starts_at s i "https://" then (
    let n = String.length s in
    let rec stop j =
      if j >= n || List.mem s.[j] [ ' '; '\t'; '\n'; ')'; ']'; '"' ] then j
      else stop (j + 1)
    in
    let j = stop i in
    let url = sub s i (j - i) in
    Some
      (external_link url [ D.txt url ], j - i, Rs_atomic (url, "ed-url")))
  else None

(* Edit-mode token scan over [s]: the same matcher table as [parse],
   returning positioned span tokens instead of elements (the element is
   still constructed — a cheap closure, no DOM work at match time — and
   dropped). Ref resolution is irrelevant to source splitting, so
   refs/self stay empty. Gaps between tokens are literal plain text. *)
let match_tokens s : span_tok list =
  let n = String.length s in
  let rec go i acc =
    if i >= n then List.rev acc
    else
      match try_match ~refs:[] ~self:"" s i with
      | Some (_, len, tok_spec) ->
          go (i + len) ({ tok_start = i; tok_stop = i + len; tok_spec } :: acc)
      | None -> go (i + 1) acc
  in
  go 0 []
