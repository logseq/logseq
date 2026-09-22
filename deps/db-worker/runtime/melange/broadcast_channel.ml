(* BroadcastChannel for shared-service election. Messages are
   structured-clone JS values; Wire.t crosses the boundary through
   Js.Json (matching cljs bean/->js for the JSON-able payloads the
   protocol uses). *)

type t = Js.Json.t

external bc : string -> t = "BroadcastChannel" [@@mel.new]
external close_ : t -> unit = "close" [@@mel.send]
external post : t -> Js.Json.t -> unit = "postMessage" [@@mel.send]
external add_listener : t -> string -> (Js.Json.t -> unit [@u]) -> unit
  = "addEventListener" [@@mel.send]
external remove_listener : t -> string -> (Js.Json.t -> unit [@u]) -> unit
  = "removeEventListener" [@@mel.send]
external event_data : Js.Json.t -> Js.Json.t = "data" [@@mel.get]

let create name = bc name
let close = close_

(* Wire.t <-> Js.Json.t, same mapping as runtime/melange/json.ml —
   keep the two in sync (spec hides the module's helpers). *)
let name_part s =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s

let key_name = function
  | Wire.String s -> s
  | Wire.Keyword s -> name_part s
  | _ -> invalid_arg "BroadcastChannel: map key must be string or keyword"

let rec json_of_wire = function
  | Wire.Nil -> Js.Json.null
  | Wire.Bool b -> Js.Json.boolean b
  | Wire.Int i -> Js.Json.number (Float.of_int i)
  | Wire.Int64 i -> Js.Json.number (Int64.to_float i)
  | Wire.Float f -> Js.Json.number f
  | Wire.String s -> Js.Json.string s
  | Wire.Keyword s -> Js.Json.string (name_part s)
  | Wire.Uuid s | Wire.Uri s -> Js.Json.string s
  | Wire.Date_ms ms -> Js.Json.number (Int64.to_float ms)
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      Js.Json.array (Array.map json_of_wire (Array.of_list xs))
  | Wire.Map kvs ->
      Js.Json.object_
        (Js.Dict.fromList
           (List.map (fun (k, v) -> (key_name k, json_of_wire v)) kvs))
  | Wire.Binary _ -> invalid_arg "BroadcastChannel: Binary values unsupported"
  | Wire.Symbol s -> Js.Json.string s
  | Wire.Big_decimal s | Wire.Big_int s -> Js.Json.string s
  | Wire.Tagged (tag, _) ->
      invalid_arg ("BroadcastChannel: tagged value unsupported: " ^ tag)

let rec wire_of_json json : Wire.t =
  match Js.Json.classify json with
  | Js.Json.JSONFalse -> Wire.Bool false
  | Js.Json.JSONTrue -> Wire.Bool true
  | Js.Json.JSONNull -> Wire.Nil
  | Js.Json.JSONString s -> Wire.String s
  | Js.Json.JSONNumber f ->
      if Float.is_integer f then Wire.Int64 (Int64.of_float f) else Wire.Float f
  | Js.Json.JSONObject o ->
      Wire.Map
        (Array.to_list
           (Array.map
              (fun (k, v) -> (Wire.String k, wire_of_json v))
              (Js.Dict.entries o)))
  | Js.Json.JSONArray a -> Wire.Array (Array.to_list (Array.map wire_of_json a))

let post_message t w = post t (json_of_wire w)

type listener = Js.Json.t -> unit [@u]

let add_message_listener t f =
  let wrapper = fun [@u] event -> f (wire_of_json (event_data event)) in
  add_listener t "message" wrapper;
  wrapper

let remove_message_listener t l = remove_listener t "message" l
