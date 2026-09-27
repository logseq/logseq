(* Read-side logseq.api methods — queries against db-worker. *)

open Sdk_util

let get_block a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some id ->
      get_entity id |> Js.Promise.then_ (fun w -> resolved_wire w)

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
      let ref_w =
        if is_uuid_string id then Wire.Uuid id
        else if String.contains id '/' then Wire.Keyword id
        else Wire.String id
      in
      Runtime.invoke2 "thread-api/get-case-page"
        (Wire.String (repo ()))
        ref_w
      |> Js.Promise.then_ (fun w -> resolved_wire w)

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

let get_property a _b _c _d =
  match arg_string a with
  | None -> resolved_nil
  | Some name ->
      Runtime.invoke2 "thread-api/get-case-page"
        (Wire.String (repo ()))
        (Wire.Keyword (property_ident name))
      |> Js.Promise.then_ (fun w -> resolved_wire w)

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
