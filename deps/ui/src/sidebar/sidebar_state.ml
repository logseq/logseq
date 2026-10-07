(* Sidebar state — favorites, recents, sticky-nav prefs and right-sidebar
   items. Area signals live on the app scheduler (ms.Signal.owner); async
   loads publish via Runtime.signal_set so the DOM updates outside the LUI
   event loop.

   Cross-area contract:
   - dispatches `ls:open-dialog` CustomEvent {detail: {name: <string>}}
     for dialogs owned by other areas: "settings", "import",
     "export-graph", "login", "delete-page", "plugins".
   - dispatches `ls:open-cards` (no detail) for the flashcards modal —
     cljs `[:modal/show-cards]` is its own event, not a named dialog.
   - listens for `ls:open-right-sidebar` {detail: {uuid}} (sdk
     `open_in_right_sidebar`, cmdk shift+enter) and document shift+click
     on a.page-ref / [data-testid='page title'] to add right-sidebar
     items.
   - refresh: subscribes to the "sync-db-changes" broadcast via
     Runtime.on_sync and re-fetches sidebar data + the current route. *)

open Promise_ext
let t = I18n.t

let default_navs = [ "flashcards"; "all-pages"; "graph-view" ]

(* A rendered right-sidebar entry. kind maps to .item-type-<kind>. *)
type item =
  { key : string
  ; kind : string
  ; uuid : string option
  ; title : string
  ; icon : (string * string) option
  ; breadcrumb : string list
  ; blocks : Model.block list
  ; linked_refs : Model.block list
  ; page_ref : string option
  ; page : Model.page option (* source page for page/contents items *)
  ; props_collapsed : bool (* cljs: collapsed? = (not (entity/class? page)) *)
  ; collapsed : bool (* cljs :ui/sidebar-collapsed-blocks — panel body *)
  }

type t =
  { favorites : Model.page list Signal.state
  ; recents : Model.page list Signal.state
  ; nav_checked : string list Signal.state
  ; nav_tag_titles : (string * string) list Signal.state
  ; favorited : bool Signal.state
  ; items : item list Signal.state
  ; open_menu : string Signal.state
  ; groups_collapsed : string list Signal.state
  }

let st_ref : t option ref = ref None

(* the live model signal — stored at init so document-event handlers
   read current model state without a shadow ref of their own *)
let model_signal : Model.t Signal.signal option ref = ref None

let model () =
  match !model_signal with
  | Some ms -> Signal.get ms
  | None -> Model.initial
let hook_installed = State_cell.Once.make ()
let loaded_repo : string option ref = ref None
let last_page_key : string option ref = ref None

(* ---------- json event helpers ---------- *)


let jbool name j =
  match Worker_client.json_field name j with
  | Some v -> (
      match Js.Json.classify v with
      | Js.Json.JSONTrue -> true
      | _ -> false)
  | None -> false

external closest_raw :
  Js.Json.t -> string -> Js.Json.t option
  = "closest" [@@mel.send] [@@mel.return nullable]

(* event targets can be document/window — .closest exists on Elements
   (nodeType 1) only *)
let closest target sel =
  match Worker_client.json_field "nodeType" target with
  | Some nt -> (
      match Js.Json.classify nt with
      | Js.Json.JSONNumber 1. -> closest_raw target sel
      | _ -> None)
  | None -> None

external prevent_default : Js.Json.t -> unit = "preventDefault"
  [@@mel.send]

external ev_client_x : Js.Json.t -> float = "clientX" [@@mel.get]
external ev_client_y : Js.Json.t -> float = "clientY" [@@mel.get]

(* open state for the left-sidebar link-item menu: (page ref, is-recent,
   anchor x, anchor y). open_menu carries "lp-<ref>" while this holds the
   rest of the menu context *)
let lp_ctx : (string * bool * float * float) option ref = ref None

let open_lp_menu st ~target ~recent ~x ~y =
  lp_ctx := Some (target, recent, x, y);
  Runtime.signal_set st.open_menu ("lp-" ^ target)
;;

let click_target sel ev =
  match Worker_client.json_field "target" ev with
  | Some tgt -> closest tgt sel
  | None -> None

let detail_string name ev =
  match Worker_client.json_field "detail" ev with
  | Some d -> (
      match Worker_client.json_field name d with
      | Some v -> Worker_client.json_string v
      | None -> None)
  | None -> None

(* #right-sidebar is chrome.ml's wrapper and carries no width; the
   resizer writes the persisted width inline, so we mirror that for
   .cp__right-sidebar.open to have a visible box. *)
let sync_right_sidebar_width () =
  match Web_dom.get_element_by_id "right-sidebar" with
  | Some el ->
      let width =
        match Platform.local_storage_get "ls-right-sidebar-width" with
        | Some w -> w
        | None -> "40%"
      in
      Web_dom.el_style_set_property el "width"
        (if (model ()).Model.right_sidebar_open then width else "0px")
  | None -> ()

