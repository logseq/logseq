(* Browser implementation of the dom service group: real DOM elements
   and document events. The ops record is handed to Platform_web.install
   once per runtime that mounts shared settings/sidebar code (app
   bootstrap and the in-process test host). *)

external j_bool : Js.Json.t -> string -> bool = "" [@@mel.get_index]

external j_field : Js.Json.t -> string -> Js.Json.t option = ""
  [@@mel.get_index] [@@mel.return null_undefined_to_opt]


external node_type : Js.Json.t -> float = "nodeType" [@@mel.get]

external closest_js : Js.Json.t -> string -> Js.Json.t option = "closest"
  [@@mel.send] [@@mel.return nullable]

external get_attr : Js.Json.t -> string -> string option =
  "getAttribute" [@@mel.send] [@@mel.return nullable]

external set_style_prop : Js.Json.t -> string -> string -> unit =
  "setProperty" [@@mel.scope "style"] [@@mel.send]

external class_add : Js.Json.t -> string -> unit = "add"
  [@@mel.scope "classList"] [@@mel.send]

external class_rm : Js.Json.t -> string -> unit = "remove"
  [@@mel.scope "classList"] [@@mel.send]

external bounding_rect : Js.Json.t -> Js.Json.t =
  "getBoundingClientRect" [@@mel.send]

external prevent_default : Js.Json.t -> unit = "preventDefault"
  [@@mel.send]

external offset_width_js : Js.Json.t -> float = "offsetWidth" [@@mel.get]

external touches_length : Js.Json.t -> int = "length"
  [@@mel.scope "touches"] [@@mel.get]

external touch_item : Js.Json.t -> int -> Js.Json.t = "item"
  [@@mel.scope "touches"] [@@mel.send]

external doc_root_js : Js.Json.t = "document.documentElement"

external focus_js : Js.Json.t -> unit = "focus" [@@mel.send]
external select_js : Js.Json.t -> unit = "select" [@@mel.send]

external set_sel_range : Js.Json.t -> int -> int -> unit =
  "setSelectionRange" [@@mel.send]

external set_attr_js : Js.Json.t -> string -> string -> unit =
  "setAttribute" [@@mel.send]

external rm_attr_js : Js.Json.t -> string -> unit = "removeAttribute"
  [@@mel.send]

external value_js : Js.Json.t -> string = "value" [@@mel.get]
external set_value_js : Js.Json.t -> string -> unit = "value" [@@mel.set]
external set_text_js : Js.Json.t -> string -> unit = "textContent"
  [@@mel.set]
external checked_js : Js.Json.t -> bool = "checked" [@@mel.get]

external set_checked_js : Js.Json.t -> bool -> unit = "checked"
  [@@mel.set]

external contains_js : Js.Json.t -> Js.Json.t -> bool = "contains"
  [@@mel.send]

external connected_js : Js.Json.t -> bool = "isConnected" [@@mel.get]
external click_js : Js.Json.t -> unit = "click" [@@mel.send]

external scroll_into_view_js : Js.Json.t -> unit = "scrollIntoView"
  [@@mel.send]

external scroll_top_js : Js.Json.t -> float = "scrollTop" [@@mel.get]

external set_scroll_top_js : Js.Json.t -> float -> unit = "scrollTop"
  [@@mel.set]

external scroll_height_js : Js.Json.t -> float = "scrollHeight" [@@mel.get]
external client_height_js : Js.Json.t -> float = "clientHeight" [@@mel.get]
external id_js : Js.Json.t -> string = "id" [@@mel.get]
external tag_js : Js.Json.t -> string = "tagName" [@@mel.get]
external query_js : Js.Json.t -> string -> Js.Json.t option =
  "querySelector" [@@mel.send] [@@mel.return nullable]

external query_all_js : Js.Json.t -> string -> Js.Json.t array =
  "querySelectorAll" [@@mel.send]

