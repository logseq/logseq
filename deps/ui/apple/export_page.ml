(* Native port of export/export_page.ml — canvas/blob externals are
   stubbed; clipboard goes through the host; download_blob via dom-op. *)

module B = Browser_ui
open Promise_ext
module W = Wire
module S = Export_state
module F = Export_formats

(* html2canvas has no native port — the "snapshot-png" dom-op snaps
   the live view into a temp PNG on the host and reports
   "snapshot-png-done" {req, path} as a platform event. A canvas is the
   png path; a blob is an int token keyed to that path. *)

let snapshot_waiters : (int, string -> unit) Hashtbl.t =
  Hashtbl.create 4
let snapshot_installed = ref false
let next_req = ref 0

let install_snapshot_listener () =
  if not !snapshot_installed then begin
    snapshot_installed := true;
    Platform.add_event_listener "snapshot-png-done" (fun payload ->
        match payload with
        | Js.Json.JObject kvs -> (
            match List.assoc_opt "req" kvs, List.assoc_opt "path" kvs
            with
            | Some (Js.Json.JNumber req), Some (Js.Json.JString path)
              -> (
                match
                  Hashtbl.find_opt snapshot_waiters
                    (int_of_float req)
                with
                | Some f ->
                    Hashtbl.remove snapshot_waiters (int_of_float req);
                    f path
                | None -> ())
            | _ -> ())
        | _ -> ())
  end

let snapshot_png ~(sel : string) : string Js.Promise.t =
  install_snapshot_listener ();
  Js.Promise.make (fun ~resolve ~reject:_ ->
      incr next_req;
      Hashtbl.replace snapshot_waiters !next_req resolve;
      Host.dom_op "snapshot-png"
        (Js.Json.stringify
           (Js.Json.JObject
              [ ( "ref"
                , Js.Json.JObject [ "#ref", Js.Json.JString sel ] )
              ; ("req", Js.Json.JNumber (float_of_int !next_req)) ])))

type canvas = string

let html2canvas_ (el : B.E.t) (_ : Js.Json.t) : canvas Js.Promise.t =
  match B.ref_id_of el with
  | Some sel -> snapshot_png ~sel
  | None -> Js.Promise.resolve ""

(* blob tokens → png path so clipboard_write_png/download_blob can
   hand the host a real file *)
let blob_paths : (int, string) Hashtbl.t = Hashtbl.create 4
let next_blob = ref 0

let blob_of_path (path : string) : Webapi.Blob.t =
  incr next_blob;
  Hashtbl.replace blob_paths !next_blob path;
  !next_blob

let blob_path (b : Webapi.Blob.t) : string =
  Option.value (Hashtbl.find_opt blob_paths b) ~default:""

