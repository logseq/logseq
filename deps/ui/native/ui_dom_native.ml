(* Native implementation of the dom/timers/files service groups:
   host-emitted event payloads over the native element snapshots. All
   element ops resolve through Dom_ext (snapshot reads + Host.dom_op
   writes); file ops through Browser_ui (dom-op pickers/downloads + the
   {name,size,path} snapshots the host fills in). *)

let jfield name j =
  match j with
  | Js.Json.JObject kvs -> List.assoc_opt name kvs
  | _ -> None

let jnum name j =
  match jfield name j with
  | Some v -> Option.value (Js.Json.decodeNumber v) ~default:0.
  | None -> 0.

let jbool name j =
  match jfield name j with
  | Some v -> Option.value (Js.Json.decodeBoolean v) ~default:false
  | None -> false

let jstr name j =
  match jfield name j with
  | Some v -> Js.Json.decodeString v
  | None -> None

(* Element handles own their snapshots. The registry uses weak keys so
   temporary pointer-event handles neither expire while held nor retain
   snapshots after the last consumer releases the handle. *)
module Element_handles = Ephemeron.K1.Make (struct
  type t = Ui_services.el
  let equal a b = a == b
  let hash element = Hashtbl.hash element.Ui_services.token
end)

let tokens : Js.Json.t Element_handles.t = Element_handles.create 1024
let token_next = ref 0

let prune_tokens () = Element_handles.clean tokens

let next_token () =
  let token = !token_next in
  incr token_next;
  if token land 511 = 0 then prune_tokens ();
  token

let token_register owner payload = Element_handles.add tokens owner payload

let token_el (el : Ui_services.el) : Js.Json.t =
  match Element_handles.find_opt tokens el with
  | Some element -> element
  | None -> invalid_arg "Element handle has no owned snapshot"

(* portable Json.t -> host Js.Json.t *)
let rec js_json_of : Json.t -> Js.Json.t = function
  | Json.Null -> Js.Json.JNull
  | Json.Bool b -> Js.Json.JBoolean b
  | Json.Number n -> Js.Json.JNumber n
  | Json.String s -> Js.Json.JString s
  | Json.Array a -> Js.Json.JArray (Array.map js_json_of a)
  | Json.Object kvs ->
      Js.Json.JObject
        (List.map (fun (k, v) -> (k, js_json_of v)) kvs)

(* host Js.Json.t -> portable Json.t (CustomEvent detail payloads) *)
let rec json_of_js (v : Js.Json.t) : Json.t =
  match v with
  | Js.Json.JNull -> Json.Null
  | Js.Json.JBoolean b -> Json.Bool b
  | Js.Json.JNumber n -> Json.Number n
  | Js.Json.JString s -> Json.String s
  | Js.Json.JObject kvs ->
      Json.Object (List.map (fun (k, v) -> (k, json_of_js v)) kvs)
  | Js.Json.JArray a -> Json.Array (Array.map json_of_js a)