(* ---------- resizers ----------
   cljs left_sidebar.cljs/sidebar-resizer + right_sidebar.cljs/sidebar-
   resizer: interact.js drag clamps the left panel to [240,460]px
   (persisted :ls-left-sidebar-width, restored into
   --ls-left-sidebar-width on mount) and the right panel to
   [max(0.1,320/vw),0.7] of the viewport (persisted
   "ls-right-sidebar-width"). Raw mousedown/move/up tracking here (no
   interact.js in LUI). *)

external doc_root : Js.Json.t = "document.documentElement"

external style_set_prop :
  Js.Json.t -> string -> string -> unit
  = "setProperty" [@@mel.scope "style"] [@@mel.send]

external style_set_width_j : Js.Json.t -> string -> unit = "width"
  [@@mel.scope "style"] [@@mel.set]

external class_add : Js.Json.t -> string -> unit = "add"
  [@@mel.scope "classList"] [@@mel.send]

external class_rm : Js.Json.t -> string -> unit = "remove"
  [@@mel.scope "classList"] [@@mel.send]


let left_resizing : Js.Json.t option ref = ref None
let right_resizing = ref false

let clampf lo hi x = if x < lo then lo else if x > hi then hi else x

(* cljs restores the persisted left width on mount *)
let sync_left_sidebar_width () =
  match Platform.local_storage_get "ls-left-sidebar-width" with
  | Some w -> style_set_prop doc_root "--ls-left-sidebar-width" w
  | None -> ()

let set_right_width width =
  Platform.local_storage_set "ls-right-sidebar-width" width;
  (* cljs persist-right-sidebar-width! also feeds :ui/sidebar-width;
     the inline write keeps the panel at the dragged size without
     waiting for the next model publish *)
  match Web_dom.query_selector "#right-sidebar" with
  | Some el -> style_set_width_j el width
  | None -> ()

let on_resizer_mousedown ev =
  match click_target ".left-sidebar-resizer" ev with
  | Some el -> (
      prevent_default ev;
      left_resizing := Some el;
      class_add doc_root "is-resizing-buf";
      class_add el "is-active";
      match closest el "#left-sidebar" with
      | Some sb -> class_add sb "is-resizing"
      | None -> ())
  | None -> (
      match click_target "#right-sidebar > .resizer" ev with
      | Some _ ->
          prevent_default ev;
          right_resizing := true;
          class_add doc_root "is-resizing-buf"
      | None -> ())

let on_resizer_mousemove ev =
  (match !left_resizing with
   | Some _ ->
       let w = clampf 240. 460. (ev_client_x ev) in
       let s = Printf.sprintf "%.2fpx" w in
       style_set_prop doc_root "--ls-left-sidebar-width" s;
       Platform.local_storage_set "ls-left-sidebar-width" s
   | None -> ()
  );
  if !right_resizing then begin
    let vw = Web_dom.win_inner_width in
    let lo = max 0.1 (320. /. vw) in
    let ratio = clampf lo 0.7 ((vw -. ev_client_x ev) /. vw) in
    set_right_width (Printf.sprintf "%g%%" (ratio *. 100.))
  end

(* ---------- edge-swipe + small-viewport behavior (cljs
   left_sidebar.cljs) ----------
   touchstart/move/end on #left-sidebar: a rightward drag from the
   collapsed rail opens the sidebar, a leftward drag while open closes
   it. While |dx| > 20px the layout carries .is-touching and
   .left-sidebar-inner follows the finger via translate3d; the
   shade-mask opacity tracks the drag ratio. Below 640px taps on
   navigation targets inside the sidebar also close it. *)

external touch_item :
  Js.Json.t -> int -> Js.Json.t = "item" [@@mel.scope "touches"] [@@mel.send]

external touches_length :
  Js.Json.t -> int = "length" [@@mel.scope "touches"] [@@mel.get]

external el_offset_width : Js.Json.t -> float = "offsetWidth" [@@mel.get]

(* cljs util/sm-breakpoint? — document.documentElement.offsetWidth < 640 *)
let sm_breakpoint () = el_offset_width doc_root < 640.

let touch_before : (float * float) option ref = ref None
let touch_dx = ref 0.
let touch_pending = ref false

let left_touch_x ev i =
  if touches_length ev > i then Some (ev_client_x (touch_item ev i))
  else None

let left_touch_y ev i =
  if touches_length ev > i then Some (ev_client_y (touch_item ev i))
  else None

let set_el_style el name v = style_set_prop el name v

let apply_touch_drag sb dx =
  let open_ = (model ()).Model.left_sidebar_open in
  (match Web_dom.query_selector "#left-sidebar .left-sidebar-inner" with
   | Some inner ->
       let w = el_offset_width inner in
       let tx =
         if dx > 0. then
           (* opening drag: reveal from -100% toward 0 *)
           let clamped = if dx > w then w else dx in
           Printf.sprintf "translate3d(calc(%.0fpx - 100%%), 0, 0)"
             clamped
         else
           (* closing drag: shift left in px (cljs magnifies the ratio
              to -% — px keeps the finger-tracking feel without the
              off-screen jump) *)
           Printf.sprintf "translate3d(%.0fpx, 0, 0)" dx
       in
       set_el_style inner "transform" tx;
       (match Web_dom.query_selector "#left-sidebar > .shade-mask" with
        | Some mask ->
            let ratio =
              if dx > 0. then clampf 0. 1. (dx /. w)
              else clampf 0. 1. (1. +. (dx /. w))
            in
            (* the mask only matters while open or while opening; when
               closed and not yet pending keep it transparent *)
            if open_ || dx > 0. then
              set_el_style mask "opacity"
                (Printf.sprintf "%.2f" ratio)
        | None -> ())
   | None -> ());
  if not !touch_pending then (
    touch_pending := true;
    class_add sb "is-touching")

