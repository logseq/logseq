(* Portable JSON tree shared by byte, native, and Melange targets.

   Both runtimes keep their host JSON values (melange `Js.Json.t`, the
   native `Js.Json` variant) at the platform boundary and convert to this
   representation for shared code (sdk_convert, icon data decode).
   Ordering matches JSON.stringify: object entries keep insertion order. *)

type t =
  | Null
  | Bool of bool
  | Number of float
  | String of string
  | Array of t array
  | Object of (string * t) list

let get k = function
  | Object kvs -> (try Some (snd (List.find (fun (k', _) -> k' = k) kvs)) with Not_found -> None)
  | _ -> None

let as_string = function String s -> Some s | _ -> None
let as_array = function Array a -> Some a | _ -> None
let as_object = function Object kvs -> Some kvs | _ -> None
let as_number = function Number n -> Some n | _ -> None
let as_bool = function Bool b -> Some b | _ -> None

let is_null = function Null -> true | _ -> false

let add_escaped b s =
  Buffer.add_char b '"';
  String.iter
    (fun c ->
       match c with
       | '"' -> Buffer.add_string b "\\\""
       | '\\' -> Buffer.add_string b "\\\\"
       | '\b' -> Buffer.add_string b "\\b"
       | '\012' -> Buffer.add_string b "\\f"
       | '\n' -> Buffer.add_string b "\\n"
       | '\r' -> Buffer.add_string b "\\r"
       | '\t' -> Buffer.add_string b "\\t"
       | c when Char.code c < 0x20 ->
           Printf.bprintf b "\\u%04x" (Char.code c)
       | c -> Buffer.add_char b c)
    s;
  Buffer.add_char b '"'

(* JS Number->String: non-finite -> null, integral values render
   without a decimal point, the rest use the shortest %g precision
   that still round-trips (JS shortest-repr semantics). *)
let add_number b f =
  match classify_float f with
  | Float.FP_nan | Float.FP_infinite -> Buffer.add_string b "null"
  | _ ->
      if Float.is_integer f && Float.abs f < 1e21 then
        Printf.bprintf b "%.0f" f
      else begin
        let s = ref "" in
        for prec = 1 to 17 do
          if !s = "" then begin
            let cand = Printf.sprintf "%.*g" prec f in
            if float_of_string_opt cand = Some f then s := cand
          end
        done;
        Buffer.add_string b (if !s = "" then Printf.sprintf "%.17g" f else !s)
      end

let rec add_json b = function
  | Null -> Buffer.add_string b "null"
  | Bool true -> Buffer.add_string b "true"
  | Bool false -> Buffer.add_string b "false"
  | Number n -> add_number b n
  | String s -> add_escaped b s
  | Array a ->
      Buffer.add_char b '[';
      Array.iteri
        (fun i v ->
          if i > 0 then Buffer.add_char b ',';
          add_json b v)
        a;
      Buffer.add_char b ']'
  | Object kvs ->
      Buffer.add_char b '{';
      List.iteri
        (fun i (k, v) ->
          if i > 0 then Buffer.add_char b ',';
          add_escaped b k;
          Buffer.add_char b ':';
          add_json b v)
        kvs;
      Buffer.add_char b '}'

let stringify j =
  let b = Buffer.create 256 in
  add_json b j;
  Buffer.contents b
