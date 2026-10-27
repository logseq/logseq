(* Query value blocks use the same clause editor as query results. The
   block snapshot owns the source; a mount owns only its unsaved draft. *)

open Promise_ext
module B = Views_builder
module W = Wire

type state =
  { tree : B.clause
  ; refs : (string, string) Hashtbl.t
  ; properties : (string, string) Hashtbl.t
  ; saving : bool
  }

let next_id = ref 0

let block_el uuid (b : Model.block) : Lui_elements.t = fun context ->
  incr next_id;
  let key = "block-" ^ uuid ^ "-" ^ string_of_int !next_id in
  let scope = context.Lui_ui.ui_scope in
  let alive () = not (Signal.scope_is_disposed scope) in
  let st = Signal.state context.Lui_ui.ui_scheduler
      { tree = B.tree_of_src b.block_title
      ; refs = Hashtbl.create 8
      ; properties = Hashtbl.create 8
      ; saving = false
      } in
  let source = Signal.own_signal scope (Signal.value st) in
  let update f =
    if alive () then begin
      Signal.set st (f (Signal.get source));
      Runtime.flush ()
    end
  in
  let save tree =
    let before = Signal.get source in
    if alive () && not before.saving then begin
      let dsl = B.tree_to_dsl tree in
      if dsl = B.tree_to_dsl before.tree then
        update (fun s -> { s with tree })
      else begin
        update (fun s -> { s with tree; saving = true });
        ignore
          ((let* op = Outliner_ops.save_block_parsed uuid dsl in
            let* result = Outliner_ops.apply_and_refresh_result [ op ] in
            (match result with None -> failwith "Query builder save requires an open graph" | Some _ -> ());
            update (fun s -> { s with saving = false });
            Js.Promise.resolve ())
           |> Js.Promise.catch (fun error ->
               Ui_services.log_error ("query builder save failed", error);
               Toast.error (I18n.t "ui/save-changes-error");
               update (fun s -> { s with tree = before.tree; saving = false });
               Js.Promise.resolve ()))
      end
    end
  in
  Views_db.get_all_properties (fun properties ->
      let titles = Hashtbl.create (List.length properties) in
      List.iter (fun p ->
          match W.get p "db/ident", W.map_get_string p "block/title" with
          | Some ident, Some title ->
              Option.iter (fun ident -> Hashtbl.replace titles ident title)
                (Views_wire.ident_of_value ident)
          | _ -> ()) properties;
      update (fun s -> { s with properties = titles }));
  Views_db.pull_many
    "[:block/uuid {:block/refs [:block/uuid :block/title]}]" [ uuid ]
    (fun blocks ->
      let refs = Hashtbl.create 8 in
      List.iter (fun block ->
          List.iter (fun entity ->
              match W.map_get_uuid entity "block/uuid", W.map_get_string entity "block/title" with
              | Some uuid, Some title -> Hashtbl.replace refs uuid title
              | _ -> ())
            (match W.get block "block/refs" with Some rs -> W.args_list rs | None -> []))
        blocks;
      update (fun s -> { s with refs }));
  (reactive (fun state ->
       let tree = ref state.tree in
       let editor : B.editor =
         { key
         ; disabled = state.saving
         ; active = (fun () ->
             alive () &&
             let current = Signal.get source in
             not current.saving && current.tree == state.tree)
         ; ref_title = (fun uuid -> Hashtbl.find_opt state.refs uuid)
         ; property_title = (fun ident -> Hashtbl.find_opt state.properties ident)
         ; remember_ref = (fun uuid title ->
             update (fun s ->
                 let refs = Hashtbl.copy s.refs in
                 Hashtbl.replace refs uuid title;
                 { s with refs }))
         ; save
         }
       in
       B.editor_el editor ~tree)
     source) context