let clear_touch_drag () =
  touch_before := None;
  touch_dx := 0.;
  touch_pending := false;
  (match Web_dom.query_selector "#left-sidebar" with
   | Some sb -> class_rm sb "is-touching"
   | None -> ());
  (match Web_dom.query_selector "#left-sidebar .left-sidebar-inner" with
   | Some inner -> set_el_style inner "transform" ""
   | None -> ());
  match Web_dom.query_selector "#left-sidebar > .shade-mask" with
  | Some mask -> set_el_style mask "opacity" ""
  | None -> ()

let on_doc_touchstart ev =
  match click_target "#left-sidebar" ev with
  | Some _ -> (
      match left_touch_x ev 0, left_touch_y ev 0 with
      | Some x, Some y -> touch_before := Some (x, y)
      | _ -> ())
  | None -> ()

let on_doc_touchmove ev =
  match !touch_before with
  | Some (bx, _by) -> (
      match left_touch_x ev 0 with
      | Some ax ->
          let dx = ax -. bx in
          touch_dx := dx;
          if Float.abs dx > 20. then
            (match Web_dom.query_selector "#left-sidebar" with
             | Some sb -> apply_touch_drag sb dx
             | None -> ())
      | None -> ())
  | None -> ()

let on_doc_touchend _ev =
  if !touch_pending then begin
    let open_ = (model ()).Model.left_sidebar_open in
    let dx = !touch_dx in
    (* cljs: >40px rightward opens the closed sidebar; >30px leftward
       closes the open one *)
    if (not open_ && dx > 40.) || (open_ && dx < -30.) then
      Runtime.send Action.Toggle_left_sidebar
  end;
  clear_touch_drag ()

let on_resizer_mouseup _ev =
  (match !left_resizing with
   | Some el -> (
       left_resizing := None;
       class_rm doc_root "is-resizing-buf";
       class_rm el "is-active";
       match closest el "#left-sidebar" with
       | Some sb -> class_rm sb "is-resizing"
       | None -> ())
   | None -> ()
  );
  if !right_resizing then begin
    right_resizing := false;
    class_rm doc_root "is-resizing-buf"
  end

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
  match Platform.local_storage_get "recent-pages" with
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
            | Some v -> List.filter_map Wire.as_int (Wire.elems v)
            | None -> [])
        | _ -> []
      with _ -> [])
  | None -> []

let push_recent repo id =
  let ids =
    id :: take 14 (List.filter (fun x -> x <> id) (recent_ids_of_storage repo))
  in
  (* merge into the stored per-graph map — rewriting the whole value
     would drop every other repo's recents on each visit *)
  let kvs =
    match Platform.local_storage_get "recent-pages" with
    | Some s -> (
        try
          match Edn.parse s with
          | Wire.Map kvs ->
              List.filter
                (fun (k, _) ->
                  match k with
                  | Wire.String r | Wire.Keyword r | Wire.Symbol r ->
                      r <> repo
                  | _ -> true)
                kvs
          | _ -> []
        with _ -> [])
    | None -> []
  in
  Platform.local_storage_set "recent-pages"
    (Edn.to_string
       (Wire.Map
          ((Wire.String repo, Wire.List (List.map (fun i -> Wire.Int i) ids))
           :: kvs)))

(* ---------- worker loaders ---------- *)

let pages_of_wire w =
  match w with
  | Wire.Array xs | Wire.List xs -> List.filter_map Decode.page_of_summary xs
  | _ -> []

let then_keep p k =
  ignore
    ((let* w = p in
     k w;
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("sidebar loader failed", e);
            Js.Promise.resolve ()))

(* loads race with writes (push_recent/set-page-favorite) and with each
   other via the sync-db-changes broadcast; a stale RPC resolving last would
   clobber fresher state, so only the latest issued load may apply *)
let favorites_gen = ref 0

let load_favorites repo st =
  incr favorites_gen;
  let gen = !favorites_gen in
  then_keep
    (Runtime.invoke1 "thread-api/get-favorite-pages" (Wire.String repo))
    (fun w ->
      if gen = !favorites_gen then
        Runtime.signal_set st.favorites (pages_of_wire w))

let recents_gen = ref 0

let load_recents repo st =
  incr recents_gen;
  let gen = !recents_gen in
  let ids =
    Wire.List (List.map (fun i -> Wire.Int i) (recent_ids_of_storage repo))
  in
  then_keep
    (Runtime.invoke2 "thread-api/get-recent-pages" (Wire.String repo) ids)
    (fun w ->
      if gen = !recents_gen then
        Runtime.signal_set st.recents (pages_of_wire w))

let load_nav_tag_titles repo st =
  let pull_cls cls =
    let* w =
      Runtime.invoke3 "thread-api/pull" (Wire.String repo)
        (Wire.String "[:block/uuid :block/title :block/name]")
        (Wire.Keyword cls)
    in
    Js.Promise.resolve
      (match Wire.map_get_string w "block/title" with
       | Some _ as t -> t
       | None -> Wire.map_get_string w "block/name")
  in
  then_keep
    (Js.Promise.all2
       (pull_cls "logseq.class/Asset", pull_cls "logseq.class/Task"))
    (fun (asset, task) ->
      Runtime.signal_set st.nav_tag_titles
        (List.filter_map Fun.id
           [ Option.map (fun t -> ("assets", t)) asset
           ; Option.map (fun t -> ("tasks", t)) task ]))

(* cljs right-sidebar/get-current-page falls back to today's journal
   on non-page routes — the same resolution page_menu applies *)
let menu_page (m : Model.t) =
  match m.Model.route_page with
  | Some p -> Some p
  | None ->
      List.find_opt
        (fun (p : Model.page) ->
          p.page_journal_day = Some (Dates.today_journal_day ()))
        m.Model.journals

let refresh_favorited repo st =
  match menu_page (Runtime.model ()) with
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

(* Ref value for get-page-route-info / get-page-blocks-tree: a bare uuid
   or page-name string. The [:block/uuid u] lookup-ref ARRAY that
   Router.page_ref builds decodes to a Vector that the endpoints'
   Ldb.get_page does not match (returns nil) — TODO(shared): fix
   Router.page_ref / Ldb.get_page so #/page/<uuid> hash routes work. *)
let route_ref s =
  if Wire.is_uuid_string s then Wire.Uuid s else Wire.String s

let push_page_route target =
  let target =
    if Wire.is_uuid_string target then target
    else encode_uri_component target
  in
  Runtime.mark_nav ();
  Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ target));
  Web_dom.dispatch_custom "ls:navigate" Js.Json.null

