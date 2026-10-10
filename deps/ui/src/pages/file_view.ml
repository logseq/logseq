(* File route — cljs components/file.cljs: #/file/<path> renders the
   graph file in a code editor (the settings "Edit config.edn" /
   "Edit custom.css" links land here).

   Content loads via thread-api/get-file-content; edits write back
   through the raw file/path transact (debounced like cljs
   set-file-content). The editor surface is the same vendored
   CodeMirror 5 the code blocks use (mount_file — no block wiring). *)

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

(* util/get-file-ext: text after the last dot *)
let file_ext path =
  match String.rindex_opt path '.' with
  | Some i -> String.sub path (i + 1) (String.length path - i - 1)
  | None -> ""

let view ~path (ms : Model.t Signal.signal) : t =
  let content_st = Signal.state ms.Signal.owner "" in
  let loaded_st = Signal.state ms.Signal.owner false in
  let debounced = Ui_services.timers_debounce 500 in
  let on_edit s = debounced (fun () -> save (Runtime.repo ()) path s) in
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
     (* flush is deferred (scheduled, not synchronous): the textarea
        mounts on the next tick, so query it after that tick and hand
        it to CodeMirror once the lazy core chunk lands *)
     Ui_services.timers_later ~ms:0 (fun () ->
         Code_mirror.attach_file_editor ~on_change:on_edit ());
     Js.Promise.resolve ());
  let editor () =
    let ext = file_ext path in
    (* textarea ~text is an initial-value prop: mount once the async
       load lands so the fetched content seeds it (and fromTextArea
       then reads it into the CM doc) *)
    reactive
      (fun (loaded : bool) ->
        if loaded then
          (* cljs extensions__code > code-lang + code-editor > textarea *)
          box ~key:"ec" ~style_class:"extensions__code flex flex-1"
            ~grow:1.
            [ text ~key:"cl"
                ~value:(String.lowercase_ascii ext)
                ~style_class:"extensions__code-lang" []
            ; box ~key:"ce"
                ~style_class:"code-editor flex flex-1 flex-row w-full"
                ~grow:1.
                [ textarea ~key:"fe" ~style_class:"ls-file-textarea"
                    ~grow:1.
                    ~data_attrs:[ ("data-lang", ext) ]
                    ~text:(Signal.get (Signal.value content_st))
                    ~on_input:(fun ev ->
                      match ev with
                      | Lui_protocol.TextChanged (_, s) -> on_edit s
                      | _ -> ())
                    [] ]
            ]
        else box ~key:"ec" ~grow:1. [])
      (Signal.value loaded_st)
  in
  column ~key:"file" ~style_class:"ls-file-page page" ~padding:16 ~grow:1.
    [ heading ~key:"ft" ~level:1 ~value:path ~style_class:"page-title" []
    ; editor ()
    ]
