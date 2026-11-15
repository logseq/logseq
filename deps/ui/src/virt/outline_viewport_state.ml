(* Application-owned handles and complete logical rows for the main viewport.
   Interaction scopes in the projection share this one physical viewport. *)

module S = Editor_state

type native =
  { owner : Lui_virtual.owner
  ; source : Lui_virtual.source
  ; navigation : Issued_reveal.t
  ; editing : Issued_reveal.t
  }

type mounted_editor =
  { uuid : string; scope : string; key : string; node : int
  ; registration : unit ref }

type editor_intent =
  { block : string; interaction_scope : string; row_key : string
  ; repository : string option; route : Model.route; revision : int
  ; session : int ref; control : int option }

let same_editor_intent a b = match a, b with
  | None, None -> true
  | Some a, Some b -> a.block = b.block && a.interaction_scope = b.interaction_scope
      && a.row_key = b.row_key && a.repository = b.repository && a.route = b.route
      && a.revision = b.revision && a.session == b.session && a.control = b.control
  | _ -> false

let editor_node mounted ~uuid ~scope ~key = match mounted with
  | Some editor when editor.uuid = uuid && editor.scope = scope && editor.key = key -> Some editor.node
  | _ -> None

type t =
  { native : native option
  ; model : Model.t Signal.signal
  ; projection : Outliner_projection.t Signal.signal
  ; rows : Outliner_projection.row list Signal.signal
  ; row_count : int Signal.signal
  ; editing_target : string Signal.signal
  ; navigation_target : string option Signal.state
  ; scroll_token : int Signal.state
  ; request_scroll : key:string -> int
  ; scroll_target : string Signal.signal
  ; scroll_completed : (int * string) option Signal.state
  ; row_roots : (int, unit) Hashtbl.t
  ; occurrences : (int, string) Hashtbl.t
  ; mounted_editor : mounted_editor option Signal.state
  ; alive : bool ref
  ; cancel_navigation : (unit -> unit) option ref
  }

let presentation_serial = ref 0

let scope_of_route = function
  | Model.Block_zoom uuid -> "zoom-" ^ uuid
  | _ -> "main"

let route_section_key = function
  | Model.Page name -> "page:" ^ name
  | Model.Block_zoom uuid -> "zoom:" ^ uuid
  | Model.Library -> "library"
  | _ -> invalid_arg "Non-page route has an outliner page"

let journal_key (page : Model.page) =
  match page.page_journal_day, page.page_uuid with
  | Some day, _ -> "day:" ^ string_of_int day
  | None, Some uuid -> "journal:" ^ uuid
  | None, None -> invalid_arg "Journal section has no day or UUID"

let sections (model : Model.t) =
  match model.route with
  | Model.Journals | Model.Home ->
      List.map (fun page ->
        {Outliner_projection.section_key = journal_key page; repository = model.repo; scope = "main"; page})
        model.journals
  | Model.Page "Recycle" -> []
  | (Model.Page _ | Model.Block_zoom _ | Model.Library) as route ->
      (match model.route_page with
       | Some page ->
           [{Outliner_projection.section_key = route_section_key route;
             repository = model.repo; scope = scope_of_route route; page}]
       | None -> [])
  | _ -> []

let key_for_block projection ~scope ~uuid =
  Option.map (fun (_, row) -> Outliner_projection.key (Outliner_projection.Block row))
    (Outliner_projection.find_block projection ~scope ~uuid)

let key_for_editor projection mounted ~scope ~uuid =
  match key_for_block projection ~scope ~uuid with
  | Some _ as key -> key
  | None ->
      match mounted with
      | Some editor when editor.uuid = uuid && editor.scope = scope
          && List.exists (fun row -> Outliner_projection.key row = editor.key) projection.Outliner_projection.rows ->
          Some editor.key
      | _ -> None