(* cljs redirect-to-page!: route-info first — hidden and
   private-built-in pages warn instead of navigating, and alias pages
   redirect to their source page *)
let navigate_to_page target =
  let go () = push_page_route target in
  ignore
    ((let* info =
       Runtime.invoke2 "thread-api/get-page-route-info"
         (Wire.String (Runtime.repo ())) (route_ref target)
     in
     let flag k =
       Option.value
         (Option.bind (Wire.get info k) Wire.as_bool)
         ~default:false
     in
     let blocked =
       (* cljs gates this on (not config/dev?) — our bundle is
          the dev build — and exempts the Recycle page *)
       (not Platform.dev_build)
       && Wire.map_get_string info "block/title" <> Some "Recycle"
       && ((flag "hidden?" && not (flag "property?"))
           || (flag "built-in?" && flag "private-built-in?"))
     in
     if blocked then Toast.warning I18n.cannot_go_to_internal_page
     else
       (match Wire.map_get_uuid info "alias-source-uuid" with
        | Some src -> push_page_route src
        | None -> go ());
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun _ ->
            (* cljs treats a nil route-info as navigable *)
            go ();
            Js.Promise.resolve ()))

(* sidebar items only need decoded + tag-resolved blocks — ~plain skips
   the collapse/embed/view shaping that would touch editor state *)
let fetch_blocks (p : Model.page) =
  let* blocks = Outliner_ops.fetch_page_blocks ~plain:true (Runtime.repo ()) p in
  Js.Promise.resolve { p with Model.page_blocks = blocks }
let open_dialog name =
  let o = Js.Dict.empty () in
  Js.Dict.set o "name" (Js.Json.string name);
  Web_dom.dispatch_custom "ls:open-dialog" (Js.Json.object_ o)

let open_cards () = Web_dom.dispatch_custom "ls:open-cards" Js.Json.null

let ensure_right_open () =
  if not (model ()).Model.right_sidebar_open then
    Runtime.send Action.Toggle_right_sidebar

(* ---------- right-sidebar items ---------- *)

