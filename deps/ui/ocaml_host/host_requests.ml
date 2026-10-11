(* Platform-request service for the OCaml native host — the in-process
   twin of the Rust host's handle_platform_request + domops.

   Envelopes arrive via Bridge as "name\npayload" strings from
   Host.enqueue. The "dom-op" envelope's payload is itself
   "<inner-op>\n<json-body>" — the generic element surface
   (measurement, scrolling, imperative mutation, focus) the app drives
   through Host.dom_op. Replies go back through
   Native_embed.platform_event, the same channel the C bridge's
   lui_ocaml_platform_event feeds on the Rust host. *)

open Lui_protocol
open Lui_window

module J = Yojson.Safe

let log fmt = Printf.eprintf (fmt ^^ "\n%!")

(* Host environment the dispatcher acts on — set once by main after
   Lui_host.create so handlers can reach the store, Ui state, rects and
   the repaint sink. *)
type env = {
  store : Lui_store.t;
  ui : Ui.t;
  rects : Rects.t;
  scale : unit -> float;
  apply_batch : patch_batch -> unit;
  apply_actions : action list -> unit;
  set_ime_rect : Lui_scene.rect -> unit;
  focused_text_input : int -> unit;
  repaint : unit -> unit;
}

let env : env option ref = ref None
let install e = env := Some e

(* ---------- json helpers ---------- *)

let jget (name : string) (j : J.t) : J.t option =
  match j with `Assoc a -> List.assoc_opt name a | _ -> None

let jstr_opt (name : string) (j : J.t) : string option =
  match jget name j with Some (`String s) -> Some s | _ -> None

let jfloat (name : string) (j : J.t) : float =
  match jget name j with
  | Some (`Int i) -> float i
  | Some (`Float f) -> f
  | _ -> 0.

let jint_opt (name : string) (j : J.t) : int option =
  match jget name j with
  | Some (`Int i) -> Some i
  | Some (`Float f) -> Some (int_of_float f)
  | _ -> None

(* ---------- ref resolution (domops.rs twin) ----------

   {"node-id": n} -> n; {"#ref"/"ref-id": ident} -> the node whose
   accessibility-identifier prop matches; {"#ref": <=0} is the
   documentElement/body placeholder -> store root. *)

