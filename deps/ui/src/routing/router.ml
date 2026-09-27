(* Hash routing — mirrors frontend.routes: "#/page/<name|uuid>",
   "#/block/<uuid>", "#/journals", "#/all-graphs", "#/library",
   default "#/". Listens hashchange + the "ls:navigate" CustomEvent
   (dispatched by sdk push_state). *)

let decode s = try Platform.decode_uri s with _ -> s

(* strip "#" and "?graph-id=..." — hash may carry query params *)
let route_path () =
  let h = Platform.location_hash () in
  let h =
    if String.length h > 0 && String.get h 0 = '#' then
      String.sub h 1 (String.length h - 1)
    else h
  in
  match String.index_opt h '?' with
  | Some i -> String.sub h 0 i
  | None -> h

let parse_hash () : Model.route =
  let p =
    match route_path () with
    | "" | "/" -> ""
    | p ->
        if String.length p > 0 && String.get p 0 = '/' then
          String.sub p 1 (String.length p - 1)
        else p
  in
  match p with
  | "" -> Model.Home
  | p -> (
      match String.index_opt p '/' with
      | Some i -> (
          let seg = String.sub p 0 i in
          let rest = String.sub p (i + 1) (String.length p - i - 1) in
          match seg with
          | "page" -> Model.Page (decode rest)
          | "block" -> Model.Block_zoom (decode rest)
          | "journals" -> Model.Journals
          | "library" -> Model.Library
          | "all-pages" -> Model.All_pages
          | "all-graphs" -> Model.All_graphs
          | _ -> Model.Not_found p)
      | None -> (
          match p with
          | "journals" -> Model.Journals
          | "library" -> Model.Library
          | "all-pages" -> Model.All_pages
          | "all-graphs" -> Model.All_graphs
          | "page" | "block" -> Model.Not_found p
          | _ -> Model.Not_found p))

let repo () = Option.value !Runtime.current_repo ~default:""

(* ref wire for get-page-blocks-tree / get-page-route-info:
   Uuid for uuid strings, String for page names *)
let page_ref s =
  if Sdk_util.is_uuid_string s then Wire.Uuid s else Wire.String s

let ref_of_page (p : Model.page) =
  match p.Model.page_uuid, p.Model.page_title with
  | Some u, _ -> page_ref u
  | None, t -> page_ref t

let fetch_blocks (p : Model.page) =
  Runtime.invoke3 "thread-api/get-page-blocks-tree"
    (Wire.String (repo ())) (ref_of_page p) Wire.Nil
  |> Js.Promise.then_ (fun blocks_w ->
         Js.Promise.resolve
           { p with Model.page_blocks = Decode.blocks_of_wire blocks_w })

let fetch_refs (p : Model.page) =
  match p.Model.page_db_id with
  | Some id ->
      ignore
        (Runtime.invoke2 "thread-api/get-block-refs"
           (Wire.String (repo ())) (Wire.Int id)
         |> Js.Promise.then_ (fun w ->
                Js.Promise.resolve
                  (Runtime.send
                     (Action.Refs_loaded (Decode.blocks_of_wire w)))))
  | None -> ()

let load_journals () =
  Runtime.invoke2 "thread-api/get-latest-journals" (Wire.String (repo ()))
    (Wire.Int 40)
  |> Js.Promise.then_ (fun w ->
         let pages =
           match w with
           | Wire.Array xs | Wire.List xs ->
               List.filter_map Decode.page_of_summary xs
           | _ -> []
         in
         let rec collect acc = function
           | [] -> Js.Promise.resolve (List.rev acc)
           | p :: rest ->
               fetch_blocks p
               |> Js.Promise.then_ (fun p' -> collect (p' :: acc) rest)
         in
         collect [] pages
         |> Js.Promise.then_ (fun js ->
                Js.Promise.resolve
                  (Runtime.send (Action.Journals_loaded js))))