let item_of_page (p : Model.page) =
  { key = "page-" ^ Option.value p.Model.page_uuid ~default:p.page_title
  ; kind = "page"
  ; uuid = p.Model.page_uuid
  ; title = p.Model.page_title
  ; icon = p.Model.page_icon
  ; breadcrumb = []
  ; blocks = p.Model.page_blocks
  ; linked_refs = p.Model.page_linked_refs
  ; page = Some p
  ; props_collapsed = not p.Model.page_is_tag
  ; collapsed = false
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
  let* info =
    Runtime.invoke2 "thread-api/get-page-route-info" (Wire.String repo)
      (Wire.page_ref target)
  in
  match Decode.page_of_summary info with
  | None -> Js.Promise.resolve None
  | Some p ->
      let* p' = fetch_blocks p in
      let* refs = Router.fetch_refs_blocks p' in
      Js.Promise.resolve
        (Some
           (item_of_page
              { p' with
                Model.page_linked_refs = refs }))

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
          (Wire.elems tags)
    | None -> false
  in
  class_tagged
  || (Wire.get w "block/page" = None
      && Wire.map_get_string w "block/name" <> None)

let block_of_pair pair =
  match Wire.block_of_pair pair with Some b -> b | None -> Wire.Nil

let breadcrumb_titles w =
  List.filter_map
    (fun p ->
      match Wire.map_get_string p "block/title" with
      | Some s -> Some s
      | None -> Wire.map_get_string p "block/name")
    (Wire.elems w)

let block_item_of_uuid repo uuid : item option Js.Promise.t =
  let* w =
    Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo)
      (Wire.Array
         [ Wire.Map
             [ (Wire.String "id", Wire.Uuid uuid)
             ; ( Wire.String "opts"
               , Wire.Map
                   [ (Wire.Keyword "children?", Wire.Bool true)
                   ; (* a container's root always renders its children,
                        even when collapsed in the page — fetch them *)
                     ( Wire.Keyword "include-collapsed-children?"
                     , Wire.Bool true )
                   ] )
             ]
         ])
  in
  match Wire.elems w with
  | [ pair ] -> (
      match block_of_pair pair with
      | Wire.Map _ as blk ->
          let b =
            (* the pair's flat `children` carry the full maps;
               splice them into block/children before decoding *)
            match Decode.nest_get_blocks pair with
            | Some w -> Decode.block_of_wire w
            | None -> Decode.block_of_wire blk
          in
          let* parents =
            Runtime.invoke3 "thread-api/get-block-parents"
              (Wire.String repo)
              (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
              (Wire.Int 8)
          in
          let crumbs = breadcrumb_titles parents in
          Js.Promise.resolve
            (Some
               { key = "block-" ^ uuid
               ; kind = "block"
               ; uuid = Some uuid
               ; title = b.Model.block_title
               ; icon = None
               ; breadcrumb = crumbs
               ; blocks = [ b ]
               ; linked_refs = []
               ; page = None
               ; props_collapsed = true
               ; collapsed = false
               ; page_ref = List.nth_opt crumbs 0
               })
      | _ -> Js.Promise.resolve None)
  | _ -> Js.Promise.resolve None

(* cljs :contents item renders the built-in "Contents" page's own blocks
   (<build-sidebar-item> pulls the entity named "Contents"), and
   sidebar-action-block-lookup resolves :contents -> "Contents" so
   "Open as page" navigates to that page. *)
let contents_item repo : item option Js.Promise.t =
  let* v = page_item_of_ref repo "Contents" in
  match v with Some it ->
    Js.Promise.resolve
      (Some { it with key = "contents"; kind = "contents" })
| None -> Js.Promise.resolve None

let static_item key kind title =
  Some
    { key
    ; kind
    ; uuid = None
    ; title = t title
    ; icon = None
    ; breadcrumb = []
    ; blocks = []
    ; linked_refs = []
    ; page = None
    ; props_collapsed = true
    ; collapsed = false
    ; page_ref = None
    }

let has_item st key =
  List.exists (fun (i : item) -> i.key = key) (Signal.get_state st.items)

let push_item st it =
  let items = Signal.get_state st.items in
  if has_item st it.key then ()
  else begin
    (* a sidebar block is its container's root — cljs mounts it with
       set-collapsed-block! false so its children show regardless of the
       db collapsed datom. Once per mount: refresh_items re-adds via
       signal_set and must not undo a user's collapse in this pane *)
    (match it.kind, it.uuid with
     | "block", Some u ->
         Editor_state.expand_root ~scope:"sidebar" u
     | _ -> ());
    Runtime.signal_set st.items (items @ [ it ])
  end

(* cljs sidebar-add-block! :search — a cmdk-block pane pinned to the
   right sidebar, one per query *)
let add_search_item st q =
  let key = "search-" ^ q in
  if has_item st key then ()
  else begin
    ensure_right_open ();
    push_item st
      { key
      ; kind = "search"
      ; uuid = None
      ; title = q
      ; icon = Some ("search", "gray")
      ; breadcrumb = []
      ; blocks = []
      ; linked_refs = []
      ; page = None
      ; props_collapsed = true
      ; collapsed = false
      ; page_ref = None
      }
  end

let remove_item st key =
  Runtime.signal_set st.items
    (List.filter (fun (i : item) -> i.key <> key)
       (Signal.get_state st.items))

let toggle_props st key =
  Runtime.signal_set st.items
    (List.map
       (fun (i : item) ->
         if i.key = key then { i with props_collapsed = not i.props_collapsed }
         else i)
       (Signal.get_state st.items))

let toggle_collapsed st key =
  Runtime.signal_set st.items
    (List.map
       (fun (i : item) ->
         if i.key = key then { i with collapsed = not i.collapsed }
         else i)
       (Signal.get_state st.items))

let set_collapsed st key v =
  Runtime.signal_set st.items
    (List.map
       (fun (i : item) ->
         if i.key = key then { i with collapsed = v } else i)
       (Signal.get_state st.items))

let collapse_others st key v =
  Runtime.signal_set st.items
    (List.map
       (fun (i : item) ->
         if i.key = key then i else { i with collapsed = v })
       (Signal.get_state st.items))

let collapse_all st v =
  Runtime.signal_set st.items
    (List.map
       (fun (i : item) -> { i with collapsed = v })
       (Signal.get_state st.items))

let remove_rest st key =
  Runtime.signal_set st.items
    (List.filter (fun (i : item) -> i.key = key)
       (Signal.get_state st.items))

let clear_items st =
  Runtime.signal_set st.items [];
  if (model ()).Model.right_sidebar_open then
    Runtime.send Action.Toggle_right_sidebar
;;

let add_promise st p =
  ignore
    (let* v = p in
    match v with Some it ->
      push_item st it;
      Js.Promise.resolve ()
  | None -> Js.Promise.resolve ())

let open_ref st target =
  let repo = Runtime.repo () in
  if repo = "" then ()
  else
    let p =
      (let* v = page_item_of_ref repo target in
      match v with Some it -> Js.Promise.resolve (Some it)
    | None ->
        if Wire.is_uuid_string target then
          block_item_of_uuid repo target
        else Js.Promise.resolve None)
    in
    ensure_right_open ();
    add_promise st p

let open_uuid st uuid =
  let repo = Runtime.repo () in
  if repo = "" then ()
  else
    let p =
      (let* ent = pull_entity repo uuid in
      match ent with
      | Wire.Map _ ->
          if is_page_entity ent then
            page_item_of_ref repo uuid
          else block_item_of_uuid repo uuid
      | _ ->
          if Wire.is_uuid_string uuid then
            block_item_of_uuid repo uuid
          else Js.Promise.resolve None)
    in
    ensure_right_open ();
    add_promise st p

let open_sticky_item st kind =
  let repo = Runtime.repo () in
  if repo = "" then ()
  else
    match kind with
    | "contents" when not (has_item st "contents") ->
        add_promise st (contents_item repo)
    | "help" when not (has_item st "help") ->
        (match static_item "help" "help" (t "nav/help") with
         | Some it -> push_item st it
         | None -> ())
    | "page-graph" when not (has_item st "page-graph") ->
        (match static_item "page-graph" "page-graph" (t "graph.page/title")
         with
         | Some it -> push_item st it
         | None -> ())
    | (("rtc" | "undo-redo" | "profiler") as kind)
      when not (has_item st kind) -> (
        let label =
          match kind with
          | "rtc" -> "(Dev) RTC"
          | "undo-redo" -> "(Dev) Undo/Redo"
          | _ -> "(Dev) Profiler"
        in
        match static_item kind kind label with
        | Some it -> push_item st it
        | None -> ())
    | "shortcut-settings" when not (has_item st "shortcut-settings") ->
        (match
           static_item "shortcut-settings" "shortcut-settings"
             (t "help.shortcuts/label")
         with
         | Some it -> push_item st it
         | None -> ())
    | _ -> ()

let ensure_contents st =
  let repo = Runtime.repo () in
  if repo <> "" && Signal.get_state st.items = [] then
    add_promise st (contents_item repo)

let refresh_item repo (it : item) : item Js.Promise.t =
  let fallback = Js.Promise.resolve it in
  match it.kind with
  | "contents" -> (let* v = contents_item repo in
                  match v with Some it' -> Js.Promise.resolve it'
                | None -> fallback)
  | "page" -> (
      match it.page_ref with
      | Some r ->
          (let* v = page_item_of_ref repo r in
          match v with Some it' -> Js.Promise.resolve it'
        | None -> fallback)
      | None -> fallback)
  | "block" -> (
      match it.uuid with
      | Some u ->
          (let* v = block_item_of_uuid repo u in
          match v with Some it' -> Js.Promise.resolve { it' with key = it.key }
        | None -> fallback)
      | None -> fallback)
  | _ -> fallback

let refresh_items repo st =
  let items = Signal.get_state st.items in
  if items <> [] then
    ignore
      ((let* arr = Js.Promise.all (Array.of_list (List.map (refresh_item repo) items)) in
       Runtime.signal_set st.items (Array.to_list arr);
       Js.Promise.resolve ())
       |> Js.Promise.catch (fun e ->
              Platform.console_error ("sidebar refresh failed", e);
              Js.Promise.resolve ()))

(* ---------- favorites ---------- *)

let toggle_favorite_uuid st u =
  match (model ()).Model.repo with
  | Some repo ->
      (* the cached favorited signal can still hold the previous page's
         flag right after navigation; ask the worker for this page's
         state instead of toggling from stale UI state *)
      then_keep
        (Runtime.invoke2 "thread-api/favorited-page?" (Wire.String repo)
           (Wire.Uuid u))
        (fun w ->
          let fav = Wire.as_bool w = Some true in
          then_keep
            (Runtime.invoke3 "thread-api/set-page-favorite" (Wire.String repo)
               (Wire.Uuid u) (Wire.Bool (not fav)))
            (fun _ ->
              load_favorites repo st;
              refresh_favorited repo st))
  | None -> ()

let toggle_favorite st =
  match menu_page (Runtime.model ()) with
  | Some p -> (
      match p.Model.page_uuid with
      | Some u -> toggle_favorite_uuid st u
      | None -> ())
  | None -> ()

let unfavorite st uuid =
  match (model ()).Model.repo with
  | Some repo ->
      then_keep
        (Runtime.invoke3 "thread-api/set-page-favorite" (Wire.String repo)
           (Wire.Uuid uuid) (Wire.Bool false))
        (fun _ -> load_favorites repo st)
  | None -> ()

(* ---------- model / worker wiring ---------- *)

(* affected-keys gating: page-set tags (membership/lookup/rename/
   journal/recycle/class changes) refresh the lists; a right-sidebar
   item refreshes when its own entity/children key hits — a block edit
   on the open page no longer refetches the whole sidebar *)
let page_set_tags =
  [ "page-membership"; "page-lookup"; "route-page"; "journals"
  ; "recycle-roots"; "class-tree" ]

let item_hits affected st =
  List.exists
    (fun (i : item) ->
      match i.uuid with
      | Some u ->
          List.exists
            (fun k ->
              k = Subs_state.watch_key_uuid "entity" u
              || k = Subs_state.watch_key_uuid "children" u)
            affected
      | None -> false)
    (Signal.get_state st.items)

let on_sync st affected =
  match (model ()).Model.repo with  | Some repo ->
      (* the route reload comes from Worker_events.dispatch's debounced
         Router.reload — refetching it here too doubled the work per
         broadcast *)
      let sets_hit =
        affected = []
        || List.exists
             (fun k ->
               match Subs_state.key_tag k with
               | Some t -> List.mem t page_set_tags
               | None -> false)
             affected
      in
      if sets_hit then begin
        load_favorites repo st;
        load_recents repo st;
        refresh_favorited repo st
      end;
      if sets_hit || item_hits affected st then refresh_items repo st
  | None -> ()

let install_worker_hook st =
  State_cell.Once.run hook_installed (fun () ->
    ignore (Runtime.on_sync (on_sync st)))
let page_key (p : Model.page) =
  match p.Model.page_uuid with
  | Some u -> "u:" ^ u
  | None -> "d:" ^ string_of_int (Option.value p.Model.page_db_id ~default:0)

let on_model st (m : Model.t) =
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
         refresh_favorited (Runtime.repo ()) st;
         match m.Model.repo, p.Model.page_db_id with
         | Some repo, Some id ->
             (* recents only on explicit navigation (cljs
                redirect-to-page!), never boot/hashchange loads *)
             if Runtime.take_nav_mark () then (
               push_recent repo id;
               load_recents repo st)
         | _ -> ())
   | _ -> ());
  sync_right_sidebar_width ()

