(* A route intent resolves domain expansion and a logical row before asking
   either host to materialize it. No ancestor is a viewport retention owner. *)
module P = Outliner_projection
module V = Outline_viewport_state
module S = Editor_state

type target = { key : string; scope : string; index : int }

let serial = ref 0
let cancel_current : (unit -> unit) option ref = ref None

let cancel () =
  Option.iter (fun stop -> stop ()) !cancel_current;
  cancel_current := None

let block_uuid anchor =
  let length = String.length anchor in
  if length < 36 then None else
  let tail = String.sub anchor (length - 36) 36 in
  if Wire.is_uuid_string tail then Some tail else None

let state_for_model () =
  let model = Runtime.model () in
  List.find_map (fun (_, state) ->
    if !(state.V.alive) && Signal.get state.model == model then Some state else None)
    !(V.applications)

let path state uuid =
  let model = Signal.get state.V.model in
  P.find_path ~children_of:S.children_of ~scope:(V.scope_of_route model.Model.route)
    ~uuid (V.sections model)

let expand state uuid =
  match path state uuid with
  | None | Some [] -> ()
  | Some (_ :: ancestors) ->
      let collapsed = Signal.get (S.collapse_sig ()) in
      List.iter (fun ancestor ->
        let block = ancestor.P.ancestor_block in
        Option.iter (fun uuid ->
          if S.effective_collapsed_in_view ~scope:ancestor.ancestor_scope
               uuid block.Model.block_default_collapsed collapsed then
            S.expand_root ~scope:ancestor.ancestor_scope uuid) block.block_uuid) ancestors

let locate state uuid =
  let projection = Signal.get state.V.projection in
  match path state uuid with
  | None ->
      let rec header index = function
        | [] -> None
        | P.Header section :: _ when section.page.Model.page_uuid = Some uuid ->
            Some {key = P.key (P.Header section); scope = "main"; index}
        | _ :: rest -> header (index + 1) rest in
      header 0 projection.P.rows
  | Some path ->
    (* Comments and other ordinary content may belong to a projected ancestor.
       The exact descendant must still be verified inside that same row. *)
    List.find_map (fun ancestor ->
      Option.bind ancestor.P.ancestor_block.Model.block_uuid (fun uuid ->
        Option.map (fun (index, row) ->
          {key = P.key (P.Block row); scope = row.P.scope; index})
          (P.find_block projection ~scope:ancestor.ancestor_scope ~uuid))) path

let row_key (element : Ui_services.el) =
  Option.bind (element.closest "[data-projection-key]")
    (fun row -> row.Ui_services.attr "data-projection-key")

let mounted ~anchor ~uuid target =
  let candidates = Ui_services.dom_query_all ("[data-blockid=\"" ^ uuid ^ "\"]") in
  List.find_opt (fun (element : Ui_services.el) ->
    element.connected () && element.id () = anchor && row_key element = Some target.key)
    candidates

let visible (element : Ui_services.el) =
  let _, _, width, height = element.rect () in
  not (element.rect_pending ()) && width > 0. && height > 0.

let selection_scope (element : Ui_services.el) uuid =
  let title = List.exists (fun (section : P.section) ->
    section.page.Model.page_uuid = Some uuid) (V.sections (Runtime.model ())) in
  if title then Some "main" else
  let scope = element.attr "data-cid" in
  let scope = match scope with
    | Some _ -> scope
    | None when Option.is_some (S.find_in (S.page_blocks ()) uuid) -> Some "main"
    | None -> None in
  Option.bind scope (fun scope ->
    let blocks = match S.builtin_blocks_in_scope scope, S.block_source scope with
      | Some blocks, _ -> Some blocks
      | None, Some source -> Some (source.S.source_blocks ())
      | None, None -> None in
    Option.bind blocks (fun blocks ->
      if Option.is_some (S.find_in blocks uuid) then Some scope else None))

