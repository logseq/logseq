(* File route — cljs components/file.cljs: #/file/<path> renders the
   graph file in a code editor (the settings "Edit config.edn" /
   "Edit custom.css" links land here).

   Content loads via thread-api/get-file-content; edits write back
   through the raw file/path transact (debounced like cljs set-file-content). *)

open Lui_elements
open Promise_ext

(* cljs set-file-content / config write shape: the file entity needs
   block/uuid + timestamps to pass transact validation *)
let save repo path content =
  let now_ms = Int64.of_float (Js.Date.now ()) in
  ignore
    (Runtime.invoke "thread-api/transact"
       [ Wire.String repo
       ; Wire.Array
           [ Wire.Map
               [ (Wire.kw "block/uuid",
                  Wire.Uuid (Ui_services.env_random_uuid ()))
               ; (Wire.kw "file/path", Wire.String path)
               ; (Wire.kw "file/content", Wire.String content)
               ; (Wire.kw "file/created-at", Wire.Date_ms now_ms)
               ; (Wire.kw "file/last-modified-at", Wire.Date_ms now_ms) ] ]
       ; Wire.Nil
       ; Wire.Nil ])

let view ~path (ms : Model.t Signal.signal) : t =
  let content_st = Signal.state ms.Signal.owner "" in
  let loaded_st = Signal.state ms.Signal.owner false in
  let debounced = Ui_services.timers_debounce 500 in
  ignore
    (let* w =
       Runtime.invoke2 "thread-api/get-file-content"
         (Wire.String (Runtime.repo ()))
         (Wire.String path)
     in
     (match w with
      | Wire.String s -> Runtime.signal_set content_st s
      | _ -> ());
     Runtime.signal_set loaded_st true;
     Js.Promise.resolve ());
  let editor () =
    (* textarea ~text is an initial-value prop: mount once the async
       load lands so the fetched content seeds it. The reactive gate
       depends only on loaded_st — per-keystroke content_st writes
       don't remount (caret preserved) *)
    reactive
      (fun (loaded : bool) ->
        textarea ~key:"fe" ~style_class:"code-editor" ~grow:1.
          ~text:
            (if loaded then Signal.get (Signal.value content_st) else "")
          ~on_input:(fun ev ->
            match ev with
            | Lui_protocol.TextChanged (_, s) ->
                Signal.set content_st s;
                debounced (fun () -> save (Runtime.repo ()) path s)
            | _ -> ())
          [])
      (Signal.value loaded_st)
  in
  column ~key:"file" ~style_class:"ls-file-page page" ~padding:16 ~grow:1.
    [ heading ~key:"ft" ~level:1 ~value:path ~style_class:"page-title" []
    ; editor ()
    ]
