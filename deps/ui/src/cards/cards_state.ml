(* Flashcards modal state — deck list (logseq.class/Cards blocks), the
   selected deck, and the due card blocks for it.

   Entry point: `ls:open-cards` CustomEvent (optionally {eid} — the
   Cards block's db/id, like cljs [:modal/show-cards cards-id]) —
   dispatched by the left sidebar's .flashcards-nav link and the
   Practice button on a Cards block. Escape closes the modal; the
   global Dismiss_all path also listens for Escape but this state is
   area-local, so we handle it here. *)

open Promise_ext

type deck =
  { deck_eid : int
  ; deck_uuid : string
  ; deck_label : string
  }

type t =
  { open_ : bool Signal.state
  ; decks : deck list Signal.state
  ; sel : int Signal.state (* -1 = All cards *)
  ; opts_open : bool Signal.state
  ; cards : int list Signal.state (* due block eids *)
  ; all_cards : int list Signal.state (* every card eid in scope —
                                         cljs *all-block-ids drives the
                                         no-due/finished states *)
  ; pos : int Signal.state
  ; phase : string Signal.state
      (* cljs fsrs.cljs *phase: "init" | "show-cloze" | "show-answer" *)
  ; cur : Model.block option Signal.state (* current card's block tree *)
  ; crumbs : string list Signal.state (* block breadcrumb titles *)
  ; due_labels : string list Signal.state (* per-rating "in <time>" hints *)
  ; info_open : bool Signal.state
  }

let st_ref : t option ref = ref None

let repo = Runtime.repo

let q repo query =
  Runtime.invoke2 "thread-api/q" (Wire.String repo)
    (Wire.Array [ Wire.String query ])

let cards_class_eid repo =
  let* w = q repo "[:find ?e . :where [?e :db/ident :logseq.class/Cards]]" in
  Js.Promise.resolve (Wire.as_int w)

let cards_class_uuid repo =
  let* w =
    q repo
      "[:find ?u . :where [?e :db/ident :logseq.class/Cards] \
       [?e :block/uuid ?u]]"
  in
  Js.Promise.resolve (Wire.as_uuid w)

(* cljs db-content/recur-replace-uuid-in-block-title (single pass — no
   recursive ref-of-ref resolution): [[u]] -> [[title]], #[[u]] -> #title
   or #[[title]] when the title contains spaces *)
let refs_to_names title pairs =
  let title =
    List.fold_left
      (fun t (u, rt) ->
        let rep =
          if String.contains rt ' ' then "#[[" ^ rt ^ "]]" else "#" ^ rt
        in
        Title_refs.replace_all t ~pat:("#[[" ^ u ^ "]]") ~rep)
      title pairs
  in
  List.fold_left
    (fun t (u, rt) ->
      Title_refs.replace_all t
        ~pat:("[[" ^ u ^ "]]")
        ~rep:("[[" ^ rt ^ "]]"))
    title pairs

(* label = block title; blank title -> query property block's title with
   uuid refs rendered as page names *)
let deck_label repo eid title =
  if String.trim title <> "" then Js.Promise.resolve title
  else
    let* w =
      q repo
        (Printf.sprintf
           "[:find ?t . :where [%d :logseq.property/query ?qb] \
            [?qb :block/title ?t]]"
           eid)
    in
    let qt = Option.value (Wire.as_string w) ~default:"" in
    if qt = "" then Js.Promise.resolve ""
    else
      let* w =
        q repo
          (Printf.sprintf
             "[:find ?u ?rt :where [%d :logseq.property/query ?qb] \
              [?qb :block/refs ?r] [?r :block/uuid ?u] \
              [?r :block/title ?rt]]"
             eid)
      in
      let pairs =
        List.filter_map
          (fun row ->
            match Wire.elems row with
            | [ u; Wire.String rt ] -> (
                match Wire.as_uuid u with
                | Some u -> Some (u, rt)
                | None -> (
                    match Wire.as_string u with
                    | Some u -> Some (u, rt)
                    | None -> None))
            | _ -> None)
          (Wire.elems w)
      in
      Js.Promise.resolve (refs_to_names qt pairs)

let decks_of_wire repo w =
  let items =
    match w with
    | Wire.Array xs | Wire.List xs -> xs
    | _ -> []
  in
  let* a =
    items
    |> List.filter_map (fun e ->
           match Wire.map_get_int e "db/id", Wire.map_get_uuid e "block/uuid" with
           | Some eid, Some uuid ->
               Some (eid, uuid, Wire.map_get_string e "block/title")
           | _ -> None)
    |> List.map (fun (eid, uuid, title) ->
           let* label = deck_label repo eid (Option.value title ~default:"") in
           Js.Promise.resolve { deck_eid = eid; deck_uuid = uuid; deck_label = label })
    |> Array.of_list |> Js.Promise.all
  in
  Js.Promise.resolve (Array.to_list a)

let load_decks st repo =
  (let* v = cards_class_eid repo in
   let* w =
     match v with None -> Js.Promise.resolve (Wire.Array [])
   | Some cid ->
       Runtime.invoke2 "thread-api/get-class-objects"
         (Wire.String repo) (Wire.Int cid)
   in
   let* decks = decks_of_wire repo w in
   Runtime.signal_set st.decks decks;
   Js.Promise.resolve ())
  |> ignore

let ids_of_wire w =
  match w with
  | Wire.Array xs | Wire.List xs -> List.filter_map Wire.as_int xs
  | _ -> []

(* the full due + all id sets for the selected scope — cljs
   <get-due-card-block-ids / <get-card-block-ids *)
let card_ids repo sel_arg ~due_only =
  Runtime.invoke2
    (if due_only then "thread-api/get-fsrs-due-card-block-ids"
     else "thread-api/get-fsrs-card-block-ids")
    (Wire.String repo) sel_arg

let sel_arg st =
  let sel = Signal.get_state st.sel in
  if sel < 0 then Wire.String "global"
  else
    match List.nth_opt (Signal.get_state st.decks) sel with
    | Some d -> Wire.Int d.deck_eid
    | None -> Wire.String "global"

let set_phase st v =
  (* cljs {:show-cloze?} only past :init — Render_inline reads the flag
     when each cloze mounts *)
  Render_inline.cloze_reveal_all := v <> "init";
  Runtime.signal_set st.phase v

(* fetch the current card's block subtree + breadcrumb + due labels *)
let load_current st repo =
  Runtime.signal_set st.cur None;
  Runtime.signal_set st.crumbs [];
  Runtime.signal_set st.due_labels [];
  let pos = Signal.get_state st.pos in
  match List.nth_opt (Signal.get_state st.cards) pos with
  | None -> ()
  | Some eid ->
      (let* w =
         Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo)
           (Wire.Array
              [ Wire.Map
                  [ (Wire.String "id", Wire.Int eid)
                  ; ( Wire.String "opts"
                    , Wire.Map
                        [ (Wire.String "children?", Wire.Bool true) ] )
                  ]
              ])
       in
       let blk : Model.block option =
         match Wire.elems w with
         | [ pair ] -> (
             match Decode.nest_get_blocks pair with
             | Some w -> Some (Decode.block_of_wire w)
             | None -> (
                 match Wire.block_of_pair pair with
                 | Some (Wire.Map _ as b) -> Some (Decode.block_of_wire b)
                 | _ -> None))
         | _ -> None
       in
       Runtime.signal_set st.cur blk;
       (* breadcrumb — cljs block-breadcrumb shows page + ancestors *)
       let* parents =
         Runtime.invoke3 "thread-api/get-block-parents"
           (Wire.String repo)
           (Wire.Int eid)
           (Wire.Int 8)
       in
       let crumbs =
         List.filter_map
           (fun p ->
             match Wire.map_get_string p "block/title" with
             | Some s -> Some s
             | None -> Wire.map_get_string p "block/name")
           (Wire.elems parents)
       in
       Runtime.signal_set st.crumbs crumbs;
       (* due hints on the rating buttons — cljs btn-with-shortcut shows
          util/human-time of each rating's next :due *)
       let* w =
         Runtime.invoke3 "thread-api/pull" (Wire.String repo)
           (Wire.String
              "[:block/uuid :block/created-at :logseq.property.fsrs/state \
               :logseq.property.fsrs/due]")
           (Wire.Int eid)
       in
       let now = Int64.of_float (Platform.date_now_ms ()) in
       let card =
         Fsrs_sched.card_of_property_wire
           (match Wire.get w "logseq.property.fsrs/state" with
            | Some (Wire.Map _ as m) -> m
            | _ -> Wire.Map [])
           (Option.bind (Wire.get w "logseq.property.fsrs/due")
              Fsrs_sched.ms_of_wire)
           ~created_at:(Option.bind
                          (Wire.get w "block/created-at")
                          Fsrs_sched.ms_of_wire)
           ~now
       in
       (match card with
        | Some c ->
            Runtime.signal_set st.due_labels
              (Fsrs_sched.due_labels ~now c)
        | None -> ());
       Js.Promise.resolve ())
      |> ignore

let load_cards st repo =
  (let sel_arg = sel_arg st in
   let* due_w = card_ids repo sel_arg ~due_only:true in
   let* all_w = card_ids repo sel_arg ~due_only:false in
   Runtime.signal_set st.all_cards (ids_of_wire all_w);
   Runtime.signal_set st.cards (ids_of_wire due_w);
   Runtime.signal_set st.pos 0;
   set_phase st "init";
   load_current st repo;
   Js.Promise.resolve ())
  |> ignore

let refresh_due_count = ref (fun () -> ())

(* cljs rate-card! -> repeat-card! -> set-block-properties! *)
let rate st rating =
  match Fsrs_sched.rating_of_string rating with
  | None -> ()
  | Some r ->
      let r_ = repo () in
      let pos = Signal.get_state st.pos in
      (match List.nth_opt (Signal.get_state st.cards) pos with
       | None -> ()
       | Some eid ->
           if r_ = "" then ()
           else
             (let* w =
                Runtime.invoke3 "thread-api/pull" (Wire.String r_)
                  (Wire.String
                     "[:block/uuid :block/created-at \
                      :logseq.property.fsrs/state \
                      :logseq.property.fsrs/due]")
                  (Wire.Int eid)
              in
              let now = Int64.of_float (Platform.date_now_ms ()) in
              (match
                 Fsrs_sched.card_of_property_wire
                   (match Wire.get w "logseq.property.fsrs/state" with
                    | Some (Wire.Map _ as m) -> m
                    | _ -> Wire.Map [])
                   (Option.bind (Wire.get w "logseq.property.fsrs/due")
                      Fsrs_sched.ms_of_wire)
                   ~created_at:
                     (Option.bind (Wire.get w "block/created-at")
                        Fsrs_sched.ms_of_wire)
                   ~now
               with
               | None -> Js.Promise.resolve ()
               | Some card -> (
                   let next = Fsrs_sched.next_card ~now card r in
                   match Wire.map_get_uuid w "block/uuid" with
                   | None -> Js.Promise.resolve ()
                   | Some uuid ->
                       Outliner_ops.apply
                         ~opts:(Outliner_ops.op_opts "set-block-property")
                         [ Outliner_ops.set_block_property uuid
                             "logseq.property.fsrs/state"
                             (Fsrs_sched.state_wire ~rating:r next)
                         ; Outliner_ops.set_block_property uuid
                             "logseq.property.fsrs/due"
                             (Wire.Int64 next.Fsrs_sched.due)
                         ])))
             |> ignore);
      set_phase st "init";
      Runtime.signal_set st.pos (pos + 1);
      load_current st r_;
      !refresh_due_count ()

let toggle_opts st =
  Runtime.signal_set st.opts_open (not (Signal.get_state st.opts_open))

let toggle_info st =
  Runtime.signal_set st.info_open (not (Signal.get_state st.info_open))

let select_deck st i =
  Runtime.signal_set st.sel i;
  Runtime.signal_set st.opts_open false;
  let r = repo () in
  if r = "" then () else load_cards st r

(* cljs practice-again! — review the whole scope, due or not *)
let practice_again st =
  Runtime.signal_set st.cards (Signal.get_state st.all_cards);
  Runtime.signal_set st.pos 0;
  set_phase st "init";
  let r = repo () in
  if r = "" then () else load_current st r

let close st =
  Runtime.signal_set st.open_ false;
  Render_inline.cloze_reveal_all := false;
  Runtime.signal_set st.info_open false;
  !refresh_due_count ()

(* cljs <create-cards-block! — append a class-Cards block to today's
   journal, then close the modal and route to that page *)
let add_cards_block st =
  let r = repo () in
  if r <> "" then
    ignore
      (let* _ = Graph.create_today_journal r in
       let title = Dates.today () in
       let* page =
         Runtime.invoke2 "thread-api/get-case-page" (Wire.String r)
           (Wire.String title)
       in
       match Wire.map_get_uuid page "block/uuid" with
       | None -> Js.Promise.resolve ()
       | Some puuid ->
           let uuid = Platform.random_uuid () in
           let* _ =
             Outliner_ops.apply
               ~opts:(Outliner_ops.op_opts "insert-blocks")
               [ Outliner_ops.insert_blocks ~bottom:true
                   [ Wire.Map
                       [ (Wire.String "block/uuid", Wire.Uuid uuid)
                       ; (Wire.String "block/title", Wire.String "")
                       ; ( Wire.Keyword "block/tags"
                         , Wire.Set [ Wire.Keyword "logseq.class/Cards" ] )
                       ]
                   ]
                   puuid ~sibling:false
               ]
           in
           close st;
           Sidebar_state.navigate_to_page title;
           Js.Promise.resolve ())

let open_modal st eid_opt =
  Render_inline.cloze_reveal_all := false;
  Runtime.signal_set st.open_ true;
  Runtime.signal_set st.opts_open false;
  Runtime.signal_set st.info_open false;
  Runtime.signal_set st.cards [];
  Runtime.signal_set st.all_cards [];
  Runtime.signal_set st.pos 0;
  Runtime.signal_set st.cur None;
  Runtime.signal_set st.crumbs [];
  set_phase st "init";
  !refresh_due_count ();
  let r = repo () in
  if r = "" then ()
  else (
    load_decks st r;
    match eid_opt with
    | None ->
        Runtime.signal_set st.sel (-1);
        load_cards st r
    | Some e ->
        (* the Practice button's deck: decks load async — poll until
           they land, then select the matching one (cljs
           initial-cards-id); unknown eid falls back to All cards *)
        let rec wait_sel tries =
          let decks = Signal.get_state st.decks in
          if decks = [] && tries > 0 then
            Web_dom.set_timeout (fun () -> wait_sel (tries - 1)) 20
          else (
            let idx =
              match
                List.find_index (fun d -> d.deck_eid = e) decks
              with
              | Some i -> i
              | None -> -1
            in
            Runtime.signal_set st.sel idx;
            load_cards st r)
        in
        wait_sel 50)

(* due-count badge for the sidebar nav — cljs :srs/cards-due-count *)
module Due_count = State_cell.Make (struct
    type t = int
    let name = "cards-due-count"
  end)

let () =
  refresh_due_count :=
    fun () ->
      let r = repo () in
      if r <> "" && Due_count.ready () then
        (let* w = card_ids r (Wire.String "global") ~due_only:true in
         Due_count.set (fun _ -> List.length (ids_of_wire w));
         Js.Promise.resolve ())
        |> ignore

let update_due_count () = !refresh_due_count ()

let open_cards eid_opt =
  match !st_ref with
  | Some st -> open_modal st eid_opt
  | None -> ()

(* fsrs.cljs has-cloze? *)
let has_cloze (s : string) =
  let needle = "{{cloze " in
  let ls = String.length s and ln = String.length needle in
  let rec go i =
    i + ln <= ls && (String.sub s i ln = needle || go (i + 1))
  in
  go 0

(* fsrs.cljs phase->next-phase *)
let next_phase cloze phase =
  match phase with
  | "init" -> if cloze then "show-cloze" else "show-answer"
  | "show-cloze" -> if cloze then "show-answer" else "init"
  | _ -> "init"

let cur_has_cloze st =
  match Signal.get_state st.cur with
  | Some b -> has_cloze b.Model.block_title
  | None -> false

let advance_phase st =
  set_phase st
    (next_phase (cur_has_cloze st) (Signal.get_state st.phase))

(* cljs shortcut.handler/cards: s toggles answers, 1-4 click the
   rating buttons (visible when next-phase = :init) *)
let on_keydown ev st =
  if Signal.get_state st.open_ then
    match Platform.event_str ev "key" with
    | "Escape" -> close st
    | "s" -> advance_phase st
    | k ->
        let np =
          next_phase (cur_has_cloze st) (Signal.get_state st.phase)
        in
        if np = "init" then
          match k with
          | "1" -> rate st "again"
          | "2" -> rate st "hard"
          | "3" -> rate st "good"
          | "4" -> rate st "easy"
          | _ -> ()
        else ()

let init (ms : Model.t Signal.signal) : t =
  match !st_ref with
  | Some st -> st
  | None ->
      let owner = ms.Signal.owner in
      let st =
        { open_ = Signal.state owner false
        ; decks = Signal.state owner []
        ; sel = Signal.state owner (-1)
        ; opts_open = Signal.state owner false
        ; cards = Signal.state owner []
        ; all_cards = Signal.state owner []
        ; pos = Signal.state owner 0
        ; phase = Signal.state owner "init"
        ; cur = Signal.state owner None
        ; crumbs = Signal.state owner []
        ; due_labels = Signal.state owner []
        ; info_open = Signal.state owner false
        }
      in
      st_ref := Some st;
      Web_dom.on_document_event "ls:open-cards" (fun ev ->
          let eid_opt =
            match Web_dom.ev_detail ev with
            | Some d -> (
                match Worker_client.json_field "eid" d with
                | Some j -> (
                    match Js.Json.classify j with
                    | Js.Json.JSONNumber f -> Some (int_of_float f)
                    | Js.Json.JSONString s -> int_of_string_opt s
                    | _ -> None)
                | None -> None)
            | None -> None
          in
          open_modal st eid_opt);
      Web_dom.on_document_event "keydown" (fun ev -> on_keydown ev st);
      st

let ensure ms = ignore (init ms)
