(* Custom queries — the query source lives on the hidden
   logseq.property/query value block of a logseq.class/Query-tagged
   block (cljs db-model); this builds the [:query spec] resource,
   decodes rows, and implements the query source editor shell
   (.ls-query-setting → fake CodeMirror editing). *)

module D = Views_dom
module V = Views_state
module W = Wire
module Wr = Views_wire
module I = I18n
module Db = Views_db
module M = Model

type qsrc =
  | QBlank
  | QDsl of string
  | QDatalog of W.t

external date_now : unit -> Js.Json.t = "Date" [@@mel.new]
external d_year : Js.Json.t -> int = "getFullYear" [@@mel.send]
external d_month : Js.Json.t -> int = "getMonth" [@@mel.send]
external d_date : Js.Json.t -> int = "getDate" [@@mel.send]

let today_day () =
  let d = date_now () in
  (d_year d * 10000) + ((d_month d + 1) * 100) + d_date d

let parse_src (s : string) : qsrc =
  let t = String.trim s in
  if t = "" || t = "(and)" || t = "(and )" then QBlank
  else if t.[0] = '{' then (
    match Edn.parse t with
    | W.Map _ as m -> QDatalog m
    | _ -> QDsl t)
  else QDsl t

(* -- [:query spec] construction — only the worker-allowed keys -- *)

let common_pairs inst block_uuid =
  let page_title =
    match !Runtime.current_page with
    | Some p -> [ (W.kw "current-page-title", W.String p.M.page_title) ]
    | None -> []
  in
  ignore inst;
  [ (W.kw "current-block-uuid", W.Uuid block_uuid)
  ; (W.kw "today-day", W.Int (today_day ()))
  ; (W.kw "remove-block-children?", W.Bool true)
  ]
  @ page_title

let spec_of inst block_uuid = function
  | QDsl s ->
      Some
        (W.Map
           ([ (W.kw "kind", W.Keyword "dsl"); (W.kw "query", W.String s) ]
           @ common_pairs inst block_uuid))
  | QDatalog m -> (
      match W.get m "query" with
      | Some (W.Array ((W.Keyword "find" | W.Symbol "find") :: _) as q) ->
          let pairs =
            [ (W.kw "kind", W.Keyword "datalog"); (W.kw "query", q) ]
            @ common_pairs inst block_uuid
          in
          let pairs =
            match W.get m "inputs" with
            | Some v -> pairs @ [ (W.kw "inputs", v) ]
            | None -> pairs
          in
          let pairs =
            match W.get m "rules" with
            | Some v -> pairs @ [ (W.kw "rules", v) ]
            | None -> pairs
          in
          let pairs =
            match W.get m "result-transform" with
            | Some v ->
                pairs
                @ [ (W.kw "result-transform-edn", W.String (Edn.to_string v))
                  ]
            | None -> pairs
          in
          Some (W.Map pairs)
      | _ -> None)
  | QBlank -> None

(* -- run the query resource, decode rows into inst -- *)

let decode_result inst (v : W.t) =
  match W.get v "error" with
  | Some e ->
      inst.V.query_error <-
        Some
          (Option.value (W.map_get_string e "message") ~default:"query error");
      inst.V.query_rows <- [];
      inst.V.query_scalar_rows <- []
  | None -> (
      inst.V.query_error <- None;
      let items =
        match W.get v "rows" with
        | Some w -> W.elems w
        | None -> W.elems v
      in
      let uuids = List.filter_map W.as_uuid items in
      if items <> [] && List.length uuids = List.length items then (
        inst.V.query_rows <- uuids;
        inst.V.query_scalar_rows <- [])
      else (
        inst.V.query_rows <- [];
        inst.V.query_scalar_rows <- items))

let run inst (f : unit -> unit) =
  match inst.V.kind with
  | V.KQuery { block_uuid } ->
      let src =
        (* fresh title lookup happens in refresh before run; qsrc holds the
           latest extracted source *)
        match inst.V.kind with
        | V.KQuery _ -> inst.V.qsrc
        | _ -> ""
      in
      (match parse_src src with
       | QBlank ->
           inst.V.query_rows <- [];
           inst.V.query_scalar_rows <- [];
           f ()
       | src_kind -> (
           match spec_of inst block_uuid src_kind with
           | None ->
               inst.V.query_error <- Some "invalid query";
               f ()
           | Some spec ->
               let key = Db.key_query spec in
               Db.snapshots
                 ~f:(fun snap ->
                   (match Wr.snapshot_slot_value snap key with
                    | Some v -> decode_result inst v
                    | None -> inst.V.query_error <- Some "query failed");
                   f ())
                 [ Db.resource_query spec ]))
  | _ -> f ()

