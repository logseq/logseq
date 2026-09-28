(* JS <-> Wire converters for the window.logseq api surface.
   Result side mirrors logseq.sdk.utils/normalize-keyword-for-json:
   keyword -> camelCase name when ns in {block,db,file} or unqualified,
   otherwise ":ns/name"; uuid -> string; sets -> arrays. *)

external json_obj : 'a Js.Dict.t -> Js.Json.t = "%identity"
external json_arr : Js.Json.t array -> Js.Json.t = "%identity"

let is_ns_kept ns = not (ns = "block" || ns = "db" || ns = "file")

let split_ns s =
  match String.index_opt s '/' with
  | Some i ->
      (Some (String.sub s 0 i)
      , String.sub s (i + 1) (String.length s - i - 1))
  | None -> (None, s)

(* kebab-case/snake_case -> camelCase *)
let camel_case s =
  let b = Buffer.create (String.length s) in
  let up = ref false in
  String.iter
    (fun c ->
      if c = '-' || c = '_' then up := true
      else if !up then (
        Buffer.add_char b (Char.uppercase_ascii c);
        up := false)
      else Buffer.add_char b c)
    s;
  Buffer.contents b

(* keyword -> json name (map keys and keyword values) *)
let json_name_of_keyword s =
  match split_ns s with
  | Some ns, _name when is_ns_kept ns -> ":" ^ s
  | _, name -> camel_case name

(* hidden keys removed from api results (remove-hidden-properties) *)
let hidden_key = function
  | Wire.Keyword "block/tx-id" -> true
  | Wire.Keyword s -> (
      match split_ns s with
      | Some "block.temp", _ -> true
      | _ -> false)
  | _ -> false

let rec map_key_json = function
  | Wire.Keyword s -> json_name_of_keyword s
  | Wire.String s -> s
  | Wire.Symbol s -> s
  | Wire.Uuid s -> s
  | other -> Js.Json.stringify (json_of_wire other)

(* entity map with uuid+title also exposes content/fullTitle *)
and with_content_alias (w : Wire.t) (obj : Js.Json.t Js.Dict.t) =
  match Wire.get w "block/uuid", Wire.get w "block/title" with
  | Some _, Some (Wire.String t) ->
      Js.Dict.set obj "content" (Js.Json.string t);
      if Js.Dict.get obj "fullTitle" = None then
        Js.Dict.set obj "fullTitle" (Js.Json.string t)
  | _ -> ()

and json_of_wire (w : Wire.t) : Js.Json.t =
  match w with
  | Wire.Nil -> Js.Json.null
  | Wire.Bool b -> Js.Json.boolean b
  | Wire.Int n -> Js.Json.number (float_of_int n)
  | Wire.Int64 n -> Js.Json.number (Int64.to_float n)
  | Wire.Float f -> Js.Json.number f
  | Wire.String s -> Js.Json.string s
  | Wire.Binary s -> Js.Json.string s
  | Wire.Date_ms n -> Js.Json.number (Int64.to_float n)
  | Wire.Uuid s | Wire.Uri s -> Js.Json.string s
  | Wire.Big_decimal s | Wire.Big_int s -> (
      match float_of_string_opt s with
      | Some f -> Js.Json.number f
      | None -> Js.Json.string s)
  | Wire.Keyword s -> Js.Json.string (json_name_of_keyword s)
  | Wire.Symbol s -> Js.Json.string s
  | Wire.Tagged (_, v) -> json_of_wire v
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      json_arr (Array.of_list (List.map json_of_wire xs))
  | Wire.Map kvs ->
      let obj = Js.Dict.empty () in
      List.iter
        (fun (k, v) ->
          if not (hidden_key k) then
            Js.Dict.set obj (map_key_json k) (json_of_wire v))
        kvs;
      with_content_alias w obj;
      json_obj obj

let rec wire_of_json (j : Js.Json.t) : Wire.t =
  (* sdk handlers receive fixed arity — absent args arrive as undefined,
     which classify mis-tags as JSONObject *)
  if Js.typeof j = "undefined" then Wire.Nil
  else
    match Js.Json.classify j with
    | Js.Json.JSONFalse -> Wire.Bool false
    | Js.Json.JSONTrue -> Wire.Bool true
    | Js.Json.JSONNull -> Wire.Nil
    | Js.Json.JSONString s -> Wire.String s
    | Js.Json.JSONNumber f ->
        if Float.is_integer f then Wire.Int (int_of_float f)
        else Wire.Float f
    | Js.Json.JSONArray xs ->
        Wire.Array (List.map wire_of_json (Array.to_list xs))
    | Js.Json.JSONObject obj ->
        Wire.Map
          (List.map
             (fun k ->
               (Wire.String k, wire_of_json (Js.Dict.unsafeGet obj k)))
             (Array.to_list (Js.Dict.keys obj)))
