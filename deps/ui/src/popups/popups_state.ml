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
  | Slash
  | Page_ref
  | Block_ref
  | Tag_search
  | Template_search

type item_action =
  | Emit of string * int (* ls:editor-insert {text, back} *)
  | Switch of ac_kind (* reopen as another autocomplete, keeping text *)
  | Emit_switch of string * int * ac_kind * bool
  (* emit text first (cljs [:editor/input x {:backward-pos}] then reopen
     the popup as `kind`; embed = page picks wrap in {{embed [[..]]}} *)
  | Editor_cmd of string (* ls:editor-command {command, from, to} *)
  | Tag_apply of string (* existing entity — cljs tag-on-chosen-handler *)
  | Tag_create of string (* "New tag" row — always creates a class *)
  | Template_apply of string (* template block uuid — apply-template op *)
  | Noop (* "No matched commands" row — applies to nothing *)

type ac_item =
  { ai_key : string
  ; ai_label : string
  ; ai_group : string option
  ; ai_info : string option
  ; ai_idx : int
  ; ai_hdr : string option (* group-name banner, only on group starts *)
  ; ai_act : item_action
  }

let mk_item ~key ~label ?group ?info act =
  { ai_key = key; ai_label = label; ai_group = group
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
  ; rpos : int (* replace-start offset — differs from tpos after a
                  prefill emit ("{{embed [[ ]]}}"): emitted text covers
                  [rpos, caret+closer) *)
  ; embed : bool
  ; items : ac_item list
  ; chosen : int
  ; editor : Dom_ext.element
  }

type cm_item =
  | Ci_item of string
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
  ; class_titles : string list ref (* # ac lists classes only (cljs
                                       get-matched-classes) *)
  ; templates : (string * string) list ref (* (uuid, title) *)
  }

let make scheduler : t =
  { vs = Signal.state scheduler { ac = None; cm = None }
  ; gen = ref 0
  ; titles = ref []
  ; class_titles = ref []
  ; templates = ref []
  }

let get t = Signal.get t.vs.Signal.state_signal
let set t v = Runtime.signal_set t.vs v
let set_ac t ac = set t { (get t) with ac }
let set_cm t cm = set t { (get t) with cm }
let close_ac t = set_ac t None
let close_cm t = set_cm t None

let ac_class_of_kind = function
  | Slash -> "cp__commands-slash"
  | Page_ref | Tag_search | Template_search -> "black"
  | Block_ref -> "ac-block-search"
;;

let trigger_len_of_kind = function
  | Slash | Tag_search | Template_search -> 1
  | Page_ref | Block_ref -> 2
;;

let trigger_text_of_kind = function
  | Page_ref -> "[["
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

let fuzzy_filter items q =
  let scored =
    List.filter_map
      (fun it -> Option.map (fun s -> (s, it)) (fuzzy_score it.ai_label q))
      items
  in
  List.map snd
    (List.stable_sort (fun (a, _) (b, _) -> compare (a : int) b) scored)
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

let group_items grp entries =
  let g = Some (U.t grp) in
  List.map (fun (key, act) -> mk_item ~key ~label:(U.t key) ?group:g act) entries
;;

let cmd label = Editor_cmd label

(* has_heading gates "Clear heading" (cljs filter-commands drops it when
   the edited block has no heading prop, leaving "No matched commands") *)