let create ctx (model : Model.t Signal.signal) =
  S.ensure ctx;
  let alive = ref true and cancel_navigation = ref None in
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
    alive := false;
    Option.iter (fun cancel -> cancel ()) !cancel_navigation;
    cancel_navigation := None);
  let own signal = Signal.own_signal ctx.Lui_ui.ui_scope signal in
  let projection = own (Signal.map2 (fun model collapse ->
    Outliner_projection.create ~children_of:S.children_of
      ~expanded:(fun ~scope (block : Model.block) ->
        not (Comments_ops.is_comments_area block)
        && not (match block.block_uuid with
          | Some uuid -> S.effective_collapsed_in_view ~scope uuid
              block.block_default_collapsed collapse
          | None -> block.block_default_collapsed))
      (sections model)) model (S.collapse_sig ())) in
  let rows = own (Signal.map (fun projection -> projection.Outliner_projection.rows) projection) in
  let row_count = own (Signal.map List.length rows) in
  let mounted_editor = Signal.state ctx.Lui_ui.ui_scheduler None in
  let projected_editor = own (Signal.map2 (fun target projection -> target, projection)
    (S.editing_target_sig ()) projection) in
  let editing_target = own (Signal.map2 (fun (target, projection) mounted ->
    match target with
    | None -> ""
    | Some (uuid, scope) ->
        Option.value (key_for_editor projection mounted ~scope ~uuid) ~default:"")
    projected_editor (Signal.value mounted_editor)) in
  let navigation_target = Signal.state ctx.Lui_ui.ui_scheduler None in
  let scroll_token = Signal.state ctx.Lui_ui.ui_scheduler 0 in
  let next_scroll_token = ref 0 in
  let request_scroll ~key =
    if !next_scroll_token = max_int then invalid_arg "Outline scroll token space exhausted";
    incr next_scroll_token;
    Signal.set navigation_target (Some key);
    Signal.set scroll_token !next_scroll_token;
    !next_scroll_token in
  let scroll_completed = Signal.state ctx.Lui_ui.ui_scheduler None in
  let scroll_target = own (Signal.map2 (fun navigation editing ->
    Option.value navigation ~default:editing)
    (Signal.value navigation_target) editing_target) in
  let native = match Lui_ui.host ctx with
    | Lui_protocol.SwiftUIHost ->
        let owner = Lui_virtual.create_owner () in
        let source = Lui_virtual.root_source owner ~key:"main-outline" in
        if !presentation_serial = max_int then invalid_arg "Outline presentation space exhausted";
        incr presentation_serial;
        let scope = "outline:" ^ string_of_int !presentation_serial in
        let navigation = Issued_reveal.create ~scope:(scope ^ ":navigation") ~source ~request_scroll in
        let editing = Issued_reveal.create ~scope:(scope ^ ":editing") ~source ~request_scroll in
        (* Separate obligations borrow the same root. A read-only navigation
           cancellation must not terminate an active editor/IME residency. *)
        Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
          Issued_reveal.dispose navigation;
          Issued_reveal.dispose editing;
          Lui_virtual.dispose_owner owner);
        Some {owner; source; navigation; editing}
    | _ -> None in
  (* These sources live for the projected occurrence, including when its
     rows are outside the physical window. A row mount must not own them. *)
  let sources = Hashtbl.create 8 in
  let sync_sources projection =
    let next = Hashtbl.create 8 in
    List.iter (fun source ->
      let scope = source.Outliner_projection.source_scope in
      Hashtbl.add next scope ();
      match Hashtbl.find_opt sources scope with
      | Some (blocks, _) -> blocks := source.source_blocks
      | None ->
          let blocks = ref source.source_blocks in
          let remove = S.register_block_source ~scope ~kind:S.Outliner (fun () -> !blocks) in
          Hashtbl.add sources scope (blocks, remove)) projection.Outliner_projection.embedded_sources;
    let retired = Hashtbl.fold (fun scope (_, remove) retired ->
      if Hashtbl.mem next scope then retired else (scope, remove) :: retired) sources [] in
    List.iter (fun (scope, remove) -> remove (); Hashtbl.remove sources scope) retired in
  ignore (Signal.own ctx.Lui_ui.ui_scope
    (Signal.subscribe ~emit_initial:true projection sync_sources));
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
    Hashtbl.iter (fun _ (_, remove) -> remove ()) sources;
    Hashtbl.clear sources);
  Option.iter (fun native ->
    let target_key = own (Signal.map2 (fun editing key -> editing, key)
      (S.editing_sig ()) editing_target) in
    let target_control = own (Signal.map2 (fun pair mounted -> pair, mounted)
      target_key (Signal.value mounted_editor)) in
    let context = own (Signal.cutoff same_editor_intent (Signal.map2
      (fun ((editing, key), mounted) (snapshot : Model.t) ->
      Option.bind editing (fun (editing : S.editing) ->
        if key = "" then None
        else Some {block = editing.uuid; interaction_scope = editing.scope; row_key = key;
          repository = snapshot.repo; route = snapshot.route; revision = snapshot.context_revision;
          session = editing.epoch;
          control = editor_node mounted ~uuid:editing.uuid ~scope:editing.scope ~key}))
      target_control model)) in
    let demand = own (Signal.cutoff
      (fun (a, source_a) (b, source_b) -> same_editor_intent a b && source_a = source_b)
      (Signal.map2 (fun context binding -> context, binding)
      context (Lui_virtual.binding native.source))) in
    let attempt = ref None in
    let last_session = ref (Option.map (fun (editing : S.editing) -> editing.epoch) (S.editing ())) in
    let subscription = Signal.subscribe ~emit_initial:true demand
      (fun (wanted, binding) ->
        let session = Option.map (fun (editing : S.editing) -> editing.epoch) (S.editing ()) in
        let same_session = match session, !last_session with
          | Some a, Some b -> a == b
          | None, None -> true
          | _ -> false in
        last_session := session;
        if not same_session && Option.is_some session then
          Option.iter (fun cancel -> cancel ()) !cancel_navigation;
        Option.iter (fun attempt -> Issued_reveal.cancel native.editing ~attempt) !attempt;
        attempt := None;
        match wanted, binding, Lui_virtual.Internal.owner_binding native.source with
        | Some intent, Some _, Some _ ->
            let uuid = intent.block and scope = intent.interaction_scope and key = intent.row_key in
            let current () =
              let snapshot = Signal.get model in
              !alive && snapshot.repo = intent.repository && snapshot.route = intent.route
              && snapshot.context_revision = intent.revision
              && Option.fold ~none:false ~some:(fun (editing : S.editing) ->
                editing.epoch == intent.session) (S.editing ())
              && Signal.get (S.editing_target_sig ()) = Some (uuid, scope)
              && editor_node (Signal.get (Signal.value mounted_editor)) ~uuid ~scope ~key = intent.control
              && key_for_editor (Signal.get projection) (Signal.get (Signal.value mounted_editor))
                   ~scope ~uuid = Some key in
            let control_node () = Option.map
              (Lui_runtime.canonical_node ctx.Lui_ui.ui_application) intent.control in
            attempt := Some (Issued_reveal.issue native.editing ~key ~block:uuid
              ~kind:(Issued_reveal.Editor {require_focus = true; control_node;
                reveal = Option.is_none !cancel_navigation}) ~current)
        | _ -> ()) in
    ignore (Signal.own ctx.Lui_ui.ui_scope subscription)) native;
  {native; model; projection; rows; row_count; editing_target; navigation_target; scroll_token; request_scroll;
   scroll_target; scroll_completed; row_roots = Hashtbl.create 1;
   occurrences = Hashtbl.create 32; mounted_editor; alive; cancel_navigation}