(* get-page-route-info resolves name/uuid/lookup-ref -> summary *)
let load_page_ref ref_v ~missing =
  Runtime.invoke2 "thread-api/get-page-route-info"
    (Wire.String (repo ())) ref_v
  |> Js.Promise.then_ (fun info ->
         match Decode.page_of_summary info with
         | Some p ->
             fetch_blocks p
             |> Js.Promise.then_ (fun p' ->
                    Runtime.send (Action.Page_loaded p');
                    fetch_refs p';
                    Js.Promise.resolve ())
         | None ->
             Runtime.send (Action.Navigate_to (Model.Not_found missing));
             Js.Promise.resolve ())

(* Home: default-home config page when set & resolvable, else today's
   journal page (no config) or the journals list (config set but the
   page is missing). *)
let rec load_home () =
  let repo = repo () in
  Sdk_config.read_config repo
  |> Js.Promise.then_ (fun cfg ->
         let page_name =
           match Wire.get cfg "default-home" with
           | Some dh -> Wire.map_get_string dh "page"
           | None -> None
         in
         match page_name with
         | Some name ->
             Runtime.invoke2 "thread-api/page-exists?"
               (Wire.String repo) (Wire.String name)
             |> Js.Promise.then_ (function
                    | Wire.Bool true ->
                        Runtime.send (Action.Navigate_to (Model.Page name));
                        load_page_ref (Wire.String name) ~missing:name
                    | _ ->
                        Runtime.send (Action.Navigate_to Model.Journals);
                        load_journals ())
         | None -> load_today_journal repo)

and load_today_journal repo =
  let day = Dates.today_journal_day () in
  Runtime.invoke2 "thread-api/get-journal-page-by-day" (Wire.String repo)
    (Wire.Int day)
  |> Js.Promise.then_ (fun page_w ->
         match Decode.page_of_summary page_w with
         | Some p ->
             fetch_blocks p
             |> Js.Promise.then_ (fun p' ->
                    Runtime.send (Action.Page_loaded p');
                    Js.Promise.resolve ())
         | None -> Js.Promise.resolve ())

let load_block_zoom uuid =
  Runtime.invoke2 "thread-api/get-blocks" (Wire.String (repo ()))
    (Wire.Array
       [ Wire.Map
           [ (Wire.String "id", Wire.Uuid uuid)
           ; ( Wire.String "opts"
             , Wire.Map [ (Wire.Keyword "children?", Wire.Bool true) ] )
           ]
       ])
  |> Js.Promise.then_ (fun w ->
         Js.Promise.resolve
           (match Sdk_util.wire_elems w with
            | [ pair ] -> (
                let blk =
                  match Wire.get pair "block" with
                  | Some b -> b
                  | None -> (
                      match Sdk_util.wire_elems pair with
                      | [ _; b ] -> b
                      | _ -> Wire.Nil)
                in
                match blk with
                | Wire.Map _ ->
                    let b = Decode.block_of_wire blk in
                    Runtime.send
                      (Action.Page_loaded
                         { Model.page_title = b.Model.block_title
                         ; page_uuid = b.block_uuid
                         ; page_db_id = b.block_db_id
                         ; page_is_tag = false
                         ; page_blocks = b.block_children
                         })
                | _ ->
                    Runtime.send
                      (Action.Navigate_to (Model.Not_found uuid)))
            | _ -> Runtime.send (Action.Navigate_to (Model.Not_found uuid))))

let load_route (route : Model.route) =
  match route with
  | Model.Home -> ignore (load_home ())
  | Model.Page s -> ignore (load_page_ref (page_ref s) ~missing:s)
  | Model.Block_zoom uuid -> ignore (load_block_zoom uuid)
  | Model.Journals -> ignore (load_journals ())
  | Model.Library ->
      ignore (load_page_ref (Wire.String "Library") ~missing:"Library")
  | Model.All_pages | Model.All_graphs | Model.Not_found _ -> ()

let resolve () =
  let route = parse_hash () in
  Runtime.send (Action.Navigate_to route);
  load_route route;
  Runtime.flush ()

let init () =
  Platform.on_hash_change resolve;
  Platform.on_document_event "ls:navigate" (fun _ -> resolve ());
  Platform.add_document_listener "keydown" (fun ev ->
      if Platform.event_str ev "key" = "Escape" then (
        Runtime.send Action.Dismiss_all;
        Runtime.flush ()))
