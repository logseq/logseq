(* Table editing outlives its virtualized row and uses the ordinary rich-text
   editor, save pipeline and input-method handling. Only Enter submits here. *)
open Lui_elements

module S = Editor_state
module A = Editor_actions
module P = Views_popup

let scope = "table-title"

type session = { uuid : string; popup_id : int; return_scope : string }
let active : session option ref = ref None

let owns session = match !active with
  | Some current -> current == session
  | None -> false

let retire session =
  if owns session then begin
    active := None;
    S.set (fun state -> if state.S.selection_scope = scope
      then {state with S.selection_scope = session.return_scope} else state);
    S.remove_block_source ~scope;
    P.close_entry session.popup_id
  end

let rec close session =
  if owns session then
    if !S.structure_pending then
      S.enqueue_edit_action ~real:true (fun () -> close session)
    else match S.editing () with
      | Some e when e.S.uuid = session.uuid && e.S.scope = scope ->
          A.exit_edit ~select:false
      | _ -> retire session

let () = S.on_edit_exit (fun uuid ->
  match !active with
  | Some session when session.uuid = uuid && (S.read ()).S.selection_scope = scope -> retire session
  | _ -> ())

let rec show ~anchor ~column_width (block : Model.block) =
  let context = Runtime.repo (), Runtime.route () in
  let later () = S.enqueue_edit_action ~real:true (fun () ->
    if context = (Runtime.repo (), Runtime.route ()) && !active = None
       && S.editing () = None then show ~anchor ~column_width block) in
  if !S.structure_pending then
    S.enqueue_edit_action ~real:true (fun () ->
      if context = (Runtime.repo (), Runtime.route ()) then show ~anchor ~column_width block)
  else match !active, S.editing () with
  | Some session, _ when Some session.uuid = block.Model.block_uuid ->
      A.request_focus session.uuid (String.length (A.live_buffer session.uuid))
  | Some session, _ -> close session; later ()
  | None, Some _ -> A.exit_edit ~select:false; later ()
  | None, None ->
      P.close_all ();
      let uuid = Option.get block.Model.block_uuid in
      let session = { uuid; popup_id = !(P.next_id) + 1;
        return_scope = (S.read ()).S.selection_scope } in
      active := Some session;
      S.add_block_source ~scope (fun () -> [block]);
      let width = max 160 column_width - 18 in
      (* The reference card adds four-point padding, a one-point border and
         six trailing points around its column-width-minus-eighteen content. *)
      let card_inset = 5 in
      ignore (P.push (fun ctx parent ->
        Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> close session);
        Ui_components.with_props [Ui_components.card_shadow;Ui_components.Prop.padding_right 10]
          (popover ~accessibility_identifier:"ls-table-block-editor"
            ~anchor:`below ~anchor_target:anchor ~anchor_alignment:`center
            ~anchor_offset:(-.float_of_int (32 + card_inset))
            ~width:(width + 16) ~max_width:(width + 16) ~padding:4
            ~background:"hsl(var(--popover))"
            ~foreground:"hsl(var(--popover-foreground))" ~border_width:1
            ~border_color:"hsl(var(--border))" ~corner_radius:6
            ~on_dismiss:(fun _ -> close session)
            ~data_attrs:["data-keep-selection","";"tabindex","-1"]
            [Ui_components.with_props [Ui_components.Prop.padding_right 4]
              (row ~width ~max_width:width ~padding_vertical:2
                ~min_width:0 ~style_class:"ls-table-block"
                [Editor_surface.mount uuid scope])]) ctx parent));
      A.enter_edit ~scope ~submit_on_enter:true uuid (String.length block.Model.block_title)