let owner state = Option.map (fun native -> native.owner) state.native

(* A unique application owns the state even when its route or localized
   shell is reconciled. Region-only hosts use the same entry point. *)
let applications : (Lui_runtime.application * t) list ref = ref []

let previous_scroller : (string -> unit) option ref = ref None

let install_editor_scroller () =
  match !previous_scroller with
  | Some _ -> ()
  | None ->
      let previous = !S.scroll_key_into_view in
      previous_scroller := Some previous;
      S.scroll_key_into_view := (fun uuid ->
        let target = Signal.get (S.editing_target_sig ()) in
        let scope = match target with
          | Some (target, scope) when target = uuid -> scope
          | _ -> S.interaction_scope () in
        let context = Runtime.model () in
        let mapped = List.find_map (fun (_, state) ->
          let snapshot = Signal.get state.model in
          if not !(state.alive) || snapshot.Model.repo <> context.Model.repo
            || snapshot.route <> context.route || snapshot.context_revision <> context.context_revision
          then None else Option.map (fun key -> state, key)
            (key_for_editor (Signal.get state.projection)
              (Signal.get (Signal.value state.mounted_editor)) ~scope ~uuid)) !applications in
        match mapped with
        | None -> previous uuid
        | Some (state, key) ->
            match state.native with
            | None ->
                previous key;
                (* Small outlines use ordinary keyed rows rather than a Web
                   window. Correct only an already mounted exact occurrence. *)
                List.iter (fun (element : Ui_services.el) ->
                  let same_scope = element.attr "data-cid" = Some scope
                    || (scope = "main" && element.attr "data-cid" = None) in
                  let row_key = Option.bind (element.closest "[data-projection-key]")
                    (fun row -> row.Ui_services.attr "data-projection-key") in
                  if element.attr "data-blockid" = Some uuid && same_scope
                    && row_key = Some key && element.connected () then
                    element.scroll_into_view_nearest ()) (Ui_services.dom_query_all ".ls-block")
            | Some _ ->
                Option.iter (fun cancel -> cancel ()) !(state.cancel_navigation);
                ignore (state.request_scroll ~key);
                Runtime.flush ())