(* the hidden value block created by create-property-text-block for
   logseq.property/query — the parent's property ref carries its
   block/uuid; find the matching child entity (children include property
   blocks only when include-property-block? was requested) *)
let query_value_block (b : W.t) : W.t option =
  match W.get b "logseq.property/query" with
  | Some q -> (
      match
        match W.map_get_uuid q "block/uuid" with
        | Some u -> Some u
        | None -> W.as_uuid q
      with
      | Some u -> (
          match W.get b "block/children" with
          | Some (W.Array xs) | Some (W.List xs) ->
              List.find_opt
                (fun c -> W.map_get_uuid c "block/uuid" = Some u)
                xs
          | _ -> None)
      | None -> None)
  | None -> None

(* refresh query source + view props, then run *)
let refresh_block inst f =
  match inst.V.kind with
  | V.KQuery { block_uuid } ->
      Db.get_blocks [ block_uuid ] ~metadata:true ~children:true
        ~include_property_block:true
        (fun ents ->
          (match ents with
           | b :: _ ->
               (match query_value_block b with
                | Some vb ->
                    inst.V.query_block_uuid <-
                      Option.value (W.map_get_uuid vb "block/uuid")
                        ~default:"";
                    inst.V.qsrc <-
                      Option.value (W.map_get_string vb "block/title")
                        ~default:"";
                    (* id-refs in the stored source resolve through the
                       value block's block/refs — collect uuid -> title
                       so clause chips can show titles (cljs page-title) *)
                    Hashtbl.reset inst.V.ref_titles;
                    (match W.get vb "block/refs" with
                     | Some (W.Array xs) | Some (W.List xs)
                     | Some (W.Set xs) ->
                         List.iter
                           (fun r ->
                             match
                               ( W.map_get_uuid r "block/uuid"
                               , W.map_get_string r "block/title" )
                             with
                             | Some u, Some t ->
                                 Hashtbl.replace inst.V.ref_titles u t
                             | _ -> ())
                           xs
                     | _ -> ());
                    inst.V.is_advanced <-
                      (match
                         W.get vb "logseq.property.node/display-type"
                       with
                       | Some (W.Keyword s) | Some (W.String s) ->
                           s = "code"
                       | _ -> false)
                | None ->
                    inst.V.query_block_uuid <- "";
                    inst.V.qsrc <- "";
                    inst.V.is_advanced <- false);
               (match Wr.decode_view_ent b with
                | Some v -> V.apply_view_entity inst v
                | None -> ())
           | [] -> ());
          f ())
  | _ -> f ()

(* -- query source editor (fake CodeMirror contract) --
   .ls-query-setting toggles a .CodeMirror > pre.CodeMirror-line[contenteditable]
   inside the shell; Esc commits the raw source to the value block title. *)

let editor_open : V.inst -> bool ref = fun _ -> ref false

let open_editor inst (shell : D.el) =
  let buuid =
    if inst.V.query_block_uuid <> "" then inst.V.query_block_uuid
    else
      match inst.V.kind with
      | V.KQuery { block_uuid } -> block_uuid
      | _ -> ""
  in
  let cur =
    match parse_src inst.V.qsrc with
    | QDsl s -> s
    | QDatalog _ -> inst.V.qsrc
    | QBlank -> ""
  in
  let line =
    D.h ~tag:"pre"
      ~cls:"CodeMirror-line"
      ~attrs:
        [ ("contenteditable", "true"); ("role", "textbox")
        ; ("spellcheck", "false") ]
      ~text:cur ()
  in
  let cm = D.h ~cls:"CodeMirror" ~children:[ line ] () in
  (match D.query_inside shell ".CodeMirror" with
   | Some old -> D.el_remove old
   | None -> ());
  D.el_append_child shell cm;
  D.focus_end line;
  D.el_add_listener line "keydown" (fun ev ->
      match Editor_dom.ev_key ev with
      | "Escape" ->
          Editor_dom.prevent_default ev;
          let src = D.el_text_content line |> String.trim in
          (* cljs keeps the editor open after Esc commits; the next tx
             broadcast re-renders the shell anyway *)
          Db.save_block_title buuid src (fun () -> ())
      | "Enter" ->
          (* single-line editor contract *)
          Editor_dom.prevent_default ev
      | _ -> ())

let wire_settings_button inst (shell : D.el) =
  match D.query_inside shell ".ls-query-setting" with
  | None -> ()
  | Some btn ->
      D.el_add_listener btn "click" (fun ev ->
          Editor_dom.stop_propagation ev;
          match D.query_inside shell ".CodeMirror" with
          | Some cm -> D.el_remove cm
          | None -> open_editor inst shell)
