(* Sidebar state — favorites, recents, sticky-nav prefs and right-sidebar
   items. Area signals live on the app scheduler (ms.Signal.owner); async
   loads publish via Runtime.signal_set so the DOM updates outside the LUI
   event loop.

   Cross-area contract:
   - dispatches `ls:open-dialog` CustomEvent {detail: {name: <string>}}
     for dialogs owned by other areas: "settings", "import",
     "export-graph", "login", "delete-page", "cards", "plugins".
   - listens for `ls:open-right-sidebar` {detail: {uuid}} (sdk
     `open_in_right_sidebar`, cmdk shift+enter) and document shift+click
     on a.page-ref / [data-testid='page title'] to add right-sidebar
     items.
   - refresh: chains onto worker.on_message for the "sync-db-changes"
     broadcast and re-fetches sidebar data + the current route.
     TODO(app): move to a shared tx->refresh handler once one exists. *)

(* i18n placeholder: keep the t() call shape so keys can be wired to real
   dictionaries once a shared i18n module lands. *)
let t (s : string) = s

let default_navs = [ "flashcards"; "all-pages"; "graph-view" ]

(* A rendered right-sidebar entry. kind maps to .item-type-<kind>. *)
type item =
  { key : string
  ; kind : string
  ; uuid : string option
  ; title : string
  ; breadcrumb : string list
  ; blocks : Model.block list
  ; page_ref : string option
  }

type t =
  { favorites : Model.page list Signal.state
  ; recents : Model.page list Signal.state
  ; nav_checked : string list Signal.state
  ; nav_tag_titles : (string * string) list Signal.state
  ; favorited : bool Signal.state
  ; items : item list Signal.state
  ; open_menu : string Signal.state
  }

let st_ref : t option ref = ref None
let model_ref : Model.t ref = ref Model.initial
let hook_installed = ref false
let loaded_repo : string option ref = ref None
let last_page_key : string option ref = ref None

(* ---------- json event helpers ---------- *)

let jfield = Worker_client.json_field
let jstring = Worker_client.json_string

let jbool name j =
  match jfield name j with
  | Some v -> (
      match Js.Json.classify v with
      | Js.Json.JSONTrue -> true
      | _ -> false)
  | None -> false

external closest :
  Js.Json.t -> string -> Js.Json.t option
  = "closest" [@@mel.send] [@@mel.return nullable]

let click_target sel ev =
  match jfield "target" ev with
  | Some tgt -> closest tgt sel
  | None -> None

let detail_string name ev =
  match jfield "detail" ev with
  | Some d -> (
      match jfield name d with
      | Some v -> jstring v
      | None -> None)
  | None -> None

external set_el_width :
  Webapi.Dom.Element.t -> string -> unit = "width" [@@mel.set]
  [@@mel.scope "style"]

(* #right-sidebar is chrome.ml's wrapper and carries no width; the
   resizer writes the persisted width inline, so we mirror that for
   .cp__right-sidebar.open to have a visible box. *)
let sync_right_sidebar_width () =
  match Platform.get_element_by_id "right-sidebar" with
  | Some el ->
      let width =
        match Platform.local_storage_get "ls-right-sidebar-width" with
        | Some w -> w
        | None -> "40%"
      in
      set_el_width el
        (if (!model_ref).Model.right_sidebar_open then width else "0px")
  | None -> ()

(* ---------- storage ---------- *)

let nav_checked_of_storage () =
  match Platform.local_storage_get "ls-sidebar-navigations" with
  | Some s -> (
      try
        match Edn.parse s with
        | Wire.List xs | Wire.Array xs | Wire.Set xs ->
            List.filter_map Wire.as_keyword xs
        | _ -> default_navs
      with _ -> default_navs)
  | None -> default_navs

let persist_nav_checked xs =
  Platform.local_storage_set "ls-sidebar-navigations"
    (Edn.to_string (Wire.List (List.map (fun n -> Wire.Keyword n) xs)))

let rec take n xs =
  match n, xs with
  | 0, _ | _, [] -> []
  | n, x :: tl -> x :: take (n - 1) tl

let recent_ids_of_storage repo =
  match Platform.local_storage_get "ui/recent-pages" with
  | Some s -> (
      try
        match Edn.parse s with
        | Wire.Map kvs -> (
            match
              List.find_map
                (fun (k, v) ->
                  match k with
                  | Wire.String r | Wire.Keyword r | Wire.Symbol r ->
                      if r = repo then Some v else None
                  | _ -> None)
                kvs
            with
            | Some v -> List.filter_map Wire.as_int (Sdk_util.wire_elems v)
            | None -> [])
        | _ -> []
      with _ -> [])
  | None -> []