let resolve_ref (e : env) (j : J.t) : int option =
  match jint_opt "node-id" j with
  | Some id -> Some id
  | None -> (
      match jget "#ref" j with
      | Some (`Int n) when n <= 0 -> (
          match Lui_store.root_ids e.store with
          | r :: _ -> Some r
          | [] -> None)
      | _ -> (
          let ident =
            match jstr_opt "#ref" j with
            | Some _ as s -> s
            | None -> jstr_opt "ref-id" j
          in
          match ident with
          | None -> None
          | Some ident ->
            Lui_store.all_nodes e.store
            |> List.find_opt (fun n ->
                   Lui_store.string_prop e.store
                     (Lui_store.node_id n) "accessibility-identifier"
                   = Some ident)
            |> Option.map Lui_store.node_id))

(* ---------- local store mutation ----------

   Imperative ops mutate the rendered tree the same way apply_local
   does in the Rust domops: a single-op batch applied to the host
   store, then a repaint. Extension nodes take set-extension-prop (raw
   names); standard nodes take set-prop with the schema enum. *)

let is_extension (e : env) (id : int) : bool =
  Option.is_some (Lui_store.ext_id e.store id)

let prop_of_name (name : string) : property option =
  List.find_opt
    (fun p -> Lui_wire_schema.property_name p = name)
    Lui_wire_schema.all_properties

let set_named (e : env) (id : int) (name : string) (v : wire_value) =
  let op =
    if is_extension e id then SetExtensionProp (id, name, v)
    else
      match prop_of_name name with
      | Some p -> SetProp (id, p, v)
      | None -> SetExtensionProp (id, name, v)
  in
  e.apply_batch { generation = 0; ops = [ op ] }

let attrs_of (e : env) (id : int) : (string * string) list =
  let raw =
    match Lui_store.string_prop e.store id "attrs" with
    | Some _ as s -> s
    | None -> Lui_store.string_prop e.store id "data-attrs"
  in
  match Option.map J.from_string raw with
  | Some (`Assoc kvs) ->
    List.filter_map (fun (k, v) ->
        match v with `String s -> Some (k, s) | _ -> None)
      kvs
  | _ -> []

let put_attrs (e : env) (id : int) (attrs : (string * string) list) =
  let json =
    `Assoc (List.map (fun (k, v) -> (k, `String v)) attrs)
    |> J.to_string
  in
  set_named e id "attrs" (StringValue json)

let set_attr_pair attrs name value =
  (name, value) :: List.remove_assoc name attrs

let style_set_decl (style : string) (name : string) (value : string) =
  let decls =
    String.split_on_char ';' style
    |> List.map String.trim
    |> List.filter (fun d ->
           d <> ""
           && match String.index_opt d ':' with
              | Some i -> String.trim (String.sub d 0 i) <> name
              | None -> true)
  in
  String.concat ";" (decls @ [ name ^ ":" ^ value ])

(* ---------- rect replies ---------- *)

(* Rects/engine rects are device px; the app's element rects are
   logical — divide by scale like the native host's logical bounds. *)
let rect_json (e : env) (r : Lui_scene.rect) : J.t =
  let s = e.scale () in
  let f v = `Float (v /. s) in
  `Assoc
    [ ("left", f r.Lui_scene.x)
    ; ("top", f r.Lui_scene.y)
    ; ("right", f (r.Lui_scene.x +. r.Lui_scene.w))
    ; ("bottom", f (r.Lui_scene.y +. r.Lui_scene.h))
    ; ("width", f r.Lui_scene.w)
    ; ("height", f r.Lui_scene.h) ]

let reply (name : string) (j : J.t) =
  Native_embed.platform_event (name ^ "\n" ^ J.to_string j)

(* ---------- dom-op dispatch ---------- *)

let dom_op (e : env) (op : string) (body : string) =
  let parsed =
    match J.from_string body with
    | exception _ -> `Assoc []
    | j -> j
  in
  let ref_ =
    match jget "ref" parsed with Some r -> r | None -> `Null
  in
  let target = resolve_ref e ref_ in
  match op with
  | "measure-node" ->
    (match target with
     | Some id ->
       let r = Rects.get e.rects id in
       reply "node-rect"
         (`Assoc
            [ ("nodeId", `Int id)
            ; ("rect", rect_json e r)
            ; ("ref", ref_) ])
     | None -> ())
  | "natural-size" ->
    (match target with
     | Some id ->
       reply "node-natural-size"
         (`Assoc
            [ ("nodeId", `Int id); ("width", `Int 0); ("height", `Int 0) ])
     | None -> ())
  | "scroll-into-view" | "scroll-to-node" ->
    (match target with
     | Some id -> e.apply_actions (Ui.scroll_show e.ui e.store id)
     | None -> ())
  | "scroll-row-into-view" ->
    (match
       Option.bind (jget "row" parsed) (resolve_ref e)
     with
     | Some row -> e.apply_actions (Ui.scroll_show e.ui e.store row)
     | None -> ())
  | "set-scroll-top" ->
    (match target with
     | Some id ->
       let top = jfloat "top" parsed in
       e.apply_actions (Ui.scroll_to e.ui e.store id top)
     | None -> ())
  | "focus" ->
    (match target with
     | Some id when id <> 0 ->
       Ui.set_focused e.ui e.store id;
       e.focused_text_input id
     | _ -> ())
  | "set-value" | "set-text" | "set-text-content" ->
    (match target with
     | Some id ->
       let text =
         match jstr_opt "value" parsed with
         | Some _ as v -> v
         | None -> jstr_opt "text" parsed
       in
       (match text with
        | Some text -> set_named e id "text" (StringValue text)
        | None -> ())
     | None -> ())
  | "set-checked" ->
    (match target with
     | Some id ->
       let checked =
         match jget "checked" parsed with
         | Some (`Bool b) -> b
         | _ -> false
       in
       set_named e id "checked" (BoolValue checked)
     | None -> ())
  | "set-attr" ->
    (match target with
     | Some id -> (
         match jstr_opt "name" parsed, jstr_opt "value" parsed with
         | Some name, Some value ->
           put_attrs e id (set_attr_pair (attrs_of e id) name value)
         | _ -> ())
     | None -> ())
  | "remove-attr" ->
    (match target with
     | Some id -> (
         match jstr_opt "name" parsed with
         | Some name ->
           put_attrs e id (List.remove_assoc name (attrs_of e id))
         | None -> ())
     | None -> ())
  | "set-class" ->
    (match target with
     | Some id -> (
         match jstr_opt "class" parsed with
         | Some cls -> set_named e id "style-class" (StringValue cls)
         | None -> ())
     | None -> ())
  | "class-add" | "class-remove" ->
    (match target with
     | Some id -> (
         match jstr_opt "class" parsed with
         | Some token ->
           let current =
             Option.value
               (Lui_store.string_prop e.store id "style-class")
               ~default:""
           in
           let classes = String.split_on_char ' ' current
                         |> List.filter (fun c -> c <> "") in
           let next =
             if op = "class-add" then
               if List.mem token classes then classes
               else classes @ [ token ]
             else List.filter (fun c -> c <> token) classes
           in
           set_named e id "style-class"
             (StringValue (String.concat " " next))
         | None -> ())
     | None -> ())
  | "style-set-property" ->
    (match jstr_opt "property" parsed, jstr_opt "value" parsed with
     | Some name, Some value ->
       if
         String.length name > 2
         && String.sub name 0 2 = "--"
       then begin
         (* CSS custom property — app-level var write; lands in the
            active mode's table so color_of sees it next repaint. *)
         Hashtbl.replace
           (Theme_vars.vars_of_mode !Theme_vars.mode) name value;
         e.repaint ()
       end
       else
         (match target with
          | Some id ->
            let attrs = attrs_of e id in
            let style =
              Option.value (List.assoc_opt "style" attrs) ~default:""
            in
            put_attrs e id
              (set_attr_pair attrs "style"
                 (style_set_decl style name value))
          | None -> ())
     | _ -> ())
  | "remove" ->
    (match target with
     | Some id -> (
         match Lui_store.parent e.store id with
         | Some parent ->
           e.apply_batch
             { generation = 0
             ; ops =
                 [ RemoveChild (parent, id); DropNode id ] }
         | None -> ())
     | None -> ())
  | "dump-frames" ->
    List.iter
      (fun id ->
         let kind = Lui_store.kind e.store id in
         log "dom node %d kind=%s" id kind)
      (Lui_store.preorder e.store)
  | "select" ->
    (match target with
     | Some id -> Ui.set_focused e.ui e.store id
     | None -> ())
  | "click" | "katex-pending" | "hljs-pending"
  | "imperative-attach" | "imperative-detach" -> ()
  | "caret-rect" | "offset-at" | "line-ranges" | "scroll-height"
  | "set-input-focus" ->
    (* Editor conduit: no host-rendered editor surface on this backend
       yet — the contract's "no data" response keeps the app's
       measure loop cycling (same as a reply that never arrives). *)
    (match op with
     | "caret-rect" ->
       (match jstr_opt "block-id" parsed with
        | Some bid ->
          reply "caret-rect"
            (`Assoc
               [ ("block-id", `String bid)
               ; ("x", `Int 0); ("y", `Int 0); ("h", `Int 0)
               ; ("ox", `Int 0); ("oy", `Int 0) ])
        | None -> ())
     | "offset-at" ->
       (match jstr_opt "block-id" parsed with
        | Some bid ->
          reply "offset-at"
            (`Assoc
               [ ("block-id", `String bid); ("offset", `Int 0) ])
        | None -> ())
     | "line-ranges" ->
       (match jstr_opt "block-id" parsed with
        | Some bid ->
          reply "line-ranges"
            (`Assoc
               [ ("block-id", `String bid); ("ranges", `String "") ])
        | None -> ())
     | "scroll-height" ->
       (match jstr_opt "block-id" parsed with
        | Some bid ->
          reply "scroll-height"
            (`Assoc
               [ ("block-id", `String bid); ("height", `Int 0) ])
        | None -> ())
     | _ -> ())
  | other -> log "dom-op %s unsupported: %s" other body

(* ---------- top-level envelope dispatch ---------- *)

let handle (envelope : string) =
  match String.index_opt envelope '\n' with
  | None -> ()
  | Some i -> (
      let name = String.sub envelope 0 i in
      let payload =
        String.sub envelope (i + 1) (String.length envelope - i - 1)
      in
      match !env with
      | None -> ()
      | Some e -> (
          match name with
          | "clipboard" ->
            ignore (Lui_shell.clipboard_write payload)
          | "clipboard-read" ->
            let text =
              Option.value (Lui_shell.clipboard_read ()) ~default:""
            in
            reply "clipboard-read" (`Assoc [ ("text", `String text) ])
          | "open-url" ->
            let url =
              match J.from_string payload with
              | `Assoc _ as j -> (
                  match jstr_opt "url" j with
                  | Some u -> u
                  | None -> payload)
              | `String u -> u
              | _ -> payload
            in
            (* no outbound open-url in lui_shell; the user's browser
               is the target either way *)
            ignore
              (Unix.create_process "open"
                 [| "open"; url |]
                 Unix.stdin Unix.stdout Unix.stderr)
          | "ui-state" ->
            (match J.from_string payload with
             | `Assoc _ as j ->
               let dark =
                 match
                   (match jget "data" j with
                    | Some (`Assoc d) -> jstr_opt "theme" (`Assoc d)
                    | _ -> None)
                 with
                 | Some "dark" -> Some true
                 | Some _ -> Some false
                 | None -> (
                     match jstr_opt "body-classes" j with
                     | Some classes ->
                       Some
                         (let pat = "dark-theme" in
                          let rec find i =
                            i + String.length pat <= String.length classes
                            && (String.sub classes i (String.length pat) = pat
                                || find (i + 1))
                          in
                          find 0)
                     | None -> None)
               in
               (match dark with
                | Some d ->
                  Theme_vars.set_dark d;
                  e.repaint ()
                | None -> ())
             | _ -> ())
          | "theme-snapshot" ->
            Theme_vars.install_snapshot payload;
            e.repaint ()
          | "app-icons" -> Host_icons.install payload
          | "dom-op" -> (
              match String.index_opt payload '\n' with
              | Some j ->
                let op = String.sub payload 0 j in
                let body =
                  String.sub payload (j + 1)
                    (String.length payload - j - 1)
                in
                dom_op e op body
              | None -> ())
          | "save-file" ->
            ignore (Lui_shell.save_dialog ())
          | "open-file-picker" ->
            ignore (Lui_shell.open_dialog ())
          | "notify" ->
            (match J.from_string payload with
             | `Assoc _ as j ->
               ignore
                 (Lui_shell.notify ~id:"logseq"
                    ~title:
                      (Option.value (jstr_opt "title" j)
                         ~default:"logseq")
                    ?subtitle:(jstr_opt "subtitle" j)
                    ~body:
                      (Option.value (jstr_opt "body" j) ~default:"")
                    ())
             | _ -> ())
          | other -> log "platform request %s: %s" other payload))

let drain () = List.iter handle (Bridge.take_requests ())
