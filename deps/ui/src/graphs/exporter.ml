(* Export dialog body (.export) — links that run the worker export
   endpoints and trigger real browser downloads (Blob + a[download]).
   Mirrors frontend/handler/export + components/export.cljs. *)

open Promise_ext
open Lui_elements

let dom = Logseq_dom.dom
module T = I18n
let repo () =
  match (Runtime.model ()).Model.repo with
  | Some r -> r
  | None -> "logseq_db_Demo"

let short_repo () =
  let r = repo () in
  let p = "logseq_db_" in
  if String.length r > String.length p then
    String.sub r (String.length p) (String.length r - String.length p)
  else r

let secs () = int_of_float (Platform.date_now_ms () /. 1000.)

let export_binary () =
  let* w = Runtime.invoke1 "thread-api/export-db-binary" (Wire.String (repo ())) in
  match w with
  | Wire.Binary data ->
      Web_dom.download_binary
        ~filename:
          (Printf.sprintf "%s_%d.sqlite" (short_repo ()) (secs ()))
        ~mime:"application/octet-stream" data;
      Js.Promise.resolve ()
  | _ -> Js.Promise.resolve ()

let export_zip () =
  let* w = Runtime.invoke1 "thread-api/export-db-binary" (Wire.String (repo ())) in
  match w with
  | Wire.Binary data ->
      let z =
        Zip.build [ ("db.sqlite", data) ]
      in
      Web_dom.download_binary
        ~filename:
          (Printf.sprintf "%s_%d.zip" (short_repo ()) (secs ()))
        ~mime:"application/zip" z;
      Js.Promise.resolve ()
  | _ -> Js.Promise.resolve ()

let export_edn () =
  let* w =
    Runtime.invoke2 "thread-api/export-edn" (Wire.String (repo ()))
      (Wire.Map
         [ (Wire.kw "export-type", Wire.Keyword "graph")
         ; ( Wire.kw "graph-options"
           , Wire.Map [ (Wire.kw "include-timestamps?", Wire.Bool true) ] )
         ])
  in
  let text =
    try Edn.to_string w with _ -> Transit.to_string w
  in
  Web_dom.download_text
    ~filename:(Printf.sprintf "%s_%d.edn" (short_repo ()) (secs ()))
    ~mime:"application/edn" text;
  Js.Promise.resolve ()

let export_markdown () =
  let* w =
    Runtime.invoke2 "thread-api/export-get-all-page->content"
      (Wire.String (repo ())) (Wire.Map [])
  in
  match w with
  | Wire.Array pairs ->
      let files =
        List.filter_map
          (fun p ->
            match p with
            | Wire.Array [ Wire.String name; Wire.String content ]
            | Wire.List [ Wire.String name; Wire.String content ] ->
                Some (name ^ ".md", content)
            | Wire.Array [ Wire.Nil; Wire.String content ] ->
                Some ("page.md", content)
            | _ -> None)
          pairs
      in
      let z = Zip.build files in
      Web_dom.download_binary
        ~filename:
          (Printf.sprintf "%s_markdown_%d.zip" (short_repo ())
             (secs ()))
        ~mime:"application/zip" z;
      Js.Promise.resolve ()
  | _ -> Js.Promise.resolve ()

let export_transit () =
  let* w =
    Runtime.invoke1 "thread-api/export-get-debug-datoms"
      (Wire.String (repo ()))
  in
  let text =
    try Transit.to_string w with _ -> Edn.to_string w
  in
  Web_dom.download_text
    ~filename:
      (Printf.sprintf "%s-debug-datoms_%d.transit" (short_repo ())
         (secs ()))
    ~mime:"application/transit+json" text;
  Js.Promise.resolve ()

let link ~key label desc on_click =
  dom ~key
    (dom ~key:(key ^ "-a") ~tag:"a" ~style_class:"ls-strong"
       ~text:label ~events:"click"
       ~attrs:[ ("href", "#"); ("onclick", "return false") ]
       ~on_dom_event:(fun n _ -> if n = "click" then ignore (on_click ()))
       []
     :: (if desc = "" then []
         else
           [ dom ~key:(key ^ "-d") ~tag:"p"
               ~style_class:"ls-desc" ~text:desc [] ]))