let ensure ctx model =
  install_editor_scroller ();
  match List.find_opt (fun (application, _) -> application == ctx.Lui_ui.ui_application) !applications with
  | Some (_, state) ->
      if state.model != model then invalid_arg "An outline owner cannot change its application model source";
      state
  | None ->
      (* The SDK keeps this scope across root view reconciliation/reload. Row
         scopes borrow the state and retire only their own bindings. *)
      let owner_context = {ctx with Lui_ui.ui_scope = ctx.ui_state_scope} in
      let state = create owner_context model in
      let application = ctx.Lui_ui.ui_application in
      applications := (application, state) :: !applications;
      Signal.on_dispose ctx.Lui_ui.ui_state_scope (fun () ->
        applications := List.filter (fun (current, _) -> current != application) !applications);
      state

let register_rows ctx state root =
  Hashtbl.add state.row_roots root ();
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> Hashtbl.remove state.row_roots root)

(* Register application row ownership before rendering ordinary row content.
   This is retained semantic context, never a DOM or native-control proof. *)
let row_occurrence state ~key content : Lui_elements.t =
 fun ctx parent ->
  let root = match parent with Some root -> root | None -> invalid_arg "A projected row requires its root" in
  Hashtbl.replace state.occurrences root key;
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> Hashtbl.remove state.occurrences root);
  content ctx parent

(* Keyed and reactive constructors, including their mount hooks, can run
   before the returned root is attached. Native promises run synchronously,
   so use the host timer there. Admission uses the committed retained tree;
   it does not establish physical mounting or native control acceptance. *)
let after_attachment ctx f =
  let run () =
    if Ui_effect.alive ctx.Lui_ui.ui_scope then begin
      f ();
      Ui_services.request_flush ()
    end in
  match Lui_ui.host ctx with
  | Lui_protocol.WebHost ->
      ignore Js.Promise.(resolve () |> then_ (fun () -> run (); resolve ()))
  | _ -> ignore (Ui_effect.timeout ~scope:ctx.Lui_ui.ui_scope 0 run)

