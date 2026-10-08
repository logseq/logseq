let check label condition = if not condition then failwith label
let invalid f = try f (); false with Invalid_argument _ -> true

let run () =
  check "storage access before installation fails"
    (invalid (fun () -> ignore (Ui_services.storage_get "wide-mode")));
  let values = Hashtbl.create 4 and flushes = ref 0 in
  let services : Ui_services.t =
    { storage =
        { get = Hashtbl.find_opt values
        ; set = Hashtbl.replace values
        ; remove = Hashtbl.remove values
        }
    ; literal_text = Fun.id
    ; request_flush = (fun () -> incr flushes)
    ; assert_owner = (fun () -> ())
    }
  in
  Ui_services.install services;
  Ui_services.storage_set "wide-mode" "\"true\"";
  check "storage preserves the serialized preference"
    (Ui_services.storage_get "wide-mode" = Some "\"true\"");
  Ui_services.request_flush ();
  check "flush uses the installed application" (!flushes = 1);
  check "duplicate installation must fail" (invalid (fun () -> Ui_services.install services));
  check "failed installation preserves existing storage"
    (Ui_services.storage_get "wide-mode" = Some "\"true\"");
  Ui_services.storage_remove "wide-mode";
  check "removed preferences are absent" (Ui_services.storage_get "wide-mode" = None);
  print_endline "PASS service installation, preference persistence, and application flush"
