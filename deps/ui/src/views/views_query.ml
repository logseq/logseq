(* Custom queries — parses `{{query <src>}}` block titles, builds the
   [:query spec] resource, decodes rows, and implements the query source
   editor shell (.ls-query-setting → fake CodeMirror editing). *)

module D = Views_dom
module V = Views_state
module W = Wire
module Wr = Views_wire
module I = Views_i18n
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

let extract_src (title : string) : string =
  let t = String.trim title in
  let n = String.length t in
  if
    n >= 9 && String.sub t 0 7 = "{{query"
    && String.sub t (n - 2) 2 = "}}"
  then String.trim (String.sub t 7 (n - 9))
  else ""

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
        | Some w -> Wr.seq_items w
        | None -> Wr.seq_items v
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

(* refresh block title + view props, then run *)
let refresh_block inst f =
  match inst.V.kind with
  | V.KQuery { block_uuid } ->
      Db.get_blocks [ block_uuid ] ~metadata:true (fun ents ->
          (match ents with
           | b :: _ ->
               inst.V.qsrc <-
                 extract_src
                   (Option.value (W.map_get_string b "block/title")
                      ~default:"");
               (match Wr.decode_view_ent b with
                | Some v -> V.apply_view_entity inst v
                | None -> ())
           | [] -> ());
          f ())
  | _ -> f ()

(* -- query source editor (fake CodeMirror contract) --
   .ls-query-setting toggles a .CodeMirror > pre.CodeMirror-line[contenteditable]
   inside the shell; Esc commits back to {{query <src>}}. *)

let editor_open : V.inst -> bool ref = fun _ -> ref false

let open_editor inst (shell : D.el) =
  let buuid =
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
          let title =
            if src = "" then "{{query }}"
            else "{{query " ^ src ^ "}}"
          in
          Db.save_block_title buuid title (fun () -> ())
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
