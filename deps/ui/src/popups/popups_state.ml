(* Autocomplete popups + block context menu state — mirrors
   src/main/frontend/components/editor.cljs (auto-complete) and
   src/main/frontend/components/content.cljs (custom context menu).

   Documented cross-area hooks dispatched on document:
   - "ls:editor-insert"  CustomEvent {text, from, to, back}
     replace buffer range [from,to) (the typed trigger text) with text;
     `back` pulls the caret back (cljs backward-pos).
   - "ls:editor-command" CustomEvent {command, from, to, block?}
     editor-owned side effect (heading/status/priority/color/…) consumed
     by editor/editor_commands.ml. `from`/`to` is the slash-command range
     the consumer clears before running the command.
   The editor area wires the listeners; see e2e-contract.md. *)

module S = String
module U = Ui_strings

type ac_kind =
    Slash | Page_ref | Page_embed | Block_ref | Tag_search
  | Template_search | Embed_ref
type item_action =
  | Emit of string * int (* ls:editor-insert {text, back} *)
  | Emit_exit of string (* ls:editor-insert {text, exit} — cljs clear-edit! *)
  | Switch of ac_kind (* reopen as another autocomplete *)
  | Editor_cmd of string (* ls:editor-command {command, from, to} *)
  | Embed of string (* page title — insert a :block/link embed *)
  | Tag_apply of string (* existing entity — cljs tag-on-chosen-handler *)
  | Tag_create of string (* "New tag" row — always creates a class *)
  | Template_apply of string (* template block uuid — apply-template op *)
  | Run_query of bool (* cljs editor/run-query-command; arg = advanced? *)
  | Noop (* "No matched commands" row — applies to nothing *)

type ac_item =
  { ai_key : string
  ; ai_label : string
  ; ai_icon : string option (* tabler/tabler-ext icon name *)
  ; ai_group : string option
  ; ai_info : string option
  ; ai_idx : int
  ; ai_hdr : string option (* group-name banner, only on group starts *)
  ; ai_act : item_action
  }

let mk_item ~key ~label ?icon ?group ?info act =
  { ai_key = key; ai_label = label; ai_icon = icon; ai_group = group
  ; ai_info = info; ai_idx = -1; ai_hdr = None; ai_act = act }

let empty_key = "__ac_empty__"
let empty_item = mk_item ~key:empty_key ~label:"" Noop

type ac =
  { kind : ac_kind
  ; x : float
  ; y : float
  ; query : string
  ; tpos : int (* query-trigger offset (the "/" "[[" "((" "#" start) *)
  ; tlen : int
  ; items : ac_item list
  ; chosen : int
  ; editor : Dom_ext.element
  }

type cm_item =
  (* label, optional (binding, display caps) shortcut, command id —
     mirrors ui/dropdown-shortcut output; the id is what
     ls:editor-command carries *)
  | Ci_item of string * (string * string list) option * string
  | Ci_sub of string
  | Ci_sep
  | Ci_colors
  | Ci_headings

type cm =
  { cx : float
  ; cy : float
  ; block_id : string
  ; multi : bool
  ; entries : cm_item list
  }

type view =
  { ac : ac option
  ; cm : cm option
  }

