(* Export dialog body (.export) — links that run the worker export
   endpoints and trigger real browser downloads (Blob + a[download]).
   Mirrors frontend/handler/export + components/export.cljs. *)

open Promise_ext
open Lui_elements

let dom = Logseq_dom.dom
module T = I18n
module B = Browser_ui

let repo () =
  match !Runtime.current_repo with
  | Some r -> r
  | None -> "logseq_db_Demo"

let short_repo () =
  let r = repo () in
  let p = "logseq_db_" in
  if String.length r > String.length p then
    String.sub r (String.length p) (String.length r - String.length p)
  else r

let secs () = int_of_float (B.now_ms () /. 1000.)

let export_binary () =
  let* w = Runtime.invoke1 "thread-api/export-db-binary" (Wire.String (repo ())) in
  match w with
  | Wire.Binary data ->
      B.download_binary
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
      B.download_binary
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
  B.download_text
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
      B.download_binary
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
  B.download_text
    ~filename:
      (Printf.sprintf "%s-debug-datoms_%d.transit" (short_repo ())
         (secs ()))
    ~mime:"application/transit+json" text;
  Js.Promise.resolve ()

let link ~key label desc on_click =
  dom ~key
    [ dom ~key:(key ^ "-a") ~tag:"a" ~style_class:"ls-strong"
        ~text:label ~events:"click"
        ~attrs:[ ("href", "#"); ("onclick", "return false") ]
        ~on_dom_event:(fun n _ -> if n = "click" then ignore (on_click ()))
        []
    ; dom ~key:(key ^ "-d") ~tag:"p"
        ~style_class:"ls-desc" ~text:desc []
    ]

let body (_ms : Model.t Signal.signal) : t =
  dom ~key:"export" ~style_class:"export"
    [ dom ~key:"ex-h" ~tag:"h1" ~style_class:"title ls-mb"
        ~text:T.export_title []
    ; dom ~key:"ex-list" ~style_class:"ls-ex-list"
        [ link ~key:"ex-db" T.export_sqlite_db T.export_sqlite_desc
            export_binary
        ; link ~key:"ex-zip" T.export_sqlite_zip T.export_zip_desc
            export_zip
        ; link ~key:"ex-edn" T.export_edn_file T.export_edn_desc export_edn
        ; link ~key:"ex-md" T.export_markdown "" export_markdown
        ; link ~key:"ex-tr" T.export_debug_transit
            T.export_debug_transit_desc export_transit
        ]
    ]
