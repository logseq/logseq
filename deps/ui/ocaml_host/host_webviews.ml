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
  occluded : rect -> bool;
}

type state = {
  id : int;
  mutable source : string;
  mutable sandbox : string option;
  mutable view : Lui_webview.t option;
  mutable error : string;
  mutable painted_frame : int;
  mutable player_ready : bool;
  mutable playback_seconds : float;
  mutable playback_state : int;
  mutable playback_rate : float;
  mutable playback_wall_at : float;
  mutable player_poll_at : float;
}

type t = {
  env : env;
  states : (int, state) Hashtbl.t;
  pending_seeks : (int, int) Hashtbl.t;
  mutable frame_index : int;
  mutable backend_error : string;
  mutable passive_paints : int;
}

let create env =
  { env; states = Hashtbl.create 8; pending_seeks = Hashtbl.create 4
  ; frame_index = 0; backend_error = ""; passive_paints = 0 }

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

let url_host source =
  let rest =
    if String.length source > 8 && String.sub source 0 8 = "https://" then
      Some (String.sub source 8 (String.length source - 8))
    else if String.length source > 7 && String.sub source 0 7 = "http://" then
      Some (String.sub source 7 (String.length source - 7))
    else None
  in
  match rest with
  | None -> None
  | Some rest ->
      let authority_end = ref (String.length rest) in
      String.iteri
        (fun i c ->
          if (c = '/' || c = '?' || c = '#') && i < !authority_end then
            authority_end := i)
        rest;
      let authority = String.sub rest 0 !authority_end in
      let hostport =
        match String.rindex_opt authority '@' with
        | Some at ->
            String.sub authority (at + 1) (String.length authority - at - 1)
        | None -> authority
      in
      let host =
        match String.index_opt hostport ':' with
        | Some colon -> String.sub hostport 0 colon
        | None -> hostport
      in
      Some (String.lowercase_ascii host)

let ends_with s suf =
  let n = String.length suf and h = String.length s in
  h >= n && String.sub s (h - n) n = suf

let domain_or_subdomain host domain = host = domain || ends_with host ("." ^ domain)

let youtube_source source =
  match url_host source with
  | Some host ->
      domain_or_subdomain host "youtube.com"
      || domain_or_subdomain host "youtube-nocookie.com"
  | None -> false

let player_poll_interval = 0.5

let reset_player state =
  state.player_ready <- false;
  state.playback_seconds <- 0.;
  state.playback_state <- -1;
  state.playback_rate <- 1.;
  state.playback_wall_at <- 0.;
  state.player_poll_at <- 0.

let perform_seek view seconds =
  let js =
    Printf.sprintf
      "(function(){var sec=%d;var frame=document.getElementById('logseq-embed-player');if(window.logseqPlayer&&window.logseqPlayer.seekTo){window.logseqPlayer.seekTo(sec,true);return}if(frame&&frame.contentWindow){frame.contentWindow.postMessage(JSON.stringify({event:'command',func:'seekTo',args:[sec,true]}),'*')}})()"
      (max 0 seconds)
  in
  try Lui_webview.eval view js
  with exn -> log "youtube seek eval failed: %s" (Printexc.to_string exn)

