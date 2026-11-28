(* Native rendering needs no JavaScript library initialization for KaTeX or
   code highlighting. YouTube embeds are backed by host webview overlays;
   this module owns the shared timestamp/seek selection semantics and the
   host hooks that operate on those overlays. *)

let youtube_seek_hook : (int -> int -> unit) ref = ref (fun _ _ -> ())
let youtube_time_hook : (int -> Runtime.video_timestamp) ref =
  ref (fun _ -> Runtime.No_video)

let node_id (el : Dom_ext.element) =
  match Dom_ext.num_prop "node-id" el with
  | Some value -> Some (int_of_float value)
  | None -> None

let attr_value (el : Dom_ext.element) name =
  match Dom_ext.prop "attrs" el with
  | Js.Json.JObject fields -> (
      match List.assoc_opt name fields with
      | Some value -> Js.Json.decodeString value
      | None -> None)
  | _ -> None

let contains needle haystack =
  let n = String.length needle and h = String.length haystack in
  let rec loop i =
    i + n <= h
    && (String.sub haystack i n = needle || loop (i + 1))
  in
  n = 0 || loop 0

let youtube_iframe_id (el : Dom_ext.element) =
  if Dom_ext.tag_name el <> "iframe" then None
  else
    match attr_value el "src" with
    | Some src
      when contains "youtube.com" src || contains "youtube-nocookie.com" src ->
        node_id el
    | _ -> None

(* Mirror the web driver's document-order rule: use the last YouTube iframe
   preceding the anchor/active editor. Native snapshots are preorder, so a
   single scan gives the same ordering without compareDocumentPosition. *)
let last_youtube_before (target : Dom_ext.element) =
  let target_id = node_id target in
  let rec scan best = function
    | [] -> best
    | el :: rest ->
        let id = node_id el in
        if target_id <> None && id = target_id then best
        else
          let best =
            match youtube_iframe_id el with
            | Some iframe_id -> Some iframe_id
            | None -> best
          in
          scan best rest
  in
  scan None (!Dom_ext.doc_elements_provider ())

let seconds_of_timestamp text =
  let parts = String.split_on_char ':' text in
  let rec loop acc = function
    | [] -> Some acc
    | part :: rest -> (
        match int_of_string_opt (String.trim part) with
        | Some value -> loop ((acc * 60) + value) rest
        | None -> None)
  in
  loop 0 parts

let timestamp_seconds (anchor : Dom_ext.element) =
  match Dom_ext.query_selector anchor ".youtube-timestamp-label" with
  | Some label -> (
      match Dom_ext.str_prop "text" label with
      | Some text -> seconds_of_timestamp text
      | None -> None)
  | None -> None

let seek_anchor anchor =
  match timestamp_seconds anchor with
  | Some seconds -> (
      match last_youtube_before anchor with
      | Some iframe_id -> !youtube_seek_hook iframe_id seconds
      | None -> ())
  | None -> ()

let on_doc_click ev =
  match Dom_ext.target ev with
  | Some target -> (
      match Dom_ext.closest target "a.youtube-timestamp" with
      | Some anchor ->
          Dom_ext.prevent_default ev;
          Dom_ext.stop_propagation ev;
          seek_anchor anchor
      | None -> ())
  | None -> ()

let video_timestamp () =
  match Dom_ext.active_element () with
  | None -> Runtime.No_video
  | Some active -> (
      match last_youtube_before active with
      | Some iframe_id -> !youtube_time_hook iframe_id
      | None -> Runtime.No_video)

let installed = ref false

let ensure () : unit =
  if not !installed then begin
    installed := true;
    Runtime.video_timestamp := video_timestamp;
    Dom_ext.add_document_listener "click" on_doc_click true
  end
