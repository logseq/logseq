(* Views slice drive harness (Melange side): mounts the real
   Views_view.view against a scripted Worker_client and runs
   Shared_scenarios_views — the same scenarios gpui/drive_test.ml runs
   natively. The worker answers the views resource chain
   ([:views] -> view ents -> [:view-data] -> rows -> get-blocks ->
   get-all-properties) from mutable scenario state, so tests can change
   data, reorder rows, and hold/release responses mid-flight. *)

open Test_check
module M = Drive.Model
module S = Drive.Session
module W = Wire

(* ---------- scripted worker state ---------- *)

let requests : string list ref = ref []
let resources_log : string list ref = ref []
let views_list : (string * string * string) list ref = ref []
let view_flags : (string, string list) Hashtbl.t = Hashtbl.create 8
let view_rows : (string, (string * string) list) Hashtbl.t =
  Hashtbl.create 8
let titles : (string, string) Hashtbl.t = Hashtbl.create 64
let query_src : (string, string) Hashtbl.t = Hashtbl.create 8
let query_rows : (string, string list) Hashtbl.t = Hashtbl.create 8
let query_err : (string, string) Hashtbl.t = Hashtbl.create 8
let held : string list ref = ref []
let parked : (string * W.t * (W.t -> unit)) list ref = ref []

let kw s = W.Keyword s

let flag_view uuid name =
  match Hashtbl.find_opt view_flags uuid with
  | Some fs -> List.mem name fs
  | None -> false

(* the query block's value child — logseq.property/query holds a ref to
   the child whose block/title is the query source *)
let query_block_ent uuid : W.t =
  let vbu = uuid ^ "-v" in
  W.Map
    [ kw "block/uuid", W.Uuid uuid
    ; kw "db/id", W.Int 90
    ; kw "block/title", W.String ""
    ; kw "logseq.property/query", W.Map [ kw "block/uuid", W.Uuid vbu ]
    ; ( kw "block/children"
      , W.Array
          [ W.Map
              [ kw "block/uuid", W.Uuid vbu
              ; kw "block/title"
              , W.String
                  (Option.value (Hashtbl.find_opt query_src uuid)
                     ~default:"") ] ] ) ]

let view_ent uuid title ty : W.t =
  let extra =
    (if flag_view uuid "sort" then
       [ ( kw "logseq.property.table/sorting"
         , W.Array
             [ W.Map [ kw "id", kw "block/title"; kw "asc?", W.Bool true ] ] )
       ]
     else [])
    @
    if flag_view uuid "filters" then
      [ ( kw "logseq.property.table/filters"
        , W.Map
            [ kw "or?", W.Bool false
            ; ( kw "filters"
              , W.Array
                  [ W.Array [ kw "user.property/p1"; kw "is"; W.String "x" ]
                  ] ) ] ) ]
    else []
  in
  W.Map
    ([ kw "block/uuid", W.Uuid uuid
     ; kw "db/id", W.Int 42
     ; kw "block/title", W.String title
     ; kw "logseq.property.view/type", W.Map [ kw "db/ident", kw ty ] ]
    @ extra)

let ent_for uuid : W.t =
  match List.find_opt (fun (u, _, _) -> u = uuid) !views_list with
  | Some (u, t, ty) -> view_ent u t ty
  | None ->
      if Hashtbl.mem query_src uuid || Hashtbl.mem query_err uuid then
        query_block_ent uuid
      else
        W.Map
          [ kw "block/uuid", W.Uuid uuid
          ; kw "db/id", W.Int 7
          ; kw "block/title"
          , W.String
              (Option.value (Hashtbl.find_opt titles uuid)
                 ~default:("Row " ^ uuid)) ]

let blocks_response = function
  | Some (W.Array reqs) ->
      W.List
        (List.map
           (fun req ->
             let u =
               match W.get req "id" with
               | Some (W.Uuid u) | Some (W.String u) -> u
               | _ -> "?"
             in
             W.Map
               [ kw "block", ent_for u; kw "children", W.Array [] ])
           reqs)
  | _ -> W.List []

let view_data_value uuid : W.t =
  let rows =
    match Hashtbl.find_opt view_rows uuid with
    | Some rs -> List.map fst rs
    | None -> []
  in
  W.Map
    [ kw "count", W.Int (List.length rows)
    ; kw "rows", W.Array (List.map (fun u -> W.Uuid u) rows)
    ; kw "properties", W.List [ kw "block/title" ] ]

let query_value spec : W.t =
  (* spec carries :current-block-uuid — find the owning scripted query *)
  let qb =
    match W.get spec "current-block-uuid" with
    | Some (W.Uuid u) -> u
    | _ -> ""
  in
  match Hashtbl.find_opt query_err qb with
  | Some msg ->
      W.Map
        [ kw "error", W.Map [ kw "message", W.String msg ] ]
  | None ->
      W.Map
        [ ( kw "rows"
          , W.Array
              (List.map (fun u -> W.Uuid u)
                 (Option.value (Hashtbl.find_opt query_rows qb)
                    ~default:[]))) ]