external files_js : Js.Json.t -> Js.Json.t array = "files" [@@mel.get]

external computed_style_js : Js.Json.t -> Js.Json.t = "getComputedStyle"
  [@@mel.scope "window"]

external stop_propagation_js : Js.Json.t -> unit = "stopPropagation"
  [@@mel.send]

external stop_immediate_js : Js.Json.t -> unit = "stopImmediatePropagation"
  [@@mel.send]

external clipboard_data_js : Js.Json.t -> Js.Json.t option =
  "clipboardData" [@@mel.get] [@@mel.return nullable]

external data_transfer_js : Js.Json.t -> Js.Json.t option =
  "dataTransfer" [@@mel.get] [@@mel.return nullable]

external cd_get : Js.Json.t -> string -> string = "getData" [@@mel.send]
external cd_set : Js.Json.t -> string -> string -> unit = "setData"
  [@@mel.send]

external el_files_arr : Js.Json.t -> Js.Json.t array = "files" [@@mel.get]

external set_timeout_js : (unit -> unit) -> int -> int = "setTimeout"
  [@@mel.scope "window"]

external clear_timeout_js : int -> unit = "clearTimeout"
  [@@mel.scope "window"]

external set_interval_js : (unit -> unit) -> int -> int = "setInterval"
  [@@mel.scope "window"]

external clear_interval_js : int -> unit = "clearInterval"
  [@@mel.scope "window"]

external inner_height_js : float = "innerHeight" [@@mel.scope "window"]

external visibility_state : string = "visibilityState"
  [@@mel.scope "document"]

external active_element_js : Js.Json.t option = "activeElement"
  [@@mel.scope "document"] [@@mel.return nullable]

external element_at_js : float -> float -> Js.Json.t option =
  "elementFromPoint" [@@mel.scope "document"] [@@mel.return nullable]

external confirm_js : string -> bool = "confirm" [@@mel.scope "window"]

external add_window_listener_js : string -> (Js.Json.t -> unit) -> unit
  = "addEventListener" [@@mel.scope "window"]

external body_js : Js.Json.t = "document.body"

(* File System Access handles are opaque browser objects — the contract
   carries them as Js.Json.t so the same type checks out on hosts
   without the API. *)
external show_dir_picker_js : Js.Json.t -> Js.Json.t Js.Promise.t =
  "showDirectoryPicker" [@@mel.scope "window"]

external h_name_js : Js.Json.t -> string = "name" [@@mel.get]

external get_dir_js :
  Js.Json.t -> string -> Js.Json.t -> Js.Json.t Js.Promise.t =
  "getDirectoryHandle" [@@mel.send]

external get_file_js :
  Js.Json.t -> string -> Js.Json.t -> Js.Json.t Js.Promise.t =
  "getFileHandle" [@@mel.send]

external fh_get_file_js : Js.Json.t -> Js.Json.t Js.Promise.t = "getFile"
  [@@mel.send]

external fh_move_js :
  Js.Json.t -> Js.Json.t -> string -> unit Js.Promise.t = "move"
  [@@mel.send]

external fh_writable_js : Js.Json.t -> Js.Json.t Js.Promise.t =
  "createWritable" [@@mel.send]

external w_write_js :
  Js.Json.t -> Js.Typed_array.Uint8Array.t -> unit Js.Promise.t =
  "write" [@@mel.send]

external w_close_js : Js.Json.t -> unit Js.Promise.t = "close" [@@mel.send]

let dir_picker_supported () : bool =
  [%mel.raw
    "function () { return typeof window.showDirectoryPicker === \
     'function' }"]

let truncate_old_versions_js : Js.Json.t -> unit Js.Promise.t =
  [%mel.raw
    "async function (dir) { const names = []; for await (const e of \
     dir.values()) if (e.kind === 'file') names.push(e.name); for \
     (const n of names.sort().reverse().slice(12)) await \
     dir.removeEntry(n); }"]

