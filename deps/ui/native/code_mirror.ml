(* The native code conduit proposes source changes to the same OCaml
   buffer and debounced persistence path as the web CodeMirror adapter. *)

open Lui_elements
module W = Wire

let on_native_event uuid ~name ~value ~key =
  if not (Ui_services.env_publishing ()) && uuid <> "" then
    match name, value with
    | "input", Some source ->
        Editor_actions.sync_buffer uuid source;
        Outliner_ops.schedule_save uuid source
    | "focus", _ ->
        (match Editor_state.editing () with
         | Some editing when editing.uuid = uuid -> ()
         | _ -> Editor_actions.enter_edit uuid (String.length (Editor_actions.model_title uuid)))
    | "blur", _ ->
        (match Editor_state.editing () with
        | Some editing when editing.uuid = uuid -> Editor_actions.blur_commit ()
        | _ -> ())
    | "key", Some source ->
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

let copy_button uuid =
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

let open_lang_picker uuid =
  match
    Ui_services.dom_query ("#ls-block-" ^ uuid ^ " .select-language")
  with
  | Some anchor ->
      let menu =
        column ~gap:0
          (List.map
             (fun name ->
               menu_item ~text:name
                 ~data_attrs:[ ("data-lang", name) ]
                 ~on_press:(fun _ ->
                   pick_lang uuid name;
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
let attach_file_editor ~on_change:_ () = ()
