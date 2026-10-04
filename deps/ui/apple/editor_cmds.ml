(* ported from deps/ui/src/editor/editor_cmds.ml *)
(* "ls:editor-command" document event — context-menu and slash command
   actions. detail = {command : string, block? : uuid, value? : string}.
   Command ids are stable strings emitted by Popups_state; labels stay
   purely presentational. *)

open Promise_ext
module W = Wire
module S = String

let clipboard_write (s : string) : unit Js.Promise.t =
  Platform.copy_to_clipboard s;
  Js.Promise.resolve ()


let detail_str name ev =
  match Worker_client.json_field "detail" ev with
  | Some d -> (
      match Worker_client.json_field name d with
      | Some v -> Worker_client.json_string v
      | None -> None)
  | None -> None
;;

let repo = Runtime.repo

let batch_set uuids prop v =
  Outliner_ops.op "batch-set-property"
    [ Outliner_ops.uuids_list uuids; W.Keyword prop; v; W.Map [] ]
;;

let batch_remove uuids prop =
  Outliner_ops.op "batch-remove-property"
    [ Outliner_ops.uuids_list uuids; W.Keyword prop ]
;;

let apply ops = ignore (Outliner_ops.apply_and_refresh ops)

(* cosmetic property writes: while an editor is open the apply's
   sync-db-changes broadcast already arms the debounced reload *)
let apply_soft ops =
  ignore (Outliner_ops.apply_and_refresh_deferred ops)

(* cljs batch-set-property-closed-value!: find the closed-value entity
   whose content matches, then set it by db/id. *)
let set_closed_value uuid prop content =
  ignore
    (let* w =
      Runtime.invoke2 "thread-api/get-property-closed-values"
        (W.String (repo ())) (W.Keyword prop)
    in
    let rows =
      match w with
      | W.Array xs | W.List xs -> xs
      | _ -> []
    in
    let hit =
      List.find_opt
        (fun r ->
          let eq s =
            S.equal (S.lowercase_ascii s) (S.lowercase_ascii content)
          in
          (match W.get r "logseq.property/value" with
           | Some (W.String s) -> eq s
           | _ -> false)
          ||
          (match W.get r "block/title" with
           | Some (W.String s) -> eq s
           | _ -> false))
        rows
    in
    (match hit with
     | Some r -> (
         match W.map_get_int r "db/id" with
         | Some id ->
             apply_soft [ batch_set [ uuid ] prop (W.Int id) ]
         | None -> ())
     | None ->
         Platform.console_error ("closed value not found", content));
    Js.Promise.resolve ())
;;

let current_block fallback =
  match fallback with
  | Some u -> Some u
  | None -> Editor_state.editing_uuid ()
;;

(* context-menu target: the block selection when it includes the
   emitted block, else the emitted block alone *)
let target_uuids uuid =
  let sel = Editor_state.String_set.elements (Editor_state.selected ()) in
  if List.mem uuid sel then sel else [ uuid ]
;;