let register_editor ctx ~node ~uuid ~scope =
  match List.find_opt (fun (application, _) -> application == ctx.Lui_ui.ui_application) !applications with
  | None -> ()
  | Some (application, state) ->
      let registration = ref () in
      let clear () =
        match Runtime.signal_get state.mounted_editor with
        | Some editor when editor.registration == registration ->
            Signal.set state.mounted_editor None
        | _ -> () in
      Signal.on_dispose ctx.Lui_ui.ui_scope clear;
      let locate () =
        let current = Runtime.model () in
        let snapshot = Signal.get state.model in
        let active = match S.editing () with
          | Some editing -> editing.S.uuid = uuid && editing.scope = scope
          | None -> false in
        if !(state.alive) && active
           && snapshot.repo = current.repo && snapshot.route = current.route
           && snapshot.context_revision = current.context_revision
           && Signal.get (S.editing_target_sig ()) = Some (uuid, scope) then begin
          let canonical = Lui_runtime.canonical_node application in
          let projection = Signal.get state.projection in
          let current_key key = List.exists
              (fun row -> Outliner_projection.key row = key) projection.Outliner_projection.rows in
          let rec row node =
            let direct = Hashtbl.find_opt state.occurrences node in
            let node = canonical node in
            let found = match direct with
              | Some key when current_key key -> Some key
              | _ -> Hashtbl.fold (fun root key found ->
                  if canonical root = node && current_key key then Some key else found)
                  state.occurrences None in
            match found with
            | Some _ as key -> key
            | None -> Option.bind (Hashtbl.find_opt application.Lui_runtime.runtime_parents node) row in
          let node = canonical node in
          match row node with
          | Some key when Lui_runtime.node_live application node
              && Option.fold ~none:true ~some:(( = ) key)
                (key_for_block projection ~scope ~uuid) ->
              (* This locates the current control, independently of a particular
                 edit epoch. Issued intents own epoch and context acceptance. *)
              Signal.set state.mounted_editor (Some {uuid; scope; key; node; registration})
          | _ -> clear ()
        end else clear () in
      (* Draft surfaces can mount before Appear activates their edit target.
         Re-probe on semantic changes instead of assuming constructor-time
         activation; collapse and refresh can also move the owning occurrence. *)
      let pending = ref false in
      let schedule () =
        if not !pending && Ui_effect.alive ctx.Lui_ui.ui_scope then begin
          pending := true;
          after_attachment ctx (fun () -> pending := false; locate ())
        end in
      let target_context = Signal.own_signal ctx.Lui_ui.ui_scope
        (Signal.cutoff ( = ) (Signal.map2 (fun target (snapshot : Model.t) ->
          target, snapshot.repo, snapshot.route, snapshot.context_revision)
          (S.editing_target_sig ()) state.model)) in
      ignore (Signal.own ctx.Lui_ui.ui_scope
        (Signal.subscribe ~emit_initial:false target_context (fun _ -> schedule ())));
      ignore (Signal.own ctx.Lui_ui.ui_scope
        (Signal.subscribe ~emit_initial:false state.projection (fun _ -> schedule ())));
      schedule ()

(* This is retained ownership context, independent of DOM mounting or the
   physical window. Embedded views must render ordinary content in a row. *)
let inside_rows ctx parent =
  match List.find_opt (fun (application, _) -> application == ctx.Lui_ui.ui_application) !applications with
  | None -> false
  | Some (application, state) ->
      let canonical = Lui_runtime.canonical_node application in
      let rec contains node =
        let node = canonical node in
        Hashtbl.fold (fun root () found -> found || canonical root = node) state.row_roots false
        || match Hashtbl.find_opt application.Lui_runtime.runtime_parents node with
           | None -> false
           | Some parent -> contains parent
      in
      Option.fold ~none:false ~some:contains parent