let slash_items ~has_heading : ac_item list =
  List.concat
    [ group_items "editor.slash/group-basic"
        [ ( "editor.slash/node-reference"
          , Emit_switch ("[[ ]]", 2, Page_ref, false) )
        ; ( "editor.slash/node-embed"
          , Emit_switch ("{{embed [[ ]]}}", 4, Page_ref, true) ) ]
    ; group_items "editor.slash/group-format"
        [ "ui/link", cmd "link"
        ; "editor.slash/image-link", cmd "image-link"
        ; "editor.slash/underline", Emit ("<ins></ins>", 6)
        ; "editor.slash/code-block", cmd "code-block"
        ; "class.built-in/quote-block", cmd "quote"
        ; "editor.slash/math-block", cmd "math-block" ]
    ; group_items "editor.slash/group-heading"
        ([ "editor.slash/normal-text", cmd "normal-text" ]
        @ (if has_heading then [ "editor.slash/clear-heading", cmd "clear-heading" ]
           else [])
        @ List.init 6 (fun i ->
            ( U.tf "editor.slash/heading-label" [ string_of_int (i + 1) ]
            , cmd ("heading:" ^ string_of_int (i + 1)) )))
    ; group_items "editor.slash/group-task-status"
        [ "property.status/backlog", cmd "status:Backlog"
        ; "property.status/todo", cmd "status:Todo"
        ; "property.status/doing", cmd "status:Doing"
        ; "property.status/in-review", cmd "status:In Review"
        ; "property.status/done", cmd "status:Done"
        ; "property.status/canceled", cmd "status:Canceled" ]
    ; group_items "editor.slash/group-task-date"
        [ "property.built-in/deadline", cmd "deadline"
        ; "property.built-in/scheduled", cmd "scheduled" ]
    ; group_items "editor.slash/group-priority"
        ([ "editor.slash/no-priority", cmd "priority:" ]
        @ List.map
            (fun lvl ->
              ( U.tf "editor.slash/priority-label"
                  [ U.t ("property.priority/" ^ lvl) ]
              , cmd ("priority:" ^ U.t ("property.priority/" ^ lvl)) ))
            [ "low"; "medium"; "high"; "urgent" ])
    ; group_items "editor.slash/group-time-and-date"
        [ "date.nlp/tomorrow", Emit (journal_offset 1, 0)
        ; "date.nlp/yesterday", Emit (journal_offset (-1), 0)
        ; "date.nlp/today", Emit ("[[" ^ Dates.today () ^ "]]", 0)
        ; "editor.slash/current-time", Emit (current_time (), 0)
        ; "editor.slash/date-picker", cmd "date-picker" ]
    ; group_items "editor.slash/group-list-type"
        [ "editor.slash/number-list", cmd "number-list"
        ; "editor.slash/number-children", cmd "number-children" ]
    ; group_items "editor.slash/group-advanced"
        [ "block.comments/add-comment", cmd "add-comment"
        ; "property.built-in/query", cmd "query"
        ; "editor.slash/advanced-query", cmd "advanced-query"
        ; "editor.slash/query-function", Emit ("{{function }}", 2)
        ; "editor.slash/calculator", cmd "calculator"
        ; "editor.slash/upload-asset", cmd "upload"
        ; "class.built-in/template", Emit_switch ("/", 0, Template_search, false)
        ; "editor.slash/cloze", Emit ("{{cloze }}", 2)
        ; "editor.slash/embed-html", Emit ("@@html: @@", 2)
        ; "editor.slash/embed-video-url", Emit ("{{video }}", 2)
        ; "editor.slash/embed-youtube-timestamp", cmd "youtube-timestamp"
        ; "editor.slash/embed-twitter-tweet", Emit ("{{tweet }}", 2)
        ; "command.editor/add-property", cmd "add-property" ]
    ]
;;

(* cljs editor.cljs keeps a fallback item for slash — literal there too *)
let slash_fallback =
  mk_item ~key:"no-matched" ~label:"No matched commands" Noop
;;

(* ---- filtering ---- *)

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
  let fs = fuzzy_filter items q in
  (match fs with [] -> [ slash_fallback ] | _ -> fs)
  |> with_headers (q = "")
;;

let page_items_for t kind q =
  let q = S.trim q in
  let wrap title =
    match kind with
    | Tag_search -> mk_item ~key:("page:" ^ title) ~label:title (Tag_apply title)
    | _ ->
        mk_item ~key:("page:" ^ title) ~label:title (Emit ("[[" ^ title ^ "]]", 0))
  in
  let pool =
    match kind with Tag_search -> !(t.class_titles) | _ -> !(t.titles)
  in
  let matched =
    take 20 (List.map wrap (List.filter (fun ti -> fuzzy_score ti q <> None) pool))
  in
  let exact = List.exists (fun ti -> S.equal ti q) pool in
  let items =
    if q <> "" && not exact then
      let label =
        (match kind with
         | Tag_search -> U.t "editor/new-tag"
         | _ -> U.t "editor/new-page")
        ^ " " ^ q
      in
      let act =
        match kind with
        | Tag_search -> Tag_create q
        | _ -> Emit ("[[" ^ q ^ "]]", 0)
      in
      mk_item ~key:("new:" ^ q) ~label act :: matched
    else matched
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
  | Slash -> { ac with items = filter_slash ac.query (slash_items ~has_heading:(editing_has_heading ())) }
  | Page_ref | Tag_search -> { ac with items = page_items_for t ac.kind ac.query }
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
    (Emit ("((" ^ uuid ^ "))", 0))
;;

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
             | Some ({ kind = Page_ref | Tag_search; _ } as ac) ->
                 set_ac t (Some (refresh_items t ac))
             | _ -> ());
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups titles failed", e);
            Js.Promise.resolve ()))
;;

(* cljs get-matched-classes — # autocomplete lists classes only, never
   plain pages or properties *)