let push_recent repo id =
  let ids =
    id :: take 14 (List.filter (fun x -> x <> id) (recent_ids_of_storage repo))
  in
  Platform.local_storage_set "ui/recent-pages"
    (Edn.to_string
       (Wire.Map
          [ ( Wire.String repo
            , Wire.List (List.map (fun i -> Wire.Int i) ids) ) ]))

(* ---------- worker loaders ---------- *)

let pages_of_wire w =
  match w with
  | Wire.Array xs | Wire.List xs -> List.filter_map Decode.page_of_summary xs
  | _ -> []

let then_keep p k =
  ignore
    (Js.Promise.then_
       (fun w ->
         k w;
         Js.Promise.resolve ())
       p)

let load_favorites repo st =
  then_keep
    (Runtime.invoke1 "thread-api/get-favorite-pages" (Wire.String repo))
    (fun w -> Runtime.signal_set st.favorites (pages_of_wire w))

let load_recents repo st =
  let ids =
    Wire.List (List.map (fun i -> Wire.Int i) (recent_ids_of_storage repo))
  in
  then_keep
    (Runtime.invoke2 "thread-api/get-recent-pages" (Wire.String repo) ids)
    (fun w -> Runtime.signal_set st.recents (pages_of_wire w))

let load_nav_tag_titles repo st =
  let pull_cls cls =
    Runtime.invoke3 "thread-api/pull" (Wire.String repo)
      (Wire.String "[:block/uuid :block/title :block/name]")
      (Wire.Keyword cls)
    |> Js.Promise.then_ (fun w ->
           Js.Promise.resolve
             (match Wire.map_get_string w "block/title" with
              | Some _ as t -> t
              | None -> Wire.map_get_string w "block/name"))
  in
  then_keep
    (Js.Promise.all2
       (pull_cls "logseq.class/Asset", pull_cls "logseq.class/Task"))
    (fun (asset, task) ->
      Runtime.signal_set st.nav_tag_titles
        (List.filter_map Fun.id
           [ Option.map (fun t -> ("assets", t)) asset
           ; Option.map (fun t -> ("tasks", t)) task ]))

let refresh_favorited repo st =
  match !Runtime.current_page with
  | Some p -> (
      match p.Model.page_uuid with
      | Some u ->
          then_keep
            (Runtime.invoke2 "thread-api/favorited-page?"
               (Wire.String repo) (Wire.Uuid u))
            (fun w ->
              Runtime.signal_set st.favorited (Wire.as_bool w = Some true))
      | None -> Runtime.signal_set st.favorited false)
  | None -> Runtime.signal_set st.favorited false

(* ---------- navigation ---------- *)

external encode_uri_component : string -> string = "encodeURIComponent"

let navigate_to_page target =
  let target =
    if Sdk_util.is_uuid_string target then target
    else encode_uri_component target
  in
  Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ target));
  Platform.dispatch "ls:navigate" Js.Json.null

