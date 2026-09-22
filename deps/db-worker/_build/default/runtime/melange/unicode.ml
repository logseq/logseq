external normalize_ : string -> string -> string = "normalize" [@@mel.send]
let nfc s = normalize_ s "NFC"