(* Js.Promise -> Ui_task bridge *)
let task_of (p : 'a Js.Promise.t) : 'a Ui_task.t =
  Ui_task.create (fun ~resolve ~reject ->
      Js.Promise.then_ (fun v -> resolve v; Js.Promise.resolve ()) p
      |> Js.Promise.catch (fun _ ->
          reject (Failure "host promise rejected");
          Js.Promise.resolve ())
      |> ignore)

let file_of_json (f : Js.Json.t) : Ui_services.file =
  { Ui_services.file_name = Browser_ui.file_name f
  ; file_size = Browser_ui.file_size f
  ; file_text =
      (fun () ->
        task_of
          (let open Js.Promise in
           Browser_ui.file_buffer f
           |> then_ (fun b -> resolve (Bytes.unsafe_to_string b))))
  ; file_binary =
      (fun () ->
        task_of
          (let open Js.Promise in
           Browser_ui.file_buffer f
           |> then_ (fun b -> resolve (Bytes.unsafe_to_string b))))
  }

let clipboard_data e = jfield "clipboardData" e

let text_clipboard_data text =
  Js.Json.JObject ["text",Js.Json.JString text;
    "types",Js.Json.JArray [|Js.Json.JString "text/plain"|];
    "items",Js.Json.JArray [|Js.Json.JObject
      ["kind",Js.Json.JString "string";"type",Js.Json.JString "text/plain"]|];
    "files",Js.Json.JArray [||]]

let clipboard_value data mime =
  if mime="text/plain" then Option.value (jstr "text" data) ~default:"" else ""

let empty_clipboard_snapshot () = Ui_services.empty_clipboard_snapshot

let inspect_clipboard data () =
  let entries name=match jfield name data with
    | Some (Js.Json.JArray values) -> Array.to_list values
    | _ -> invalid_arg ("Invalid native clipboard " ^ name) in
  let field name value=Option.get (jstr name value) in
  {Ui_services.clipboard_formats=List.map (fun value ->
     let mime=Option.get (Js.Json.decodeString value) in mime,clipboard_value data mime) (entries "types");
   clipboard_items=List.map (fun item -> field "kind" item,field "type" item) (entries "items");
   clipboard_files=List.map (fun file -> field "name" file,
     Option.value (jstr "type" file) ~default:"",jnum "size" file) (entries "files")}

let rec el_of (e : Js.Json.t) : Ui_services.el =
  let result = { Ui_services.token = next_token ()
  ; closest = (fun sel -> Option.map el_of (Dom_ext.closest e sel))
  ; attr = (fun name -> Dom_ext.get_attribute e name)
  ; rect =
      (fun () ->
        let r = Dom_ext.bounding_rect e in
        ( Dom_ext.rect_left r
        , Dom_ext.rect_top r
        , Dom_ext.rect_width r
        , Dom_ext.rect_height r ))
  ; rect_pending = (fun () -> Dom_ext.rect_pending e)
  ; set_style = (fun name v -> Dom_ext.style_set_property e name v)
  ; add_class = (fun c -> Dom_ext.el_class_add e c)
  ; remove_class = (fun c -> Dom_ext.el_class_remove e c)
  ; offset_width = (fun () -> Dom_ext.el_offset_width e)
  ; focus = (fun () -> Dom_ext.focus e)
  ; select_text = (fun () -> Dom_ext.el_select_text e)
  ; set_selection_range = (fun s e' -> Dom_ext.set_selection_range e s e')
  ; set_attr = (fun name v -> Dom_ext.el_set_attr e name v)
  ; rm_attr = (fun name -> Dom_ext.el_remove_attr e name)
  ; value = (fun () -> Dom_ext.value e)
  ; set_value = (fun v -> Dom_ext.set_value e v)
  ; set_text = (fun v -> Dom_ext.set_text_content e v)
  ; checked = (fun () -> Dom_ext.el_checked e)
  ; set_checked = (fun v -> Dom_ext.el_set_checked e v)
  ; contains = (fun other -> Dom_ext.el_contains e (token_el other))
  ; connected =
      (fun () -> true)
      (* a snapshot from the document providers is a mounted node *)
  ; click = (fun () -> Dom_ext.el_click e)
  ; scroll_into_view = (fun () -> Dom_ext.el_scroll_into_view e)
  ; scroll_into_view_nearest = (fun () -> Dom_ext.el_scroll_into_view e)
  ; scroll_top = (fun () -> Dom_ext.el_scroll_top e)
  ; set_scroll_top = (fun v -> Dom_ext.el_set_scroll_top e v)
  ; scroll_height = (fun () -> Dom_ext.el_scroll_height e)
  ; client_height = (fun () -> Dom_ext.el_client_height e)
  ; id = (fun () -> Dom_ext.el_id e)
  ; tag = (fun () -> String.uppercase_ascii (Dom_ext.tag_name e))
  ; editable = (fun () -> Dom_ext.el_editable e)
  ; query =
      (fun sel -> Option.map el_of (Dom_ext.query_selector e sel))
  ; query_all =
      (fun sel -> List.map el_of (Dom_ext.query_selector_all e sel))
  ; files =
      (fun () ->
        match jfield "files" e with
        | Some (Js.Json.JArray a) ->
            List.map file_of_json (Array.to_list a)
        | _ -> [])
  ; style_prop =
      (fun _ -> "")
      (* no stylesheets on this host — the capability gap the contract
         documents *)
  } in
  token_register result e;
  result

let ev_of (e : Js.Json.t) : Ui_services.ev =
  let clipboard=clipboard_data e in
  let files =
    match
      ( Option.bind (clipboard_data e) (fun cd -> jfield "files" cd)
      , Option.bind (jfield "dataTransfer" e) (fun dt -> jfield "files" dt) )
    with
    | Some (Js.Json.JArray a), _ | _, Some (Js.Json.JArray a) ->
        List.map file_of_json (Array.to_list a)
    | _ -> []
  in
  let has_file_type transfer =
    match Option.bind transfer (fun t -> jfield "types" t) with
    | Some (Js.Json.JArray a) ->
        Array.exists (fun t -> Js.Json.decodeString t = Some "Files") a
    | _ -> false
  in
  { Ui_services.x = jnum "clientX" e
  ; y = jnum "clientY" e
  ; shift = jbool "shiftKey" e
  ; meta = jbool "metaKey" e
  ; ctrl = jbool "ctrlKey" e
  ; alt = jbool "altKey" e
  ; composing = jbool "isComposing" e
  ; key = jstr "key" e
  ; key_char =
      (match jstr "keyChar" e with
       | Some s when String.length s = 1 -> Some s
       | _ -> None)
  ; buttons = int_of_float (jnum "buttons" e)
  ; button = int_of_float (jnum "button" e)
  ; repeat = jbool "repeat" e
  ; movement_x = jnum "movementX" e
  ; movement_y = jnum "movementY" e
  ; default_prevented = jbool "defaultPrevented" e || !Platform.default_prevented
  ; target =
      (match jfield "target" e with
       | Some t -> Some (el_of t)
       | None -> None)
  ; touches = []
      (* the native host emits no touch events; handlers stay wired and
         simply never fire *)
  ; detail =
      (fun name ->
        match jfield "detail" e with
        | Some d -> (
            match jfield name d with
            | Some v -> (
                match Js.Json.classify v with
                | Js.Json.JSONString s -> Some s
                (* primitive detail fields surface as their JS string
                   form — numbers/booleans decode from the repr *)
                | Js.Json.JSONNumber _ | Js.Json.JSONTrue | Js.Json.JSONFalse ->
                    Some (Js.Json.stringify v)
                | _ -> None)
            | None -> None)
        | None -> None)
  ; detail_json =
      (fun name ->
        match jfield "detail" e with
        | Some d -> Option.map json_of_js (jfield name d)
        | None -> None)
  ; clipboard_get =
      (fun mime ->
        match clipboard_data e with
        | Some data -> clipboard_value data mime
        | None -> "")
  ; clipboard_snapshot = (match clipboard with None -> empty_clipboard_snapshot | Some data -> inspect_clipboard data)
  ; clipboard_set =
      (fun mime text ->
        (* no clipboardData object natively — a copy/cut event's setData
           goes straight to the OS clipboard; only text/plain matters to
           the paste paths that read it back *)
        if mime = "text/plain" then Host.clipboard_write text)
  ; data_transfer_get =
      (fun mime ->
        match jfield "dataTransfer" e with
        | Some cd -> Option.value (jstr "text" cd) ~default:""
        | None ->
            (* the native drop path stores payload under the same
               clipboardData key *)
            (match clipboard_data e with
             | Some cd -> Option.value (jstr mime cd) ~default:""
             | None -> ""))
  ; files
  ; has_files = files <> [] || has_file_type (jfield "dataTransfer" e)
      || has_file_type (clipboard_data e)
  ; prevent_default = Platform.request_prevent
  ; stop_propagation = Platform.request_stop
  ; stop_immediate = Platform.request_stop
  }

let ops : Ui_services.dom =
  { Ui_services.on_document_event =
      (fun ?capture name f ->
        Platform.add_event_listener ?capture name
          (fun payload -> f (ev_of payload)))
  ; subscribe_document_event =
      (fun ?(capture=false) name f ->
        let listener payload = f (ev_of payload) in
        Platform.add_event_listener ~capture name listener;
        fun () ->
          let table = if capture then Platform.capture_listeners else Platform.window_listeners in
          let remaining = List.filter (fun callback -> callback != listener)
            (Hashtbl.find table name) in
          if remaining=[] then Hashtbl.remove table name
          else Hashtbl.replace table name remaining)
  ; on_window_event =
      (fun name f ->
        Platform.add_event_listener name (fun payload -> f (ev_of payload)))
  ; subscribe_window_event =
      (fun name f ->
        let listener payload = f (ev_of payload) in
        Platform.add_event_listener name listener;
        fun () ->
          let remaining = List.filter (fun callback -> callback != listener)
            (Hashtbl.find Platform.window_listeners name) in
          if remaining=[] then Hashtbl.remove Platform.window_listeners name
          else Hashtbl.replace Platform.window_listeners name remaining)
  ; query = (fun sel -> Option.map el_of (Dom_ext.doc_query_selector sel))
  ; query_all =
      (fun sel -> List.map el_of (Dom_ext.doc_query_selector_all sel))
  ; measure_rect = Dom_ext.measure_rect
  ; by_id = (fun id -> Option.map el_of (Dom_ext.by_id id))
  ; active_element =
      (fun () -> Option.map el_of (Dom_ext.active_element ()))
  ; element_at =
      (fun _ _ -> None)
      (* no hit-test on this host — the capability gap the contract
         documents *)
  ; doc_root = (fun () -> el_of Dom_ext.document_el)
  ; body = (fun () -> el_of Dom_ext.document_el)
  ; viewport_width = Host.inner_width
  ; viewport_height = Host.inner_height
  ; document_visible =
      (fun () -> true)
      (* a foreground native app has no hidden-document state *)
  ; dispatch = (fun name -> Platform.dispatch name Js.Json.null)
  ; dispatch_json =
      (fun name detail -> Platform.dispatch name (js_json_of detail))
  ; emit_json =
      (fun name p ->
        Platform.emit_event name
          (try Js.Json.parseExn p with _ -> Js.Json.null))
  ; open_dialog =
      (fun name ->
        Platform.dispatch "ls:open-dialog"
          (Js.Json.object_list [ ("name", Js.Json.string name) ]))
  ; confirm = Browser_ui.confirm
  ; scroll_row_into_view =
      (fun ~scroller ~row ->
        Dom_ext.scroll_row_into_view ~scroller:(token_el scroller)
          ~row:(token_el row))
  ; ensure_fixups = (fun () -> ())
      (* the host renders source nodes directly — nothing to strip *)
  ; selected_block_uuids = Platform.selected_block_uuids
  }

let timers : Ui_services.timers =
  { Ui_services.timeout = (fun f ms -> Host.set_timeout f ms)
  ; clear_timeout = (fun id -> Host.clear_timeout id)
  ; interval =
      (fun f ms ->
        (* no setInterval in the host table — chain self-rescheduling
           timeouts, same cadence *)
        let id = ref (-1) in
        let rec tick () = id := Host.set_timeout (fun () -> f (); tick ()) ms in
        tick ();
        !id)
  ; clear_interval = (fun id -> Host.clear_timeout id)
  ; debounce =
      (fun ms ->
        let id = ref (-1) in
        fun f ->
          if !id >= 0 then Host.clear_timeout !id;
          id := Host.set_timeout f ms)
  ; later = (fun ~ms f -> ignore (Host.set_timeout f ms))
  }

let files : Ui_services.files =
  let no_fs_access what =
    failwith
      ("files." ^ what ^ ": File System Access is web-only (native \
        dir_picker_supported is false)")
  in
  { Ui_services.pick_files =
      (fun ?accept ?(multiple = false) ?(directory = false) on_files ->
        Browser_ui.open_file_picker ?accept ~multiple ~directory
          (fun js -> on_files (List.map file_of_json (Array.to_list js))))
  ; download_text =
      (fun ~filename ~mime text ->
        Browser_ui.download_text ~filename ~mime text)
  ; download_binary =
      (fun ~filename ~mime data ->
        Browser_ui.download_binary ~filename ~mime data)

  ; inflate_raw =
      (fun _data ->
        Ui_task.reject (Failure "inflate_raw: not implemented on native"))
  ; dir_picker_supported = (fun () -> false)
  ; show_dir_picker = (fun () -> no_fs_access "show_dir_picker")
  }
