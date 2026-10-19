(* File route — cljs components/file.cljs: #/file/<path> renders the
   graph file in a code editor (the settings "Edit config.edn" /
   "Edit custom.css" links land here).

   Content loads via thread-api/get-file-content; edits write back
   through the raw file/path transact (debounced like cljs
   set-file-content). The editor surface is the same vendored
   CodeMirror 5 the code blocks use (mount_file — no block wiring). *)

open Lui_elements

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
       ; Wire.Nil ]
     |> Js.Promise.then_ (fun _ ->
            Sdk_config.note_file_saved repo path content;
            Js.Promise.resolve ()))

(* util/get-file-ext: text after the last dot *)
let file_ext path =
  match String.rindex_opt path '.' with
  | Some i -> String.sub path (i + 1) (String.length path - i - 1)
  | None -> ""

let view ~path (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let content_st = Signal.state ctx.Lui_ui.ui_scheduler "" in
  let load_st = Signal.state ctx.Lui_ui.ui_scheduler Ui_effect.Loading in
  let debounced = Ui_services.timers_debounce 500 in
  (* save is controller-owned: a pending debounced write still lands
     after the view unmounts *)
  let on_edit s = debounced (fun () -> save (Runtime.repo ()) path s) in
  Ui_effect.task ~scope:ctx.Lui_ui.ui_scope
    (Subs_state.task_of_promise
       (Runtime.invoke2 "thread-api/get-file-content"
          (Wire.String (Runtime.repo ()))
          (Wire.String path)))
    ~ok:(fun w ->
      (match w with
       | Wire.String s -> Runtime.signal_set content_st s
       | _ -> ());
      Runtime.signal_set load_st (Ui_effect.Ready ());
      (* flush is deferred (scheduled, not synchronous): the textarea
         mounts on the next tick, so query it after that tick and hand
         it to CodeMirror once the lazy core chunk lands *)
      ignore
        (Ui_effect.timeout ~scope:ctx.Lui_ui.ui_scope 0 (fun () ->
             Code_mirror.attach_file_editor ~on_change:on_edit ())))
    ~error:(fun e ->
      Runtime.signal_set load_st (Ui_effect.Failed e));
  let editor () =
    let ext = file_ext path in
    (* textarea ~text is an initial-value prop: mount once the async
       load lands so the fetched content seeds it (and fromTextArea
       then reads it into the CM doc) *)
    reactive
      (fun (load : unit Ui_effect.load) ->
        match load with
        | Ui_effect.Ready () ->
            (* cljs extensions__code > code-lang + code-editor > textarea *)
            row ~key:"ec" ~style_class:"extensions__code"
              ~grow:1.
              [ text ~key:"cl"
                  ~value:(String.lowercase_ascii ext)
                  ~style_class:"extensions__code-lang" []
              ; row ~key:"ce"
                  ~style_class:"code-editor"
                  ~grow:1.
                  ~data_attrs:[ ("style", "width:100%") ]
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
        | Ui_effect.Failed e ->
            row ~key:"ec" ~style_class:"extensions__code" ~grow:1.
              [ text ~key:"fe-err" ~value:(Printexc.to_string e) [] ]
        | Ui_effect.Loading -> box ~key:"ec" ~grow:1. [])
      (Signal.value load_st)
  in
  (column ~key:"file" ~style_class:"ls-file-page page" ~padding:16 ~grow:1.
     [ heading ~key:"ft" ~level:1 ~value:path ~style_class:"page-title" []
     ; editor ()
     ])
    ctx parent