type t =
  { vs : view Signal.state
  ; gen : int ref (* stale-response guard *)
  ; titles : string list ref
  ; tag_titles : (string * string option) list ref
    (* class/tag entities for the # popup: (title, tabler icon) *)
  ; templates : (string * string) list ref (* (uuid, title) *)  }

(* the live popups layer — exactly one exists per app; lets editor key
   handling yield to an open autocomplete (cljs: the commands popup consumes
   arrows/enter/tab/escape before the editor sees them) *)
let active : t option ref = ref None

let make scheduler : t =
  let t =
    { vs = Signal.state scheduler { ac = None; cm = None }
  ; gen = ref 0
  ; titles = ref []
    ; tag_titles = ref []
    ; templates = ref []  }
  in
  active := Some t;
  t

let get t = Signal.get t.vs.Signal.state_signal
let ac_open () =
  match !active with
  | Some t -> (get t).ac <> None
  | None -> false

let set t v = Runtime.signal_set t.vs v
let set_ac t ac = set t { (get t) with ac }
let set_cm t cm = set t { (get t) with cm }
let close_ac t = set_ac t None
let close_cm t = set_cm t None

let ac_class_of_kind = function
  | Slash -> "cp__commands-slash"
  | Page_ref | Page_embed | Tag_search | Template_search | Embed_ref
      -> "black"
  | Block_ref -> "ac-block-search"
;;

let trigger_len_of_kind = function
  | Slash | Tag_search | Template_search -> 1
  | Page_ref | Page_embed | Block_ref -> 2
  | Embed_ref -> 0 (* only reachable via Switch — no typed trigger *)

(* cljs data-editor-popup-ref values drive popup sizing in editor.css *)
let popup_ref_of_kind = function
  | Slash -> "commands"
  | Page_ref | Page_embed | Embed_ref | Template_search -> "page-search"
  | Block_ref -> "block-search"
  | Tag_search -> "page-search-hashtag"
;;

let trigger_text_of_kind = function
  | Page_ref | Page_embed -> "[["
  | Embed_ref -> ""
  | Block_ref -> "(("
  | Tag_search -> "#"
  | Slash | Template_search -> "/"
;;

(* ---- fuzzy match (cljs search/fuzzy-search is subsequence based —
   "h1" must match "Heading 1", "te 1" must match "template 1") ---- *)

let fuzzy_score hay needle =
  let h = S.lowercase_ascii hay and n = S.lowercase_ascii needle in
  let hl = S.length h and nl = S.length n in
  if nl = 0 then Some 0
  else if nl > hl then None
  else
    let rec first_hit i =
      if i >= hl then None
      else if h.[i] = n.[0] then Some i
      else first_hit (i + 1)
    in
    match first_hit 0 with
    | None -> None
    | Some first ->
        let rec go hi ni =
          if ni = nl then Some hi
          else if hi >= hl then None
          else if h.[hi] = n.[ni] then go (hi + 1) (ni + 1)
          else go (hi + 1) ni
        in
        (match go (first + 1) 1 with
         | Some last -> Some ((first * 1000) + (last - first))
         | None -> None)
;;

(* ---- slash command table ---- *)

let journal_offset days =
  let d = Dates.date_now () in
  ignore (Js.Date.setDate ~date:(Js.Date.getDate d +. float_of_int days) d);
  "[[" ^ Dates.journal_title_of d ^ "]]"
;;

let current_time () =
  let d = Dates.date_now () in
  Printf.sprintf "%02d:%02d"
    (int_of_float (Js.Date.getHours d))
    (int_of_float (Js.Date.getMinutes d))
;;

(* (i18n key, icon, action) — icon names mirror commands.cljs :icon/*
   values verbatim (custom-pack names like pageRef stay camelCase) *)
let group_items grp entries =
  let g = Some (U.t grp) in
  List.map
    (fun (key, icon, act) ->
      mk_item ~key ~label:(U.t key) ~icon ?group:g act)
    entries
;;

let cmd label = Editor_cmd label

(* has_heading gates "Clear heading" (cljs filter-commands drops it when
   the edited block has no heading prop, leaving "No matched commands") *)
let slash_items ~has_heading : ac_item list =  List.concat
    [ group_items "editor.slash/group-basic"
        [ "editor.slash/node-reference", "pageRef", Switch Page_ref
        ; "editor.slash/node-embed", "blockEmbed", Switch Embed_ref ]
    ; group_items "editor.slash/group-format"
        [ "ui/link", "link", cmd "link"
        ; "editor.slash/image-link", "photoLink", cmd "image-link"
        ; "editor.slash/underline", "underline", Emit ("<ins></ins>", 6)
        ; "editor.slash/code-block", "code", cmd "code-block"
        ; "class.built-in/quote-block", "quote", cmd "quote"
        ; "editor.slash/math-block", "math", cmd "math-block" ]
    ; (let g = Some (U.t "editor.slash/group-heading") in
       [ mk_item ~key:"editor.slash/normal-text"
           ~label:(U.t "editor.slash/normal-text") ~icon:"text" ?group:g
           (cmd "normal-text") ]
       @ (if has_heading then
            [ mk_item ~key:"editor.slash/clear-heading"
                ~label:(U.t "editor.slash/clear-heading") ~icon:"heading-off"
                ?group:g (cmd "clear-heading") ]
          else [])
       @ List.init 6 (fun i ->
           let l = string_of_int (i + 1) in
           mk_item ~key:("heading-" ^ l)
             ~label:(U.tf "editor/heading" [ l ]) ~icon:("h-" ^ l)
             ?group:g (cmd ("heading:" ^ l))))    ; group_items "editor.slash/group-task-status"
        [ "property.status/backlog", "backlog", cmd "status:Backlog"
        ; "property.status/todo", "todo", cmd "status:Todo"
        ; "property.status/doing", "inProgress50", cmd "status:Doing"
        ; "property.status/in-review", "inReview", cmd "status:In Review"
        ; "property.status/done", "done", cmd "status:Done"
        ; "property.status/canceled", "cancelled", cmd "status:Canceled" ]    ; group_items "editor.slash/group-task-date"
        [ "property.built-in/deadline", "calendar-stats", cmd "deadline"
        ; "property.built-in/scheduled", "calendar-month", cmd "scheduled" ]
    ; (let g = Some (U.t "editor.slash/group-priority") in
       mk_item ~key:"editor.slash/no-priority"
         ~label:(U.t "editor.slash/no-priority") ~icon:"priorityLvlNone"
         ?group:g (cmd "priority:")
       :: List.map            (fun lvl ->
              mk_item ~key:("priority-" ^ lvl)
                ~label:
                  (U.tf "editor.slash/priority-label"
                     [ U.t ("property.priority/" ^ lvl) ])
                ~icon:("priorityLvl" ^ String.capitalize_ascii lvl)
                ?group:g (cmd ("priority:" ^ lvl)))            [ "low"; "medium"; "high"; "urgent" ])
    ; group_items "editor.slash/group-time-and-date"
        [ "date.nlp/tomorrow", "tomorrow", Emit (journal_offset 1, 0)
        ; "date.nlp/yesterday", "yesterday", Emit (journal_offset (-1), 0)
        ; "date.nlp/today", "calendar", Emit ("[[" ^ Dates.today () ^ "]]", 0)
        ; "editor.slash/current-time", "clock", Emit (current_time (), 0)
        ; "editor.slash/date-picker", "calendar-dots", cmd "date-picker" ]    ; group_items "editor.slash/group-list-type"
        [ "editor.slash/number-list", "numberedParents", cmd "number-list"
        ; "editor.slash/number-children", "numberedChildren", cmd "number-children" ]    ; group_items "editor.slash/group-advanced"
        [ "block.comments/add-comment", "messageCircle", cmd "add-comment"
        ; "property.built-in/query", "query", Run_query false
        ; "editor.slash/advanced-query", "query", Run_query true
        ; "editor.slash/query-function", "queryCode", Emit ("{{function }}", 2)
        ; "editor.slash/calculator", "calculator", cmd "calculator"
        ; "editor.slash/upload-asset", "upload", cmd "upload"
        ; "class.built-in/template", "template", Switch Template_search
        ; "editor.slash/cloze", "braces", Emit ("{{cloze }}", 2)
        ; "editor.slash/embed-html", "htmlEmbed", Emit ("@@html: @@", 2)
        ; "editor.slash/embed-video-url", "videoEmbed", Emit ("{{video }}", 2)
        ; "editor.slash/embed-youtube-timestamp", "videoEmbed"
          , cmd "youtube-timestamp"
        ; "editor.slash/embed-twitter-tweet", "xEmbed", Emit ("{{tweet }}", 2)
        ; "command.editor/add-property", "cube-plus", cmd "add-property" ]    ]
;;

(* cljs editor.cljs keeps a fallback item for slash — literal there too *)
let slash_fallback =
  mk_item ~key:"no-matched" ~label:"No matched commands" Noop
;;

(* ---- filtering ---- *)

let contains_ci hay needle =
  let n = S.lowercase_ascii needle and h = S.lowercase_ascii hay in
  let nl = S.length n and hl = S.length h in
  let rec go i = i + nl <= hl && (S.sub h i nl = n || go (i + 1)) in
  nl > 0 && go 0
;;

let rec take n xs =
  if n <= 0 then [] else match xs with [] -> [] | x :: tl -> x :: take (n - 1) tl
;;

(* index + .ui__ac-group-name banners (unfiltered slash only, like cljs) *)
let with_headers show items =
  let rec go last idx = function
    | [] -> []
    | it :: tl ->
        let hdr =
          if show then
            match it.ai_group with
            | Some g when not (last = Some g) -> Some g
            | _ -> None
          else None
        in
        { it with ai_idx = idx; ai_hdr = hdr } :: go it.ai_group (idx + 1) tl
  in
  go None 0 items
;;

let renumber items = with_headers false items

let editing_has_heading () =
  match Editor_state.editing_uuid () with
  | Some u -> (
      match Editor_state.find u with
      | Some b -> b.Model.block_heading <> None
      | None -> false)
  | None -> false
;;

let filter_slash q items =
  let fs = List.filter (fun it -> contains_ci it.ai_label q) items in
  (* cljs only renders group headers when `filtered?` is false — i.e. when
     the filtered command list equals *initial-commands*. filter-commands
     always rebuilds the list, so headers effectively never show *)
  (match fs with [] -> [ slash_fallback ] | _ -> fs)
  |> with_headers false
;;

(* cljs editor.cljs page-search: an empty [[ query lists the i18n nlp
   date pages (calendar icon); choosing one emits [[<journal title>]]
   parsed from the english name *)
let nlp_date_of (en : string) : Js.Date.t =
  let now = Dates.date_now () in
  let add n = Js.Date.fromFloat (Js.Date.getTime now +. n *. 86400000.) in
  let shift_month n =
    let c = Js.Date.fromFloat (Js.Date.getTime now) in
    ignore (Js.Date.setMonth c ~month:(Js.Date.getMonth c +. n));
    c
  in
  let shift_year n =
    let c = Js.Date.fromFloat (Js.Date.getTime now) in
    ignore (Js.Date.setFullYear c ~year:(Js.Date.getFullYear c +. n));
    c
  in
  match en with
  | "Today" -> now
  | "Tomorrow" -> add 1.
  | "Yesterday" -> add (-1.)
  | "Next week" -> add 7.
  | "This week" -> now
  | "Last week" -> add (-7.)
  | "Next month" -> shift_month 1.
  | "This month" -> now
  | "Last month" -> shift_month (-1.)
  | "Next year" -> shift_year 1.
  | _ -> now

let nlp_en_names =
  [ "Today"; "Tomorrow"; "Yesterday"; "Next week"; "This week"
  ; "Last week"; "Next month"; "This month"; "Last month"; "Next year" ]

let nlp_i18n_key en =
  "date.nlp/"
  ^ String.concat "-"
      (List.map String.lowercase_ascii (String.split_on_char ' ' en))

let page_items_for t kind q =
  let act_of ~created title =
    match kind with
    | Tag_search -> if created then Tag_create title else Tag_apply title
    | Embed_ref -> Embed title
    | Page_embed -> Emit ("{{embed [[" ^ title ^ "]]}}", 0)
    | _ -> Emit ("[[" ^ title ^ "]]", 0)
  in
  let wrap title =
    mk_item ~key:("page:" ^ title) ~label:title (act_of ~created:false title)
  in
  let wrap_tag (title, icon) =
    mk_item ~key:("page:" ^ title) ~label:title ?icon (Tag_apply title)
  in
  let matched =
    match kind with
    | Tag_search ->
        (* cljs get-matched-classes → fuzzy-search (limit 20) *)
        Fuzzy.fuzzy_search ~extract:fst ~limit:20 !(t.tag_titles) q
        |> List.map wrap_tag
    | Page_ref | Page_embed | Embed_ref ->
        if q = "" then
          List.map
            (fun en ->
              let jt = Dates.journal_title_of (nlp_date_of en) in
              mk_item ~key:("nlp:" ^ en)
                ~label:(U.t (nlp_i18n_key en)) ~icon:"calendar"
                (match kind with
                 | Embed_ref -> Embed jt
                 | Page_embed -> Emit ("{{embed [[" ^ jt ^ "]]}}", 0)
                 | _ -> Emit ("[[" ^ jt ^ "]]", 0)))
            nlp_en_names
        else
          Fuzzy.fuzzy_search ~extract:(fun ti -> ti) ~limit:50 !(t.titles) q
          |> List.map wrap
    | _ ->
        take 20
          (List.map wrap
             (List.filter (fun ti -> contains_ci ti q) !(t.titles)))
  in
  let exact =
    match kind with
    | Tag_search ->
        List.exists (fun (ti, _) -> S.equal ti q) !(t.tag_titles)
    | _ -> List.exists (fun ti -> S.equal ti q) !(t.titles)
  in
  (* cljs matched-pages-with-new-page: the "New tag/page" row goes after a
     leading starts-with match, else first *)
  let with_new xs =
    if q <> "" && not exact then
      let label =
        (match kind with
         | Tag_search -> U.t "editor/new-tag"
         | _ -> U.t "editor/new-page")
        ^ " " ^ q
      in
      mk_item ~key:("new:" ^ q) ~label (act_of ~created:true q) :: xs
    else xs
  in
  let items =
    match matched with
    | first :: rest
      when S.length first.ai_label >= S.length q
           && S.equal
                (S.lowercase_ascii
                   (S.sub first.ai_label 0 (S.length q)))
                (S.lowercase_ascii q) ->
        first :: with_new rest
    | _ -> with_new matched
  in
  renumber items
;;
let template_items_for t q =
  let q = S.trim q in
  renumber
    (List.filter_map
       (fun (uuid, title) ->
         match fuzzy_score title q with
         | Some _ ->
             Some
               (mk_item ~key:("tpl:" ^ uuid) ~label:title
                  (Template_apply uuid))
         | None -> None)
       !(t.templates))
;;

(* ---- async loads ---- *)

let repo () = Option.value !(Runtime.current_repo) ~default:""

let refresh_items t ac =
  match ac.kind with
  | Slash ->
      { ac with
        items =
          filter_slash ac.query
            (slash_items ~has_heading:(editing_has_heading ())) }
  | Page_ref | Page_embed | Tag_search | Embed_ref ->
      { ac with items = page_items_for t ac.kind ac.query }
  | Template_search -> { ac with items = template_items_for t ac.query }
  | Block_ref -> ac (* filled asynchronously by run_block_search *)
;;

let block_item_of_row i w =
  let it = Cmdk_state.item_of_row w i in
  let uuid =
    match Wire.map_get_uuid w "block/uuid" with
    | Some u -> u
    | None -> Option.value (Cmdk_state.str_field w "block/uuid") ~default:""
  in
  mk_item ~key:it.Cmdk_state.ikey ~label:it.Cmdk_state.ititle
    ?info:it.Cmdk_state.header
    (Emit ("[[" ^ uuid ^ "]]", 0));;

let run_block_search t ac =
  incr t.gen;
  let gen = !(t.gen) in
  ignore
    (Runtime.invoke3 "thread-api/search-blocks"
       (Wire.String (repo ()))
       (Wire.String ac.query)
       (Cmdk_state.search_opts false 20)
     |> Js.Promise.then_ (fun w ->
            let rows =
              match w with
              | Wire.Array xs | Wire.List xs -> xs
              | _ -> []
            in
            (match (get t).ac with
             | Some a
               when gen = !(t.gen) && a.kind = Block_ref && a.query = ac.query ->
                 set_ac t
                   (Some
                      { a with
                        items = renumber (take 20 (List.mapi block_item_of_row rows))
                      ; chosen = 0 })
             | _ -> ());
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups block search failed", e);
            Js.Promise.resolve ()))
;;

let load_titles t =
  ignore
    (Runtime.invoke1 "thread-api/get-all-page-titles"
       (Wire.String (repo ()))
     |> Js.Promise.then_ (fun w ->
            let rows =
              match w with
              | Wire.Array xs | Wire.List xs -> xs
              | _ -> []
            in
            t.titles :=
              List.filter_map
                (fun row ->
                  match row with
                  | Wire.String s -> Some s
                  | _ -> Cmdk_state.str_field row "block/title")
                rows;
            (match (get t).ac with
             | Some ({ kind = Page_ref | Page_embed | Tag_search | Embed_ref; _ } as ac) ->
                 set_ac t (Some (refresh_items t ac))
             | _ -> ());
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups titles failed", e);
            Js.Promise.resolve ()))
;;

(* cljs get-matched-classes: all classes except the root tag (plus the
   Page class when editing a non-page block), alias titles included.
   Entity maps carry block/title and block/alias rows. *)
let class_titles_of rows =
  (* cljs icon-component/get-node-icon: logseq.property/icon of the class,
     shape {:type :tabler-icon :id <name>} *)
  let icon_of row =
    match Wire.get row "logseq.property/icon" with
    | Some m -> (
        match Wire.get m "id" with
        | Some (Wire.String id) -> Some id
        | _ -> None)
    | None -> None
  in
  List.concat_map
    (fun row ->
      let title = Cmdk_state.str_field row "block/title" in
      let icon = icon_of row in
      let aliases =
        match Wire.get row "block/alias" with
        | Some (Wire.Array xs) | Some (Wire.List xs) ->
            List.filter_map
              (fun a -> Cmdk_state.str_field a "block/title")
              xs
        | _ -> []
      in
      (match title with
       | Some t -> [ (t, icon) ]
       | None -> [])
      @ List.map (fun a -> (a, None)) aliases)
    rows

let load_tag_titles t _editor =
  let editing_block =
    match Editor_state.editing_uuid () with
    | Some _ -> true
    | None -> false
  in
  let wopts extra =
    Wire.Map
      (List.map
         (fun (k, v) -> (Wire.kw k, v))
         ([ ("except-root-class?", Wire.Bool true) ]
          @ extra))
  in
  ignore
    (Runtime.invoke2 "thread-api/get-all-classes"
       (Wire.String (repo ()))
       (wopts [ ("except-private-tags?", Wire.Bool true) ])
     |> Js.Promise.then_ (fun w ->
            let rows =
              match w with
              | Wire.Array xs | Wire.List xs -> xs
              | _ -> []
            in
            t.tag_titles := class_titles_of rows;
            if editing_block then
              Runtime.invoke2 "thread-api/get-all-classes"
                (Wire.String (repo ()))
                (wopts [ ("except-private-tags?", Wire.Bool false) ])
              |> Js.Promise.then_ (fun w2 ->
                     let rows2 =
                       match w2 with
                       | Wire.Array xs | Wire.List xs -> xs
                       | _ -> []
                     in
                     let page_class =
                       List.filter
                         (fun r ->
                           Cmdk_state.str_field r "db/ident"
                           = Some "logseq.class/Page")
                         rows2
                     in
                     t.tag_titles :=
                       !(t.tag_titles)
                       @ class_titles_of page_class;
                     Js.Promise.resolve ())
            else Js.Promise.resolve ())
     |> Js.Promise.then_ (fun () ->
            (match (get t).ac with
             | Some ({ kind = Tag_search; _ } as ac) ->
                 set_ac t (Some (refresh_items t ac))
             | _ -> ());
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups classes failed", e);            Js.Promise.resolve ()))
;;

(* template-search: blocks tagged logseq.class/Template (cljs
   search/template-search = get-tag-objects + fuzzy) *)
let load_templates t =
  ignore
    (Runtime.invoke2 "thread-api/q" (Wire.String (repo ()))
       (Wire.Array
          [ Wire.String
              "[:find ?u ?ti :where [?b :block/tags ?t] \
               [?t :db/ident :logseq.class/Template] \
               [?b :block/uuid ?u] [?b :block/title ?ti]]"
          ])
     |> Js.Promise.then_ (fun w ->
            let rows = Sdk_util.wire_elems w in
            t.templates :=
              List.filter_map
                (fun row ->
                  match Sdk_util.wire_elems row with
                  | [ u; ti ] -> (
                      match (u, Wire.as_string ti) with
                      | Wire.Uuid u, Some ti -> Some (u, ti)
                      | Wire.String u, Some ti -> Some (u, ti)
                      | _ -> None)
                  | _ -> None)
                rows;
            (match (get t).ac with
             | Some ({ kind = Template_search; _ } as ac) ->
                 set_ac t (Some (refresh_items t ac))
             | _ -> ());
            Js.Promise.resolve ()))
;;

(* ---- open / update ---- *)

let open_ac t kind editor =
  let x, y = Dom_ext.caret_popup_pos editor in
  let tlen = trigger_len_of_kind kind in
  let tpos = Dom_ext.selection_start editor - tlen in
  let ac =
    { kind; x; y; query = ""
    ; tpos; tlen
    ; items = []; chosen = 0; editor }
  in
  (* cljs autopair: typing [[ inputs ]] immediately with the caret kept
     inside the brackets; insert_text consumes the ghost pair on choice *)
  (match kind with
   | Page_ref ->
       let v = Dom_ext.value editor in
       let n = S.length v in
       let pos = ac.tpos + tlen in
       if not (pos + 1 < n && S.sub v pos 2 = "]]") then (
         let v' = S.sub v 0 pos ^ "]]" ^ S.sub v pos (n - pos) in
         Dom_ext.set_value editor v';
         (match Editor_state.editing_uuid () with
          | Some uuid -> Editor_actions.sync_buffer uuid v'
          | None -> ());
         Dom_ext.set_selection_range editor pos pos)
   | _ -> ());
  (match kind with
   | Page_ref | Page_embed | Embed_ref -> load_titles t
   | Tag_search -> load_tag_titles t editor
   | Template_search -> load_templates t   | Block_ref -> ()
   | Slash -> ());
  set_cm t None;
  set_ac t (Some (refresh_items t ac))
;;

let ac_update t ac q =
  let ac = { ac with query = q; chosen = 0 } in
  set_ac t (Some (refresh_items t ac));
  if ac.kind = Block_ref then run_block_search t ac
;;

let query_closed ac q =
  match ac.kind with
  | Page_ref | Page_embed -> S.contains q ']'
  | Block_ref -> S.contains q ')'
  | Slash | Tag_search | Template_search | Embed_ref -> S.contains q '\n'
;;

(* cljs autopair overtype: typing a closing char that already sits under
   the caret (the ghost pair we inserted) skips over it instead of
   inserting a duplicate *)
let overtype_skip el =
  let pos = Dom_ext.selection_start el in
  let v = Dom_ext.value el in
  if
    pos >= 1 && pos < S.length v
    && Dom_ext.selection_end el = pos
    && S.get v pos = S.get v (pos - 1)
    && (S.get v pos = ']' || S.get v pos = ')')
  then (
    Dom_ext.set_value el
      (S.sub v 0 (pos - 1) ^ S.sub v pos (S.length v - pos));
    Dom_ext.set_selection_range el pos pos);;

(* after an `input` event in a .editor-wrapper textarea *)
let on_editor_input t el ev =
  overtype_skip el;  let pos = Dom_ext.selection_start el in
  match (get t).ac with
  | Some ac ->
      let v = Dom_ext.value el in
      let trig_missing =
        ac.tpos + ac.tlen > S.length v
        || S.sub v ac.tpos ac.tlen <> trigger_text_of_kind ac.kind
      in
      if pos < ac.tpos + ac.tlen then close_ac t
      else
        (* cljs handle-last-input runs the /, [[, (( and # openers
           regardless of an open popup, so a trigger char typed while an
           ac is open replaces it (e.g. / inside a #tag query starts the
           slash menu); # followed by another # clears instead *)
        let c =
          if pos >= 1 && pos <= S.length v then Some (S.get v (pos - 1))
          else None
        in
        let two ch = pos >= 2 && S.get v (pos - 2) = ch in
        let bounded =
          pos < 2 || (let p = S.get v (pos - 2) in p = ' ' || p = '\n')
        in
        let switched =
          match c with
          | Some '/' when bounded ->
              close_ac t;
              open_ac t Slash el;
              true
          | Some '[' when two '[' ->
              close_ac t;
              open_ac t Page_ref el;
              true
          | Some '(' when two '(' ->
              close_ac t;
              open_ac t Block_ref el;
              true
          | Some '#' when bounded || two '#' ->
              if bounded && not (two '#') then open_ac t Tag_search el
              else close_ac t;
              true
          | _ -> false
        in
        if switched then ()
        else if trig_missing then
          (* cljs ac state isn't tied to the trigger still being in the
             buffer: a whole-buffer replacement (e2e `fill`, inputType
             insertText/insertReplacementText) wipes the trigger but the
             popup stays open with the buffer as its query. Only a real
             keystroke that removed the trigger (delete inputTypes)
             closes it. *)
          let it = Dom_ext.input_type ev in
          if S.length it >= 6 && S.sub it 0 6 = "delete" then close_ac t
          else
            ac_update t { ac with tpos = 0; tlen = 0 }
              (S.sub v 0 pos)
        else
          let qend = pos - ac.tpos - ac.tlen in
          if qend > S.length v then close_ac t
          else
            let q = S.sub v (ac.tpos + ac.tlen) qend in
            (* "# " clears hashtag search (a space right after the
               trigger), and "#+" is an org directive, not a tag *)
            if query_closed ac q
               || (ac.kind = Tag_search && (q = " " || q = "+"))
            then close_ac t
            else ac_update t ac q
  | None ->
      let v = Dom_ext.value el in
      if pos < 1 || pos > S.length v then ()
      else
        let c = S.get v (pos - 1) in
        let two = pos >= 2 && S.get v (pos - 1) = S.get v (pos - 2) in
        let bounded =
          pos < 2
          || (let p = S.get v (pos - 2) in p = ' ' || p = '\n')
          || (pos >= 3 && S.get v (pos - 2) = ']' && S.get v (pos - 3) = ']')
        in
        if c = '/' && bounded then open_ac t Slash el
        else if c = '[' && two then open_ac t Page_ref el
        else if c = '(' && two then open_ac t Block_ref el
        else if c = '#' && bounded then open_ac t Tag_search el
        else ()
;;

(* ---- events ---- *)

let detail_obj pairs =
  let o = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set o k v) pairs;
  Js.Json.object_ o
;;

(* replace [tpos, caret) with text and sync the editing buffer —
   equivalent to cljs's ls:editor-insert handler *)
let insert_text (ac : ac) text back =
  let el = ac.editor in
  let v = Dom_ext.value el in
  let n = S.length v in
  let tpos = max 0 (min ac.tpos n) in
  let pos = max tpos (min (Dom_ext.selection_start el) n) in
  (* consume the autopaired ]] sitting right after the caret *)
  let pos =
    if (ac.kind = Page_ref || ac.kind = Embed_ref)
       && pos + 1 < n && S.sub v pos 2 = "]]"
    then pos + 2
    else pos
  in
  let v' = S.sub v 0 tpos ^ text ^ S.sub v pos (n - pos) in
  Dom_ext.set_value el v';
  (match Editor_state.editing_uuid () with
   | Some uuid -> Editor_actions.sync_buffer uuid v'
   | None -> ());
  let caret = tpos + S.length text - back in
  Dom_ext.set_selection_range el caret caret;
  Dom_ext.focus el

let emit ?(exit = false) editor tpos text =
  match Dom_ext.closest editor ".ls-page-title" with
  | Some _ ->
      (* the page-title editor isn't a block editor — splice the buffer
         directly instead of dispatching ls:editor-insert *)
      let v = Dom_ext.value editor in
      let n = String.length v in
      let f = Int.max 0 (Int.min tpos n) in
      let t_ = Int.max f (Int.min (Dom_ext.selection_start editor) n) in
      let nv = String.sub v 0 f ^ text ^ String.sub v t_ (n - t_) in
      let caret = f + String.length text in
      Dom_ext.set_value editor nv;
      Dom_ext.set_text_content editor nv;
      Dom_ext.set_selection_range editor caret caret;
      Dom_ext.focus editor
  | None ->
      Dom_ext.dispatch_custom "ls:editor-insert"
        (detail_obj
           [ "text", Js.Json.string text
           ; "from", Js.Json.number (float_of_int tpos)
           ; "to", Js.Json.number (float_of_int (Dom_ext.selection_start editor))
           ; "exit", Js.Json.boolean exit ]);
      (* cljs refocuses the editor input after a chosen item *)
      Dom_ext.focus editor
;;

let emit_cmd ?pos command extra =
  Dom_ext.dispatch_custom "ls:editor-command"
    (detail_obj
       (("command", Js.Json.string command)
        :: (match pos with
            | Some p ->
                [ "from", Js.Json.number (float_of_int p)
                ; "to", Js.Json.number (float_of_int p) ]
            | None -> [])
        @ extra))
;;

(* erase the typed trigger range [tpos, caret) from the editor and hand
   focus back to the textarea — a clicked menu-link steals focus to its
   anchor, and Switch keeps no literal text (cljs [:editor/input ""]) *)
let erase_trigger_text (ac : ac) =
  let el = ac.editor in
  let v = Dom_ext.value el in
  let n = S.length v in
  let tpos = max 0 (min ac.tpos n) in
  let pos = max tpos (min (Dom_ext.selection_start el) n) in
  let pos =
    if (ac.kind = Page_ref || ac.kind = Embed_ref)
       && pos + 1 < n && S.sub v pos 2 = "]]"
    then pos + 2
    else pos
  in
  let v' = S.sub v 0 tpos ^ S.sub v pos (n - pos) in
  Dom_ext.set_value el v';
  (match Editor_state.editing_uuid () with
   | Some uuid -> Editor_actions.sync_buffer uuid v'
   | None -> ());
  Dom_ext.set_selection_range el tpos tpos;
  Dom_ext.focus el
;;
(* cljs tag-on-chosen-handler: strip the "#query" fragment, then either
   keep "#title" inline (existing page) or attach the tag as a class via
   block/tags (existing class or a new "New tag" class). The "New tag"
   row always takes the class path even when a plain page exists. *)
let apply_tag t ac ~create title =
  (* the page-title textarea isn't registered as a block editor —
     resolve it to the current page entity instead *)
  let buuid_opt, title_edit =
    match Editor_state.editing_uuid () with
    | Some u -> (Some u, false)
    | None -> (
        match Dom_ext.closest ac.editor ".ls-page-title" with
        | Some _ -> (
            match !Runtime.current_page with
            | Some p -> (p.Model.page_uuid, true)
            | None -> (None, false))
        | None -> (None, false))
  in
  match buuid_opt with
  | None -> ()
  | Some buuid ->
      let repo_v = repo () in
      let save_and_tag dbid =
        (* emit already stripped "#q" from the buffer; persist the new
           buffer and the tag in one batch. For the page-title editor the
           stripped title is committed by the title's own rename path —
           save-block rejects page entities, so only the tag is sent. *)
        let rest =
          [ Outliner_ops.set_block_property buuid "block/tags" (Wire.Int dbid) ]
        in
        ignore
          (if title_edit then Outliner_ops.apply_and_refresh rest
           else
             Outliner_ops.apply_parsed_and_refresh ~rest
               [ (buuid, Dom_ext.value ac.editor) ])
      in
      let create_and_tag () =
        emit ac.editor ac.tpos "";
        close_ac t;
        ignore
          (Runtime.invoke3 "thread-api/apply-outliner-ops"
             (Wire.String repo_v)
             (Wire.Array [ Outliner_ops.create_class title ])
             (Wire.Map [])
           |> Js.Promise.then_ (fun _ ->
                  Runtime.invoke2 "thread-api/get-case-page"
                    (Wire.String repo_v) (Wire.String title))
           |> Js.Promise.then_ (fun e ->
                  (match Wire.map_get_int e "db/id" with
                   | Some dbid -> save_and_tag dbid
                   | None -> ());
                  Js.Promise.resolve ()))
      in
      if create then create_and_tag ()
      else
        ignore
          (Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo_v)
             (Wire.String title)
           |> Js.Promise.then_ (fun w ->
                  match w with
                  | Wire.Map _ -> (
                      match Wire.map_get_int w "db/id" with
                      | None -> Js.Promise.resolve ()
                      | Some dbid ->
                          (match Wire.get w "db/ident" with
                           | Some _ ->
                               emit ac.editor ac.tpos "";
                               close_ac t;
                               save_and_tag dbid;
                               Js.Promise.resolve ()
                           | None ->
                               (* cljs tag-on-chosen-handler: a plain page
                                  chosen in the hashtag search is converted
                                  to a class, then attached via block/tags *)
                               emit ac.editor ac.tpos "";
                               close_ac t;
                               Runtime.invoke2
                                 "thread-api/convert-page-to-tag"
                                 (Wire.String repo_v) (Wire.Int dbid)
                               |> Js.Promise.then_ (fun _ ->
                                      save_and_tag dbid;
                                      Js.Promise.resolve ())))
                  | _ ->
                      create_and_tag ();
                      Js.Promise.resolve ()))

let apply_template t ac uuid =
  match Editor_state.editing_uuid () with
  | None -> ()
  | Some buuid ->
      let buf = Dom_ext.value ac.editor in
      close_ac t;
      ignore
        (Outliner_ops.apply_and_refresh
           ~opts:(Outliner_ops.op_opts "apply-template")
           [ Outliner_ops.save_block buuid buf
           ; Outliner_ops.apply_template uuid buuid ])
(* cljs run-query-command! / advanced-query-steps: save the current
   block, tag it logseq.class/Query, create the hidden
   logseq.property/query value block and copy the current title into it
   (the query source), clear the block title, exit edit. Advanced also
   marks the value block display-type=code + code/lang=clojure so the
   worker's render-view-data exposes the pulled :query columns. *)
let run_query t ac ~advanced =
  match Editor_state.editing_uuid () with
  | None -> ()
  | Some buuid ->
      emit ac.editor ac.tpos "";
      close_ac t;
      let title = Dom_ext.value ac.editor in
      Editor_actions.exit_edit ~select:false;
      let repo_v = repo () in
      ignore
        (Outliner_ops.apply
           [ Outliner_ops.save_block buuid title
           ; Outliner_ops.op "create-property-text-block"
               [ Wire.Uuid buuid
               ; Wire.Keyword "logseq.property/query"
               ; Wire.String ""
               ; Wire.Map
                   [ (Wire.Keyword "set-block-property?", Wire.Bool true) ] ]
           ]
        |> Js.Promise.then_ (fun _ ->
               Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo_v)
                 (Wire.Array
                    [ Wire.Map
                        [ (Wire.Keyword "id", Wire.Uuid buuid)
                        ; ( Wire.Keyword "opts"
                          , Wire.Map
                              [ (Wire.Keyword "children?", Wire.Bool true)
                              ; ( Wire.Keyword "include-property-block?"
                                , Wire.Bool true ) ] ) ]
                    ]))
        |> Js.Promise.then_ (fun w ->
               let quuid =
                 match Wire.args_list w with
                 | res :: _ -> (
                     let b =
                       match Wire.get res "block" with
                       | Some b -> b
                       | None -> res
                     in
                     match Wire.get b "logseq.property/query" with
                     | Some v -> (
                         match Wire.map_get_uuid v "block/uuid" with
                         | Some u -> u
                         | None -> (
                             match Wire.as_uuid v with
                             | Some u -> u
                             | None -> ""))
                     | None -> "")
                 | [] -> ""
               in
               if quuid = "" then Js.Promise.resolve ()
               else
                 let rest =
                   [ Outliner_ops.set_block_property buuid "block/tags"
                       (Wire.Keyword "logseq.class/Query") ]
                   @ if advanced then
                       [ Outliner_ops.set_block_property quuid
                           "logseq.property.node/display-type"
                           (Wire.Keyword "code")
                       ; Outliner_ops.set_block_property quuid
                           "logseq.property.code/lang"
                           (Wire.String "clojure") ]
                     else []
                 in
                 Outliner_ops.apply_parsed ~rest
                   [ (quuid, title); (buuid, "") ]))

let apply_item t ac it =
  match it.ai_act with
  | Switch kind ->
      erase_trigger_text ac;      (match kind with
       | Page_ref | Page_embed | Tag_search | Embed_ref -> load_titles t
       | _ -> ());
      set_ac t
        (Some
           (refresh_items t
              { ac with kind; query = ""; tlen = 0; items = []; chosen = 0 }))
  | Embed title ->
      erase_trigger_text ac;
      close_ac t;
      Editor_embed.insert title
  | Emit (text, back) -> insert_text ac text back; close_ac t
  | Emit_exit text -> emit ~exit:true ac.editor ac.tpos text; close_ac t
  | Editor_cmd c ->
      (* cljs strips the "/cmd" trigger text like an Emit "" insert *)
      emit ac.editor ac.tpos "";
      emit_cmd ~pos:ac.tpos c [];
      close_ac t  | Run_query advanced -> run_query t ac ~advanced
  | Tag_apply title -> apply_tag t ac ~create:false title
  | Tag_create title -> apply_tag t ac ~create:true title
  | Template_apply uuid -> apply_template t ac uuid
  | Noop -> close_ac t
;;

let chosen_scroll chosen =
  Dom_ext.set_timeout
    (fun () ->
      match Dom_ext.doc_query_selector "#ui__ac-inner" with
      | Some scroller -> (
          match Dom_ext.doc_query_selector ("#ac-" ^ string_of_int chosen) with
          | Some row -> Dom_ext.scroll_row_into_view ~scroller ~row
          | None -> ())
      | None -> ())
    0
;;

let move_chosen t dir =
  match (get t).ac with
  | Some ac ->
      let n = List.length ac.items in
      if n > 0 then (
        let chosen = (ac.chosen + dir + n) mod n in
        set_ac t (Some { ac with chosen });
        chosen_scroll chosen)
  | None -> ()
;;

let set_chosen t i =
  match (get t).ac with
  | Some ac -> set_ac t (Some { ac with chosen = i })
  | None -> ()
;;

let apply_index t i =
  match (get t).ac with
  | Some ac ->
      Option.iter (fun it -> apply_item t ac it) (List.nth_opt ac.items i)
  | None -> ()
;;

let apply_chosen t =
  match (get t).ac with
  | Some ac -> apply_index t ac.chosen
  | None -> ()
;;

(* true if the keydown was consumed by the open popup *)
let ac_keydown t ev =
  if (get t).ac = None then false
  else
    match Dom_ext.key_ ev with
    | Some "ArrowDown" -> move_chosen t 1; true
    | Some "ArrowUp" -> move_chosen t (-1); true
    | Some ("Enter" | "Tab") -> apply_chosen t; true
    | Some "Escape" -> close_ac t; true
    | _ -> false
;;

let ac_mousemove t el =
  match Dom_ext.get_attribute el "id" with
  | Some id
    when S.length id > 3 && S.sub id 0 3 = "ac-" -> (
      match int_of_string_opt (S.sub id 3 (S.length id - 3)) with
      | Some i -> set_chosen t i
      | None -> ())
  | _ -> ()
;;

(* ---- context menu ---- *)

let colors = [ "yellow"; "red"; "pink"; "green"; "blue"; "purple"; "gray" ]

(* mirrors content.cljs block-context-menu-content. Shortcut caps match
   shortcut utils decorate-binding/print-shortcut-key output on macOS *)
let block_entries () =
  [ Ci_colors; Ci_headings; Ci_sep
  ; Ci_item (U.t "sidebar.right/open", Some ("shift+click", [ "\u{21e7}"; "Click" ]), "open-in-sidebar")
  ; Ci_item (U.t "block.comments/add-comment", None, "add-comment")
  ; Ci_sub (U.t "command.editor/add-reaction")
  ; Ci_sub (U.t "context-menu/set-icon")
  ; Ci_sep
  ; Ci_item (U.t "block/copy-ref", None, "copy-ref")
  ; Ci_item (U.t "export/copy-or-export-as", None, "copy-export-as")
  ; Ci_item (U.t "editor/cut", Some ("meta+x", [ "\u{2318}"; "X" ]), "cut")
  ; Ci_item (U.t "editor/delete-selection", Some ("delete", [ "Delete" ]), "delete")
  ; Ci_sep
  ; Ci_item (U.t "context-menu/make-a-flashcard", None, "make-flashcard")
  ; Ci_item (U.t "context-menu/toggle-number-list", None, "toggle-numbered-list")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children", Some ("meta+down", [ "\u{2318}"; "\u{2193}" ]), "expand-children")
  ; Ci_item (U.t "editor/collapse-block-children", Some ("meta+up", [ "\u{2318}"; "\u{2191}" ]), "collapse-children")
  ]
;;

(* mirrors content.cljs custom-context-menu-content (multi-select) *)
let multi_entries () =
  [ Ci_colors; Ci_headings
  ; Ci_sub (U.t "context-menu/set-icon")
  ; Ci_sep
  ; Ci_item (U.t "editor/cut", Some ("meta+x", [ "\u{2318}"; "X" ]), "cut")
  ; Ci_item (U.t "editor/delete-selection", Some ("delete", [ "Delete" ]), "delete")
  ; Ci_item (U.t "ui/copy", Some ("meta+c", [ "\u{2318}"; "C" ]), "copy")
  ; Ci_item (U.t "export/copy-or-export-as", None, "copy-export-as")
  ; Ci_item (U.t "block/copy-ref", None, "copy-ref")  ; Ci_sep
  ; Ci_item (U.t "context-menu/toggle-number-list", None, "toggle-numbered-list")
  ; Ci_item (U.t "editor/cycle-todo", None, "cycle-todo")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children", Some ("meta+down", [ "\u{2318}"; "\u{2193}" ]), "expand-children")
  ; Ci_item (U.t "editor/collapse-block-children", Some ("meta+up", [ "\u{2318}"; "\u{2191}" ]), "collapse-children")
  ]
;;

let open_cm t ~x ~y ~block_id ~multi =
  let entries = if multi then multi_entries () else block_entries () in
  close_ac t;
  set_cm t (Some { cx = x; cy = y; block_id; multi; entries })
;;

let run_cm_item t label =
  match (get t).cm with
  | Some cm ->
      emit_cmd label [ "block", Js.Json.string cm.block_id ];
      close_cm t
  | None -> ()
;;

let run_cm_color t color =
  match (get t).cm with
  | Some cm ->
      emit_cmd "set-color"        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string color ];
      close_cm t
  | None -> ()
;;

let run_cm_heading t h =
  match (get t).cm with
  | Some cm ->
      emit_cmd "set-heading"        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string h ];
      close_cm t
  | None -> ()
;;