let load_classes t =
  ignore
    (Runtime.invoke2 "thread-api/get-all-classes"
       (Wire.String (repo ()))
       (Wire.Map
          [ (Wire.kw "except-root-class?", Wire.Bool true)
          ; (Wire.kw "except-private-tags?", Wire.Bool false)
          ; (Wire.kw "except-extends-hidden-tags?", Wire.Bool false) ])
     |> Js.Promise.then_ (fun w ->
            t.class_titles :=
              List.filter_map
                (fun row -> Wire.map_get_string row "block/title")
                (Sdk_util.wire_elems w);
            (match (get t).ac with
             | Some ({ kind = Tag_search; _ } as ac) ->
                 set_ac t (Some (refresh_items t ac))
             | _ -> ());
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups classes failed", e);
            Js.Promise.resolve ()))
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
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups templates failed", e);
            Js.Promise.resolve ()))
;;

(* ---- open / update ---- *)

let open_ac t kind editor =
  let x, y = Dom_ext.caret_popup_pos editor in
  let tlen = trigger_len_of_kind kind in
  let tpos = Dom_ext.selection_start editor - tlen in
  let ac =
    { kind; x; y; query = ""
    ; tpos; tlen; rpos = tpos; embed = false
    ; items = []; chosen = 0; editor }
  in
  (match kind with
   | Page_ref -> load_titles t
   | Tag_search -> load_classes t
   | Template_search -> load_templates t
   | Block_ref -> ()
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
  | Page_ref -> S.contains q ']'
  | Block_ref -> S.contains q ')'
  | Slash | Tag_search | Template_search -> S.contains q '\n'
;;

(* after an `input` event in a .editor-wrapper textarea *)
let on_editor_input t el ev =
  let pos = Dom_ext.selection_start el in
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
            ac_update t { ac with tpos = 0; tlen = 0; rpos = 0 }
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
          pos < 2 || (let p = S.get v (pos - 2) in p = ' ' || p = '\n')
        in
        if c = '/' then open_ac t Slash el
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

(* cljs page-ref on-chosen consumes the trailing "]]" left by the
   "[[ ]]" prefill (and "]]}}" for node embeds) so the emitted
   [[title]] doesn't leave a dangling closer *)
let closer_len ac v pos =
  let n = S.length v in
  if ac.embed && pos + 4 <= n && S.sub v pos 4 = "]]}}" then 4
  else if pos + 2 <= n && S.sub v pos 2 = "]]" then 2
  else if pos + 2 <= n && S.sub v pos 2 = "))" then 2
  else 0
;;

let emit_range editor from to_ text back =
  Dom_ext.dispatch_custom "ls:editor-insert"
    (detail_obj
       [ "text", Js.Json.string text
       ; "from", Js.Json.number (float_of_int from)
       ; "to", Js.Json.number (float_of_int to_)
       ; "back", Js.Json.number (float_of_int back) ]);
  (* cljs refocuses the editor input after a chosen item *)
  Dom_ext.focus editor
;;

let emit ac text back =
  let pos = Dom_ext.selection_start ac.editor in
  let v = Dom_ext.value ac.editor in
  emit_range ac.editor ac.rpos (pos + closer_len ac v pos) text back
;;

let emit_cmd ac command extra =
  Dom_ext.dispatch_custom "ls:editor-command"
    (detail_obj
       ([ "command", Js.Json.string command
        ; "from", Js.Json.number (float_of_int ac.rpos)
        ; "to", Js.Json.number (float_of_int (Dom_ext.selection_start ac.editor)) ]
        @ extra))
;;

let sub_index s pat =
  let n = S.length pat and m = S.length s in
  let rec go i =
    if i + n > m then -1 else if S.sub s i n = pat then i else go (i + 1)
  in
  go 0
;;

(* re-derive the popup anchor after the prefill emit rewrote the buffer:
   tpos sits on the trigger inside the emitted text ("[[" for "[[ ]]" and
   "{{embed [[ ]]}}"), rpos on the emitted text's start *)
let switched_ac ac text kind embed =
  let tlen = trigger_len_of_kind kind in
  let trig =
    match kind with
    | Page_ref -> "[["
    | Block_ref -> "(("
    | Tag_search -> "#"
    | Slash | Template_search -> "/"
  in
  let tpos =
    match sub_index text trig with i when i >= 0 -> ac.rpos + i | _ -> ac.rpos
  in
  { ac with kind; query = ""; items = []; chosen = 0; embed
  ; tpos; tlen
  ; rpos = (if embed then ac.rpos else tpos) }

(* cljs tag-on-chosen-handler: strip the "#query" fragment, then either
   keep "#title" inline (existing page) or attach the tag as a class via
   block/tags (existing class or a new "New tag" class). The "New tag"
   row always takes the class path even when a plain page exists. *)
let apply_tag t ac ~create title =
  match Editor_state.editing_uuid () with
  | None -> ()
  | Some buuid ->
      let repo_v = repo () in
      (* cljs set-block-property! tags with the class entity's db/id *)
      let save_and_tag w =
        match Wire.map_get_int w "db/id" with
        | Some dbid ->
            let v = Dom_ext.value ac.editor in
            ignore
              (Outliner_ops.apply_and_refresh
                 [ Outliner_ops.save_block buuid v
                 ; Outliner_ops.set_block_property buuid "block/tags"
                     (Wire.Int dbid)
                 ])
        | None -> ()
      in
      let create_and_tag () =
        emit ac "" 0;
        close_ac t;
        ignore
          (Runtime.invoke3 "thread-api/apply-outliner-ops"
             (Wire.String repo_v)
             (Wire.Array [ Outliner_ops.create_class title ])
             (Wire.Map [])
           |> Js.Promise.then_ (fun _ ->
                  Runtime.invoke2 "thread-api/get-case-page"
                    (Wire.String repo_v) (Wire.String title))
           |> Js.Promise.then_ (fun e -> save_and_tag e; Js.Promise.resolve ()))
      in
      if create then create_and_tag ()
      else
        ignore
          (Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo_v)
             (Wire.String title)
           |> Js.Promise.then_ (fun w ->
                  Js.Promise.resolve
                    (match Wire.get w "db/ident" with
                     | Some _ -> (
                         emit ac "" 0;
                         close_ac t;
                         save_and_tag w)
                     | None -> (
                         match w with
                         | Wire.Map _ ->
                             emit ac ("#" ^ title) 0;
                             close_ac t
                         | _ -> create_and_tag ())))
           |> Js.Promise.catch (fun e ->
                  Platform.console_error ("tag apply failed", e);
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

let apply_item t ac it =
  match it.ai_act with
  | Switch kind ->
      (match kind with
       | Page_ref | Tag_search -> load_titles t
       | _ -> ());
      set_ac t
        (Some
           (refresh_items t
              { ac with kind; query = ""; items = []; chosen = 0 }))
  | Emit_switch (text, back, kind, embed) ->
      emit ac text back;
      let ac' = switched_ac ac text kind embed in
      (match kind with
       | Page_ref | Tag_search -> load_titles t
       | Template_search -> load_templates t
       | _ -> ());
      set_ac t (Some (refresh_items t ac'))
  | Emit (text, back) -> emit ac text back; close_ac t
  | Editor_cmd c -> emit_cmd ac c []; close_ac t
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

(* mirrors content.cljs block-context-menu-content *)
let block_entries () =
  [ Ci_colors; Ci_headings; Ci_sep
  ; Ci_item (U.t "sidebar.right/open")
  ; Ci_item (U.t "block.comments/add-comment")
  ; Ci_sub (U.t "command.editor/add-reaction")
  ; Ci_sub (U.t "context-menu/set-icon")
  ; Ci_sep
  ; Ci_item (U.t "block/copy-ref")
  ; Ci_item (U.t "export/copy-or-export-as")
  ; Ci_item (U.t "editor/cut")
  ; Ci_item (U.t "editor/delete-selection")
  ; Ci_sep
  ; Ci_item (U.t "context-menu/toggle-number-list")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children")
  ; Ci_item (U.t "editor/collapse-block-children")
  ]
;;

(* mirrors content.cljs custom-context-menu-content (multi-select) *)
let multi_entries () =
  [ Ci_colors; Ci_headings
  ; Ci_sub (U.t "context-menu/set-icon")
  ; Ci_sep
  ; Ci_item (U.t "editor/cut")
  ; Ci_item (U.t "editor/delete-selection")
  ; Ci_item (U.t "ui/copy")
  ; Ci_item (U.t "block/copy-ref")
  ; Ci_sep
  ; Ci_item (U.t "context-menu/toggle-number-list")
  ; Ci_item (U.t "editor/cycle-todo")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children")
  ; Ci_item (U.t "editor/collapse-block-children")
  ]
;;

let open_cm t ~x ~y ~block_id ~multi =
  let entries = if multi then multi_entries () else block_entries () in
  close_ac t;
  set_cm t (Some { cx = x; cy = y; block_id; multi; entries })
;;

(* context-menu commands carry no slash range — the consumer keys off
   the "block" detail instead *)
let emit_cm_cmd command extra =
  Dom_ext.dispatch_custom "ls:editor-command"
    (detail_obj (("command", Js.Json.string command) :: extra))
;;

let run_cm_item t label =
  match (get t).cm with
  | Some cm ->
      emit_cm_cmd label [ "block", Js.Json.string cm.block_id ];
      close_cm t
  | None -> ()
;;

let run_cm_color t color =
  match (get t).cm with
  | Some cm ->
      emit_cm_cmd "Set block color"
        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string color ];
      close_cm t
  | None -> ()
;;

let run_cm_heading t h =
  match (get t).cm with
  | Some cm ->
      emit_cm_cmd "Set heading"
        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string h ];
      close_cm t
  | None -> ()
;;
