(* Inline markup parser: raw block-title text -> LUI elements.
   Mirrors the cljs renderer (components/block.cljs inline) — class names
   follow docs/e2e-contract.md exactly. *)

open Promise_ext
open Lui_elements
module D = Render_dom
module U = I18n

let starts_at s i pat =
  let n = String.length pat in
  i + n <= String.length s && String.sub s i n = pat

let find_sub s i pat =
  let n = String.length s and m = String.length pat in
  let rec go j =
    if j + m > n then -1 else if String.sub s j m = pat then j else go (j + 1)
  in
  go i

let bracket s =
  D.el ~tag:"span" ~style_class:"text-gray-500 bracket" [ D.txt s ]

(* cljs page-reference wraps the anchor in .preview-ref-link *)
let preview_link inner =
  D.el ~tag:"span" [ D.el ~tag:"span" ~style_class:"preview-ref-link" [ inner ] ]


(* ---------- emitters ---------- *)

let page_link ~(tag : bool) ?label ?uuid_sig name =
  let name = String.trim name in
  let text =
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
      D.el ~tag:"a" ~style_class:cls ~attrs:base [ D.txt text ]
  | Some u_sig ->
      (* cljs sets :data-uuid on the anchor once the page entity resolves;
         attrs apply is replace-semantic so emit the whole set *)
      D.el ~tag:"a" ~style_class:cls ~attrs:base
        ~attrs_signal_v:(Logseq_dom.attrs_signal u_sig (fun u -> if u = "" then base else ("data-uuid", u) :: base))
        [ D.txt text ]

(* ---- pull memoization ----
   Every [[name]]/uuid anchor used to fire its own thread-api/pull per
   mount. Memoize name->uuid and uuid->(title, is-page) per repo; the
   worker's sync-db-changes broadcast drops the caches
   (worker_events.invalidate_pull_caches). Misses are not cached — a
   just-created entity resolves on the next broadcast+remount. *)

type pull_cache =
  { c_name_uuid : (string, string) Hashtbl.t
  ; c_uuid_meta : (string, string * bool) Hashtbl.t (* title, is-page *)
  }

let pull_caches : (string, pull_cache) Hashtbl.t = Hashtbl.create 4

let repo_cache repo =
  match Hashtbl.find_opt pull_caches repo with
  | Some c -> c
  | None ->
      let c =
        { c_name_uuid = Hashtbl.create 256
        ; c_uuid_meta = Hashtbl.create 256
        }
      in
      Hashtbl.replace pull_caches repo c;
      c

module Uuid_gens = Stdlib.Map.Make (String)

(* republish key for keyed rows: a keyed item keeps its mount whenever
   the spliced/refetched record is structurally equal, so rows whose
   rendered text depends on a touched entity would paint stale resolved
   refs forever. Pair [(reset_gen, uuid_gens)] into the row's dyn key:
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
  match !Runtime.current_repo with
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
  match !Runtime.current_repo with
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
  D.el ~tag:"a" ~style_class:"external-link"
    ~attrs:[ ("href", href); ("target", "_blank") ] label_els

(* ((uuid)) (deprecated form) / #[[uuid]] -> resolved block title via
   thread-api/pull — lazy: the anchor mounts empty and fills when the
   pull returns *)
let block_ref_anchor uuid : t =
 fun context parent ->
  let st = uuid_meta_state context uuid ~fallback:(uuid, false) () in
  let title_sig = Signal.map fst (Signal.value st) in
  D.el ~tag:"a" ~style_class:"relative page-ref"
    ~attrs:[ ("data-ref", uuid); ("tabindex", "0") ]
    ~text_signal:(Logseq_dom.reactive_text Fun.id title_sig)
    [] context parent

let block_ref uuid =
  D.el ~tag:"span" ~style_class:"page-reference"
    ~attrs:[ ("data-ref", uuid) ]
    [ block_ref_anchor uuid ]

let image_el ~src ~alt =
  (* cljs asset-container / image-or-fallback *)
  D.el ~tag:"span" ~style_class:"asset-container image normalize"
    [ D.el ~tag:"img"
        ~style_class:"rounded-sm relative fade-in fade-in-faster"
        ~attrs:
          [ ("src", src); ("loading", "lazy")
          ; ("referrerPolicy", "no-referrer"); ("title", alt); ("alt", alt) ]
        []
    ]

let code_span s = D.el ~tag:"code" [ D.txt s ]

(* cljs extensions/latex: span.latex-inline (inline) / div.latex (block)
   with class "initial", a generated id, and a span.opacity-0 child
   holding the raw tex; the Render_libs doc-scan lazy-loads katex.min.js +
   mhchem.min.js and calls katex.render into the element. *)
let katex_el ~block ~display tex : t =
 fun context parent ->
  Render_libs.ensure ();
  let id = "ls-katex-" ^ Platform.random_uuid () in
  Render_libs.katex_register_pending id display;
  D.el
    ~tag:(if block then "div" else "span")
    ~style_class:(if block then "latex initial" else "latex-inline initial")
    ~id
    [ D.el ~tag:"span" ~style_class:"opacity-0" ~text:tex [] ]
    context parent

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
   seconds->display label; the click handler lives in Render_libs *)
