(* Inline markup parser: raw block-title text -> LUI elements.
   Mirrors the cljs renderer (components/block.cljs inline) — class names
   follow docs/e2e-contract.md exactly. *)

open Lui_elements
module D = Render_dom

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

let is_uuid_like s =
  String.length s = 36
  && s.[8] = '-' && s.[13] = '-' && s.[18] = '-' && s.[23] = '-'
  && String.for_all
       (fun c ->
         (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')
         || (c >= 'A' && c <= 'F') || c = '-')
       s

(* ---------- emitters ---------- *)

let page_link ~(tag : bool) ?label name =
  let name = String.trim name in
  let text =
    match label with
    | Some l when String.trim l <> "" -> l
    | _ -> if tag then "#" ^ name else name
  in
  D.el ~tag:"a"
    ~style_class:(if tag then "relative tag" else "relative page-ref")
    ~attrs:
      [ ("data-ref", String.lowercase_ascii name)
      ; ("tabindex", "0")
      ; ("draggable", "true") ]
    [ D.txt text ]

let external_link href label_els =
  D.el ~tag:"a" ~style_class:"external-link"
    ~attrs:[ ("href", href); ("target", "_blank") ] label_els

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

(* TODO(render): real katex — needs a JS hook the dom adapter does not
   expose yet; emits span.katex with raw tex so .katex selectors match. *)
let katex_el tex = D.el ~tag:"span" ~style_class:"katex" ~text:tex []

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
  let dt =
    Js.Date.fromFloat (Js.Date.utc ~year:(float y) ~month:(float (m - 1)) ~date:(float d) ())
  in
  match day_diff ~y ~m ~d with
  | 0 -> "Today"
  | -1 -> "Yesterday"
  | 1 -> "Tomorrow"
  | _ -> Dates.journal_title_of dt

let datetime_el ~y ~m ~d =
  let title = Dates.journal_title_of (Js.Date.fromFloat (Js.Date.utc ~year:(float y) ~month:(float (m - 1)) ~date:(float d) ())) in
  D.el ~tag:"span" ~style_class:"ls-datetime flex flex-row gap-1 items-center"
    [ D.el ~tag:"a" ~style_class:"relative page-ref"
        ~attrs:[ ("data-ref", String.lowercase_ascii title); ("tabindex", "0") ]
        [ D.txt (date_label y m d) ]
    ]

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
    ~style_class_signal:
      (D.text_of_class_signal sig_ (fun o ->
           if o then "cloze cloze-revealed" else "cloze"))
    ~attrs_signal_v:
      (D.text_of_class_signal sig_ (fun o ->
           Logseq_dom.attrs_json
             [ ("role", "button"); ("tabindex", "0")
             ; ("aria-pressed", string_of_bool o) ]))
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

let youtube_embed_src url =
  let id =
    match find_sub url 0 "youtu.be/" with
    | j when j >= 0 ->
        let k = j + 9 in
        let e = find_sub url k "?" in
        let e = if e < 0 then String.length url else e in
        String.sub url k (e - k)
    | _ -> (
        match find_sub url 0 "v=" with
        | j when j >= 0 ->
            let k = j + 2 in
            let e = find_sub url k "&" in
            let e = if e < 0 then String.length url else e in
            String.sub url k (e - k)
        | _ -> url)
  in
  "https://www.youtube.com/embed/" ^ id

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
  | '(' -> try_paren ~refs ~self s i
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
  if is_uuid_like name then
    if List.mem name refs then D.el ~tag:"span" []
    else if tag then resolved_tag_ref ~refs ~self name
    else
      D.el ~tag:"span" ~style_class:"page-reference"
        ~attrs:[ ("data-ref", name) ]
        [ bracket "[["; preview_link (resolved_ref ~refs ~self name); bracket "]]" ]
  else if tag then preview_link (page_link ~tag:true name)
  else
    D.el ~tag:"span" ~style_class:"page-reference"
      ~attrs:[ ("data-ref", name) ]
      [ bracket "[["; preview_link (page_link ~tag:false name); bracket "]]" ]

(* ((uuid)) -> resolved block/page title; pages render as plain text,
   block titles are re-parsed with the ref chain extended *)
and resolved_ref ~refs ~self uuid : t =
 fun context parent ->
  let st = Signal.state context.Lui_ui.ui_scheduler ("", true) in
  Render_state.with_repo (fun repo ->
      Runtime.invoke3 "thread-api/pull" (Wire.String repo)
        (Wire.String "[:block/title :block/name]")
        (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
      |> Js.Promise.then_ (fun w ->
             (match Wire.map_get_string w "block/title" with
              | Some t when String.trim t <> "" ->
                  let is_page =
                    match Wire.map_get_string w "block/name" with
                    | Some n -> String.trim n <> ""
                    | None -> false
                  in
                  Runtime.signal_set st (t, is_page)
              | _ -> Runtime.signal_set st (uuid, true));
             Js.Promise.resolve ())
      |> ignore);
  let child_refs =
    self :: (match refs with [] -> [] | _ -> uuid :: refs)
  in
  D.el ~tag:"a" ~style_class:"relative page-ref"
    ~attrs:[ ("data-uuid", uuid); ("tabindex", "0"); ("draggable", "true") ]
    ~attrs_signal_v:
      (D.text_of_class_signal
         (Signal.map fst (Signal.value st))
         (fun n ->
           Logseq_dom.attrs_json
             [ ("data-ref", String.lowercase_ascii n) ]))
    [ dyn
        ~equal:(fun (a : string * bool) b -> a = b)
        (fun (title, is_page) ->
          if is_page then D.el ~tag:"span" [ D.txt title ]
          else D.el ~tag:"span" (parse ~refs:child_refs ~self:uuid title))
        (Signal.value st) ]
    context parent

(* #[[uuid]] — same lazy resolution, rendered as a .tag anchor *)
and resolved_tag_ref ~refs ~self uuid : t =
 fun context parent ->
  ignore (refs, self);
  let st = Signal.state context.Lui_ui.ui_scheduler uuid in
  Render_state.with_repo (fun repo ->
      Runtime.invoke3 "thread-api/pull" (Wire.String repo)
        (Wire.String "[:block/title]")
        (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
      |> Js.Promise.then_ (fun w ->
             (match Wire.map_get_string w "block/title" with
              | Some t when String.trim t <> "" -> Runtime.signal_set st t
              | _ -> ());
             Js.Promise.resolve ())
      |> ignore);
  D.el ~tag:"a" ~style_class:"relative tag"
    ~attrs:[ ("data-uuid", uuid); ("tabindex", "0") ]
    ~attrs_signal_v:
      (D.text_of_class_signal (Signal.value st) (fun n ->
           Logseq_dom.attrs_json
             [ ("data-ref", String.lowercase_ascii n) ]))
    ~text_signal:(D.text_of_class_signal (Signal.value st) (fun n -> "#" ^ n))
    [] context parent

and macro_el ~refs ~self body =
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
      D.el ~tag:"div" ~style_class:"custom-query-results"
        [ D.el ~tag:"button"
            ~style_class:
              "ls-query-setting ls-small-icon text-muted-foreground ml-2 w-6 h-6"
            ~attrs:[ ("type", "button"); ("title", "Set query") ]
            []
        ]
  | "embed" -> (
      if starts_at args 0 "[[" && find_sub args 0 "]]" >= 0 then
        let j = find_sub args 0 "]]" in
        D.el ~tag:"div" ~style_class:"embed-block"
          [ page_ref ~refs ~self (String.sub args 2 (j - 2)) ]
      else if starts_at args 0 "((" && find_sub args 0 "))" >= 0 then
        let j = find_sub args 0 "))" in
        D.el ~tag:"div" ~style_class:"embed-block"
          [ page_ref ~refs ~self (String.sub args 2 (j - 2)) ]
      else if args <> "" then embed_iframe args
      else D.el ~tag:"div" ~style_class:"embed-block" [])
  | "youtube" | "video" ->
      embed_iframe (youtube_embed_src args)
  | "vimeo" | "bilibili" | "tweet" | "twitter" | "renderer" ->
      embed_iframe args
  | _ -> D.txt ("{{" ^ body ^ "}}")

(* #[[page]] / #tag *)
and try_hash ~refs ~self s i =
  if starts_at s i "#[[" then
    match find_sub s (i + 3) "]]" with
    | j when j > i + 3 ->
        Some
          (page_ref ~tag:true ~refs ~self
             (String.sub s (i + 3) (j - i - 3)),
           j + 2 - i)
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
      else Some (page_link ~tag:true (String.sub raw 0 k), k + 1)

(* ((uuid)) — same page-reference rendering as [[uuid]] *)
and try_paren ~refs ~self s i =
  if starts_at s i "((" then
    match find_sub s (i + 2) "))" with
    | j when j > i + 2 ->
        Some
          (page_ref ~refs ~self (String.sub s (i + 2) (j - i - 2)),
           j + 2 - i)
    | _ -> None
  else None

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
        Some (katex_el (String.sub s (i + 2) (j - i - 2)), j + 2 - i)
    | _ -> None
  else
    match find_sub s (i + 1) "$" with
    | j when j > i + 1 ->
        Some (katex_el (String.sub s (i + 1) (j - i - 1)), j + 1 - i)
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
        let y = int_of_string (String.sub s (i + 1) 4) in
        let m = int_of_string (String.sub s (i + 6) 2) in
        let d = int_of_string (String.sub s (i + 9) 2) in
        Some (datetime_el ~y ~m ~d, j + 1 - i)
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