let decode_u8_js : Js.Typed_array.Uint8Array.t -> string Js.Promise.t =
  [%mel.raw
    "async function (u8) { return new TextDecoder().decode(u8) }"]

let inflate_raw_js (data : string) : string Js.Promise.t =
  Web_dom.inflate_raw data

let picker_create_opts = Js.Json.object_ (Js.Dict.fromList [ ("create", Js.Json.boolean true) ])

let picker_rw_opts =
  Js.Json.object_ (Js.Dict.fromList [ ("mode", Js.Json.string "readwrite") ])

let num j key =
  match j_field j key with
  | Some v -> (
      match Js.Json.classify v with
      | Js.Json.JSONNumber n -> n
      | _ -> 0.)
  | None -> 0.

(* element-handle table backing [token]: bounded ring, values are
   valid while the token hasn't wrapped — els are consumed inside the
   event/frame that produced them *)
let token_ring_size = 1024
let token_ring : Js.Json.t array = Array.make token_ring_size Js.Json.null
let token_next = ref 0

let token_register (e : Js.Json.t) : int =
  let i = !token_next land (token_ring_size - 1) in
  token_ring.(i) <- e;
  incr token_next;
  i

let token_el (el : Ui_services.el) : Js.Json.t =
  token_ring.(el.Ui_services.token land (token_ring_size - 1))

(* Js.Promise -> Ui_task bridge (completion lands on the app thread via
   the installed scheduler) *)
