(* Custom queries — the query source lives on the hidden
   logseq.property/query value block of a logseq.class/Query-tagged
   block (cljs db-model); this builds the [:query spec] resource,
   decodes rows, and implements the query source editor shell
   (.ls-query-setting → fake CodeMirror editing). *)

module D = Logseq_el
module E = Web_dom
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

let today_day () =
  let d = Js.Date.fromFloat (Js.Date.now ()) in
  (int_of_float (Js.Date.getFullYear d) * 10000)
  + ((int_of_float (Js.Date.getMonth d) + 1) * 100)
  + int_of_float (Js.Date.getDate d)

let parse_src (s : string) : qsrc =
  let t = String.trim s in
  if t = "" || t = "(and)" || t = "(and )" then QBlank
  else if t.[0] = '{' then (
    match Edn.parse t with
    | W.Map _ as m -> QDatalog m
    | _ -> QDsl t)
  else QDsl t

(* -- [:query spec] construction — only the worker-allowed keys -- *)

let common_pairs block_uuid =
  let page_title =
    match !Runtime.current_page with
    | Some p -> [ (W.kw "current-page-title", W.String p.M.page_title) ]
    | None -> []
  in
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

let spec_of cfg block_uuid = function
  | QDsl s ->
      Ok
        (W.Map
           ([ (W.kw "kind", W.Keyword "dsl"); (W.kw "query", W.String s) ]
           @ common_pairs block_uuid))
  | QDatalog m -> (
      match W.get m "query" with
      | Some (W.Array ((W.Keyword "find" | W.Symbol "find") :: _) as q) ->
          let pairs =
            [ (W.kw "kind", W.Keyword "datalog"); (W.kw "query", q) ]
            @ common_pairs block_uuid
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
      V.update inst (fun s ->
          { s with
            V.query_error =
              Some
                (Option.value (W.map_get_string e "message")
                   ~default:"query error")
          ; query_rows = []
          ; query_scalar_rows = []
          ; query_view = W.Nil
          })
  | None -> (
      let items =
        match W.get v "rows" with
        | Some w -> W.elems w
        | None -> W.elems v
      in
      let uuids = List.filter_map W.as_uuid items in
      if items <> [] && List.length uuids = List.length items then
        V.update inst (fun s ->
            { s with
              V.query_error = None
            ; query_rows = uuids
            ; query_scalar_rows = []
            ; query_view = Option.value (W.get v "view") ~default:W.Nil
            })
      else
        V.update inst (fun s ->
            { s with
              V.query_error = None
            ; query_rows = []
            ; query_scalar_rows = items
            ; query_view = Option.value (W.get v "view") ~default:W.Nil
            }))

(* uuids inside the :view hiccup hydrate to titles via inst blocks *)
let rec collect_uuids w acc =
  match w with
  | W.Uuid u -> u :: acc
  | W.Array xs | W.List xs | W.Set xs ->
      List.fold_left (fun a x -> collect_uuids x a) acc xs
  | W.Map kvs ->
      List.fold_left (fun a (k, v) -> collect_uuids v (collect_uuids k a)) acc kvs
  | _ -> acc

let run inst (f : unit -> unit) =
  match inst.V.kind with
  | V.KQuery { block_uuid } -> (
      let src = (V.get inst).V.qsrc in
      match parse_src src with
      | QBlank ->
          V.update inst (fun s ->
              { s with
                V.query_rows = []
              ; query_scalar_rows = []
              ; query_view = W.Nil
              });
          f ()
      | src_kind ->
          let run_with_cfg cfg =
            match spec_of cfg block_uuid src_kind with
            | Error msg ->
                V.update inst (fun s -> { s with V.query_error = Some msg });
                f ()
            | Ok spec ->
                let key = Db.key_query spec in
                let gen = V.new_fetch inst in
                Db.snapshots
                  ~f:(fun snap ->
                    if V.fetch_fresh inst gen then begin
                      (match Wr.snapshot_slot_value snap key with
                       | Some v -> decode_result inst v
                       | None ->
                           V.update inst (fun s ->
                               { s with V.query_error = Some "query failed" }));
                      (match (V.get inst).V.query_view with
                       | W.Nil -> f ()
                       | view ->
                           let uuids = collect_uuids view [] in
                           Db.get_blocks uuids ~metadata:true (fun ents ->
                               V.update inst (fun s ->
                                   let blocks = Hashtbl.copy s.V.blocks in
                                   List.iter
                                     (fun b ->
                                       match W.map_get_uuid b "block/uuid" with
                                       | Some u ->
                                           Hashtbl.replace blocks u b
                                       | None -> ())
                                     ents;
                                   { s with V.blocks });
                               f ()))
                    end)
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
      let gen = V.new_fetch inst in
      Db.get_blocks [ block_uuid ] ~metadata:true ~children:true
        ~include_property_block:true
        (fun ents ->
          if not (V.fetch_fresh inst gen) then ()
          else begin
          (match ents with
           | b :: _ ->
               (match query_value_block b with
                | Some vb ->
                    let qsrc =
                      (* while the source editor is open the in-flight text
                         is authoritative — don't clobber qsrc with the
                         last-saved title, which lags the keystrokes *)
                      if (V.get inst).V.query_editor_open then
                        (V.get inst).V.qsrc
                      else
                        Option.value (W.map_get_string vb "block/title")
                          ~default:""
                    in
                    (* id-refs in the stored source resolve through the
                       value block's block/refs — collect uuid -> title
                       so clause chips can show titles (cljs page-title) *)
                    let ref_titles = Hashtbl.create 8 in
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
                                 Hashtbl.replace ref_titles u t
                             | _ -> ())
                           xs
                     | _ -> ());
                    let is_advanced =
                      match W.get vb "logseq.property.node/display-type" with
                      | Some (W.Keyword s) | Some (W.String s) -> s = "code"
                      | _ -> false
                    in
                    V.update inst (fun s ->
                        { s with
                          V.query_block_uuid =
                            Option.value (W.map_get_uuid vb "block/uuid")
                              ~default:""
                        ; qsrc
                        ; ref_titles
                        ; is_advanced
                        })
                | None ->
                    V.update inst (fun s ->
                        { s with
                          V.query_block_uuid = ""
                        ; qsrc =
                            (if s.V.query_editor_open then s.V.qsrc else "")
                        ; is_advanced = false
                        }));
               (match Wr.decode_view_ent b with
                | Some v -> V.update inst (fun s -> V.apply_view_entity s v)
                | None -> ())
           | [] -> ());
          f ()
          end)
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
      let s = V.get inst in
      if s.V.query_block_uuid <> "" then
        Db.save_block_title s.V.query_block_uuid src (fun () -> ())
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
                        V.update inst (fun s ->
                            { s with V.query_block_uuid = u });
                        Db.save_block_title u src (fun () -> ())
                    | None -> ())
                | None -> ())
            | [] -> ())
  | _ -> ()