(* Ref value for get-page-route-info / get-page-blocks-tree: a bare uuid
   or page-name string. The [:block/uuid u] lookup-ref ARRAY that
   Router.page_ref builds decodes to a Vector that the endpoints'
   Ldb.get_page does not match (returns nil) — TODO(shared): fix
   Router.page_ref / Ldb.get_page so #/page/<uuid> hash routes work. *)
let route_ref s =
  if Sdk_util.is_uuid_string s then Wire.Uuid s else Wire.String s

(* Router.fetch_blocks goes through the broken lookup-ref; keep a local
   copy that passes a bare uuid/name until the shared fix lands. *)
let fetch_blocks (p : Model.page) =
  Runtime.invoke3 "thread-api/get-page-blocks-tree"
    (Wire.String (Router.repo ()))
    (route_ref
       (match p.Model.page_uuid with
        | Some u -> u
        | None -> p.Model.page_title))
    Wire.Nil
  |> Js.Promise.then_ (fun blocks_w ->
         Outliner_ops.resolve_block_tags (Decode.blocks_of_wire blocks_w)
         |> Js.Promise.then_ (fun blocks ->
                Js.Promise.resolve
                  { p with Model.page_blocks = blocks }))

let open_dialog name =
  let o = Js.Dict.empty () in
  Js.Dict.set o "name" (Js.Json.string name);
  Platform.dispatch "ls:open-dialog" (Sdk_convert.json_obj o)

let ensure_right_open () =
  if not (!model_ref).Model.right_sidebar_open then
    Runtime.send Action.Toggle_right_sidebar

(* ---------- right-sidebar items ---------- *)

let item_of_page (p : Model.page) =
  { key = "page-" ^ Option.value p.Model.page_uuid ~default:p.page_title
  ; kind = "page"
  ; uuid = p.Model.page_uuid
  ; title = p.Model.page_title
  ; breadcrumb = []
  ; blocks = p.Model.page_blocks
  ; page_ref =
      Some
        (match p.Model.page_title with
         | "" -> (
             match p.Model.page_uuid with
             | Some u -> u
             | None -> "")
         | t -> t)
  }

let page_item_of_ref repo (target : string) : item option Js.Promise.t =
  Runtime.invoke2 "thread-api/get-page-route-info" (Wire.String repo)
    (route_ref target)
  |> Js.Promise.then_ (fun info ->
         match Decode.page_of_summary info with
         | None -> Js.Promise.resolve None
         | Some p ->
             fetch_blocks p
             |> Js.Promise.then_ (fun p' ->
                    Js.Promise.resolve (Some (item_of_page p'))))

(* pull of the entity; a "page" is tagged logseq.class/* — blocks have a
   :block/page ref back to their page. *)
let pull_entity repo uuid : Wire.t Js.Promise.t =
  Runtime.invoke3 "thread-api/pull" (Wire.String repo)
    (Wire.String
       "[:block/uuid :block/title :block/name :db/id :block/page {:block/tags [:db/ident]}]")
    (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])

let is_page_entity w =
  let class_tagged =
    match Wire.get w "block/tags" with
    | Some tags ->
        List.exists
          (fun tg ->
            match Wire.map_get_string tg "db/ident" with
            | Some id ->
                String.length id > 13
                && String.sub id 0 13 = "logseq.class/"
            | None -> false)
          (Sdk_util.wire_elems tags)
    | None -> false
  in
  class_tagged
  || (Wire.get w "block/page" = None
      && Wire.map_get_string w "block/name" <> None)

let block_of_pair pair =
  match Wire.get pair "block" with
  | Some b -> b
  | None -> (
      match Sdk_util.wire_elems pair with
      | [ _; b ] -> b
      | _ -> Wire.Nil)

let breadcrumb_titles w =
  List.filter_map
    (fun p ->
      match Wire.map_get_string p "block/title" with
      | Some s -> Some s
      | None -> Wire.map_get_string p "block/name")
    (Sdk_util.wire_elems w)

let block_item_of_uuid repo uuid : item option Js.Promise.t =
  Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo)
    (Wire.Array
       [ Wire.Map
           [ (Wire.String "id", Wire.Uuid uuid)
           ; ( Wire.String "opts"
             , Wire.Map [ (Wire.Keyword "children?", Wire.Bool true) ] )
           ]
       ])
  |> Js.Promise.then_ (fun w ->
         match Sdk_util.wire_elems w with
         | [ pair ] -> (
             match block_of_pair pair with
             | Wire.Map _ as blk ->
                 let b = Decode.block_of_wire blk in
                 Runtime.invoke3 "thread-api/get-block-parents"
                   (Wire.String repo)
                   (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
                   (Wire.Int 8)
                 |> Js.Promise.then_ (fun parents ->
                        let crumbs = breadcrumb_titles parents in
                        Js.Promise.resolve
                          (Some
                             { key = "block-" ^ uuid
                             ; kind = "block"
                             ; uuid = Some uuid
                             ; title = b.Model.block_title
                             ; breadcrumb = crumbs
                             ; blocks = [ b ]
                             ; page_ref = List.nth_opt crumbs 0
                             }))
             | _ -> Js.Promise.resolve None)
         | _ -> Js.Promise.resolve None)

(* cljs :contents item renders the TOC of the CURRENT page (the page in
   the main area), not a page literally named "Contents" *)
let contents_item _repo : item option Js.Promise.t =
  let m = !model_ref in
  let current =
    match !Runtime.current_page with
    | Some p -> Some p
    | None -> (
        match m.Model.route_page with
        | Some p -> Some p
        | None -> List.nth_opt m.Model.journals 0)
  in
  match current with
  | Some p ->
      Js.Promise.resolve
        (Some
           { key = "contents"
           ; kind = "contents"
           ; uuid = p.Model.page_uuid
           ; title = t "Contents"
           ; breadcrumb = []
           ; blocks = p.Model.page_blocks
           ; page_ref = Some p.Model.page_title
           })
  | None -> Js.Promise.resolve None

let static_item key kind title =
  Some
    { key
    ; kind
    ; uuid = None
    ; title = t title
    ; breadcrumb = []
    ; blocks = []
    ; page_ref = None
    }

let has_item st key =
  List.exists (fun (i : item) -> i.key = key) (Signal.get_state st.items)

let push_item st it =
  let items = Signal.get_state st.items in
  if has_item st it.key then ()
  else Runtime.signal_set st.items (items @ [ it ])

let remove_item st key =
  Runtime.signal_set st.items
    (List.filter (fun (i : item) -> i.key <> key)
       (Signal.get_state st.items))

let add_promise st p =
  ignore
    (Js.Promise.then_
       (function
         | Some it ->
             push_item st it;
             Js.Promise.resolve ()
         | None -> Js.Promise.resolve ())
       p)

let open_ref st target =
  let repo = Router.repo () in
  if repo = "" then ()
  else
    let p =
      page_item_of_ref repo target
      |> Js.Promise.then_ (function
             | Some it -> Js.Promise.resolve (Some it)
             | None ->
                 if Sdk_util.is_uuid_string target then
                   block_item_of_uuid repo target
                 else Js.Promise.resolve None)
    in
    ensure_right_open ();
    add_promise st p

let open_uuid st uuid =
  let repo = Router.repo () in
  if repo = "" then ()
  else
    let p =
      pull_entity repo uuid
      |> Js.Promise.then_ (fun ent ->
             match ent with
             | Wire.Map _ ->
                 if is_page_entity ent then
                   page_item_of_ref repo uuid
                 else block_item_of_uuid repo uuid
             | _ ->
                 if Sdk_util.is_uuid_string uuid then
                   block_item_of_uuid repo uuid
                 else Js.Promise.resolve None)
    in
    ensure_right_open ();
    add_promise st p

let open_sticky_item st kind =
  let repo = Router.repo () in
  if repo = "" then ()
  else
    match kind with
    | "contents" when not (has_item st "contents") ->
        add_promise st (contents_item repo)
    | "page-graph" when not (has_item st "page-graph") ->
        (match static_item "page-graph" "page-graph" "Page graph" with
         | Some it -> push_item st it
         | None -> ())
    | "help" when not (has_item st "help") ->
        (match static_item "help" "help" "Help" with
         | Some it -> push_item st it
         | None -> ())
    | _ -> ()

let ensure_contents st =
  let repo = Router.repo () in
  if repo <> "" && Signal.get_state st.items = [] then
    add_promise st (contents_item repo)

let refresh_item repo (it : item) : item Js.Promise.t =
  let fallback = Js.Promise.resolve it in
  match it.kind with
  | "contents" -> (
      contents_item repo
      |> Js.Promise.then_ (function
             | Some it' -> Js.Promise.resolve it'
             | None -> fallback))
  | "page" -> (
      match it.page_ref with
      | Some r ->
          page_item_of_ref repo r
          |> Js.Promise.then_ (function
                 | Some it' -> Js.Promise.resolve it'
                 | None -> fallback)
      | None -> fallback)
  | "block" -> (
      match it.uuid with
      | Some u ->
          block_item_of_uuid repo u
          |> Js.Promise.then_ (function
                 | Some it' -> Js.Promise.resolve { it' with key = it.key }
                 | None -> fallback)
      | None -> fallback)
  | _ -> fallback

let refresh_items repo st =
  let items = Signal.get_state st.items in
  if items <> [] then
    ignore
      (Js.Promise.all (Array.of_list (List.map (refresh_item repo) items))
       |> Js.Promise.then_ (fun arr ->
              Runtime.signal_set st.items (Array.to_list arr);
              Js.Promise.resolve ()))

(* ---------- favorites ---------- *)

let toggle_favorite st =
  match !Runtime.current_page, (!model_ref).Model.repo with
  | Some p, Some repo -> (
      match p.Model.page_uuid with
      | Some u ->
          let fav = Signal.get_state st.favorited in
          then_keep
            (Runtime.invoke3 "thread-api/set-page-favorite"
               (Wire.String repo) (Wire.Uuid u) (Wire.Bool (not fav)))
            (fun _ ->
              load_favorites repo st;
              refresh_favorited repo st)
      | None -> ())
  | _ -> ()

(* ---------- model / worker wiring ---------- *)

let on_sync st =
  match (!model_ref).Model.repo with
  | Some repo ->
      load_favorites repo st;
      load_recents repo st;
      refresh_favorited repo st;
      refresh_items repo st;
      Router.load_route (!model_ref).Model.route
  | None -> ()

let install_worker_hook st =
  match !Runtime.worker with
  | Some w when not !hook_installed ->
      hook_installed := true;
      let prev = w.Worker_client.on_message in
      w.Worker_client.on_message <-
        (fun e payload ->
          prev e payload;
          if e = "sync-db-changes" then on_sync st)
  | _ -> ()

let page_key (p : Model.page) =
  match p.Model.page_uuid with
  | Some u -> "u:" ^ u
  | None -> "d:" ^ string_of_int (Option.value p.Model.page_db_id ~default:0)

let on_model st (m : Model.t) =
  model_ref := m;
  (match m.Model.repo with
   | Some repo when !loaded_repo <> Some repo ->
       loaded_repo := Some repo;
       install_worker_hook st;
       load_favorites repo st;
       load_recents repo st;
       load_nav_tag_titles repo st;
       refresh_favorited repo st
   | _ -> ());
  (match m.Model.route_page with
   | Some p when m.Model.phase = Model.Ready ->
       let key = page_key p in
       if !last_page_key <> Some key then (
         last_page_key := Some key;
         refresh_favorited (Router.repo ()) st;
         match m.Model.repo, p.Model.page_db_id with
         | Some repo, Some id ->
             push_recent repo id;
             load_recents repo st
         | _ -> ())
   | _ -> ());
  sync_right_sidebar_width ()

let on_doc_click st ev =
  match click_target "a.page-ref" ev with
  | Some el -> (
      match Platform.get_attribute el "data-ref" with
      | Some ref_ ->
          if jbool "shiftKey" ev then open_ref st ref_
          else if not (jbool "metaKey" ev || jbool "ctrlKey" ev) then
            navigate_to_page ref_
      | None -> ())
  | None ->
      if jbool "shiftKey" ev then
        match click_target "[data-testid='page title']" ev with
        | Some _ -> (
            match !Runtime.current_page with
            | Some p -> (
                match p.Model.page_uuid with
                | Some u -> open_uuid st u
                | None -> ())
            | None -> ())
        | None -> ()

let on_doc_keydown st ev =
  match jfield "key" ev with
  | Some k -> (
      match jstring k with
      | Some "Escape" ->
          if Signal.get_state st.open_menu <> "" then
            Runtime.signal_set st.open_menu ""
      | _ -> ())
  | None -> ()

let init (ms : Model.t Signal.signal) : t =
  match !st_ref with
  | Some st -> st
  | None ->
      let owner = ms.Signal.owner in
      let st =
        { favorites = Signal.state owner []
        ; recents = Signal.state owner []
        ; nav_checked = Signal.state owner (nav_checked_of_storage ())
        ; nav_tag_titles = Signal.state owner []
        ; favorited = Signal.state owner false
        ; items = Signal.state owner []
        ; open_menu = Signal.state owner ""
        }
      in
      st_ref := Some st;
      ignore (Signal.subscribe ~emit_initial:false ms (on_model st));
      Platform.on_document_event "ls:open-right-sidebar" (fun ev ->
          match detail_string "uuid" ev with
          | Some u -> open_uuid st u
          | None -> ());
      Platform.on_document_event "click" (on_doc_click st);
      Platform.on_document_event "keydown" (on_doc_keydown st);
      st

let ensure ms = init ms

let toggle_nav st nav checked =
  let cur = Signal.get_state st.nav_checked in
  let next =
    if checked then if List.mem nav cur then cur else cur @ [ nav ]
    else List.filter (fun n -> n <> nav) cur
  in
  Runtime.signal_set st.nav_checked next;
  persist_nav_checked next

let close_menu st = Runtime.signal_set st.open_menu ""
let open_nav_menu st = Runtime.signal_set st.open_menu "nav-edit"
let open_dots_menu st = Runtime.signal_set st.open_menu "dots"
let open_item_menu st key =
  Runtime.signal_set st.open_menu ("item-" ^ key)

let open_as_page st (it : item) =
  match it.page_ref with
  | Some r ->
      navigate_to_page r;
      close_menu st
  | None -> ()
