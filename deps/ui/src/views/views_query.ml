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

(* cljs custom-query*: a keyword :view/:result-transform resolves through
   config.edn :query/views / :query/result-transforms; a literal form is
   used as-is. cfg is the repo config map (empty when not needed). *)
let edn_spec_value cfg section (v : W.t) : W.t option =
  match v with
  | W.Keyword k -> (
      match W.get cfg section with
      | Some m -> (
          match W.get m k with Some resolved -> Some resolved | None -> None)
      | None -> None)
  | _ -> Some v

let needs_config = function
  | QDatalog m -> (
      (match W.get m "view" with Some (W.Keyword _) -> true | _ -> false)
      ||
      match W.get m "result-transform" with
      | Some (W.Keyword _) -> true
      | _ -> false)
  | _ -> false

let spec_of inst cfg block_uuid = function
  | QDsl s ->
      Ok
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
          (* keyword transform that config.edn cannot resolve is an error
             in cljs ("Missing query result transform") *)
          let rt =
            match W.get m "result-transform" with
            | Some v ->
                Option.map
                  (fun resolved ->
                    ( W.kw "result-transform-edn"
                    , W.String (Edn.to_string resolved) ))
                  (edn_spec_value cfg "query/result-transforms" v)
            | None -> None
          in
          (match W.get m "result-transform", rt with
           | Some _, None -> Error "Missing query result transform"
           | _ ->
               let pairs =
                 match rt with Some p -> pairs @ [ p ] | None -> pairs
               in
               let pairs =
                 match W.get m "view" with
                 | Some v -> (
                     match edn_spec_value cfg "query/views" v with
                     | Some resolved ->
                         pairs
                         @ [ ( W.kw "view-edn"
                             , W.String (Edn.to_string resolved) ) ]
                     | None -> pairs)
                 | None -> pairs
               in
               Ok (W.Map pairs))
      | _ -> Error "invalid query")
  | QBlank -> Error "invalid query"

(* -- run the query resource, decode rows into inst -- *)

let decode_result inst (v : W.t) =
  match W.get v "error" with
  | Some e ->
      inst.V.query_error <-
        Some
          (Option.value (W.map_get_string e "message") ~default:"query error");
      inst.V.query_rows <- [];
      inst.V.query_scalar_rows <- [];
      inst.V.query_view <- W.Nil
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
        inst.V.query_scalar_rows <- items);
      (* :view fn result — hiccup wire; Nil means render the default table *)
      inst.V.query_view <- Option.value (W.get v "view") ~default:W.Nil)

(* uuids inside the :view hiccup hydrate to titles via inst.blocks *)
let rec collect_uuids w acc =
  match w with
  | W.Uuid u -> u :: acc
  | W.Array xs | W.List xs | W.Set xs -> List.fold_left (fun a x -> collect_uuids x a) acc xs
  | W.Map kvs -> List.fold_left (fun a (k, v) -> collect_uuids v (collect_uuids k a)) acc kvs
  | _ -> acc

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
           inst.V.query_view <- W.Nil;
           f ()
       | src_kind ->
           let run_with_cfg cfg =
             match spec_of inst cfg block_uuid src_kind with
             | Error msg ->
                 inst.V.query_error <- Some msg;
                 f ()
             | Ok spec ->
                 let key = Db.key_query spec in
                 Db.snapshots
                   ~f:(fun snap ->
                     (match Wr.snapshot_slot_value snap key with
                      | Some v -> decode_result inst v
                      | None -> inst.V.query_error <- Some "query failed");
                     (match inst.V.query_view with
                      | W.Nil -> f ()
                      | view ->
                          let uuids = collect_uuids view [] in
                          Db.get_blocks uuids ~metadata:true (fun ents ->
                              List.iter
                                (fun b ->
                                  match W.map_get_uuid b "block/uuid" with
                                  | Some u -> Hashtbl.replace inst.V.blocks u b
                                  | None -> ())
                                ents;
                              f ())))
                   [ Db.resource_query spec ]
           in
           if needs_config src_kind then
             Sdk_config.read_config (Runtime.repo ())
             |> Js.Promise.then_ (fun cfg ->
                    run_with_cfg cfg;
                    Js.Promise.resolve ())
             |> ignore
           else run_with_cfg (W.Map []))
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
                    (* while the source editor is open the in-flight text
                       is authoritative — don't clobber qsrc with the
                       last-saved title, which lags the keystrokes *)
                    if not inst.V.query_editor_open then
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
                    if not inst.V.query_editor_open then inst.V.qsrc <- "";
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

(* persist the raw source on the hidden value block — never on the
   tagged parent. The first refresh_block may still be in flight when
   the user commits, so the uuid is resolved through the parent's
   logseq.property/query ref on demand instead of guessed. *)
let save_src inst src =
  match inst.V.kind with
  | V.KQuery { block_uuid } ->
      if inst.V.query_block_uuid <> "" then
        Db.save_block_title inst.V.query_block_uuid src (fun () -> ())
      else
        Db.get_blocks [ block_uuid ] ~metadata:true ~children:true
          ~include_property_block:true
          (fun ents ->
            match ents with
            | b :: _ -> (
                match query_value_block b with
                | Some vb -> (
                    match W.map_get_uuid vb "block/uuid" with
                    | Some u ->
                        inst.V.query_block_uuid <- u;
                        Db.save_block_title u src (fun () -> ())
                    | None -> ())
                | None -> ())
            | [] -> ())
  | _ -> ()

let open_editor inst (shell : D.el) =
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
  inst.V.query_editor_open <- true;
  D.focus_end line;
  (* cljs's CodeMirror editor evaluates as you type — fire the query eval
     immediately on input (the spec carries the source; it does not wait
     for the save to land) and persist the title on a debounce *)
  let autosave = D.debounce 300 in
  D.el_add_listener line "input" (fun _ ->
      let src = D.el_text_content line |> String.trim in
      (V.ops ()).V.o_refresh_src inst src;
      autosave (fun () -> save_src inst src));
  D.el_add_listener line "keydown" (fun ev ->
      match Editor_dom.ev_key ev with
      | "Escape" ->
          Editor_dom.prevent_default ev;
          let src = D.el_text_content line |> String.trim in
          (* cljs keeps the editor open after Esc commits; the next tx
             broadcast re-renders the shell anyway. The eval already ran
             on input — only re-run it if the text changed since, and
             always persist the final source. *)
          if src <> inst.V.qsrc then (V.ops ()).V.o_refresh_src inst src;
          save_src inst src
      | "Enter" ->
          (* single-line editor contract *)
          Editor_dom.prevent_default ev
      | _ -> ())

(* toggle the raw-source editor for `inst` inside `shell` — called from
   the delegated click handler in Views_mount *)
let toggle_source_editor inst (shell : D.el) =
  (* a page remount can swap the shell between wiring and the click —
     retarget to the live shell holding this inst's container *)
  let shell =
    if D.el_is_connected shell then shell
    else
      match
        Editor_dom.el_closest inst.V.container ".custom-query-results"
      with
      | Some live -> live
      | None -> shell
  in
  match D.query_inside shell ".CodeMirror" with
  | Some cm ->
      D.el_remove cm;
      inst.V.query_editor_open <- false
  | None -> open_editor inst shell