let close_menu st = Runtime.signal_set st.open_menu ""
let open_nav_menu st = Runtime.signal_set st.open_menu "nav-edit"
let open_dots_menu st = Runtime.signal_set st.open_menu "dots"
(* anchor for the right-sidebar item actions menu — cljs popup-show!
   positions at the pointer (contextmenu) / trigger click *)
let im_xy : (float * float) ref = ref (0., 0.)

let open_item_menu st key ~x ~y =
  im_xy := (x, y);
  Runtime.signal_set st.open_menu ("item-" ^ key)

(* cljs left_sidebar.cljs x-menu-content: right-click or the dots
   button on a favorites/recent row opens the unfavorite/open-in-sidebar
   dropdown at the pointer; right-click on a right-sidebar item header
   opens its actions menu *)
let on_doc_contextmenu st ev =
  match click_target "#left-sidebar a.link-item" ev with
  | Some el -> (
      prevent_default ev;
      match Web_dom.el_get_attr el "data-lp-ref" with
      | Some target ->
          open_lp_menu st ~target
            ~recent:(Web_dom.el_get_attr el "data-lp-recent" = Some "1")
            ~x:(ev_client_x ev) ~y:(ev_client_y ev)
      | None -> ())
  | None -> (
      match
        click_target "#right-sidebar .sidebar-item-header" ev
      with
      | Some hdr -> (
          (* sidebar items carry their key on accessibility_identifier
             (element id "sbi-<key>") since the component migration *)
          match closest hdr ".sidebar-item" with
          | Some it -> (
              prevent_default ev;
              match Web_dom.el_get_attr it "id" with
              | Some id
                when String.length id > 4
                     && String.sub id 0 4 = "sbi-" ->
                  open_item_menu st
                    (String.sub id 4 (String.length id - 4))
                    ~x:(ev_client_x ev) ~y:(ev_client_y ev)
              | _ -> ())
          | None -> ())
      | None -> ())
