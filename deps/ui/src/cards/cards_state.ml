(* Flashcards modal state — deck list (logseq.class/Cards blocks), the
   selected deck, and the due card blocks for it.

   Entry point: `ls:open-dialog` CustomEvent {detail: {name: "cards"}}
   dispatched by the left sidebar's .flashcards-nav link.
   Escape closes the modal; the global Dismiss_all path also listens for
   Escape but this state is area-local, so we handle it here. *)

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
  ; cards : string list Signal.state (* block titles *)
  ; pos : int Signal.state
  }

let st_ref : t option ref = ref None
let t_ (s : string) = s

let repo () = Option.value !Runtime.current_repo ~default:""

let q repo query =
  Runtime.invoke2 "thread-api/q" (Wire.String repo)
    (Wire.Array [ Wire.String query ])

let cards_class_eid repo =
  q repo "[:find ?e . :where [?e :db/ident :logseq.class/Cards]]"
  |> Js.Promise.then_ (fun w ->
         Js.Promise.resolve (Wire.as_int w))

(* label = block title; blank title -> query property block's title *)
let deck_label repo eid title =
  if String.trim title <> "" then Js.Promise.resolve title
  else
    q repo
      (Printf.sprintf
         "[:find ?t . :where [%d :logseq.property/query ?qb] \
          [?qb :block/title ?t]]"
         eid)
    |> Js.Promise.then_ (fun w ->
           Js.Promise.resolve (Option.value (Wire.as_string w) ~default:""))

let decks_of_wire repo w =
  let items =
    match w with
    | Wire.Array xs | Wire.List xs -> xs
    | _ -> []
  in
  items
  |> List.filter_map (fun e ->
         match Wire.map_get_int e "db/id", Wire.map_get_uuid e "block/uuid" with
         | Some eid, Some uuid ->
             Some (eid, uuid, Wire.map_get_string e "block/title")
         | _ -> None)
  |> List.map (fun (eid, uuid, title) ->
         deck_label repo eid (Option.value title ~default:"")
         |> Js.Promise.then_ (fun label ->
                Js.Promise.resolve { deck_eid = eid; deck_uuid = uuid; deck_label = label }))
  |> Array.of_list |> Js.Promise.all
  |> Js.Promise.then_ (fun a -> Js.Promise.resolve (Array.to_list a))

let load_decks st repo =
  (cards_class_eid repo
   |> Js.Promise.then_ (function
        | None -> Js.Promise.resolve (Wire.Array [])
        | Some cid ->
            Runtime.invoke2 "thread-api/get-class-objects"
              (Wire.String repo) (Wire.Int cid))
   |> Js.Promise.then_ (fun w -> decks_of_wire repo w)
   |> Js.Promise.then_ (fun decks ->
          Runtime.signal_set st.decks decks;
          Js.Promise.resolve ()))
  |> ignore

(* block titles for due-card entity ids *)
let card_titles repo ids =
  ids
  |> List.map (fun eid ->
         q repo
           (Printf.sprintf "[:find ?t . :where [%d :block/title ?t]]" eid)
         |> Js.Promise.then_ (fun w ->
                Js.Promise.resolve (Option.value (Wire.as_string w) ~default:"")))
  |> Array.of_list |> Js.Promise.all
  |> Js.Promise.then_ (fun a -> Js.Promise.resolve (Array.to_list a))

let load_cards st repo =
  let sel_arg =
    let sel = Signal.get_state st.sel in
    match List.nth_opt (Signal.get_state st.decks) sel with
    | Some d when sel >= 0 -> Wire.Int d.deck_eid
    | _ -> Wire.String "global"
  in
  Runtime.invoke2 "thread-api/get-fsrs-due-card-block-ids"
    (Wire.String repo) sel_arg
  |> Js.Promise.then_ (fun w ->
         let ids =
           match w with
           | Wire.Array xs | Wire.List xs -> List.filter_map Wire.as_int xs
           | _ -> []
         in
         card_titles repo ids)
  |> Js.Promise.then_ (fun titles ->
         Runtime.signal_set st.cards titles;
         Runtime.signal_set st.pos 0;
         Js.Promise.resolve ())
  |> ignore

let open_modal st =
  Runtime.signal_set st.open_ true;
  Runtime.signal_set st.sel (-1);
  Runtime.signal_set st.opts_open false;
  let r = repo () in
  if r = "" then ()
  else (
    load_decks st r;
    load_cards st r)

let close st = Runtime.signal_set st.open_ false
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
    Runtime.invoke2 "thread-api/get-journal-page-by-day"
      (Wire.String r) (Wire.Int day)
    |> Js.Promise.then_ (fun page_w ->
           match Wire.map_get_uuid page_w "block/uuid" with
           | None -> Js.Promise.resolve ()
           | Some page_uuid ->
               let new_block =
                 Wire.Map
                   [ (Wire.String "block/title", Wire.String "")
                   ; ( Wire.String "block/uuid"
                     , Wire.Uuid (Platform.random_uuid ()) )
                   ; ( Wire.String "block/properties"
                     , Wire.Map
                         [ ( Wire.Keyword "block/tags"
                           , Wire.Array
                               [ Wire.Keyword "logseq.class/Cards" ] )
                         ] )
                   ]
               in
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
               |> Js.Promise.then_ (fun _ ->
                      close st;
                      Router.reload ();
                      Js.Promise.resolve ()))
    |> ignore

let on_open_dialog ev st =
  let name =
    match Js.Json.decodeObject (Platform.json_prop ev "detail") with
    | Some o -> (
        match Js.Dict.get o "name" with
        | Some v -> Option.value (Js.Json.decodeString v) ~default:""
        | None -> "")
    | None -> ""
  in
  if name = "cards" then open_modal st

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
        ; opts_open = Signal.state owner false
        ; cards = Signal.state owner []
        ; pos = Signal.state owner 0
        }
      in
      st_ref := Some st;
      Platform.on_document_event "ls:open-dialog" (fun ev ->
          on_open_dialog ev st);
      Platform.on_document_event "keydown" (fun ev -> on_keydown ev st);
      st

let ensure ms = ignore (init ms)
