(* Web boundary between the portable Json.t tree and melange Js.Json.t —
   plus the opaque JS-object builders (json_obj/json_arr) that produce
   real JS values at the api surface. *)

external json_obj : 'a Js.Dict.t -> Js.Json.t = "%identity"

let json_arr (a : Js.Json.t array) : Js.Json.t = Js.Json.array a

let rec to_js (j : Json.t) : Js.Json.t =
  match j with
  | Json.Null -> Js.Json.null
  | Json.Bool b -> Js.Json.boolean b
  | Json.Number n -> Js.Json.number n
  | Json.String s -> Js.Json.string s
  | Json.Array a -> Js.Json.array (Array.map to_js a)
  | Json.Object kvs ->
      let d = Js.Dict.empty () in
      List.iter (fun (k, v) -> Js.Dict.set d k (to_js v)) kvs;
      Js.Json.object_ d

let rec of_js (v : Js.Json.t) : Json.t =
  (* absent api args arrive as `undefined`, which classify mis-tags as
     a JSONObject — fold it to Null like the original wire_of_json did *)
  if Js.typeof v = "undefined" then Json.Null
  else
    match Js.Json.classify v with
    | Js.Json.JSONFalse -> Json.Bool false
    | Js.Json.JSONTrue -> Json.Bool true
    | Js.Json.JSONNull -> Json.Null
    | Js.Json.JSONString s -> Json.String s
    | Js.Json.JSONNumber f -> Json.Number f
    | Js.Json.JSONArray a -> Json.Array (Array.map of_js a)
    | Js.Json.JSONObject obj ->
        Json.Object
          (Array.to_list (Js.Dict.keys obj)
           |> List.map (fun k -> (k, of_js (Js.Dict.unsafeGet obj k))))
