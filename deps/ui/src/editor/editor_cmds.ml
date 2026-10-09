(* "ls:editor-command" document event — context-menu and slash command
   actions. detail = {command : string, block? : uuid, value? : string}.
   Command ids are stable strings emitted by Popups_state; labels stay
   purely presentational.

   One implementation runs on every host: clipboard writes, sidebar /
   dialog dispatch, file picking and plugin context execution are
   installed per runtime as capabilities; a capability the host does
   not provide reports unavailable instead of faking success. *)

open Promise_ext
module W = Wire
module S = String

(* a capability the host may or may not provide *)
type 'a capability =
  | Supported of 'a
  | Unavailable

type host =
  { (* write text to the system clipboard *)
    clipboard_write : string -> unit
  ; (* dispatch ls:open-right-sidebar with {uuid} *)
    open_right_sidebar : string -> unit
  ; (* open the host file picker for asset upload *)
    pick_files : unit -> unit
  ; (* run "plugin-ctx:<plugin-id>/<command-key>" — absent where no
       plugin runtime exists *)
    exec_plugin_ctx :
      (uuid:string -> plugin:string -> key:string -> unit) capability
  ; (* developer-facing error log (console / stderr) *)
    report_error : string -> string -> unit
  }

type outcome =
  | Handled
  | Unavailable_command of string (* recognized, host lacks the capability *)
  | Unimplemented of string (* recognized, not built on any host yet *)
  | Unknown of string
  | No_target

let installed : host option ref = ref None

let install_host h = installed := Some h

let host () =
  match !installed with
  | Some h -> h
  | None -> invalid_arg "editor command host not installed"

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
let set_closed_value (h : host) uuid prop content =
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
         h.report_error "closed value not found" content);
    Js.Promise.resolve ())
;;

let current_block fallback =
  match fallback with
  | Some u -> Some u
  | None -> Editor_state.editing_uuid ()
;;

(* "upload" needs no block target — dispatch it before the uuid check
   like the event listeners it replaces did. *)
