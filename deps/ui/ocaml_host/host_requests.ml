(* Platform-request service for the OCaml native host — the in-process
   host-side platform_request + dom-ops handlers — the OCaml host
   answers them in-process.

   Envelopes arrive via Bridge as "name\npayload" strings from
   Host.enqueue. The "dom-op" envelope's payload is itself
   "<inner-op>\n<json-body>" — the generic element surface
   (measurement, scrolling, imperative mutation, focus) the app drives
   through Host.dom_op. Replies go back through
   Native_embed.platform_event, the same channel the C bridge's
   lui_ocaml_platform_event feeds to the host. *)

open Lui_protocol
open Lui_window

module J = Yojson.Safe

let log fmt = Printf.eprintf (fmt ^^ "\n%!")

(* Bundle launches have no reachable stderr — mirror a diagnostic line
   into the shared host log the same way logseq_native.filelog does. *)
let filelog fmt =
  match
    (try
       Some
         (open_out_gen [ Open_append; Open_creat ] 0o644
            "/tmp/logseq_native_host.log")
     with _ -> None)
  with
  | Some oc ->
    Printf.kfprintf (fun oc -> close_out oc) oc (fmt ^^ "\n")
  | None -> Printf.ifprintf stdout fmt

(* Host environment the dispatcher acts on — set once by main after
   Lui_host.create so handlers can reach the store, Ui state, rects and
   the repaint sink. *)