(* picker anchor: the target block's row *)
(* page/set_icon inlined — Page is unreachable from here (page ->
   selection_bar -> cmdk_state -> editor_commands -> editor_cmds) *)
let set_icon_op (u : string) (c : Icon_picker.choice) =
  match c with
  | Icon_picker.Remove ->
      Outliner_ops.op "remove-block-property"
        [ Wire.Uuid u; Wire.Keyword "logseq.property/icon" ]
  | Icon_picker.Emoji id ->
      Outliner_ops.op "set-block-property"
        [ Wire.Uuid u; Wire.Keyword "logseq.property/icon"
        ; Wire.Map
            [ Wire.Keyword "type", Wire.Keyword "emoji"
            ; Wire.Keyword "id", Wire.String id ] ]
  | Icon_picker.Tabler (id, color) ->
      Outliner_ops.op "set-block-property"
        [ Wire.Uuid u; Wire.Keyword "logseq.property/icon"
        ; Wire.Map
            ([ Wire.Keyword "type", Wire.Keyword "tabler-icon"
             ; Wire.Keyword "id", Wire.String id ]
            @ (match color with
               | Some c -> [ Wire.Keyword "color", Wire.String c ]
               | None -> [])) ]

let block_anchor uuid = Editor_dom.get_element_by_id ("ls-block-" ^ uuid)
;;

let run ~command ~block ~value =
  match current_block block with
  | None -> ()
  | Some uuid -> (
      match command with
      | "open-in-sidebar" ->
          Platform.dispatch "ls:open-right-sidebar"
            (Js.Json.object_
               (Js.Dict.fromList [ ("uuid", Js.Json.string uuid) ]))
      | "copy-ref" ->
          ignore (clipboard_write ("[[" ^ uuid ^ "]]"))
      | "copy" ->
          let title =
            match Editor_state.find uuid with
            | Some b -> b.Model.block_title
            | None -> ""
          in
          ignore (clipboard_write title)
      | "cut" ->
          let title =
            match Editor_state.find uuid with
            | Some b -> b.Model.block_title
            | None -> ""
          in
          ignore (clipboard_write title);
          apply [ Outliner_ops.delete_blocks [ uuid ] ]
      | "delete" -> apply [ Outliner_ops.delete_blocks [ uuid ] ]
      | "expand-children" ->
          apply [ Outliner_ops.collapse_expand [ (uuid, false) ] ]
      | "collapse-children" ->
          apply [ Outliner_ops.collapse_expand [ (uuid, true) ] ]
      | "set-color" -> (
          match value with
          | Some c when c <> "" ->
              apply_soft
                [ batch_set [ uuid ] "logseq.property/background-color"
                    (W.String c) ]
          | _ ->
              apply_soft
                [ batch_remove [ uuid ] "logseq.property/background-color" ])
      | "set-heading" -> (
          match value with
          | Some "auto" ->
              apply_soft
                [ batch_set [ uuid ] "logseq.property/heading" (W.Bool true) ]
          | Some v ->
              (try
                 apply_soft
                   [ batch_set [ uuid ] "logseq.property/heading"
                       (W.Int (int_of_string v)) ]
               with _ ->
                 apply_soft
                   [ batch_remove [ uuid ] "logseq.property/heading" ])
          | None ->
              apply_soft
                [ batch_remove [ uuid ] "logseq.property/heading" ])
      | "toggle-numbered-list" ->
          ignore
            (let* w = Sdk_util.get_by_id (W.String uuid) in
            let cur =
              match Decode.order_list_type_of_wire w with
              | Some s -> s
              | None -> ""
            in
            (if cur = "number" then
               apply_soft
                 [ batch_remove [ uuid ]
                     "logseq.property/order-list-type" ]
             else
               apply_soft
                 [ batch_set [ uuid ] "logseq.property/order-list-type"
                     (W.String "number") ]);
            Js.Promise.resolve ())
      | "make-flashcard" ->
          ignore
            (let* w =
              Runtime.invoke2 "thread-api/get-case-page" (W.String (repo ()))
                (W.String "Card")
            in
            (match W.map_get_int w "db/id" with
             | Some dbid ->
                 apply_soft
                   [ Outliner_ops.set_block_property uuid "block/tags"
                       (W.Int dbid) ]
             | None -> ());
            Js.Promise.resolve ())
      | cmd when String.length cmd > 7 && String.sub cmd 0 7 = "status-" ->
          set_closed_value uuid "logseq.property/status"
            (String.sub cmd 7 (String.length cmd - 7))
      | "priority-none" ->
          apply_soft [ batch_remove [ uuid ] "logseq.property/priority" ]
      | cmd when String.length cmd > 9 && String.sub cmd 0 9 = "priority-" ->
          set_closed_value uuid "logseq.property/priority"
            (String.sub cmd 9 (String.length cmd - 9))
      | cmd when String.length cmd > 8 && String.sub cmd 0 8 = "heading-" -> (
          match String.sub cmd 8 (String.length cmd - 8) with
          | "normal" | "clear" ->
              apply_soft [ batch_remove [ uuid ] "logseq.property/heading" ]
          | "auto" ->
              apply_soft
                [ batch_set [ uuid ] "logseq.property/heading" (W.Bool true) ]
          | n -> (
              try
                apply_soft
                  [ batch_set [ uuid ] "logseq.property/heading"
                      (W.Int (int_of_string n)) ]
              with _ -> ()))
      | "quote" ->
          (* wrap current block title in markdown quote *)
          let b = Editor_state.find uuid in
          let title =
            match b with Some x -> x.Model.block_title | None -> ""
          in
          ignore
            (let* sops = Outliner_ops.save_block_parsed uuid ("> " ^ title) in
             Outliner_ops.apply_and_refresh_deferred sops)
      | "add-comment" -> Comments.ensure_for (target_uuids uuid)
      | "copy-export-as" ->
          ignore
            (clipboard_write
               (Editor_actions.export_titles
                  (List.filter_map Editor_state.find (target_uuids uuid))))
      | "set-icon" -> (
          match block_anchor uuid with
          | Some anchor ->
              ignore
                (Icon_picker.open_picker ~anchor ~del:false ~on_chosen:(fun c ->
                  let us = target_uuids uuid in
                  ignore
                    (let* _ =
                       Outliner_ops.apply (List.map (fun u -> set_icon_op u c) us)
                     in
                     !Runtime.reload_current_view ())))
          | None -> ())
      | "add-reaction" -> (
          match block_anchor uuid with
          | Some anchor ->
              ignore
                (Icon_picker.open_picker_with_opts ~anchor ~del:false
                  ~opts:{ Icon_picker.emoji_only = true; sub = true }
                  ~on_chosen:(fun c ->
                  match c with
                  | Icon_picker.Emoji id ->
                      List.iter
                        (fun u -> Comments_view.toggle_reaction u id)
                        (target_uuids uuid)
                  | _ -> ()))
          | None -> ())
      | "dev/show-block-data" ->
          Dialogs_state.show_entity_data (repo ()) uuid
      | "dev/show-block-ast" -> (
          match Editor_state.find uuid with
          | Some b ->
              Dialogs_state.show_block_ast (repo ()) uuid b.Model.block_title
          | None -> ())
      | _ -> Platform.console_error ("unknown editor command", command))
;;