let poll_player t state view =
  if youtube_source state.source then begin
    let now = Unix.gettimeofday () in
    if now -. state.player_poll_at >= player_poll_interval then begin
      state.player_poll_at <- now;
      try
        Lui_webview.call_async view
          "return (window.logseqPlayerReady && window.logseqPlayer && typeof window.logseqPlayer.getCurrentTime === 'function') ? [window.logseqPlayer.getCurrentTime(), window.logseqPlayer.getPlayerState(), (typeof window.logseqPlayer.getPlaybackRate === 'function' ? window.logseqPlayer.getPlaybackRate() : null)] : [-1, -1, 1]"
          (fun result ->
            let sample =
              try
                match Yojson.Safe.from_string result with
                | `List [time; player_state; playback_rate] ->
                    let number = function
                      | `Float value -> Some value
                      | `Int value -> Some (float_of_int value)
                      | _ -> None
                    in
                    let integer = function
                      | `Int value -> Some value
                      | `Float value -> Some (int_of_float value)
                      | _ -> None
                    in
                    (match number time, integer player_state, number playback_rate with
                     | Some seconds, Some player_state, Some playback_rate
                       when playback_rate > 0. ->
                         Some (seconds, player_state, playback_rate)
                     | _ -> None)
                | _ -> None
              with _ -> None
            in
            match sample with
            | Some (seconds, player_state, playback_rate) when seconds >= 0. ->
              if not state.player_ready then
                log "youtube player ready id=%d seconds=%.1f" state.id seconds;
              state.player_ready <- true;
              state.playback_seconds <- seconds;
              state.playback_state <- player_state;
              state.playback_rate <- playback_rate;
              state.playback_wall_at <- Unix.gettimeofday ();
              (match Hashtbl.find_opt t.pending_seeks state.id with
               | Some pending ->
                   Hashtbl.remove t.pending_seeks state.id;
                   log "youtube apply pending seek id=%d seconds=%d" state.id pending;
                   perform_seek view pending
               | None -> ())
            | _ ->
              state.player_ready <- false;
              state.playback_seconds <- 0.;
              state.playback_state <- -1;
              state.playback_rate <- 1.;
              state.playback_wall_at <- 0.)
      with exn -> log "youtube playback poll failed: %s" (Printexc.to_string exn)
    end
  end

let pump t =
  if Hashtbl.length t.states > 0 then begin
    Hashtbl.iter
      (fun _ state ->
        match state.view with
        | Some view -> poll_player t state view
        | None -> ())
      t.states;
    Lui_webview.pump ()
  end

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
let youtube_driver_script source =
  if not (youtube_source source) then ""
  else
    "<script>(function(){\
     window.logseqPlayerReady=false;window.logseqPlayer=null;\
     window.onYouTubeIframeAPIReady=function(){\
     var frame=document.getElementById('logseq-embed-player');\
     if(frame&&window.YT&&YT.Player){\
     window.logseqPlayer=new YT.Player(frame,{events:{onReady:function(){window.logseqPlayerReady=true}}});\
     }};\
     var tag=document.createElement('script');\
     tag.src='https://www.youtube.com/iframe_api';\
     document.head.appendChild(tag);\
     })();</script>"

let wrapper_html ?sandbox source =
  let sandbox_attr =
    match sandbox with
    | Some value -> " sandbox=\"" ^ escape_html value ^ "\""
    | None -> ""
  in
  "<!doctype html><html><head><meta charset=\"utf-8\"><style>\
   html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}\
   iframe{display:block;width:100%;height:100%;border:0}\
   </style></head><body><iframe id=\"logseq-embed-player\" src=\""
  ^ escape_html source
  ^ "\""
  ^ sandbox_attr
  ^ " allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen referrerpolicy=\"strict-origin-when-cross-origin\"></iframe>"
  ^ youtube_driver_script source
  ^ "</body></html>"

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


let has_prefix s prefix =
  String.length s >= String.length prefix
  && String.sub s 0 (String.length prefix) = prefix

(* Backend/environment initialization failures are permanent for this host
   window. Per-controller creation failures (notably WebView2) can be
   transient and must not disable unrelated later embeds. *)
let permanent_backend_error message =
  let prefix = "lui_webview: " in
  let message =
    if has_prefix message prefix then
      String.sub message (String.length prefix)
        (String.length message - String.length prefix)
    else message
  in
  List.exists (has_prefix message)
    [ "cannot load "; "missing symbol "; "gtk_init_check failed"
    ; "SDL3 window is not "; "SDL3 window is NULL"
    ; "built without SDL3"; "host is not "; "host window has no contentView"
    ; "no webview backend"; "WebView2Loader.dll not found" ]

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
      reset_player state;
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
         reset_player state;
         log "webview create id=%d src=%s backend=%s frame=%.1f,%.1f %.1fx%.1f"
           state.id source (Lui_webview.backend_name ()) frame.x frame.y frame.w frame.h
       with
       | Failure message ->
         state.source <- source;
         state.error <- message;
         if permanent_backend_error message then t.backend_error <- message
       | Invalid_argument message ->
         state.source <- source;
         state.error <- message;
         if permanent_backend_error message then t.backend_error <- message)

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
          { id; source = ""; sandbox = None; view = None; error = ""; painted_frame = 0
        ; player_ready = false; playback_seconds = 0.; playback_state = -1; playback_rate = 1.; playback_wall_at = 0.; player_poll_at = 0. }
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
    let occluded = t.env.occluded clipped in
    if passive then ()
    else if rect_empty clipped || logical.w < 1. || logical.h < 1. then hide state
    else if occluded then hide state
    else ensure t state source (sandbox_of store id) logical;
    (* The black backing exists only behind a live overlay; when occlusion
       hides that overlay, leave the page background visible instead. *)
    let base = if occluded then [] else [ solid_black frame ] in
    if state.error = "" then base
    else
      base
      @ ctx.hooks.text_ops id frame (color 252 165 165 255) state.error
  end

let seek_youtube t id seconds =
  let seconds = max 0 seconds in
  match Hashtbl.find_opt t.states id with
  | Some { view = Some view; source; player_ready = true; _ }
    when youtube_source source ->
      log "youtube seek id=%d seconds=%d" id seconds;
      perform_seek view seconds
  | Some { view = Some view; source; _ } when youtube_source source ->
      Hashtbl.replace t.pending_seeks id seconds;
      log "youtube seek id=%d seconds=%d" id seconds;
      perform_seek view seconds
  | _ -> Hashtbl.replace t.pending_seeks id seconds

let playback_time t id =
  match Hashtbl.find_opt t.states id with
  | Some state when youtube_source state.source ->
      if not state.player_ready then Runtime.Player_pending
      else
        let seconds =
          if state.playback_state = 1 then
            state.playback_seconds
            +. ((Unix.gettimeofday () -. state.playback_wall_at) *. state.playback_rate)
          else state.playback_seconds
        in
        Runtime.Playback_time (max 0 (int_of_float (floor seconds)))
  | _ -> Runtime.No_video

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
    (fun id seconds ->
      if Lui_store.mem store id then Some seconds else None)
    t.pending_seeks;
  Hashtbl.filter_map_inplace
    (fun id state ->
      if not (Lui_store.mem store id) then begin
        log "webview destroy detached id=%d src=%s" id state.source;
        close_view state;
        Hashtbl.remove t.pending_seeks id;
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
  Hashtbl.reset t.states;
  Hashtbl.reset t.pending_seeks