type env = {
  store : Lui_store.t;
  ui : Ui.t;
  rects : Rects.t;
  (* live element rect (scroll-shifted, ancestor-clipped) — the rects
     table only refills after each repaint, so a measure of a node
     mounted this frame reads 0 through it *)
  rect_of : int -> Lui_scene.rect;
  scale : unit -> float;
  measure : int -> string -> float * float;
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

let jbool_opt (name : string) (j : J.t) : bool option =
  match jget name j with Some (`Bool b) -> Some b | _ -> None

(* ---------- editor surface measurement (.ed-r runs) ----------

   The app's edit sink mounts a .ed-r element per run fragment; its
   "runs" prop lists each fragment's model-unit span "lo,hi,kind;…" in
   the same document order, so index i in the parsed runs pairs with
   the i-th .ed-r node under the sink's parent. Offsets are UTF-8
   bytes into the model text; rects are device px. *)

let cls_has e id tok =
  match Lui_store.string_prop e.store id "style-class" with
  | Some cls -> List.mem tok (String.split_on_char ' ' cls)
  | None -> false

type ed_ctx = {
  sink : int;
  ox : float;
  oy : float;
  runs : (int * int) array;
  nodes : int array;
}

let ed_ctx (e : env) (bid : string) : ed_ctx option =
  match
    List.find_opt
      (fun id ->
        match Lui_store.prop e.store id "block-id" with
        | Some (StringValue b) -> b = bid
        | _ -> false)
      (Lui_store.preorder e.store)
  with
  | None -> None
  | Some sink -> (
    match Lui_store.parent e.store sink with
    | None -> None
    | Some editor ->
      let ed_rect = e.rect_of editor in
      let runs =
        match Lui_store.prop e.store sink "runs" with
        | Some (StringValue s) ->
          List.filter_map
            (fun entry ->
              match String.split_on_char ',' entry with
              | [ lo; hi; _kind ] -> (
                try Some (int_of_string lo, int_of_string hi)
                with _ -> None)
              | _ -> None)
            (String.split_on_char ';' s)
        | _ -> []
      in
      let nodes =
        List.filter
          (fun id -> cls_has e id "ed-r")
          (Lui_store.preorder ~root:editor e.store)
      in
      Some
        { sink
        ; ox = ed_rect.Lui_scene.x
        ; oy = ed_rect.Lui_scene.y
        ; runs = Array.of_list runs
        ; nodes = Array.of_list nodes
        })

(* Window-space rect of the n-th .ed-r node, as (x, y, h) relative to
   the block-editor origin. *)
let run_rect e ctx i =
  let r = e.rect_of ctx.nodes.(i) in
  (r.Lui_scene.x -. ctx.ox, r.Lui_scene.y -. ctx.oy, r.Lui_scene.h)

(* nodes/runs lengths can skew while a re-render is mid-flight —
   clamp the span index so measurement degrades instead of crashing. *)
let run_at ctx i =
  ctx.runs.(min i (Array.length ctx.runs - 1))

(* Span index the model offset lands in — an offset on a boundary
   takes the later span so a caret at a run edge sits at the start
   of that run's rect, matching DOM caret affinity. *)
let run_of_off ctx off =
  let rec find i =
    if i >= Array.length ctx.runs then Array.length ctx.runs - 1
    else
      let lo, hi = ctx.runs.(i) in
      if off < hi || (off = lo && lo = hi) then i else find (i + 1)
  in
  find 0

let caret_rect e ctx off =
  if Array.length ctx.nodes = 0 || Array.length ctx.runs = 0
  then (0., 0., 0.)
  else begin
    let i = run_of_off ctx off in
    let lo, _ = run_at ctx i in
    let x, y, h = run_rect e ctx i in
    if h <= 0. then (0., 0., 0.)
    else begin
      let text =
        Option.value ~default:""
          (Lui_store.string_prop e.store ctx.nodes.(i) "text")
      in
      let local = max 0 (min (off - lo) (String.length text)) in
      let dx, _ =
        e.measure ctx.nodes.(i) (String.sub text 0 local)
      in
      (x +. dx, y, h)
    end
  end

let offset_at e ctx x y =
  let wx, wy = ctx.ox +. float x, ctx.oy +. float y in
  let n = Array.length ctx.nodes in
  if n = 0 || Array.length ctx.runs = 0 then 0
  else begin
    (* closest run by y first, then x — points between lines snap to
       the line above; past a run's end snaps to its next run. *)
    let best = ref 0 and bd = ref Float.max_float in
    Array.iteri
      (fun i id ->
        let r = e.rect_of id in
        let dy =
          if wy < r.Lui_scene.y then r.Lui_scene.y -. wy
          else if wy > r.Lui_scene.y +. r.Lui_scene.h then
            wy -. (r.Lui_scene.y +. r.Lui_scene.h)
          else 0.
        in
        let dx =
          if wx < r.Lui_scene.x then r.Lui_scene.x -. wx
          else if wx > r.Lui_scene.x +. r.Lui_scene.w then
            wx -. (r.Lui_scene.x +. r.Lui_scene.w)
          else 0.
        in
        let d = (dy *. dy) +. (dx *. dx) in
        if d < !bd then begin bd := d; best := i end)
      ctx.nodes;
    let i = !best in
    let lo, hi = run_at ctx i in
    let id = ctx.nodes.(i) in
    let r = e.rect_of id in
    let text =
      Option.value ~default:"" (Lui_store.string_prop e.store id "text")
    in
    let len = String.length text in
    (* widest prefix whose advance still precedes the point *)
    let rec step k =
      if k >= len then len
      else
        let w, _ = e.measure id (String.sub text 0 (k + 1)) in
        if r.Lui_scene.x +. w <= wx then step (k + 1) else k
    in
    lo + min (hi - lo) (step 0)
  end

let line_ranges e ctx =
  let n = Array.length ctx.nodes in
  if n = 0 || Array.length ctx.runs = 0 then ""
  else begin
    (* group consecutive runs sharing a baseline y into visual
       lines; each line's range unions its run spans. *)
    let b = Buffer.create 128 in
    let cur_y = ref Float.nan and lo = ref max_int and hi = ref 0 in
    let flush () =
      if !lo < !hi then begin
        if Buffer.length b > 0 then Buffer.add_char b ';';
        Buffer.add_string b (Printf.sprintf "%d,%d" !lo !hi)
      end
    in
    for i = 0 to n - 1 do
      let r = e.rect_of ctx.nodes.(i) in
      let slo, shi = run_at ctx i in
      if Float.is_nan !cur_y || abs_float (r.Lui_scene.y -. !cur_y) < 1.
      then begin
        cur_y := r.Lui_scene.y;
        lo := min !lo slo;
        hi := max !hi shi
      end
      else begin
        flush ();
        cur_y := r.Lui_scene.y;
        lo := slo;
        hi := shi
      end
    done;
    flush ();
    Buffer.contents b
  end

let scroll_height e ctx =
  let top = ref Float.max_float and bot = ref 0. in
  Array.iter
    (fun id ->
      let r = e.rect_of id in
      if r.Lui_scene.h > 0. then begin
        top := Float.min !top r.Lui_scene.y;
        bot := Float.max !bot (r.Lui_scene.y +. r.Lui_scene.h)
      end)
    ctx.nodes;
  Float.max 0. (!bot -. (if !top = Float.max_float then !bot else !top))

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
  match Lui_store.string_prop e.store id "attrs" with
  | Some raw ->
    (* put_attrs writes attrs as a JSON assoc; guard the parse anyway *)
    (match (try J.from_string raw with Yojson.Json_error _ -> `Null) with
     | `Assoc kvs ->
       List.filter_map
         (fun (k, v) -> match v with `String s -> Some (k, s) | _ -> None)
         kvs
     | _ -> [])
  | None ->
    (* data-attrs uses the \x1e/\x1f wire encoding, not JSON *)
    (match Lui_store.string_prop e.store id "data-attrs" with
     | Some raw -> data_attrs_decode raw
     | None -> [])

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

