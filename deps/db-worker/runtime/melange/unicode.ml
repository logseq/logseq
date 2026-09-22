external normalize_ : string -> string -> string = "normalize" [@@mel.send]

let nfc s = normalize_ s "NFC"
let nfkc s = normalize_ s "NFKC"
let nfd s = normalize_ s "NFD"
let lowercase s = Js.String.toLowerCase s
