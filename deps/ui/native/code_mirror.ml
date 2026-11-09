(* The native code conduit proposes source changes to the same OCaml
   buffer and debounced persistence path as the web CodeMirror adapter. *)

open Lui_elements
module W = Wire

let composition_active (ev : Ui_services.ev) = ev.composing

let on_native_event ?editing_row uuid =
  let scope, row_ref = Option.value editing_row
      ~default:("main", Editor_state.ordinary_row uuid) in
  let epoch = ref None in
  let accepts editing = editing.Editor_state.uuid = uuid
      && editing.scope = scope && editing.row_ref = row_ref
      && Option.fold ~none:false ~some:(fun mounted -> mounted == editing.epoch) !epoch in
  fun ~name ~value ~key ->
    if not (Ui_services.env_publishing ()) && uuid <> "" then
      match name, value, Editor_state.editing () with
      | "focus", _, _ ->
          Editor_actions.enter_edit ~scope ~row_ref uuid
            (String.length (Editor_actions.model_title uuid));
          let adopt () = match Editor_state.editing () with
            | Some e when e.Editor_state.uuid = uuid && e.scope = scope && e.row_ref = row_ref ->
                epoch := Some e.epoch
            | _ -> () in
          adopt ();
          Editor_state.pending_focus_actions := adopt :: !Editor_state.pending_focus_actions
      | "input", Some source, Some editing when accepts editing ->
          Editor_actions.sync_buffer uuid source;
          Outliner_ops.schedule_save uuid source
      | "blur", _, Some editing when accepts editing -> Editor_actions.blur_commit ()
      | "key", Some source, Some editing when accepts editing ->
          (match key with
           | Some "Escape" ->
               Editor_actions.sync_buffer uuid source;
               Editor_actions.exit_edit ~select:true
           | Some "Shift-Enter" ->
               Editor_actions.sync_buffer uuid source;
               Editor_actions.insert_sibling_after uuid
           | _ -> ())
      | _ -> ()

let update_calc (_ : 'a) = ()
let install () = ()

(* -- copy button — block source is the stored block_title, no editor
   instance needed -- *)

let copy_button ?editing_row:_ uuid =
  match Editor_state.find uuid with
  | Some b ->
      Platform.copy_to_clipboard b.Model.block_title;
      let d = Js.Dict.empty () in
      Js.Dict.set d "msg"
        (Js.Json.string (I18n.t "notification/copied"));
      Js.Dict.set d "cls" (Js.Json.string "success");
      Dom_ext.dispatch_custom "ls:toast" (Js.Json.object_ d)
  | None -> ()

(* -- language picker (.code-block-actions .select-language) -- *)

(* Stored language names are resolved by the platform editor. Unsupported
   modes keep their source and use the plain-text fallback. *)
let languages =
  [ "calc"; "clojure"; "css"; "csv"; "diff"; "go"; "graphql"; "haskell"
  ; "html"; "java"; "javascript"; "json"; "julia"; "kotlin"; "latex"
  ; "lua"; "markdown"; "ocaml"; "perl"; "php"; "python"; "r"; "ruby"
  ; "rust"; "scala"; "shell"; "sql"; "swift"; "typescript"; "xml"
  ; "yaml" ]

let pick_lang uuid lang =
  ignore
    (Outliner_ops.apply_and_refresh
       [ Outliner_ops.set_block_property uuid
           "logseq.property.code/lang" (W.String lang) ])

let open_lang_picker ?editing_row uuid =
  let context = Runtime.repo (), Runtime.route () in
  let current () = context = (Runtime.repo (), Runtime.route ())
      && (match editing_row with
          | Some (scope, row_ref) when row_ref.Editor_state.owner_uuid <> uuid || row_ref.link_hosts <> [] ->
              Editor_state.valid_row ~scope ~uuid row_ref
          | _ -> true) in
  match
    Ui_services.dom_query ((match editing_row with
      | Some (scope, row_ref) -> "#" ^ Editor_state.row_mount_id ~scope row_ref
      | None -> "#ls-block-" ^ uuid) ^ " .select-language")
  with
  | Some anchor ->
      let menu =
        column ~gap:0
          (List.map
             (fun name ->
               menu_item ~text:name
                 ~data_attrs:[ ("data-lang", name) ]
                 ~on_press:(fun _ ->
                   if current () then pick_lang uuid name;
                   Properties_state.close_overlays ())
                 [])
             languages)
      in
      ignore
        (Properties_popup.open_anchored ~cls:"ls-code-lang-picker"
           anchor menu)
  | None -> ()

(* file route: no native CodeMirror — the plain textarea stays the editor
   (its on_input already persists via file_view's debounced save) *)
let attach_file_editor ~on_change:_ () = fun () -> ()
