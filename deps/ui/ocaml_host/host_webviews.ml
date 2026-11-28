(* Embedded iframe webviews for the self-drawn host.

   LUI renders iframe elements as retained `logseq-iframe` extension nodes,
   but OS webviews are not scene objects: they are native subviews layered
   over the host window. This module owns their node-keyed lifecycle. Paint
   marks the visible node and places its overlay; end_frame hides overlays
   whose nodes were not painted and destroys overlays whose nodes left the
   store. *)

open Lui_scene

type env = {
  host_window : unit -> Lui_webview.host_window;
  clip_of : int -> rect -> rect;
}

type state = {
  id : int;
  mutable source : string;
  mutable sandbox : string option;
  mutable view : Lui_webview.t option;
  mutable error : string;
  mutable painted_frame : int;
}

type t = {
  env : env;
  states : (int, state) Hashtbl.t;
  mutable frame_index : int;
  mutable backend_error : string;
  mutable passive_paints : int;
}

let create env =
  { env; states = Hashtbl.create 8; frame_index = 0; backend_error = ""; passive_paints = 0 }

let with_passive_paints t f =
  t.passive_paints <- t.passive_paints + 1;
  Fun.protect
    ~finally:(fun () -> t.passive_paints <- t.passive_paints - 1)
    f

let debug =
  lazy
    (match Sys.getenv_opt "LOGSEQ_NATIVE_WEBVIEW_DEBUG" with
     | Some ("1" | "true") -> true
     | _ -> false)

let log fmt =
  if Lazy.force debug then Printf.eprintf (fmt ^^ "\n%!")
  else Printf.ifprintf stderr fmt

let count t = Hashtbl.length t.states

let ids t = Hashtbl.fold (fun id _ acc -> id :: acc) t.states []

let begin_frame t = t.frame_index <- t.frame_index + 1

let pump t = if Hashtbl.length t.states > 0 then Lui_webview.pump ()

let escape_html s =
  let b = Buffer.create (String.length s + 16) in
  String.iter
    (fun c ->
      match c with
      | '&' -> Buffer.add_string b "&amp;"
      | '<' -> Buffer.add_string b "&lt;"
      | '>' -> Buffer.add_string b "&gt;"
      | '"' -> Buffer.add_string b "&quot;"
      | '\'' -> Buffer.add_string b "&#39;"
      | _ -> Buffer.add_char b c)
    s;
  Buffer.contents b

let http_source s =
  (String.length s > 8 && String.sub s 0 8 = "https://")
  || (String.length s > 7 && String.sub s 0 7 = "http://")

(* Load the original iframe inside a minimal wrapper rather than loading
   the provider URL as the webview's top-level document. YouTube rejects a
   top-level embed with Error 153 because there is no embedding referrer;
   the wrapper gives the real iframe the same document structure it has on
   the web and its base URL supplies the referrer. *)
let wrapper_html ?sandbox source =
  let sandbox_attr =
    match sandbox with
    | Some value -> " sandbox=\"" ^ escape_html value ^ "\""
    | None -> ""
  in
  "<!doctype html><html><head><meta charset=\"utf-8\"><style>\
   html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}\
   iframe{display:block;width:100%;height:100%;border:0}\
   </style></head><body><iframe src=\""
  ^ escape_html source
  ^ "\""
  ^ sandbox_attr
  ^ " allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen referrerpolicy=\"strict-origin-when-cross-origin\"></iframe></body></html>"

let base_url = "https://logseq.com/"

let json_string_member_opt json key =
  match json with
  | `Assoc fields -> (
    match List.assoc_opt key fields with
    | Some (`String value) -> Some value
    | _ -> None)
  | _ -> None

let json_string_member json key =
  match json_string_member_opt json key with
  | Some value -> value
  | None -> ""

let attrs_json store id =
  match Lui_store.string_prop store id "attrs" with
  | Some text -> (try Some (Yojson.Safe.from_string text) with _ -> None)
  | None -> None

let source_of store id =
  match Lui_store.string_prop store id "src" with
  | Some source when source <> "" -> source
  | _ -> (
    match attrs_json store id with
    | Some json -> json_string_member json "src"
    | None -> "")

let sandbox_of store id =
  match attrs_json store id with
  | Some json -> json_string_member_opt json "sandbox"
  | None -> None

let logical_rect scale (r : rect) =
  Lui_webview.rect (r.x /. scale) (r.y /. scale) (r.w /. scale) (r.h /. scale)

let close_view state =
  match state.view with
  | Some view ->
    state.view <- None;
    (try Lui_webview.destroy view with _ -> ())
  | None -> ()

let load view source sandbox =
  Lui_webview.load_html view ~base_url (wrapper_html ?sandbox source)