(* cljs components/export.cljs auto-backup — File System Access folder
   picker, folder name persisted under :logseq.kv/graph-backup-folder,
   hourly writes of <graph-dir>/db.sqlite with the old file rotated into
   <graph-dir>/backups/. *)

let create_opts = Js.Json.object_ (Js.Dict.fromList [ ("create", Js.Json.boolean true) ])

let picker_opts =
  Js.Json.object_
    (Js.Dict.fromList [ ("mode", Js.Json.string "readwrite") ])

let backup_folder_key = "logseq.kv/graph-backup-folder"

let handle_ref : Web_dom.dir_handle option ref = ref None

let interval_ref : int option ref = ref None

let folder_sig : string option Signal.state option ref = ref None

let folder_st ctx =
  match !folder_sig with
  | Some s -> s
  | None ->
      let s = Signal.state ctx.Lui_ui.ui_scheduler None in
      folder_sig := Some s;
      s

let set_folder ctx v =
  Signal.set (folder_st ctx) v;
  Runtime.flush ()

let kv_transact tx =
  Runtime.invoke "thread-api/transact"
    [ Wire.String (repo ()); Wire.Array tx; Wire.Nil; Wire.Nil ]

let write_kv name =
  kv_transact
    [ Wire.Map
        [ (Wire.kw "db/ident", Wire.Keyword backup_folder_key)
        ; (Wire.kw "kv/value", Wire.String name) ] ]

let retract_kv () =
  kv_transact
    [ Wire.Array
        [ Wire.Keyword "db/retractEntity"; Wire.Keyword backup_folder_key ]
    ]

let backup_notify ok =
  match ok with
  | `unchanged -> Toast.success (T.t "export/no-updates-since-last-export")
  | `written -> Toast.success (T.t "export/backup-successful")
  | `err -> Toast.error (T.t "export/db-backup-error")

let backup_now () =
  match !handle_ref with
  | None -> Js.Promise.resolve `err
  | Some dir ->
      let repo_name = short_repo () in
      (let* graph_dir = Web_dom.get_dir dir repo_name create_opts in
       let* backups = Web_dom.get_dir graph_dir "backups" create_opts in
       let* fh = Web_dom.get_file graph_dir "db.sqlite" create_opts in
       let* f = Web_dom.fh_get_file fh in
       let* ftext = Web_dom.file_text f in
       let* w =
         Runtime.invoke1 "thread-api/export-db-binary"
           (Wire.String (repo ()))
       in
       match w with
       | Wire.Binary data ->
           let* decoded = Web_dom.decode_u8 (Web_dom.str_to_u8 data) in
           if ftext = decoded then Js.Promise.resolve `unchanged
           else (
             (if Web_dom.file_size f > 0. then
                Web_dom.fh_move fh backups
                  (Printf.sprintf "%.0f.db.sqlite" (Platform.date_now_ms ()))
              else Js.Promise.resolve ())
             |> Js.Promise.then_ (fun () ->
                    let* _ = Web_dom.truncate_old_versions backups in
                    let* fh2 = Web_dom.get_file graph_dir "db.sqlite" create_opts in
                    let* wr = Web_dom.fh_writable fh2 in
                    let* _ = Web_dom.w_write wr (Web_dom.str_to_u8 data) in
                    Web_dom.w_close wr)
             |> Js.Promise.then_ (fun () -> Js.Promise.resolve `written))
       | _ -> Js.Promise.resolve `err)
      |> Js.Promise.catch (fun _ ->
             (* access expired — repick like cljs verifyPermission *)
             Js.Promise.resolve `err)

let auto_backup_interval () =
  (match !interval_ref with
   | Some i -> Web_dom.clear_interval i
   | None -> ());
  interval_ref :=
    Some
      (Web_dom.set_interval
         (fun () ->
           ignore
             (backup_now () |> Js.Promise.then_ (fun r ->
                  backup_notify r;
                  Js.Promise.resolve ())))
         (60 * 60 * 1000))

let choose_folder ctx =
  (let* dir = Web_dom.show_dir_picker picker_opts in
   let name = Web_dom.h_name dir in
   handle_ref := Some dir;
   let* _ = write_kv name in
   set_folder ctx (Some name);
   auto_backup_interval ();
   Js.Promise.resolve ())
  |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
  |> ignore

let clear_folder ctx =
  handle_ref := None;
  (match !interval_ref with
   | Some i -> Web_dom.clear_interval i; interval_ref := None
   | None -> ());
  ignore
    (let* _ = retract_kv () in
     set_folder ctx None;
     Js.Promise.resolve ())