;;

let on_doc_click st ev =
  (* dropdown menus dismiss on outside interaction; the trigger controls and
     the menu content itself are excluded so their own handlers can run *)
  if Signal.get_state st.open_menu <> "" then (
    match
      click_target
        ".ui__dropdown-menu-content, .toolbar-plugins-manager, .as-edit, \
         .sidebar-page-actions, .sidebar-item-more"
        ev
    with
    | Some _ -> ()
    | None -> close_menu st);
  match click_target "a.page-ref, a.tag" ev with
  | Some el -> (
      match
        (* uuid refs ([[uuid]]/((uuid))) carry data-uuid; data-ref holds the
           resolved title, which drifts out of sync on rename. tag chips
           keep the uuid on the .block-tag wrapper *)
        (match Web_dom.el_get_attr el "data-uuid" with
         | Some u when u <> "" -> Some u
         | _ -> (
             match
               Option.bind (closest el ".block-tag[data-tag-uuid]")
                 (fun chip -> Web_dom.el_get_attr chip "data-tag-uuid")
             with
             | Some u when u <> "" -> Some u
             | _ -> Web_dom.el_get_attr el "data-ref"))
      with
      | Some ref_ ->
          (* cljs open-page-ref: shift+click opens in the sidebar, any other
             click (mod included) navigates *)
          if jbool "shiftKey" ev then open_ref st ref_
          else navigate_to_page ref_
      | None -> ())
  | None ->
      (* cljs left_sidebar.cljs: below the sm breakpoint a tap on a
         navigation target inside the open sidebar closes it *)
      if
        sm_breakpoint ()
        && (model ()).Model.left_sidebar_open
      then
        match
          click_target
            "#left-sidebar .sidebar-navigations .item, \
             #left-sidebar .favorites .bd, \
             #left-sidebar .recent .bd, #left-sidebar .nav-header"
            ev
        with
        | Some _ -> Runtime.send Action.Toggle_left_sidebar
        | None ->
            if jbool "shiftKey" ev then
              match click_target "[data-testid='page title']" ev with
              | Some _ -> (
                  match (Runtime.model ()).Model.route_page with
                  | Some p -> (
                      match p.Model.page_uuid with
                      | Some u -> open_uuid st u
                      | None -> ())
                  | None -> ())
              | None -> ()
      else if jbool "shiftKey" ev then
        match click_target "[data-testid='page title']" ev with
        | Some _ -> (
            match (Runtime.model ()).Model.route_page with
            | Some p -> (
                match p.Model.page_uuid with
                | Some u -> open_uuid st u
                | None -> ())
            | None -> ())
        | None -> ()

