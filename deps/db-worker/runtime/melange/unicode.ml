external normalize_ : string -> string -> string = "normalize" [@@mel.send]

let nfc s = normalize_ s "NFC"
let nfkc s = normalize_ s "NFKC"
let nfd s = normalize_ s "NFD"
let lowercase s = Js.String.toLowerCase s
let uppercase s = Js.String.toUpperCase s
let trim s = Js.String.trim s
external trim_start : string -> string = "trimStart" [@@mel.send]
external trim_end : string -> string = "trimEnd" [@@mel.send]
let triml s = trim_start s
let trimr s = trim_end s

(* cljs clojure.string/capitalize — first char toUpperCase, rest
   toLowerCase. *)
let capitalize s =
  let n = Js.String.length s in
  if n = 0 then s
  else
    Js.String.toUpperCase (Js.String.substring ~start:0 ~end_:1 s)
    ^ Js.String.toLowerCase (Js.String.substring ~start:1 ~end_:n s)

(* JS String.length — UTF-16 code units natively. *)
let js_length s = Js.String.length s

(* JS subs on UTF-16 units. *)
let js_sub s start end_ = Js.String.substring ~start ~end_ s