let ensure t state source sandbox frame =
  match state.view with
  | Some view ->
    if state.source <> source || state.sandbox <> sandbox then begin
      load view source sandbox;
      state.source <- source;
      state.sandbox <- sandbox;
      state.error <- "";
      log "webview reload id=%d src=%s" state.id source
    end;
    Lui_webview.layout_webview view frame;
    Lui_webview.set_visible view true;
    if Lazy.force debug then begin
      let placed = Lui_webview.frame view in
      log "webview layout id=%d host=%.1f,%.1f %.1fx%.1f logical=%.1f,%.1f %.1fx%.1f"
        state.id frame.x frame.y frame.w frame.h placed.x placed.y placed.w placed.h
    end
  | None ->
    if t.backend_error <> "" then begin
      state.source <- source;
      state.error <- t.backend_error
    end
    else if state.error = "" || state.source <> source then
      (try
         let host = t.env.host_window () in
         let view =
           Lui_webview.create host frame
             (Lui_webview.opts (Lui_webview.Html (wrapper_html ?sandbox source, base_url)))
         in
         state.view <- Some view;
         state.source <- source;
         state.sandbox <- sandbox;
         state.error <- "";
         log "webview create id=%d src=%s backend=%s frame=%.1f,%.1f %.1fx%.1f"
           state.id source (Lui_webview.backend_name ()) frame.x frame.y frame.w frame.h
       with
       | Failure message ->
         state.source <- source;
         state.error <- message;
         t.backend_error <- message
       | Invalid_argument message ->
         state.source <- source;
         state.error <- message;
         t.backend_error <- message)

let hide state =
  log "webview hide id=%d" state.id;
  match state.view with
  | Some view -> Lui_webview.set_visible view false
  | None -> ()

let solid_black r =
  Lui_paint.fill r (0., 0., 0., 0.) ~paint:Solid ~c1:(color 0 0 0 255)
    ~c2:(color 0 0 0 255) ~grad:(0., 0., 0., 0.) ~border:(0., 0., 0., 0.)
    ~bcolor:(color 0 0 0 0) ~dashed:false ~alpha:1.

let paint t (ctx : Lui_paint.ctx) store node frame =
  let id = Lui_store.node_id node in
  let source = source_of store id in
  if not (http_source source) then []
  else begin
    let state =
      match Hashtbl.find_opt t.states id with
      | Some state -> state
      | None ->
        let state =
          { id; source = ""; sandbox = None; view = None; error = ""; painted_frame = 0 }
        in
        Hashtbl.replace t.states id state;
        state
    in
    let passive = t.passive_paints > 0 in
    if not passive then state.painted_frame <- t.frame_index;
    (* Provider iframes are CSS-sized to fill their `.video-embed-frame`
       parent on the web. Native layout does not interpret that stylesheet,
       so the raw iframe can measure 560x0 while the typed parent carries
       the real 560x315 rect. Reuse the parent only for missing axes. *)
    let frame =
      if frame.w > 1. && frame.h > 1. then frame
      else
        match Lui_store.parent store id with
        | Some parent ->
          let placement = ctx.hooks.layout parent in
          let parent_rect =
            match placement.Lui_paint.p_override with
            | Some r -> r
            | None -> placement.Lui_paint.p_rect
          in
          rect
            (if frame.w > 1. then frame.x else parent_rect.x)
            (if frame.h > 1. then frame.y else parent_rect.y)
            (if frame.w > 1. then frame.w else parent_rect.w)
            (if frame.h > 1. then frame.h else parent_rect.h)
        | None -> frame
    in
    let clipped = rect_intersect (t.env.clip_of id frame) ctx.viewport in
    let logical = logical_rect ctx.scale clipped in
    if passive then ()
    else if rect_empty clipped || logical.w < 1. || logical.h < 1. then hide state
    else ensure t state source (sandbox_of store id) logical;
    let base = [ solid_black frame ] in
    if state.error = "" then base
    else
      base
      @ ctx.hooks.text_ops id frame (color 252 165 165 255) state.error
  end

let drain_state state =
  match state.view with
  | Some view ->
    List.iter
      (fun event ->
        match event with
        | Lui_webview.Load_error (url, message) ->
          state.error <- message;
          log "webview load error id=%d url=%s error=%s" state.id url message
        | Lui_webview.Did_finish url ->
          log "webview finish id=%d url=%s" state.id url
        | Lui_webview.Did_navigate _ | Lui_webview.Did_commit _
        | Lui_webview.Script_message _ ->
          ())
      (Lui_webview.drain view)
  | None -> ()

let end_frame t store =
  Hashtbl.filter_map_inplace
    (fun id state ->
      if not (Lui_store.mem store id) then begin
        log "webview destroy detached id=%d src=%s" id state.source;
        close_view state;
        None
      end else begin
        if state.painted_frame <> t.frame_index then begin
          log "webview frame mismatch id=%d painted=%d frame=%d" id state.painted_frame t.frame_index;
          hide state
        end;
        drain_state state;
        Some state
      end)
    t.states

let destroy_all t =
  Hashtbl.iter (fun _ state -> close_view state) t.states;
  Hashtbl.reset t.states