let load_folder ctx =
  try
    (let* w =
       Runtime.invoke "thread-api/get-key-value"
         [ Wire.String (repo ()); Wire.Keyword backup_folder_key ]
     in
     (match w with
      | Wire.String name ->
          Signal.set (folder_st ctx) (Some name);
          Runtime.flush ()
      | _ -> ());
     Js.Promise.resolve ())
    |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
    |> ignore
  with _ -> ()

let auto_backup ctx =
  dom ~key:"ab" ~style_class:"flex flex-col gap-4"
    [ dom ~key:"ab-h" ~style_class:"font-medium opacity-50"
        ~text:(T.t "export.backup/schedule") []
    ; (if not (Web_dom.picker_supported ()) then
         dom ~key:"ab-na"
           [ dom ~key:"ab-na-s" ~tag:"span"
               ~text:(T.t "export.backup/unsupported-desc") [] ]
       else
         Logseq_dom.dyn ~equal:( == )
           (fun folder ->
             match folder with
             | Some name ->
                 dom ~key:"ab-in" ~style_class:"flex flex-col gap-4"
                   [ dom ~key:"ab-row"
                       ~style_class:"flex flex-row items-center gap-1 text-sm"
                       [ dom ~key:"ab-l" ~style_class:"opacity-50"
                           ~text:(T.t "export.backup/folder") []
                       ; dom ~key:"ab-n" ~text:name []
                       ; dom ~key:"ab-x" ~tag:"button"
                           ~style_class:"ui__button as-ghost h-8 rounded !px-1 !py-1"
                           ~attrs:[ ("title", T.t "export.backup/cancel") ]
                           ~events:"click"
                           ~on_dom_event:(fun n _ ->
                             if n = "click" then clear_folder ctx)
                           [ Icons.raw ~cls:"ls-icon-sm" "x" ] ]
                   ; dom ~key:"ab-note"
                       ~style_class:"opacity-50 text-sm"
                       ~text:(T.t "export.backup/hourly-note") []
                   ; dom ~key:"ab-go" ~tag:"button"
                       ~style_class:"ui__button ls-btn-primary"
                       ~text:(T.t "export.backup/backup-now")
                       ~events:"click"
                       ~on_dom_event:(fun n _ ->
                         if n = "click" then (
                           ignore
                             (backup_now ()
                              |> Js.Promise.then_ (fun r ->
                                     backup_notify r;
                                     Js.Promise.resolve ()));
                           auto_backup_interval ()))
                       [] ]
             | None ->
                 dom ~key:"ab-in" ~style_class:"flex flex-col gap-4"
                   [ dom ~key:"ab-set" ~tag:"button"
                       ~style_class:"ui__button ls-btn-primary"
                       ~text:(T.t "export.backup/set-folder-first")
                       ~events:"click"
                       ~on_dom_event:(fun n _ ->
                         if n = "click" then choose_folder ctx)
                       []
                   ; dom ~key:"ab-note"
                       ~style_class:"opacity-50 text-sm"
                       ~text:(T.t "export.backup/hourly-note") [] ])
           (folder_st ctx).Signal.state_signal)
    ]

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  load_folder ctx;
  dom ~key:"export" ~style_class:"export"
    [ dom ~key:"ex-h" ~tag:"h1" ~style_class:"title ls-mb"
        ~text:T.export_title []
    ; dom ~key:"ex-list" ~style_class:"ls-ex-list"
        ([ link ~key:"ex-db" T.export_sqlite_db T.export_sqlite_desc
             export_binary
         ; link ~key:"ex-zip" T.export_sqlite_zip T.export_zip_desc
             export_zip
         ; link ~key:"ex-edn" T.export_edn_file T.export_edn_desc export_edn
         ; link ~key:"ex-md" T.export_markdown "" export_markdown
         ; link ~key:"ex-tr" T.export_debug_transit
             T.export_debug_transit_desc export_transit
         ]
        @
        (* cljs web only shows the auto-backup section (hr + schedule) on
           the web platform, which this build always is *)
        [ dom ~key:"ab-wrap"
            [ dom ~key:"ex-hr" ~tag:"hr" []
            ; auto_backup ctx
            ]
        ])
    ]
    ctx parent