let task_of (p : 'a Js.Promise.t) : 'a Ui_task.t =
  Ui_task.create (fun ~resolve ~reject ->
      Js.Promise.then_
        (fun v ->
          resolve v;
          Js.Promise.resolve ())
        p
      |> Js.Promise.catch (fun _ ->
          reject (Failure "host promise rejected");
          Js.Promise.resolve ())
      |> ignore)

let rec js_of_json : Json.t -> Js.Json.t = function
  | Json.Null -> Js.Json.null
  | Json.Bool b -> Js.Json.boolean b
  | Json.Number n -> Js.Json.number n
  | Json.String s -> Js.Json.string s
  | Json.Array a -> Js.Json.array (Array.map js_of_json a)
  | Json.Object kvs ->
      Js.Json.object_
        (Js.Dict.fromList
           (List.map (fun (k, v) -> (k, js_of_json v)) kvs))

(* Js.Json.t -> portable Json.t (CustomEvent detail payloads) *)
let rec json_of_js (v : Js.Json.t) : Json.t =
  match Js.Json.classify v with
  | Js.Json.JSONNull -> Json.Null
  | Js.Json.JSONFalse -> Json.Bool false
  | Js.Json.JSONTrue -> Json.Bool true
  | Js.Json.JSONNumber n -> Json.Number n
  | Js.Json.JSONString s -> Json.String s
  | Js.Json.JSONObject o ->
      Json.Object
        (List.map
           (fun (k, v) -> (k, json_of_js v))
           (Array.to_list (Js.Dict.entries o)))
  | Js.Json.JSONArray a -> Json.Array (Array.map json_of_js a)

let file_of_json (f : Js.Json.t) : Ui_services.file =
  { Ui_services.file_name = Web_dom.file_name f
  ; file_size = Web_dom.file_size f
  ; file_text = (fun () -> task_of (Web_dom.file_text f))
  ; file_binary =
      (fun () ->
        task_of
          (let open Js.Promise in
           Web_dom.file_buffer f
           |> then_ (fun buf -> resolve (Web_dom.u8_of_buffer buf))))
  }

let rec el_of (e : Js.Json.t) : Ui_services.el =
  { Ui_services.token = token_register e
  ; closest =
      (fun sel ->
        match closest_js e sel with
        | Some c -> Some (el_of c)
        | None -> None)
  ; attr =
      (fun name ->
        match get_attr e name with
        | Some v -> Some v
        | None -> None)
  ; rect =
      (fun () ->
        let r = bounding_rect e in
        (num r "x", num r "y", num r "width", num r "height"))
  ; set_style = (fun name v -> set_style_prop e name v)
  ; add_class = (fun c -> class_add e c)
  ; remove_class = (fun c -> class_rm e c)
  ; offset_width = (fun () -> offset_width_js e)
  ; focus =
      (fun () ->
        focus_js e;
        (* input[type=number|date|...] reject setSelectionRange — the
           caret-to-end nicety stays best-effort *)
        (try
           let n = String.length (value_js e) in
           set_sel_range e n n
         with _ -> ()))
  ; select_text = (fun () -> select_js e)
  ; set_selection_range = (fun s e' -> set_sel_range e s e')
  ; set_attr = (fun name v -> set_attr_js e name v)
  ; rm_attr = (fun name -> rm_attr_js e name)
  ; value = (fun () -> value_js e)
  ; set_value = (fun v -> set_value_js e v)
  ; set_text = (fun v -> set_text_js e v)
  ; checked = (fun () -> checked_js e)
  ; set_checked = (fun v -> set_checked_js e v)
  ; contains = (fun other -> contains_js e (token_el other))
  ; connected = (fun () -> connected_js e)
  ; click = (fun () -> click_js e)
  ; scroll_into_view = (fun () -> scroll_into_view_js e)
  ; scroll_into_view_nearest =
      (fun () ->
        let o = Js.Dict.empty () in
        Js.Dict.set o "block" (Js.Json.string "nearest");
        Web_dom.el_scroll_into_view_opts e (Js.Json.object_ o))
  ; scroll_top = (fun () -> scroll_top_js e)
  ; set_scroll_top = (fun v -> set_scroll_top_js e v)
  ; scroll_height = (fun () -> scroll_height_js e)
  ; client_height = (fun () -> client_height_js e)
  ; id = (fun () -> id_js e)
  ; tag = (fun () -> tag_js e)
  ; editable =
      (fun () ->
        let t = tag_js e in
        t = "TEXTAREA" || t = "INPUT" || t = "SELECT"
        || closest_js e "[contenteditable='true']" <> None)
  ; query =
      (fun sel ->
        match query_js e sel with
        | Some c -> Some (el_of c)
        | None -> None)
  ; query_all =
      (fun sel -> List.map el_of (Array.to_list (query_all_js e sel)))
  ; files =
      (fun () ->
        List.map file_of_json (Array.to_list (el_files_arr e)))
  ; style_prop =
      (fun prop ->
        match Js.Json.decodeString (j_field (computed_style_js e) prop
                |> Option.value ~default:Js.Json.null) with
        | Some s -> s
        | None -> "")
  }

(* .closest/getAttribute exist on Elements (nodeType 1) only — event
   targets can be document/window *)
let el_opt (e : Js.Json.t) =
  if node_type e = 1. then Some (el_of e) else None

let detail_field name ev =
  match j_field ev "detail" with
  | Some d -> (
      match j_field d name with
      | Some v -> (
          match Js.Json.classify v with
          | Js.Json.JSONString s -> Some s
          (* primitive detail fields surface as their JS string form so
             consumers decode numbers/booleans without a JSON escape *)
          | Js.Json.JSONNumber _ | Js.Json.JSONTrue | Js.Json.JSONFalse ->
              Some (Js.Json.stringify v)
          | _ -> None)
      | None -> None)
  | None -> None

let detail_json_field name ev =
  match j_field ev "detail" with
  | Some d -> Option.map json_of_js (j_field d name)
  | None -> None

let ev_of (e : Js.Json.t) : Ui_services.ev =
  let touches =
    match j_field e "touches" with
    | Some _ ->
        let n = touches_length e in
        List.init n (fun i ->
            let t = touch_item e i in
            (num t "clientX", num t "clientY"))
    | None -> []
  in
  { Ui_services.x = num e "clientX"
  ; y = num e "clientY"
  ; shift = j_bool e "shiftKey"
  ; meta = j_bool e "metaKey"
  ; ctrl = j_bool e "ctrlKey"
  ; composing = j_bool e "isComposing"
  ; key =
      (match j_field e "key" with
       | Some v -> (
           match Js.Json.classify v with
           | Js.Json.JSONString s -> Some s
           | _ -> None)
       | None -> None)
  ; target =
      (match j_field e "target" with
       | Some t -> el_opt t
       | None -> None)
  ; touches
  ; detail = (fun name -> detail_field name e)
  ; detail_json = (fun name -> detail_json_field name e)
  ; clipboard_get =
      (fun mime ->
        match clipboard_data_js e with
        | Some cd -> cd_get cd mime
        | None -> "")
  ; clipboard_set =
      (fun mime v ->
        match clipboard_data_js e with
        | Some cd -> cd_set cd mime v
        | None -> ())
  ; data_transfer_get =
      (fun mime ->
        match data_transfer_js e with
        | Some dt -> cd_get dt mime
        | None -> "")
  ; files =
      (let files_of = function
         | Some j -> j_field j "files"
         | None -> None
       in
       let from cd = match cd with
         | Some j -> files_of (Some j)
         | None -> None
       in
       match
         ( from (clipboard_data_js e), from (data_transfer_js e) )
       with
       | Some j, _ | _, Some j -> (
           match Js.Json.classify j with
           | Js.Json.JSONArray a ->
               List.map file_of_json (Array.to_list a)
           | _ -> [])
       | _ -> [])
  ; prevent_default = (fun () -> prevent_default e)
  ; stop_propagation = (fun () -> stop_propagation_js e)
  ; stop_immediate = (fun () -> stop_immediate_js e)
  ; buttons = int_of_float (num e "buttons")
  ; button = int_of_float (num e "button")
  ; repeat = j_bool e "repeat"
  ; movement_x = num e "movementX"
  ; movement_y = num e "movementY"
  ; alt = j_bool e "altKey"
  ; default_prevented = j_bool e "defaultPrevented"
  }

(* base-ui's scroll-into-view heading correction needs element parents;
   the web impl keeps the DOM's own helper, native approximates with
   rects *)
let ops : Ui_services.dom =
  { Ui_services.on_document_event =
      (fun ?capture name f ->
        Web_dom.add_document_listener name
          (fun payload -> f (ev_of payload))
          (match capture with Some c -> c | None -> false))
  ; on_window_event =
      (fun name f -> add_window_listener_js name (fun e -> f (ev_of e)))
  ; query_all =
      (fun sel ->
        List.map el_of
          (Array.to_list (Web_dom.query_selector_all_arr sel)))
  ; by_id = (fun id -> Option.map el_of (Web_dom.get_element_by_id id))
  ; active_element =
      (fun () ->
        match active_element_js with
        | Some e when node_type e = 1. -> Some (el_of e)
        | _ -> None)
  ; element_at =
      (fun x y ->
        match element_at_js x y with
        | Some e when node_type e = 1. -> Some (el_of e)
        | _ -> None)
  ; body = (fun () -> el_of body_js)
  ; viewport_height = (fun () -> inner_height_js)
  ; document_visible = (fun () -> visibility_state = "visible")
  ; dispatch_json =
      (fun name detail -> Web_dom.dispatch_custom name (js_of_json detail))
  ; confirm = (fun msg -> confirm_js msg)
  ; scroll_row_into_view =
      (fun ~scroller ~row ->
        Web_dom.scroll_row_into_view ~scroller:(token_el scroller)
          ~row:(token_el row))
  ; ensure_fixups = (fun () -> Web_dom.ensure_dom_fixups ())
  ; query =
      (fun sel ->
        match Web_dom.query_selector sel with
        | Some e -> Some (el_of e)
        | None -> None)
  ; doc_root = (fun () -> el_of doc_root_js)
  ; viewport_width = (fun () -> Web_dom.win_inner_width)
  ; dispatch = (fun name -> Web_dom.dispatch_custom name Js.Json.null)
  ; emit_json =
      (fun (_ : string) (_ : string) ->
        (* hosts never synthesize dom-events on web — the real DOM
           dispatch already reached document listeners *)
        ())
  ; open_dialog =
      (fun name ->
        let o = Js.Dict.empty () in
        Js.Dict.set o "name" (Js.Json.string name);
        Web_dom.dispatch_custom "ls:open-dialog" (Js.Json.object_ o))
  ; apply_left_sidebar_width =
      (fun px ->
        set_style_prop doc_root_js "--ls-left-sidebar-width"
          (Printf.sprintf "%dpx" px))
  ; selected_block_uuids = Platform.selected_block_uuids
  }

let timers : Ui_services.timers =
  { Ui_services.timeout = (fun f ms -> set_timeout_js f ms)
  ; clear_timeout = (fun id -> clear_timeout_js id)
  ; interval = (fun f ms -> set_interval_js f ms)
  ; clear_interval = (fun id -> clear_interval_js id)
  ; debounce =
      (fun ms ->
        let id = ref (-1) in
        fun f ->
          if !id >= 0 then clear_timeout_js !id;
          id := set_timeout_js f ms)
  ; later = (fun ~ms f -> ignore (set_timeout_js f ms))
  }

let fs_handles : (int, Js.Json.t) Hashtbl.t = Hashtbl.create 16
let fs_next = ref 0

let rec dir_of (h : Js.Json.t) : Ui_services.fs_dir =
  incr fs_next;
  Hashtbl.replace fs_handles !fs_next h;
  { Ui_services.dir_id = !fs_next
  ; dir_name = h_name_js h
  ; get_dir =
      (fun name ->
        Ui_task.bind (task_of (get_dir_js h name picker_create_opts))
          (fun d -> Ui_task.resolve (dir_of d)))
  ; get_file =
      (fun name ->
        Ui_task.bind (task_of (get_file_js h name picker_create_opts))
          (fun fh -> Ui_task.resolve (file_of fh)))
  ; truncate_old_versions =
      (fun () -> task_of (truncate_old_versions_js h))
  }

and file_of (fh : Js.Json.t) : Ui_services.fs_file =
  { Ui_services.fh_file =
      (fun () ->
        Ui_task.bind (task_of (fh_get_file_js fh))
          (fun f -> Ui_task.resolve (file_of_json f)))
  ; fh_move =
      (fun dir name ->
        task_of (fh_move_js fh (Hashtbl.find fs_handles dir.Ui_services.dir_id) name))
  ; fh_writable =
      (fun () ->
        Ui_task.bind (task_of (fh_writable_js fh))
          (fun w -> Ui_task.resolve (writable_of w)))
  }

and writable_of (w : Js.Json.t) : Ui_services.fs_writable =
  { Ui_services.w_write =
      (fun data -> task_of (w_write_js w (Web_dom.binary_to_u8 data)))
  ; w_close = (fun () -> task_of (w_close_js w))
  }

let files : Ui_services.files =
  { Ui_services.pick_files =
      (fun ?accept ?(multiple = false) ?(directory = false) on_files ->
        Web_dom.open_file_picker ?accept ~multiple ~directory
          (fun js -> on_files (List.map file_of_json (Array.to_list js))))
  ; download_text =
      (fun ~filename ~mime text ->
        Web_dom.download_text ~filename ~mime text)
  ; download_binary =
      (fun ~filename ~mime data ->
        Web_dom.download_binary ~filename ~mime data)
  ; inflate_raw = (fun data -> task_of (inflate_raw_js data))
  ; dir_picker_supported
  ; show_dir_picker =
      (fun () ->
        Ui_task.bind (task_of (show_dir_picker_js picker_rw_opts))
          (fun h -> Ui_task.resolve (dir_of h)))
  }