let timestamp_el seconds : t =
 fun context parent ->
  Render_libs.ensure ();
  D.el ~tag:"a" ~style_class:"youtube-timestamp"
    [ D.el ~tag:"span" ~style_class:"youtube-timestamp-icon"
        [ D.el ~tag:"svg" ~style_class:"h-5 w-5"
            ~attrs:[ ("fill", "currentColor"); ("viewBox", "0 0 20 20") ]
            [ D.el ~tag:"path"
                ~attrs:
                  [ ("clip-rule", "evenodd"); ("fill-rule", "evenodd")
                  ; ( "d"
                    , "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" )
                  ]
                [] ] ]
    ; D.el ~tag:"span" ~style_class:"youtube-timestamp-label"
        ~text:(seconds_display seconds)
        [] ]
    context parent

let emph tag children = D.el ~tag children

let emoji_el name =
  (* em-emoji custom element fallback — see render_dom.ml TODO. *)
  D.el ~tag:"em-emoji" ~id:name []

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
  D.el ~tag:"span" ~style_class:"timestamp"
    ~attrs:[ ("active", "true") ]
    [ D.txt literal ]

(* ---------- cloze ---------- *)

(* {{cloze answer\\cue}} — click/Enter/Space toggles span.cloze ->
   span.cloze-revealed showing the answer (cljs fsrs.cljs cloze-cp). *)
let cloze_el answer cue : t =
 fun context parent ->
  let open_ = Signal.state context.Lui_ui.ui_scheduler false in
  let sig_ = Signal.value open_ in
  let hidden_text = match cue with Some c -> "(" ^ c ^ ")" | None -> "[...]" in
  let revealed = D.el ~tag:"span" [ D.txt ("[" ^ answer ^ "]") ] in
  let hidden = D.el ~tag:"span" ~text:hidden_text [] in
  let toggle _name _payload =
    Runtime.signal_set open_ (not (Signal.get_state open_))
  in
  D.el ~tag:"span"
    ~style_class_signal:(Logseq_dom.reactive_class (fun o -> if o then "cloze cloze-revealed" else "cloze") sig_)
    ~attrs_signal_v:(Logseq_dom.reactive_attrs
         (fun o ->
           [ ("role", "button"); ("tabindex", "0")
           ; ("aria-pressed", string_of_bool o) ])
         sig_)
    ~events:"click keydown" ~on_dom_event:toggle
    [ dyn ~equal:(fun a b -> (a : bool) = b)
        (fun o -> if o then revealed else hidden)
        sig_ ]
    context parent

(* ---------- macros ---------- *)

let macro_args body =
  match String.index_opt body ' ' with
  | None -> (String.trim body, "")
  | Some i ->
      (String.lowercase_ascii (String.sub body 0 i)
      , String.trim (String.sub body (i + 1) (String.length body - i - 1)))

(* cljs extensions/video youtube-regex: the id is the first [\w-]+ after
   youtu.be/|y2u.be/, /shorts/|/embed/|/v/, or ?v=/&v=; a bare 11-char
   arg is itself an id (provider hint :youtube). *)
let youtube_id url =
  let id_after marker =
    match find_sub url 0 marker with
    | j when j >= 0 -> (
        let k = j + String.length marker in
        let n = String.length url in
        let rec stop i =
          if i < n then
            match url.[i] with
            | 'a' .. 'z' | 'A' .. 'Z' | '0' .. '9' | '_' | '-' -> stop (i + 1)
            | _ -> i
          else i
        in
        match stop k - k with
        | len when len > 0 -> Some (String.sub url k len)
        | _ -> None)
    | _ -> None
  in
  match
    List.find_map id_after
      [ "youtu.be/"; "y2u.be/"; "/shorts/"; "/embed/"; "/v/"; "v=" ]
  with
  | Some id -> Some id
  | None ->
      let u = String.trim url in
      if String.length u = 11 then Some u else None