(* the .CodeMirror host — declarative: mounts/unmounts on
   query_editor_open. The logseq-codemirror adapter owns the
   contenteditable line and reports edits over cm-event; Enter/Escape
   preventDefault applies synchronously inside the adapter listener. *)
let cm_host inst : Lui_elements.t =
 fun ctx parent ->
  let open_sig =
    Logseq_el.own ctx
      (Signal.map
         (fun s -> s.V.query_editor_open)
         inst.V.st.Signal.state_signal)
  in
  Lui_elements.if_ ~test:open_sig
    (fun ctx parent ->
      let cur =
        match parse_src (V.get inst).V.qsrc with
        | QDsl s -> s
        | QDatalog _ -> (V.get inst).V.qsrc
        | QBlank -> ""
      in
      (* cljs's CodeMirror editor evaluates as you type — fire the query
         eval immediately on input (the spec carries the source; it does
         not wait for the save to land) and persist on a debounce *)
      let autosave = E.debounce 300 in
      Logseq_codemirror.cm ~key:"cm" ~source_role:"query" ~value:cur
        ~style_class:"CodeMirror"
        ~on_event:(fun ~name ~value ~key ->
          match (name, key) with
          | "input", _ ->
              let src = Option.value value ~default:"" |> String.trim in
              (V.ops ()).V.o_refresh_src inst src;
              autosave (fun () -> save_src inst src)
          | "key", Some "Escape" ->
              let src = Option.value value ~default:"" |> String.trim in
              (* cljs keeps the editor open after Esc commits; the next
                 tx broadcast re-renders the shell anyway. The eval
                 already ran on input — only re-run it if the text
                 changed since, and always persist the final source. *)
              if src <> (V.get inst).V.qsrc then
                (V.ops ()).V.o_refresh_src inst src;
              save_src inst src
          | _ -> ())
        ()
        ctx parent)
    ctx parent

(* toggle the raw-source editor for `inst` — called from the
   .ls-query-setting button in the query shell *)
let toggle_source_editor inst =
  V.update inst (fun s ->
      { s with V.query_editor_open = not s.V.query_editor_open })
