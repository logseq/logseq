(* Install browser services before constructing the shared application. *)
external enqueue : (unit -> unit) -> unit = "queueMicrotask" [@@mel.scope "globalThis"]

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
    }