let slot_value (rk : W.t) : W.t option =
  match rk with
  | W.Array (W.Keyword "views" :: _ :: _) ->
      Some
        (W.Array (List.map (fun (u, _, _) -> W.Uuid u) !views_list))
  | W.Array (W.Keyword "view-data" :: W.Uuid vu :: _) ->
      Some (view_data_value vu)
  | W.Array (W.Keyword "query" :: spec :: _) -> Some (query_value spec)
  | _ -> None

let rec wire_str (w : W.t) : string =
  match w with
  | W.Keyword s -> ":" ^ s
  | W.String s -> s
  | W.Uuid u -> u
  | W.Int i -> string_of_int i
  | W.Array xs | W.List xs | W.Set xs ->
      "[" ^ String.concat " " (List.map wire_str xs) ^ "]"
  | W.Map kvs ->
      "{"
      ^ String.concat " " (List.map (fun (k, v) -> wire_str k ^ " " ^ wire_str v) kvs)
      ^ "}"
  | _ -> "?"

let snapshots_response req : W.t =
  match W.get req "resources" with
  | Some (W.Array rks) ->
      resources_log :=
        !resources_log @ [ String.concat " " (List.map wire_str rks) ];
      W.Map
        [ ( kw "slots"
          , W.Map
              (List.filter_map
                 (fun rk ->
                   Option.map
                     (fun v ->
                       ( W.Array [ kw "resource"; rk ]
                       , W.Map [ kw "value", v ] ))
                     (slot_value rk))
                 rks) ) ]
  | _ -> W.Map []

let scripted_response (name : string) (args : W.t list) : W.t =
  match name with
  | "thread-api/get-render-snapshots" ->
      snapshots_response
        (match List.nth_opt args 1 with Some r -> r | None -> W.Map [])
  | "thread-api/get-blocks" -> blocks_response (List.nth_opt args 1)
  | "thread-api/get-all-properties" -> W.List []
  | "thread-api/pull" | "thread-api/pull-many" -> W.List []
  | _ -> W.Map []

let invoke name args : W.t Js.Promise.t =
  requests := !requests @ [ name ];
  let resp = scripted_response name args in
  if List.mem name !held then
    Js.Promise.make (fun ~resolve ~reject:_ ->
        (* snapshot the response now: a parked request answers with the
           data its context asked for, arriving late *)
        parked := !parked @ [ (name, resp, fun w -> resolve w [@u]) ])
  else Js.Promise.resolve resp

let install_worker () =
  let dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) in
  Runtime.worker :=
    Some
      { Worker_client.invoke_fn = (fun n a -> invoke n a)
      ; on_message = (fun _ _ -> ())
      ; dead
      }

(* ---------- mount ---------- *)

let registry () =
  let registry = Lui_extension.registry () in
  Logseq_emoji.register registry;
  Logseq_katex.register registry;
  Logseq_el.register registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  Logseq_virt.register registry;
  registry

let mount_view ~kind () =
  install_worker ();
  let vs =
    S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
      ~initial:Model.initial ~reducer:Update.update
      ~view:(fun _ctx _ms _send ->
        Logseq_el.el
          [ Views_view.view ~kind ~owner:(W.String "$$$views") ])
      ()
  in
  let flush0 = !Runtime.app_flush in
  Runtime.app_flush :=
    (fun () -> flush0 (); ignore (Lui_app.flush vs.S.app));
  vs

(* ---------- host ---------- *)

let host () : (Model.t, Action.t) Shared_scenarios_views.host =
  { Shared_scenarios_views.check = Test_check.check
  ; mount_table =
      (fun () -> mount_view ~kind:Views_state.KAllPages ())
  ; mount_query =
      (fun ~uuid ->
        mount_view ~kind:(Views_state.KQuery { block_uuid = uuid }) ())
  ; after =
      (fun n f ->
        let rec go n = if n <= 0 then f () else after_tick (n - 1)
        and after_tick n =
          ignore
            Js.Promise.(
              resolve ()
              |> then_ (fun () ->
                     go n; Js.Promise.resolve ()))
        in
        go n)
  ; requests = (fun () -> !requests)
  ; resources = (fun () -> !resources_log)
  ; clear_requests = (fun () -> requests := [])
  ; set_views = (fun vs -> views_list := vs)
  ; set_view_flags =
      (fun uuid flags -> Hashtbl.replace view_flags uuid flags)
  ; set_rows =
      (fun ~view rows ->
        Hashtbl.replace view_rows view rows;
        List.iter (fun (u, t) -> Hashtbl.replace titles u t) rows)
  ; set_query =
      (fun ~uuid ~src ~rows ->
        Hashtbl.replace query_src uuid src;
        Hashtbl.replace query_rows uuid rows)
  ; set_query_error =
      (fun ~uuid ~msg -> Hashtbl.replace query_err uuid msg)
  ; hold = (fun name -> held := name :: !held)
  ; release =
      (fun name ->
        match
          List.find_opt (fun (n, _, _) -> n = name) !parked
        with
        | Some ((_, resp, resolve) as p) ->
            parked := List.filter (fun q -> q != p) !parked;
            (if not (List.exists (fun (n, _, _) -> n = name) !parked)
             then held := List.filter (fun n -> n <> name) !held);
            resolve resp
        | None -> check ("release: parked " ^ name) false)
  ; pending = (fun () -> List.map (fun (n, _, _) -> n) !parked)
  }

let run ~finish = Shared_scenarios_views.run (host ()) ~finish