(* cljs video-start: [?&]t=(\d+) *)
let youtube_start url =
  match find_sub url 0 "t=" with
  | j when j > 0 && (url.[j - 1] = '?' || url.[j - 1] = '&') -> (
      let k = j + 2 in
      let n = String.length url in
      let rec stop i =
        if i < n && url.[i] >= '0' && url.[i] <= '9' then stop (i + 1)
        else i
      in
      match stop k - k with
      | len when len > 0 -> Some (String.sub url k len)
      | _ -> None)
  | _ -> None

let first_arg args =
  match String.index_opt args ' ' with
  | Some i -> String.sub args 0 i
  | None -> args

(* cljs youtube-video iframe + attrs; enablejsapi=1 is required for the
   timestamp seek postMessage. The shell stays .embed-block (e2e contract
   waits on it); cljs wraps in .video-embed-shell/.video-embed-frame. *)
let youtube_iframe id start =
  let src =
    "https://www.youtube.com/embed/" ^ id ^ "?enablejsapi=1"
    ^ (match start with Some s -> "&start=" ^ s | None -> "")
  in
  D.el ~tag:"div" ~style_class:"embed-block"
    [ D.el ~tag:"iframe"
        ~attrs:
          [ ("id", "youtube-player-" ^ id)
          ; ("allow-full-screen", "allowfullscreen")
          ; ( "allow"
            , "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" )
          ; ("referrer-policy", "strict-origin-when-cross-origin")
          ; ("referer", "https://logseq.com")
          ; ("frame-border", "0")
          ; ("src", src) ]
        [] ]

let embed_iframe src =
  (* iframes are plugin-loaded in cljs; emit the shell + src so the
     container is present (e2e waits on iframe inside .embed-block). *)
  D.el ~tag:"div" ~style_class:"embed-block"
    [ D.el ~tag:"iframe" ~attrs:[ ("src", src) ] [] ]


(* ---------- matchers (return (element, chars consumed)) ---------- *)

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
      | Some (e, len) ->
          flush ();
          push e;
          go (i + len)
      | None ->
          Buffer.add_char buf s.[i];
          go (i + 1)
  in
  go 0;
  List.rev !els

and try_match ~refs ~self s i : (t * int) option =
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
  | '$' -> try_math s i
  | '{' -> try_macro ~refs ~self s i
  | '<' -> try_lt ~refs ~self s i
  | ':' -> try_emoji s i
  | 'h' -> try_url s i
  | '\n' -> Some (D.el ~tag:"br" [], 1)
  | _ -> None

(* [[page]] / [label](url) *)
and try_bracket ~refs ~self s i =
  if starts_at s i "[[" then
    match find_sub s (i + 2) "]]" with
    | j when j > i + 2 ->
        Some (page_ref ~refs ~self (String.sub s (i + 2) (j - i - 2)), j + 2 - i)
    | _ -> None
  else
    match find_sub s (i + 1) "](" with
    | j when j > i + 1 -> (
        match find_sub s (j + 2) ")" with
        | k when k > j + 2 ->
            let label = String.sub s (i + 1) (j - i - 1) in
            let url = String.sub s (j + 2) (k - j - 2) in
            Some (external_link url (parse ~refs ~self label), k + 1 - i)
        | _ -> None)
    | _ -> None

(* span.page-reference[data-ref] with bracket spans around a.page-ref;
   uuid targets resolve via thread-api/pull and re-parse the resolved
   title (cljs page-reference/page-reference-content). *)
and page_ref ?(tag = false) ~refs ~self name =
  let name = String.trim name in
  if Wire.is_uuid_string name then
    if List.mem name refs then D.el ~tag:"span" []
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
        ~attrs:[ ("data-ref", name) ]
        ~attrs_signal_v:(Logseq_dom.reactive_attrs (fun u -> [ ("data-ref", if u = "" then name else u) ])
             uuid_sig)
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
  dyn
    ~equal:(fun (a : string * bool) b -> a = b)
    (fun (title, is_page) ->
      if title = "" then
        (* pull in flight — keep the chrome so the row does not shift *)
        D.el ~tag:"span" ~style_class:"page-reference"
          ~attrs:[ ("data-ref", uuid) ] []
      else if title = uuid then
        D.el ~tag:"a" ~style_class:"relative page-ref broken"
          ~attrs:[ ("data-uuid", uuid); ("tabindex", "0")
                 ; ("draggable", "true") ]
          [ D.txt ("[[" ^ uuid ^ "]]") ]
      else
        D.el ~tag:"span" ~style_class:"page-reference"
          ~attrs:[ ("data-ref", String.lowercase_ascii title) ]
          [ bracket "[["
          ; preview_link
              (D.el ~tag:"a" ~style_class:"relative page-ref"
                 ~attrs:[ ("data-uuid", uuid); ("tabindex", "0")
                        ; ("draggable", "true")
                        ; ("data-ref", String.lowercase_ascii title) ]
                 [ (if is_page then D.el ~tag:"span" [ D.txt title ]
                    else
                      D.el ~tag:"span"
                        (parse ~refs:child_refs ~self:uuid title)) ])
          ; bracket "]]" ])
    (Signal.value st)
    context parent

