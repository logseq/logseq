(* Read-side logseq.api methods — queries against db-worker. *)

open Sdk_util

(* cljs result->js beans datascript entities, materializing ref attributes
   as nested entity objects; worker wire values keep them as db/id refs, so
   expand the known ref attrs one level via pull *)
let ref_attrs =
  [ "block/alias"; "block/tags"; "block/parent"; "block/page"
  ; "block/refs"; "block/link"; "block/path-refs"; "block/namespace"
  ; "block/closed-value-property"; "logseq.property.class/extends" ]

let ref_ids_of w =
  let ids_of x = match x with Wire.Int id -> Some id | _ -> None in
  match w with
  | Wire.Int id -> [ id ]
  | Wire.Set xs | Wire.List xs | Wire.Array xs ->
      List.filter_map ids_of xs
  | _ -> []

let pull_entity id =
  Runtime.invoke3 "thread-api/pull" (Wire.String (repo ()))
    (Wire.String "[*]") (Wire.Int id)

let expand_refs (w : Wire.t) : Wire.t Js.Promise.t =
  match w with
  | Wire.Map kvs ->
      let ids =
        List.concat_map
          (fun (k, v) ->
            match k with
            | Wire.Keyword key when List.mem key ref_attrs -> ref_ids_of v
            | _ -> [])
          kvs
        |> List.sort_uniq compare
      in
      if ids = [] then Js.Promise.resolve w
      else
        Js.Promise.all
          (Array.of_list
             (List.map
                (fun id ->
                  pull_entity id
                  |> Js.Promise.then_ (fun e ->
                         Js.Promise.resolve (id, e)))
                ids))
        |> Js.Promise.then_ (fun pairs ->
               let tbl = Hashtbl.create 7 in
               Array.iter (fun (id, e) -> Hashtbl.replace tbl id e) pairs;
               let expand = function
                 | Wire.Int id ->
                     Option.value (Hashtbl.find_opt tbl id)
                       ~default:(Wire.Int id)
                 | Wire.Set xs | Wire.List xs | Wire.Array xs ->
                     Wire.Array
                       (List.map
                          (fun x ->
                            match x with
                            | Wire.Int id ->
                                Option.value (Hashtbl.find_opt tbl id)
                                  ~default:x
                            | _ -> x)
                          xs)
                 | other -> other
               in
               Js.Promise.resolve
                 (Wire.Map
                    (List.map
                       (fun ((k, v) as kv) ->
                          match k with
                          | Wire.Keyword key when List.mem key ref_attrs ->
                              (k, expand v)
                          | _ -> kv)
                       kvs)))
  | _ -> Js.Promise.resolve w

let get_block a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      get_entity id
      |> Js.Promise.then_ expand_refs
      |> Js.Promise.then_ (fun w -> resolved_wire w)

let get_page = get_block

let page_ref_of id =
  if is_uuid_string id then
    Wire.Array [ Wire.kw "block/uuid"; Wire.Uuid id ]
  else Wire.String id

let get_page_blocks_tree a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      Runtime.invoke3 "thread-api/get-page-blocks-tree"
        (Wire.String (repo ()))
        (page_ref_of id)
        (Wire.Map [])
      |> Js.Promise.then_ (fun w -> resolved_wire w)

let json_of_model_page (p : Model.page) =
  let o = Js.Dict.empty () in
  Js.Dict.set o "title" (Js.Json.string p.page_title);
  Js.Dict.set o "name" (Js.Json.string p.page_title);
  (match p.page_uuid with
   | Some u -> Js.Dict.set o "uuid" (Js.Json.string u)
   | None -> ());
  Sdk_convert.json_obj o

let get_current_page _a _b _c _d =
  match !Runtime.current_page with
  | Some p -> resolved (json_of_model_page p)
  | None -> resolved_nil

let get_tag a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      get_entity id |> Js.Promise.then_ (fun w -> resolved_wire w)

let get_tags_by_name a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      call "thread-api/get-tags-by-name"
        [ Wire.String (repo ()); Wire.String name ]

let get_tag_objects a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      get_entity id
      |> Js.Promise.then_ (fun tag ->
             match Wire.map_get_int tag "db/id" with
             | Some cid ->
                 call "thread-api/get-class-objects"
                   [ Wire.String (repo ()); Wire.Int cid ]
             | None -> resolved_nil)

let get_all_tags _a _b _c _d =
  call "thread-api/get-all-classes"
    [ Wire.String (repo ())
    ; Wire.Map [ (Wire.kw "except-root-class?", Wire.Bool true) ]
    ]

let get_all_properties _a _b _c _d =
  call "thread-api/get-all-properties" [ Wire.String (repo ()); Wire.Map [] ]

(* cljs get-property returns the entity + :type = :logseq.property/type *)
let get_property a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      get_entity_ident (property_ident name)
      |> Js.Promise.then_ (fun w ->
             match w with
             | Wire.Map kvs ->
                 let w' =
                   match Wire.get w "logseq.property/type" with
                   | Some t -> Wire.Map ((Wire.kw "type", t) :: kvs)
                   | None -> w
                 in
                 resolved_wire w'
             | _ -> resolved_nil)

(* properties of an entity: :block/properties map on the wire entity *)
let get_block_properties a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      get_entity id
      |> Js.Promise.then_ (fun block ->
             match Wire.get block "block/properties" with
             | Some (Wire.Map _ as props) -> resolved_wire props
             | _ -> resolved_nil)

let get_page_properties = get_block_properties

let get_block_property a b _c _d =
  match arg_string a, arg_string b with
  | Some id, Some key ->
      get_entity id
      |> Js.Promise.then_ (fun block ->
             let props =
               match Wire.get block "block/properties" with
               | Some p -> p
               | None -> Wire.Map []
             in
             let ident = property_ident key in
             let v =
               match
                 ( Wire.get props key
                 , Wire.get props ident
                 , Wire.get props ("block/" ^ key) )
               with
               | Some v, _, _ | _, Some v, _ | _, _, Some v -> Some v
               | _ -> None
             in
             (match v with
              | Some v -> resolved_wire v
              | None -> resolved_nil))
  | _ -> resolved_nil
