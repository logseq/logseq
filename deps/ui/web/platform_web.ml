type storage
let storage : unit -> storage = [%mel.raw "function () { return globalThis.localStorage; }"]
external storage_get : storage -> string -> string option = "getItem"
  [@@mel.send] [@@mel.return nullable]
external storage_set : storage -> string -> string -> unit = "setItem" [@@mel.send]
external storage_remove : storage -> string -> unit = "removeItem" [@@mel.send]
external enqueue : (unit -> unit) -> unit = "queueMicrotask" [@@mel.scope "globalThis"]

let literal_text : string -> string =
  [%mel.raw
    "function (s) { var u8 = new Uint8Array(s.length); for (var i = 0; i < \
     s.length; i++) u8[i] = s.charCodeAt(i) & 0xff; return new \
     TextDecoder().decode(u8) }"]

let install ~request_flush =
  if Js.Undefined.testAny (storage ()) then invalid_arg "Browser local storage is unavailable";
  Ui_services.install
    { storage =
        { get = (fun key -> storage_get (storage ()) key)
        ; set = (fun key value -> storage_set (storage ()) key value)
        ; remove = (fun key -> storage_remove (storage ()) key)
        }
    ; literal_text
    ; request_flush
    ; assert_owner = (fun () -> ())
    };
  Ui_task.install { enqueue; assert_owner = (fun () -> ()) }