let jump anchor =
  cancel ();
  if !serial = max_int then invalid_arg "Navigation serial space exhausted";
  incr serial;
  let issued_serial = !serial and context = Runtime.model () in
  let editing = Option.map (fun (editing : S.editing) ->
    editing.epoch, editing.uuid, editing.scope) (S.editing ()) in
  let location = Ui_services.nav_hash () in
  let stopped = ref false and timer = ref None and root = ref None in
  let attempt = ref None and chosen = ref None and highlighted = ref None in
  let web_requested = ref false in
  let edit_ownership_current () = match S.editing (), editing with
    | None, _ -> true
    | Some live, Some (epoch, uuid, scope) ->
        live.S.epoch == epoch && live.uuid = uuid && live.scope = scope
    | Some _, None -> false in
  let current () = not !stopped && !serial = issued_serial
    && Outliner_ops.context_current context && Ui_services.nav_hash () = location
    && edit_ownership_current ()
    && Option.fold ~none:true ~some:(fun state -> !(state.V.alive)) !root in
  let cancel_attempt () =
    Option.iter (fun (native, id) ->
      let token = Issued_reveal.scroll_token native.V.navigation ~attempt:id in
      Issued_reveal.cancel native.navigation ~attempt:id;
      (match !root, !chosen, token with
       | Some state, Some target, Some token
         when Runtime.signal_get state.V.scroll_token = token
           && Runtime.signal_get state.navigation_target = Some target.key ->
           Signal.set state.navigation_target None
       | _ -> ())) !attempt;
    attempt := None in
  let stop () =
    if not !stopped then begin
      stopped := true;
      Option.iter Ui_services.timers_clear_timeout !timer;
      timer := None;
      cancel_attempt ();
      Option.iter (fun (element : Ui_services.el) ->
        if element.connected () && element.id () = anchor then
          element.remove_class "block-highlight") !highlighted;
      highlighted := None;
      Option.iter (fun state -> state.V.cancel_navigation := None) !root;
      if !serial = issued_serial then cancel_current := None
    end in
  cancel_current := Some stop;
  let schedule delay callback =
    timer := Some (Ui_services.timers_timeout (fun () -> timer := None; callback ()) delay) in
  let finish element uuid =
    if current () && element.Ui_services.connected () then begin
      element.scroll_into_view ();
      match uuid with
      | Some uuid ->
          Option.iter (fun scope -> Editor_actions.select_single_in ~scope uuid)
            (selection_scope element uuid);
          stop ()
      | None ->
          element.add_class "block-highlight";
          highlighted := Some element;
          schedule 4000 stop
    end else stop () in
  let rec poll count =
    if not (current ()) || count >= 120 then stop () else begin
      (match !root, state_for_model () with
       | None, Some state -> root := Some state; state.V.cancel_navigation := Some stop
       | _ -> ());
      let retry () = schedule 50 (fun () -> poll (count + 1)) in
      match block_uuid anchor, !root with
      | None, _ ->
          (match Ui_services.dom_by_id anchor with
           | Some element when visible element -> finish element None
           | _ -> retry ())
      | Some _, None -> retry ()
      | Some uuid, Some state ->
          expand state uuid;
          Runtime.flush ();
          if not (current ()) then stop () else
          match locate state uuid with
          | None -> retry ()
          | Some target ->
              if Option.fold ~none:false ~some:(fun previous ->
                   previous.key <> target.key || previous.scope <> target.scope) !chosen
              then stop () else begin
                chosen := Some target;
                let exact () = current ()
                  && Option.fold ~none:false ~some:(fun now ->
                    now.key = target.key && now.scope = target.scope) (locate state uuid) in
                let ready = match state.V.native with
                  | None ->
                      if not !web_requested then begin
                        (* The existing Web registry resolves the scoped logical key
                           against its full data array before mounting a DOM row. *)
                        (match !(V.previous_scroller) with
                         | Some scroll -> scroll target.key; web_requested := true
                         | None -> invalid_arg "Application outline scroller is not installed")
                      end;
                      true
                  | Some native ->
                      (match !attempt with
                       | None ->
                           (match Signal.get (Lui_virtual.binding native.source),
                                  Lui_virtual.Internal.owner_binding native.source with
                            | Some _, Some _ ->
                                let id = Issued_reveal.issue native.navigation ~key:target.key
                                  ~block:uuid ~kind:Issued_reveal.Navigation ~current:exact in
                                attempt := Some (native, id);
                                Runtime.flush ()
                            | _ -> ());
                           false
                       | Some (_, id) ->
                           match Issued_reveal.phase native.navigation ~attempt:id with
                           | Some Issued_reveal.Scrolled -> true
                           | Some Issued_reveal.Awaiting -> false
                           | _ -> stop (); false) in
                if ready && exact () then
                  (match mounted ~anchor ~uuid target with
                   | Some element when visible element -> finish element (Some uuid)
                   | _ -> retry ())
                else if not !stopped then retry ()
              end
    end in
  schedule 0 (fun () -> poll 0)