let run ~command ~block ~value : outcome =
  let h = host () in
  match command with
  | "upload" ->
      h.pick_files ();
      Handled
  | _ -> (
      match current_block block with
      | None -> No_target
      | Some uuid -> (
          match command with
          | "open-in-sidebar" ->
              h.open_right_sidebar uuid;
              Handled
          | "copy-ref" ->
              h.clipboard_write ("[[" ^ uuid ^ "]]");
              Handled
          | "copy" ->
              let title =
                match Editor_state.find uuid with
                | Some b -> b.Model.block_title
                | None -> ""
              in
              h.clipboard_write title;
              Handled
          | "cut" ->
              let title =
                match Editor_state.find uuid with
                | Some b -> b.Model.block_title
                | None -> ""
              in
              h.clipboard_write title;
              apply [ Outliner_ops.delete_blocks [ uuid ] ];
              Handled
          | "delete" ->
              apply [ Outliner_ops.delete_blocks [ uuid ] ];
              Handled
          (* text-level editing commands — act on the edit model's
             selection inside .block-editor, not on block entities. The
             edit context menu emits these; neither web nor native shows
             a native edit menu over our overlay selection *)
          | "edit-copy" -> (
              match Editor_actions.edit_model uuid with
              | Some m -> (
                  match Edit_model.selection_range m with
                  | Some (lo, hi) ->
                      h.clipboard_write
                        (String.sub m.Edit_model.source lo (hi - lo));
                      Handled
                  | None -> Handled)
              | None -> No_target)
          | "edit-cut" -> (
              match Editor_actions.edit_model uuid with
              | Some m -> (
                  match Edit_model.selection_range m with
                  | Some (lo, hi) ->
                      h.clipboard_write
                        (String.sub m.Edit_model.source lo (hi - lo));
                      Editor_actions.splice_range uuid lo hi "";
                      Outliner_ops.schedule_save uuid
                        (Editor_actions.live_buffer uuid);
                      Handled
                  | None -> Handled)
              | None -> No_target)
          | "edit-paste" -> (
              match Editor_actions.edit_model uuid with
              | Some _ ->
                  ignore
                    (Ui_task.bind (Ui_services.clipboard_read_text ())
                       (fun text ->
                         (match Editor_actions.edit_model uuid with
                          | Some m ->
                              let lo, hi = Editor_actions.sel_span_of m in
                              Editor_actions.splice_range uuid lo hi text;
                              Outliner_ops.schedule_save uuid
                                (Editor_actions.live_buffer uuid)
                          | None -> ());
                         Ui_task.resolve ()));
                  Handled
              | None -> No_target)
          | "edit-select-all" -> (
              match Editor_actions.edit_model uuid with
              | Some _ ->
                  Editor_actions.update_model uuid Edit_model.select_all;
                  ignore (Editor_actions.refresh_overlay uuid);
                  Handled
              | None -> No_target)
          | "expand-children" ->
              apply [ Outliner_ops.collapse_expand [ (uuid, false) ] ];
              Handled
          | "collapse-children" ->
              apply [ Outliner_ops.collapse_expand [ (uuid, true) ] ];
              Handled
          | "set-color" -> (
              match value with
              | Some c when c <> "" ->
                  apply_soft
                    [ batch_set [ uuid ] "logseq.property/background-color"
                        (W.String c) ];
                  Handled
              | _ ->
                  apply_soft
                    [ batch_remove [ uuid ] "logseq.property/background-color" ];
                  Handled)
          | "set-heading" -> (
              (match value with
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
                     [ batch_remove [ uuid ] "logseq.property/heading" ]);
              Handled)
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
                Js.Promise.resolve ());
              Handled
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
                Js.Promise.resolve ());
              Handled
          | cmd when String.length cmd > 7 && String.sub cmd 0 7 = "status-" ->
              set_closed_value h uuid "logseq.property/status"
                (String.sub cmd 7 (String.length cmd - 7));
              Handled
          | "priority-none" ->
              apply_soft [ batch_remove [ uuid ] "logseq.property/priority" ];
              Handled
          | cmd when String.length cmd > 9 && String.sub cmd 0 9 = "priority-" ->
              set_closed_value h uuid "logseq.property/priority"
                (String.sub cmd 9 (String.length cmd - 9));
              Handled
          | cmd when String.length cmd > 8 && String.sub cmd 0 8 = "heading-" -> (
              (match String.sub cmd 8 (String.length cmd - 8) with
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
                   with _ -> ()));
              Handled)
          | "quote" ->
              (* wrap current block title in markdown quote *)
              let b = Editor_state.find uuid in
              let title =
                match b with Some x -> x.Model.block_title | None -> ""
              in
              ignore
                (let* sop = Outliner_ops.save_block_parsed uuid ("> " ^ title) in
                 Outliner_ops.apply_and_refresh_deferred [ sop ]);
              Handled
          | "add-comment" ->
              (* cljs add-comment over the block selection — the comments
                 area mounts once the refresh lands *)
              ignore
                (let* _ =
                   Runtime.invoke2
                     "thread-api/ensure-comments-area-for-blocks"
                     (W.String (repo ()))
                     (W.Array [ W.Uuid uuid ])
                 in Outliner_ops.refresh_page ());
              Handled
          | "copy-export-as" ->
              (* cljs export-blocks: block ctx menu -> [block] :block; the
                 selection ctx menu exports the top-level selected roots *)
              let sel = Editor_state.selected () in
              let uuids =
                if Editor_state.String_set.mem uuid sel then
                  List.filter
                    (fun u ->
                      not (Editor_actions.has_selected_ancestor sel u))
                    (Editor_actions.selected_uuids ())
                else [ uuid ]
              in
              Export_state.arm_blocks uuids;
              Sidebar_state.open_dialog "export-page";
              Handled
          | "cycle-todo" | "deadline" | "scheduled" | "date-picker"
          | "set-icon" | "add-reaction" ->
              h.report_error "editor command not implemented" command;
              Unimplemented command
          | _ ->
              (* plugin block-context-menu-item — "plugin-ctx:<pid>/<key>" *)
              if String.starts_with ~prefix:"plugin-ctx:" command then (
                let rest =
                  String.sub command 11 (String.length command - 11)
                in
                match String.rindex_opt rest '/' with
                | Some i -> (
                    match h.exec_plugin_ctx with
                    | Supported exec ->
                        exec ~uuid
                          ~plugin:(String.sub rest 0 i)
                          ~key:(String.sub rest (i + 1)
                                  (String.length rest - i - 1));
                        Handled
                    | Unavailable ->
                        h.report_error
                          "editor command unavailable on this host" command;
                        Unavailable_command command)
                | None ->
                    h.report_error "unknown editor command" command;
                    Unknown command)
              else begin
                h.report_error "unknown editor command" command;
                Unknown command
              end))
;;