let on_doc_keydown st ev =
  match Worker_client.json_field "key" ev with
  | Some k -> (
      match Worker_client.json_string k with
      | Some "Escape" ->
          if Signal.get_state st.open_menu <> "" then close_menu st
          else if (model ()).Model.appearance <> None then
            Runtime.send (Action.Appearance_set None)

      (* mod+shift+f = :page/toggle-favorite (cljs shortcut config) *)
      | Some ("f" | "F")
        when jbool "shiftKey" ev && (jbool "metaKey" ev || jbool "ctrlKey" ev) ->
          toggle_favorite st
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
        ; groups_collapsed = Signal.state owner []
        }
      in
      st_ref := Some st;
      model_signal := Some ms;
      (* sidebar item blocks are editable: expose them to Editor_state.find
         so click-to-edit works on .cp__right-sidebar block rows *)
      Editor_state.add_block_source (fun uuid ->
          List.find_map
            (fun (it : item) -> Editor_state.find_in it.blocks uuid)
            (Signal.get_state st.items));
      ignore (Signal.subscribe ~emit_initial:false ms (on_model st));
      Web_dom.on_document_event "ls:open-right-sidebar" (fun ev ->
          match detail_string "uuid" ev with
          | Some u -> open_uuid st u
          | None -> ());
      Web_dom.on_document_event "click" (on_doc_click st);
      Web_dom.on_document_event "contextmenu" (on_doc_contextmenu st);
      Web_dom.on_document_event "keydown" (on_doc_keydown st);
      Web_dom.on_document_event "mousedown" on_resizer_mousedown;
      Web_dom.on_document_event "mousemove" on_resizer_mousemove;
      Web_dom.on_document_event "mouseup" on_resizer_mouseup;
      Web_dom.on_document_event "touchstart" on_doc_touchstart;
      Web_dom.on_document_event "touchmove" on_doc_touchmove;
      Web_dom.on_document_event "touchend" on_doc_touchend;
      sync_left_sidebar_width ();
      st

let ensure ms = init ms

(* the singleton — set once init runs *)
let current () = !st_ref

(* cljs :ui/navigation-item-collapsed? — in-memory toggle keyed by the
   group's class ("favorites", "recent"); not persisted like cljs *)
let group_collapsed_sig st key =
  Signal.map (fun ks -> List.mem key ks) (Signal.value st.groups_collapsed)

let toggle_group_collapsed st key =
  let ks = Signal.get_state st.groups_collapsed in
  Runtime.signal_set st.groups_collapsed
    (if List.mem key ks then List.filter (fun k -> k <> key) ks else key :: ks)

let toggle_nav st nav checked =
  let cur = Signal.get_state st.nav_checked in
  let next =
    if checked then if List.mem nav cur then cur else cur @ [ nav ]
    else List.filter (fun n -> n <> nav) cur
  in
  Runtime.signal_set st.nav_checked next;
  persist_nav_checked next

let open_as_page st (it : item) =
  match it.page_ref with
  | Some r ->
      navigate_to_page r;
      close_menu st
  | None -> ()
