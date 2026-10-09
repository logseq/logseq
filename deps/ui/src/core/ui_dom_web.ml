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

let num j key =
  match j_field j key with
  | Some v -> (
      match Js.Json.classify v with
      | Js.Json.JSONNumber n -> n
      | _ -> 0.)
  | None -> 0.

let rec el_of (e : Js.Json.t) : Ui_services.el =
  { Ui_services.closest =
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
          | _ -> None)
      | None -> None)
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
  ; prevent_default = (fun () -> prevent_default e)
  }

let ops : Ui_services.dom =
  { Ui_services.on_document_event =
      (fun name f ->
        Web_dom.on_document_event name (fun payload -> f (ev_of payload)))
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