(* ---------- native menu popup ---------- *)

(* ocaml_host_stubs.c: runs a real NSMenu modally at the spec's anchor
   and returns the picked item tag (-1 on dismiss). The JSON shape
   comes from popups_state's cm_native_spec. *)
external native_menu_popup : string -> int = "logseq_native_menu_popup"

let b64_alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

let b64_of_string (s : string) : string =
  let n = String.length s in
  let out = Buffer.create (((n + 2) / 3) * 4) in
  let put = Buffer.add_char out in
  let i = ref 0 in
  while !i < n do
    let c0 = Char.code s.[!i] in
    let c1 = if !i + 1 < n then Char.code s.[!i + 1] else 0 in
    let c2 = if !i + 2 < n then Char.code s.[!i + 2] else 0 in
    put b64_alphabet.[c0 lsr 2];
    put b64_alphabet.[((c0 land 0x03) lsl 4) lor (c1 lsr 4)];
    put
      (if !i + 1 < n then
         b64_alphabet.[((c1 land 0x0f) lsl 2) lor (c2 lsr 6)]
       else '=');
    put (if !i + 2 < n then b64_alphabet.[c2 land 0x3f] else '=');
    i := !i + 3
  done;
  Buffer.contents out

(* spec "icon" names → rasterized premultiplied RGBA for the C side's
   NSImage build: same svg source + foreground tint + Lui_svg raster
   the paint path uses, at 2x the 18pt menu slot *)
let menu_icon_rgba name =
  match Host_icons.svg_of name with
  | None -> None
  | Some src0 -> (
      let src =
        match Theme_vars.color_of "foreground" with
        | Some { Lui_scene.r; g; b; _ } ->
            Host_icons.with_color src0
              (Printf.sprintf "rgb(%d,%d,%d)" r g b)
        | None -> src0
      in
      match Lui_svg.render src ~w:36 ~h:36 with
      | Ok img ->
          Some
            ( b64_of_string (Bytes.unsafe_to_string img.Lui_scene.ipix)
            , img.Lui_scene.iw
            , img.Lui_scene.ih )
      | Error _ -> None)

let rec menu_spec_icons (j : J.t) : J.t =
  match j with
  | `Assoc kvs ->
      let kvs = List.map (fun (k, v) -> k, menu_spec_icons v) kvs in
      (match List.assoc_opt "icon" kvs with
       | Some (`String name) -> (
           match menu_icon_rgba name with
           | Some (rgba, w, h) ->
               `Assoc
                 (kvs
                 @ [ "icon_rgba", `String rgba
                   ; "icon_w", `Int w
                   ; "icon_h", `Int h ])
           | None -> `Assoc kvs)
       | _ -> `Assoc kvs)
  | `List xs -> `List (List.map menu_spec_icons xs)
  | v -> v

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
       (* Painted rects are the truth for out-of-flow nodes: a popup's
          flex absolute_layout keeps its in-flow placeholder (stretched
          inside the overlay container), while the scene cache records
          the rect actually painted. Fall back to the on-demand rect
          only while the node has not painted yet. *)
       let r =
         let p = Rects.get e.rects id in
         if Lui_scene.rect_empty p then e.rect_of id else p
       in
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
    (* Editor conduit over the rendered .ed-r text runs — the host's
       twin of getClientRects over DOM text nodes. The sink node
       (ed-sink-<block-id>) carries the "runs" prop listing each run's
       model-unit span in document order; it zips against the .ed-r
       elements under the sink's parent. All rects are device px;
       x/y/h are relative to the block-editor element, ox/oy is its
       window-space origin. A miss replies with the contract's
       no-data values so the app's measure loop keeps cycling. *)
    (match jstr_opt "block-id" parsed with
     | None -> ()
     | Some bid -> (
       match ed_ctx e bid with
       | None -> ()
       | Some ctx -> (
         match op with
         | "caret-rect" ->
           (match jint_opt "offset" parsed with
            | Some off ->
              let x, y, h = caret_rect e ctx off in
              reply "caret-rect"
                (`Assoc
                   [ ("block-id", `String bid)
                   ; ("offset", `Int off)
                   ; ("x", `Float x); ("y", `Float y); ("h", `Float h)
                   ; ("ox", `Float ctx.ox); ("oy", `Float ctx.oy) ])
            | None -> ())
         | "offset-at" ->
           (match (jint_opt "x" parsed, jint_opt "y" parsed) with
            | Some x, Some y ->
              let off = offset_at e ctx x y in
              reply "offset-at"
                (`Assoc
                   [ ("block-id", `String bid)
                   ; ("x", `Int x)
                   ; ("y", `Int y)
                   ; ("offset", `Int off) ])
            | _ -> ())
         | "line-ranges" ->
           reply "line-ranges"
             (`Assoc
                [ ("block-id", `String bid)
                ; ("ranges", `String (line_ranges e ctx)) ])
         | "scroll-height" ->
           reply "scroll-height"
             (`Assoc
                [ ("block-id", `String bid)
                ; ("height", `Float (scroll_height e ctx)) ])
         | "set-input-focus" ->
           (* the conduit contract is a handshake: after the host moves
              its text input onto the sink it pushes the "focus"/"blur"
              extension event back — Edit_input.Focus folds into
              Editor_state.focused_block, which is_focused reads to
              consume the pending_focus arm. Without the event the
              app's focus-retry loops forever. *)
           (match jbool_opt "focused" parsed with
            | Some true -> (
              e.focused_text_input ctx.sink;
              List.iter e.apply_batch
                (Patch_decode.batches_of_string
                   (Native_embed.extension_event ctx.sink "logseq-editor"
                      "focus" "{}")))
            | Some false -> (
              e.focused_text_input 0;
              List.iter e.apply_batch
                (Patch_decode.batches_of_string
                   (Native_embed.extension_event ctx.sink "logseq-editor"
                      "blur" "{}")))
            | None -> ())
         | _ -> ())))
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
            filelog "theme-snapshot installed: light=%d dark=%d"
              (Theme_vars.count_of_mode Lui_theme.Light)
              (Theme_vars.count_of_mode Lui_theme.Dark);
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
          | "native-menu-popup" ->
            (match J.from_string payload with
             | `Assoc _ as spec ->
               let spec = menu_spec_icons spec in
               let s = J.to_string spec in
               let tag = native_menu_popup s in
               reply "native-menu-select"
                 (`Assoc [ "detail", `Assoc [ "tag", `Int tag ] ])
             | _ -> ())
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

let name_of req =
  try String.sub req 0 (String.index req '\n') with _ -> "?"

let drain () =
  List.iter
    (fun req ->
       let t0 = Unix.gettimeofday () in
       handle req;
       let dt = Unix.gettimeofday () -. t0 in
       if dt > 0.005 then
         Daemon_client.boot_mark
           (Printf.sprintf "hostreq %.0fms %s" (dt *. 1000.)
              (name_of req)))
    (Bridge.take_requests ())
