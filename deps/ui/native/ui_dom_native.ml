(* Native implementation of the dom service group: host-emitted event
   payloads over the native element snapshots. No document query engine
   exists on this host — element resolution only reaches through event
   targets (same reach the former native twin had). *)

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

let rec el_of (e : Js.Json.t) : Ui_services.el =
  { Ui_services.closest = (fun sel -> Option.map el_of (Dom_ext.closest e sel))
  ; attr = (fun name -> Platform.get_attribute e name)
  ; rect = (fun () -> (0., 0., 0., 0.))
      (* no host geometry on native — the shared anchor falls back to
         the event coordinates, matching the former twin's behavior *)
  ; set_style = (fun _ _ -> ())
      (* no stylesheet on this host — style writes are no-ops, the same
         capability gap the former twin's stub recorded *)
  ; add_class = (fun c -> Editor_dom.el_class_add e c)
  ; remove_class = (fun c -> Editor_dom.el_class_remove e c)
  ; offset_width = (fun () -> 0.)
      (* no layout metrics on this host — callers reach it only through
         touch/right-resize paths that never fire here *)
  }

let ev_of (e : Js.Json.t) : Ui_services.ev =
  { Ui_services.x = jnum "clientX" e
  ; y = jnum "clientY" e
  ; shift = jbool "shiftKey" e
  ; meta = jbool "metaKey" e
  ; ctrl = jbool "ctrlKey" e
  ; composing = jbool "isComposing" e
  ; key = jstr "key" e
  ; target = (match jfield "target" e with Some t -> Some (el_of t) | None -> None)
  ; touches = []
      (* the native host emits no touch events; handlers stay wired and
         simply never fire *)
  ; detail =
      (fun name ->
        match jfield "detail" e with
        | Some d -> jstr name d
        | None -> None)
  ; prevent_default = (fun () -> ())
  }

let ops : Ui_services.dom =
  { Ui_services.on_document_event =
      (fun name f ->
        Platform.on_document_event name (fun payload -> f (ev_of payload)))
  ; query = (fun _ -> None)
  ; doc_root = (fun () -> el_of Editor_dom.document_element)
  ; viewport_width = Host.inner_width
  ; dispatch = (fun name -> Platform.dispatch name Js.Json.null)
  ; emit_json =
      (fun name p ->
        Platform.emit_event name
          (try Js.Json.parseExn p with _ -> Js.Json.null))
  ; open_dialog =
      (fun name ->
        Platform.dispatch "ls:open-dialog"
          (Js.Json.object_list [ ("name", Js.Json.string name) ]))
  ; apply_left_sidebar_width =
      (fun px -> Runtime.send (Action.Set_left_sidebar_width px))
      (* dock column width is model-bound on native (no CSS var) *)
  ; selected_block_uuids = Platform.selected_block_uuids
  }