(* #[[uuid]] — same lazy resolution, rendered as a .tag anchor *)
and resolved_tag_ref ~refs ~self uuid : t =
 fun context parent ->
  ignore (refs, self);
  let st = uuid_meta_state context uuid ~fallback:(uuid, false) () in
  let title_sig = Signal.map fst (Signal.value st) in
  D.el ~tag:"a" ~style_class:"relative tag"
    ~attrs:[ ("data-uuid", uuid); ("tabindex", "0") ]
    ~attrs_signal_v:(Logseq_dom.reactive_attrs
         (fun n ->
           [ ("data-uuid", uuid); ("tabindex", "0")
           ; ("data-ref", String.lowercase_ascii n) ])
         title_sig)
    [ D.el ~tag:"span" ~text_signal:(Logseq_dom.reactive_text (fun n -> "#" ^ n) title_sig) [] ]
    context parent

and macro_el ~refs:_refs ~self:_self body =
  let name, args = macro_args body in
  match name with
  | "cloze" -> (
      (* answer\\cue — cue is the last \\-separated segment *)
      match find_sub args 0 "\\\\" with
      | j when j >= 0 ->
          let cue = String.trim (String.sub args (j + 2) (String.length args - j - 2)) in
          cloze_el (String.trim (String.sub args 0 j)) (Some cue)
      | _ -> cloze_el (String.trim args) None)
  | "query" ->
      D.el ~tag:"div" ~style_class:"warning"
        ~text:(U.t "block.macro/query-deprecated") []
  | "namespace" ->
      D.el ~tag:"div" ~style_class:"warning"
        ~text:(U.tf "block.macro/namespace-deprecated" [ U.t "library/title" ])
        []
  | "embed" ->
      (* cljs: {{embed}} is deprecated — renders a warning, not an embed *)
      D.el ~tag:"div" ~style_class:"warning"
        ~text:(U.t "block.macro/embed-deprecated") []
  | "youtube" | "video" -> (
      let url = first_arg args in
      match youtube_id url with
      | Some id -> youtube_iframe id (youtube_start url)
      | None -> embed_iframe url)
  | "youtube-timestamp" -> (
      (* cljs: parse failure renders nothing *)
      match parse_timestamp (first_arg args) with
      | Some seconds -> timestamp_el seconds
      | None -> D.txt "")
  | "vimeo" | "bilibili" | "tweet" | "twitter" | "renderer" ->
      embed_iframe args
  | _ -> D.txt ("{{" ^ body ^ "}}")

(* #[[page]] / #tag *)

(* #[[page]] / #tag *)
and try_hash ~refs ~self s i =
  if starts_at s i "#[[" then
    match find_sub s (i + 3) "]]" with
    | j when j > i + 3 ->
        let inner = String.sub s (i + 3) (j - i - 3) in
        Some
          ( (if Wire.is_uuid_string inner
             then preview_link (resolved_tag_ref ~refs ~self inner)
             else page_ref ~tag:true ~refs ~self inner)
          , j + 2 - i )
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
      let raw = String.sub s (i + 1) (j - i - 1) in
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
      else
        let name = String.sub raw 0 k in
        let link : t =
         fun context parent ->
          let st = name_uuid_state context name in
          page_link ~tag:true ~uuid_sig:(Signal.value st) name context parent
        in
        Some (preview_link link, k + 1)

(* deprecated ((uuid)) block-ref form — cljs db-mode parses it to a
   Link/Block_ref but renders it back out as literal ((uuid)) text *)
and try_paren s i =
  ignore (s, i);
  None

(* ![alt](src) *)
and try_image s i =
  if starts_at s i "![" then
    match find_sub s (i + 2) "](" with
    | j when j >= i + 2 -> (
        match find_sub s (j + 2) ")" with
        | k when k > j + 2 ->
            let alt = String.sub s (i + 2) (j - i - 2) in
            let src = String.sub s (j + 2) (k - j - 2) in
            Some (image_el ~src ~alt, k + 1 - i)
        | _ -> None)
    | _ -> None
  else None

(* `code` *)
and try_code s i =
  match find_sub s (i + 1) "`" with
  | j when j > i + 1 ->
      Some (code_span (String.sub s (i + 1) (j - i - 1)), j + 1 - i)
  | _ -> None

(* **bold** / *italic* *)
and try_star ~refs ~self s i =
  if starts_at s i "**" then
    match find_sub s (i + 2) "**" with
    | j when j > i + 2 ->
        Some
          (emph "b" (parse ~refs ~self (String.sub s (i + 2) (j - i - 2))),
           j + 2 - i)
    | _ -> None
  else
    match find_sub s (i + 1) "*" with
    | j when j > i + 1 ->
        Some
          (emph "i" (parse ~refs ~self (String.sub s (i + 1) (j - i - 1))),
           j + 1 - i)
    | _ -> None

(* __bold__ / _italic_ *)
and try_uscore ~refs ~self s i =
  if starts_at s i "__" then
    match find_sub s (i + 2) "__" with
    | j when j > i + 2 ->
        Some
          (emph "b" (parse ~refs ~self (String.sub s (i + 2) (j - i - 2))),
           j + 2 - i)
    | _ -> None
  else
    match find_sub s (i + 1) "_" with
    | j when j > i + 1 ->
        Some
          (emph "i" (parse ~refs ~self (String.sub s (i + 1) (j - i - 1))),
           j + 1 - i)
    | _ -> None

(* ~~strike~~ *)
and try_strike ~refs ~self s i =
  if starts_at s i "~~" then
    match find_sub s (i + 2) "~~" with
    | j when j > i + 2 ->
        Some
          (emph "del" (parse ~refs ~self (String.sub s (i + 2) (j - i - 2))),
           j + 2 - i)
    | _ -> None
  else None

(* ^^highlight^^ *)
and try_hl ~refs ~self s i =
  if starts_at s i "^^" then
    match find_sub s (i + 2) "^^" with
    | j when j > i + 2 ->
        Some
          (emph "mark" (parse ~refs ~self (String.sub s (i + 2) (j - i - 2))),
           j + 2 - i)
    | _ -> None
  else None

(* $$..$$ / $..$ *)
and try_math s i =
  if starts_at s i "$$" then
    match find_sub s (i + 2) "$$" with
    | j when j > i + 2 ->
        Some
          (katex_el ~block:false ~display:true
             (String.sub s (i + 2) (j - i - 2))
          , j + 2 - i)
    | _ -> None
  else
    match find_sub s (i + 1) "$" with
    | j when j > i + 1 ->
        Some
          (katex_el ~block:false ~display:false
             (String.sub s (i + 1) (j - i - 1))
          , j + 1 - i)
    | _ -> None

(* {{macro ...}} *)
and try_macro ~refs ~self s i =
  if starts_at s i "{{" then
    match find_sub s (i + 2) "}}" with
    | j when j > i + 2 ->
        Some (macro_el ~refs ~self (String.sub s (i + 2) (j - i - 2)), j + 2 - i)
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
          if starts_at s i "<br>" then Some (D.el ~tag:"br" [], 4)
          else if starts_at s i "<br/>" then Some (D.el ~tag:"br" [], 5)
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
          ( timestamp_text_el ~literal:(String.sub s i (j + 1 - i))
          , j + 1 - i )
    | _ -> None
  else None

and is_digit c = c >= '0' && c <= '9'

(* <u>x</u> <ins>x</ins> etc — small whitelist *)
and try_html_tag ~refs ~self s i =
  let open_tags =
    [ "u"; "ins"; "del"; "s"; "mark"; "b"; "i"; "em"; "strong"; "code"
    ; "sup"; "sub"; "small"; "kbd" ]
  in
  let try_one t =
    let open_len = String.length t + 2 in
    if starts_at s i ("<" ^ t ^ ">") then
      let close = "</" ^ t ^ ">" in
      match find_sub s (i + open_len) close with
      | j when j >= i + open_len ->
          let inner = String.sub s (i + open_len) (j - i - open_len) in
          let dom_tag = match t with "ins" -> "u" | "s" -> "del" | x -> x in
          Some
            (emph dom_tag (parse ~refs ~self inner),
             j + String.length close - i)
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
    Some (emoji_el (String.sub s (i + 1) (j - i - 1)), j + 1 - i)
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
  if starts_at s i "http://" || starts_at s i "https://" then (
    let n = String.length s in
    let rec stop j =
      if j >= n || List.mem s.[j] [ ' '; '\t'; '\n'; ')'; ']'; '"' ] then j
      else stop (j + 1)
    in
    let j = stop i in
    let url = String.sub s i (j - i) in
    Some (external_link url [ D.txt url ], j - i))
  else None
