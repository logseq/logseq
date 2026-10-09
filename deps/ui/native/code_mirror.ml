(* Native impl of editor/code_mirror.ml — code blocks render as plain
   text until a native code editor exists. The actions bar still works:
   copy goes to the pasteboard via Platform, and the language picker is
   an anchored popover that writes the block's
   logseq.property.code/lang property. *)

open Lui_elements
module W = Wire

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

(* Common fence languages — native has no CodeMirror mode table to
   enumerate; picking a lang only stores the property + label text. *)
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
