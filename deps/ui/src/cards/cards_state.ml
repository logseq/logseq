(* Flashcards modal state — deck list (logseq.class/Cards blocks), the
   selected deck, and the due card blocks for it.

   Entry point: `ls:open-cards` CustomEvent (no detail) dispatched by the
   left sidebar's .flashcards-nav link — cljs `[:modal/show-cards]`.
   Escape closes the modal; the global Dismiss_all path also listens for
   Escape but this state is area-local, so we handle it here. *)

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
  ; (* cljs *phase: :init | :show-cloze | :show-answer — the test flow only
       exercises init -> show-answer *)
    revealed : bool Signal.state
  ; opts_open : bool Signal.state
  ; cards : string list Signal.state (* block titles *)
  ; pos : int Signal.state
  ; phase : string Signal.state
      (* cljs fsrs.cljs *phase: "init" | "show-cloze" | "show-answer" *)
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

(* block titles for due-card entity ids *)
let card_titles repo ids =
  let* a =
    ids
    |> List.map (fun eid ->
           let* w =
             q repo
               (Printf.sprintf "[:find ?t . :where [%d :block/title ?t]]" eid)
           in
           Js.Promise.resolve (Option.value (Wire.as_string w) ~default:""))
    |> Array.of_list |> Js.Promise.all
  in
  Js.Promise.resolve (Array.to_list a)

let load_cards st repo =
  let sel_arg =
    let sel = Signal.get_state st.sel in
    if sel < 0 then Wire.String "global"
    else
      match List.nth_opt (Signal.get_state st.decks) sel with
      | Some d -> Wire.Int d.deck_eid
      | None -> Wire.String "global"
  in
  (let* w =
    Runtime.invoke2 "thread-api/get-fsrs-due-card-block-ids"
      (Wire.String repo) sel_arg
  in
  let ids =
    match w with
    | Wire.Array xs | Wire.List xs -> List.filter_map Wire.as_int xs
    | _ -> []
  in
  let* titles = card_titles repo ids in
  Runtime.signal_set st.cards titles;
  Runtime.signal_set st.pos 0;
  Runtime.signal_set st.phase "init";
  Js.Promise.resolve ())
  |> ignore

let open_modal st =
  Runtime.signal_set st.open_ true;
  Runtime.signal_set st.sel (-1);
  Runtime.signal_set st.revealed false;
  Runtime.signal_set st.opts_open false;
  Runtime.signal_set st.phase "init";
  let r = repo () in
  if r = "" then ()
  else (
    load_decks st r;
    load_cards st r)

let close st = Runtime.signal_set st.open_ false

let reveal st = Runtime.signal_set st.revealed true

(* rating advances to the next card; cljs also persists the fsrs state —
   the OCaml worker has no rate endpoint yet, so only the index moves *)
let rate st =
  Runtime.signal_set st.pos (Signal.get_state st.pos + 1);
  Runtime.signal_set st.revealed false
let toggle_opts st =
  Runtime.signal_set st.opts_open (not (Signal.get_state st.opts_open))

let select_deck st i =
  Runtime.signal_set st.sel i;
  Runtime.signal_set st.opts_open false;
  let r = repo () in
  if r = "" then () else load_cards st r

(* insert an empty Cards-tagged block at the end of today's journal,
   matching cljs <create-cards-block! *)
let add_cards_block st =
  let r = repo () in
  if r = "" then ()
  else
    let day = Dates.today_journal_day () in
    (let* page_w =
      Runtime.invoke2 "thread-api/get-journal-page-by-day"
        (Wire.String r) (Wire.Int day)
    in
    match Wire.map_get_uuid page_w "block/uuid" with
    | None -> Js.Promise.resolve ()
    | Some page_uuid ->
        (let* v = cards_class_uuid r in
        match v with None -> Js.Promise.resolve ()
      | Some cards_uuid ->
 let new_uuid = Platform.random_uuid () in
 let new_block =
   Wire.Map
     [ (Wire.String "block/title", Wire.String "")
     ; (Wire.String "block/uuid", Wire.Uuid new_uuid)
     ; ( Wire.String "block/tags"
       , Wire.Set
           [ Wire.Array
               [ Wire.Keyword "block/uuid"
               ; Wire.Uuid cards_uuid ] ] ) ]
 in
 let* _ =
   Runtime.invoke3 "thread-api/apply-outliner-ops"
     (Wire.String r)
     (Wire.Array
        [ Wire.Array
            [ Wire.Keyword "insert-blocks"
            ; Wire.Array
                [ Wire.List [ new_block ]
                ; Wire.Uuid page_uuid
                ; Wire.Map
                    [ ( Wire.Keyword "sibling?"
                      , Wire.Bool false )
                    ; ( Wire.Keyword "keep-uuid?"
                      , Wire.Bool true )
                    ; ( Wire.Keyword "outliner-op"
                      , Wire.Keyword "insert-blocks" )
                    ]
                ]
            ]
        ])
     (Wire.Map [])
 in
 close st;
 Router.reload ();
 Js.Promise.resolve ()))
    |> ignore

let on_keydown ev st =
  if Platform.event_str ev "key" = "Escape"
     && Signal.get_state st.open_
  then close st

let init (ms : Model.t Signal.signal) : t =
  match !st_ref with
  | Some st -> st
  | None ->
      let owner = ms.Signal.owner in
      let st =
        { open_ = Signal.state owner false
        ; decks = Signal.state owner []
        ; sel = Signal.state owner (-1)
        ; revealed = Signal.state owner false
        ; opts_open = Signal.state owner false
        ; cards = Signal.state owner []
        ; pos = Signal.state owner 0
        ; phase = Signal.state owner "init"
        }
      in
      st_ref := Some st;
      Web_dom.on_document_event "ls:open-cards" (fun _ ->
          open_modal st);
      Web_dom.on_document_event "keydown" (fun ev -> on_keydown ev st);
      st

let ensure ms = ignore (init ms)
