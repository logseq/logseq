type node = {
  key : string;
  title : string;
  description : string option;
  content : string option;
  cover : string option;
  demos : string list;
  color : string option;
  icon : string option;
  children : node list;
}

type t = {root:node;entries:node list;popular_keys:string list;parents:(string * string) list}
type target = Internal of string | External of string

let invalid field = invalid_arg ("Invalid Handbook " ^ field)

let normalize_key value =
  String.split_on_char '/' (String.lowercase_ascii value)
  |> List.mapi (fun index part ->
    let part=String.map (function '-' | ' ' -> '_' | character -> character) part in
    if index>0 && String.length part>0 && part.[0]>='0' && part.[0]<='9'
    then "_" ^ part else part)
  |> String.concat "/"

let fields = function Wire.Map fields -> fields | _ -> invalid "node"
let field name fields = List.assoc_opt (Wire.Keyword name) fields
let optional_string name fields = match field name fields with
  | None | Some Wire.Nil -> None
  | Some (Wire.String value) -> Some value
  | _ -> invalid name
let required_string name fields = match optional_string name fields with
  | Some value when String.trim value<>"" -> value
  | _ -> invalid name
let sequence name = function
  | Wire.Array values | Wire.List values -> values
  | _ -> invalid name
let strings name values = List.map (function Wire.String value -> value | _ -> invalid name) values

let parse source =
  let root_fields=fields (Edn.parse source) in
  let rec parse_node ~root value =
    let fields=fields value in
    let children=match field "children" fields with
      | None -> []
      | Some value -> List.map (parse_node ~root:false) (sequence "children" value) in
    let demos=match field "demos" fields with
      | None | Some Wire.Nil -> []
      | Some (Wire.String value) -> [value]
      | Some value -> strings "demos" (sequence "demos" value) in
    {key=(if root then "__root" else normalize_key (required_string "key" fields));
     title=required_string "title" fields;
     description=optional_string "description" fields;content=optional_string "content" fields;
     cover=optional_string "cover" fields;demos;
     color=optional_string "color" fields;icon=optional_string "icon" fields;children} in
  let root=parse_node ~root:true (Wire.Map root_fields) in
  let seen=Hashtbl.create 32 and entries=ref [] and parents=ref [] in
  let rec collect parent node =
    if Hashtbl.mem seen node.key then invalid ("duplicate key " ^ node.key);
    Hashtbl.add seen node.key ();
    entries:=node::!entries;
    Option.iter (fun parent -> parents:=(node.key,parent)::!parents) parent;
    List.iter (collect (Some node.key)) node.children in
  collect None root;
  let popular_keys=match field "popular-topics" root_fields with
    | None -> []
    | Some value -> strings "popular-topics" (sequence "popular-topics" value)
      |> List.map normalize_key in
  {root;entries=List.rev !entries;popular_keys;parents=List.rev !parents}

let get catalog key = List.find_opt (fun node -> node.key=key) catalog.entries
let require catalog key = match get catalog key with
  | Some node -> node
  | None -> invalid ("topic link " ^ key)
let categories catalog = List.filter (fun node -> node.children<>[]) catalog.root.children
let popular catalog = List.map (require catalog) catalog.popular_keys

let collapse_path path =
  List.fold_left (fun parts -> function
    | "" | "." -> parts
    | ".." -> (match parts with [] -> invalid "path above root" | _::remaining -> remaining)
    | part -> part::parts) [] (String.split_on_char '/' path)
  |> List.rev |> String.concat "/"

let resolve catalog ~from href =
  let href=String.trim href in
  if String.contains href ':' || String.starts_with ~prefix:"//" href ||
     String.starts_with ~prefix:"#" href then External href
  else
    let _=require catalog from in
    let href=if String.ends_with ~suffix:".edn" href
      then String.sub href 0 (String.length href-4) else href in
    let path=
      if String.starts_with ~prefix:"@" href then String.sub href 1 (String.length href-1)
      else if String.starts_with ~prefix:"/" href then href
      else
        let parent=match List.assoc_opt from catalog.parents with
          | Some key when key<>"__root" -> key ^ "/" | _ -> "" in
        parent ^ href in
    let key=normalize_key (collapse_path path) in
    Internal (require catalog key).key

let encode_uri value =
  let value=Fuzzy.utf8_bytes value in
  let buffer=Buffer.create (String.length value) in
  let hex = function '0'..'9' | 'a'..'f' | 'A'..'F' -> true | _ -> false in
  let rec emit index =
    if index<String.length value then
      let character=value.[index] in
      if character='%' && index+2<String.length value && hex value.[index+1] && hex value.[index+2] then
        (Buffer.add_substring buffer value index 3;emit (index+3))
      else begin
        (match character with
         | 'a'..'z' | 'A'..'Z' | '0'..'9' -> Buffer.add_char buffer character
         | character when String.contains "-_.~:/?#[]@!$&'()*+,;=" character -> Buffer.add_char buffer character
         | character -> Buffer.add_string buffer (Printf.sprintf "%%%02X" (Char.code character)));
        emit (index+1)
      end in
  emit 0;Buffer.contents buffer

let asset_url value =
  let value=String.trim value in
  if String.starts_with ~prefix:"https://" value || String.starts_with ~prefix:"http://" value then encode_uri value
  else "https://handbooks.pages.dev/" ^ encode_uri (collapse_path value)

let search ?within catalog query =
  let query=String.trim query in
  if query="" then [] else
  let candidates=match within with
    | None -> List.filter (fun node -> node.key<>"__root") catalog.entries
    | Some key -> List.concat_map (fun node -> node::node.children) (require catalog key).children in
  Fuzzy.fuzzy_search ~extract:(fun node -> node.title) ~limit:30 candidates query

let reading_node catalog key =
  let rec first node=match node.children with [] -> node | child::_ -> first child in
  Option.map first (get catalog key)

let adjacent catalog key direction =
  match reading_node catalog key with
  | None -> None
  | Some node ->
      match List.assoc_opt node.key catalog.parents with
      | None -> None
      | Some parent ->
          let rec find previous = function
            | [] -> None
            | child::remaining ->
                if child.key=node.key then (match direction,remaining with
                  | `Prev,_ -> previous | `Next,next::_ -> Some next | `Next,[] -> None)
                else find (Some child) remaining in
          find None (require catalog parent).children
