(* Install browser services before constructing the shared application. *)
external enqueue : (unit -> unit) -> unit = "queueMicrotask" [@@mel.scope "globalThis"]

external set_timeout : (unit -> unit) -> int -> unit = "setTimeout"
  [@@mel.scope "globalThis"]

let local_ymd d =
  ( int_of_float (Js.Date.getFullYear d)
  , int_of_float (Js.Date.getMonth d) + 1
  , int_of_float (Js.Date.getDate d) )

let install ~request_flush =
  if Platform.local_storage_obj = None then
    invalid_arg "Browser local storage is unavailable";
  Ui_services.install
    { storage =
        { get = Platform.local_storage_get
        ; set = Platform.local_storage_set
        ; remove = Platform.local_storage_remove
        }
    ; literal_text = Platform.utf8
    ; request_flush
    ; assert_owner = (fun () -> ())
    };
  Ui_task.install
    { enqueue
    ; assert_owner = (fun () -> ())
    };
  Properties_services.install
    { schedule = (fun f ms -> ignore (set_timeout f ms))
    ; report_error = Platform.console_error
    ; publishing = Platform.publishing
    ; random_uuid = Platform.random_uuid
    ; encode_uri_component = Platform.encode_uri_component
    ; now_ms = Js.Date.now
    ; local_ymd_now = (fun () -> local_ymd (Js.Date.make ()))
    ; local_ymd_of_ms = (fun ms -> local_ymd (Js.Date.fromFloat ms))
    ; local_ms_of_fields =
        (fun ~year ~month ~date ~hours ~minutes ~seconds ->
          Js.Date.valueOf
            (Js.Date.make ~year:(float year) ~month:(float month)
               ~date:(float date) ~hours:(float hours)
               ~minutes:(float minutes) ~seconds:(float seconds) ()))
    }