let canvas_to_blob (path : canvas) (cb : 'a Js.Nullable.t -> unit)
    (_ : string) : unit =
  if path = "" then cb Js.Nullable.null
  else cb (Js.Nullable.return (blob_of_path path))

let computed_style (_ : B.E.t) : Js.Json.t = Js.Json.JObject []
let css_prop (_ : Js.Json.t) (_ : string) : string = ""
let el_scroll_height (_ : B.E.t) : float = 0.
let body_el : B.E.t = 0
let blob_as_file (b : Webapi.Blob.t) : Webapi.File.t = b

let clipboard_write_png (b : Webapi.Blob.t) : unit Js.Promise.t =
  let path = blob_path b in
  if path <> "" then
    Host.dom_op "clipboard-write-png"
      (Js.Json.stringify
         (Js.Json.JObject [ "path", Js.Json.JString path ]));
  Js.Promise.resolve ()

(* cljs export-common/get-content-config defaults *)
let content_config =
  W.Map
    [ (W.kw "export-bullet-indentation", W.String "\t")
    ; (W.kw "date-formatter", W.String "MMM do, yyyy")
    ; (W.kw "encode-highlight-as-mark?", W.Bool true) ]

let indent_unit = "\t"

let repo () =
  match !Runtime.current_repo with
  | Some r -> r
  | None -> "logseq_db_Demo"

let uuids_v st =
  match st.S.page_uuid with Some u -> W.List [ W.Uuid u ] | None -> W.List []

let tree_opts_v (st : S.t) =
  W.Map
    [ (W.kw "open-blocks-only?", W.Bool st.open_blocks_only)
    ; ( W.kw "include-properties?"
      , W.Bool (not (List.mem "property" st.remove_options)) ) ]

let options_v (st : S.t) =
  W.Map
    [ ( W.kw "remove-options"
      , W.Set (List.map (fun k -> W.Keyword k) st.remove_options) )
    ; (W.kw "indent-style", W.String st.indent_style)
    ; ( W.kw "other-options"
      , W.Map
          [ (W.kw "newline-after-block", W.Bool st.newline_after_block)
          ; (W.kw "open-blocks-only", W.Bool st.open_blocks_only)
          ; ( W.kw "keep-only-level<=N"
            , match st.level_lte with
              | None -> W.Keyword "all"
              | Some n -> W.Int n ) ] ) ]

let map_str w k =
  match w with
  | W.Map kvs -> (
      match
        List.find_map
          (fun (kk, v) ->
            match (kk, v) with
            | (W.String s | W.Keyword s), W.String v when s = k -> Some v
            | _ -> None)
          kvs
      with
      | Some v -> v
      | None -> "")
  | _ -> ""

let export_text (st : S.t) =
  let* w =
    Runtime.invoke "thread-api/export-blocks-as-format"
      [ W.String (repo ())
      ; uuids_v st
      ; W.Keyword "markdown"
      ; options_v st
      ; content_config ]
  in
  Js.Promise.resolve (Option.value ~default:"" (W.as_string w))

let export_structured (st : S.t) =
  let* w =
    Runtime.invoke "thread-api/export-get-blocks-data"
      [ W.String (repo ()); uuids_v st; tree_opts_v st; content_config ]
  in
  let content = map_str w "content" in
  let title = map_str w "title" in
  Js.Promise.resolve
    (match st.fmt with
     | S.Opml -> F.opml ~title ~indent_unit content
     | S.Html -> F.html ~indent_unit content
     | _ -> content)

let export_edn (st : S.t) =
  let page_id =
    match st.page_uuid with
    | Some u -> W.List [ W.Keyword "block/uuid"; W.Uuid u ]
    | None -> (
        match st.page_db_id with
        | Some id -> W.Int id
        | None -> W.Nil)
  in
  let* w =
    Runtime.invoke2 "thread-api/export-edn" (W.String (repo ()))
      (W.Map [ (W.kw "export-type", W.Keyword "page"); (W.kw "page-id", page_id) ])
  in
  Js.Promise.resolve (Edn.to_string w)

(* cljs get-image-blob for a page export — selector is always
   #main-content-container; page zoom/x/y/width/height cljs pulls from
   the block-selection path do not apply here (scale 1, x/y 0) *)
let export_png (st : S.t Signal.state) =
  Signal.update st (fun s -> { s with png = None });
  Runtime.flush ();
  match B.qs "#main-content-container" with
  | None -> ()
  | Some container ->
      let cur = Signal.get_state st in
      let background =
        if cur.S.png_transparent then "transparent"
        else
          match
            css_prop
              (computed_style body_el)
              "--ls-primary-background-color"
          with
          | "" -> "transparent"
          | v -> v
      in
      let options =
        B.json_props
          [ "allowTaint", Js.Json.boolean true
          ; "useCORS", Js.Json.boolean true
          ; "backgroundColor", B.str_to_json background
          ; "x", Js.Json.number 0.
          ; "y", Js.Json.number 0.
          ; "width", Js.Json.null
          ; "height", Js.Json.null
          ; "scrollX", Js.Json.number 0.
          ; "scrollY", Js.Json.number 0.
          ; "scale", Js.Json.number 1.
          ; "windowHeight", Js.Json.number (el_scroll_height container) ]
      in
      (let* cv = html2canvas_ container options in
       canvas_to_blob cv
         (fun blob ->
           match Js.Nullable.toOption blob with
           | Some blob ->
               let url = blob_path blob in
               Signal.update st (fun s ->
                   { s with png = Some blob; png_url = Some url });
               Runtime.flush ();
               (* cljs sets img#export-preview .src imperatively; the
                  reactive attrs in export_view also carry it *)
               (match B.qs "#export-preview" with
                | Some img -> B.set_attr img "src" url
                | None -> ())
           | None -> ())
         "image/png";
       Js.Promise.resolve ())
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
      |> ignore

let set_png_transparent (st : S.t Signal.state) =
  Signal.update st (fun s ->
      { s with png_transparent = not s.png_transparent });
  Runtime.flush ();
  export_png st

(* cljs reset-export-content! — refetch when tab/options change *)
let regen (st : S.t Signal.state) =
  let cur = Signal.get_state st in
  Signal.update st (fun s -> { s with copied = false });
  match cur.fmt with
  | S.Png -> export_png st
  | _ ->
      let p =
        match cur.fmt with
        | S.Text -> export_text cur
        | S.Opml | S.Html -> export_structured cur
        | S.Edn -> export_edn cur
        | S.Png -> Js.Promise.resolve ""
      in
      (let* content = p in
      Signal.update st (fun s -> { s with content = Some content });
      Runtime.flush ();
      Js.Promise.resolve ())
      |> Js.Promise.catch (fun _ ->
             Signal.update st (fun s ->
                 { s with content = Some "<export failed>" });
             Runtime.flush ();
             Js.Promise.resolve ())
      |> ignore

let set_fmt (st : S.t Signal.state) fmt =
  Signal.update st (fun s -> { s with fmt; copied = false });
  Runtime.flush ();
  regen st

let opt_change (st : S.t Signal.state) f =
  Signal.update st f;
  S.persist (Signal.get_state st);
  Runtime.flush ();
  regen st

let clipboard_write (s : string) : unit Js.Promise.t =
  Host.clipboard_write s; Js.Promise.resolve ()

let copied_flash (st : S.t Signal.state) p =
  (let* _ = p in
  Signal.update st (fun s -> { s with copied = true });
  Runtime.flush ();
  B.later ~ms:2000 (fun () ->
      Signal.update st (fun s -> { s with copied = false });
      Runtime.flush ());
  Js.Promise.resolve ())
  |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
  |> ignore

(* cljs :on-click #(copy-to-clipboard content) — e2e reads the textarea *)
let copy (st : S.t Signal.state) =
  match (Signal.get_state st).content with
  | Some c -> copied_flash st (clipboard_write c)
  | None -> ()

(* cljs ClipboardItem path for the png blob *)
let copy_png (st : S.t Signal.state) =
  match (Signal.get_state st).png with
  | Some b -> copied_flash st (clipboard_write_png b)
  | None -> ()

let download_blob ~filename (blob : Webapi.Blob.t) =
  let path = blob_path blob in
  if path <> "" then
    Host.dom_op "save-file-binary"
      (Js.Json.stringify
         (Js.Json.JObject
            [ "path", Js.Json.JString path
            ; "filename", Js.Json.JString filename ]))

(* cljs filename: "logseq_" + (t/now) + ext — txt for text else format *)
let save_to_file (st : S.t Signal.state) =
  let cur = Signal.get_state st in
  match cur.fmt, cur.content, cur.png with
  | S.Png, _, Some blob ->
      download_blob
        ~filename:
          (Printf.sprintf "logseq_%s.png" (B.fmt_time (B.now_ms ())))
        blob
  | S.Png, _, None -> ()
  | _, Some content, _ ->
      let ext =
        match cur.fmt with
        | S.Text -> "txt"
        | S.Opml -> "opml"
        | S.Html -> "html"
        | S.Edn -> "edn"
        | S.Png -> "png"
      in
      let mime =
        match cur.fmt with
        | S.Text -> "text/plain"
        | S.Opml -> "text/xml"
        | S.Html -> "text/html"
        | S.Edn -> "text/plain"
        | S.Png -> "image/png"
      in
      B.download_text
        ~filename:
          (Printf.sprintf "logseq_%s.%s" (B.fmt_time (B.now_ms ())) ext)
        ~mime content
  | _, None, _ -> ()
