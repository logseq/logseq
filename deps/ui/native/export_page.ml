(* Native page export uses worker serializers and authorized host downloads. *)

open Promise_ext
module W = Wire
module S = Export_state
module F = Export_formats

let png_unavailable () =
  Toast.error (I18n.t1 "file/format-not-supported" "PNG")

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
  | None -> failwith "Page export requires an open graph"

let uuids_v st =
  match st.S.block_uuids with
  | [] -> (
      match st.S.page_uuid with
      | Some u -> W.List [ W.Uuid u ]
      | None -> W.List [])
  | us -> W.List (List.map (fun u -> W.Uuid u) us)

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
  let uuid_id u = W.List [ W.Keyword "block/uuid"; W.Uuid u ] in
  let options_v =
    match st.block_uuids with
    | [ u ] ->
        (* cljs <export-edn-helper :block — no validation *)
        W.Map
          [ (W.kw "export-type", W.Keyword "block")
          ; (W.kw "block-id", uuid_id u) ]
    | _ :: _ as us ->
        W.Map
          [ (W.kw "export-type", W.Keyword "selected-nodes")
          ; (W.kw "node-ids", W.List (List.map uuid_id us)) ]
    | [] ->
        let page_id =
          match st.page_uuid with
          | Some u -> uuid_id u
          | None -> (
              match st.page_db_id with
              | Some id -> W.Int id
              | None -> W.Nil)
        in
        W.Map
          [ (W.kw "export-type", W.Keyword "page")
          ; (W.kw "page-id", page_id) ]
  in
  let* w =
    Runtime.invoke2 "thread-api/export-edn" (W.String (repo ()))
      options_v
  in
  Js.Promise.resolve (Edn.to_string w)

let export_png (st : S.t Signal.state) =
  S.mutate st (fun s -> { s with png = None; png_url = None });
  Runtime.flush ();
  png_unavailable ()

let set_png_transparent (st : S.t Signal.state) =
  S.mutate st (fun s ->
      { s with png_transparent = not s.png_transparent });
  Runtime.flush ();
  export_png st

let generation = ref 0

(* cljs reset-export-content! — refetch when tab/options change *)
let regen (st : S.t Signal.state) =
  let cur = S.cur st in
  incr generation;
  let request = !generation and graph = Runtime.repo () in
  let current () = request = !generation && graph = Runtime.repo () in
  S.mutate st (fun s -> { s with copied = false; content = None });
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
      if current () then (
        S.mutate st (fun s -> { s with content = Some content });
        Runtime.flush ());
      Js.Promise.resolve ())
      |> Js.Promise.catch (fun error ->
             if current () then (
               Ui_services.log_error ("Page export failed", error);
               Toast.error (I18n.t1 "ui/error-boundary-error" "page-export:failed"));
             Js.Promise.resolve ())
      |> ignore

let set_fmt (st : S.t Signal.state) fmt =
  S.mutate st (fun s -> { s with fmt; copied = false });
  Runtime.flush ();
  regen st

let opt_change (st : S.t Signal.state) f =
  S.mutate st f;
  S.persist (S.cur st);
  Runtime.flush ();
  regen st

let clipboard_write (s : string) : unit Js.Promise.t =
  Host.clipboard_write s; Js.Promise.resolve ()

let copied_flash (st : S.t Signal.state) p =
  (let* _ = p in
  S.mutate st (fun s -> { s with copied = true });
  Runtime.flush ();
  ignore (Host.set_timeout (fun () ->
      S.mutate st (fun s -> { s with copied = false });
      Runtime.flush ()) 2000);
  Js.Promise.resolve ())
  |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
  |> ignore

(* cljs :on-click #(copy-to-clipboard content) — e2e reads the textarea *)
let copy (st : S.t Signal.state) =
  match (S.cur st).content with
  | Some c -> copied_flash st (clipboard_write c)
  | None -> ()

(* cljs ClipboardItem path for the png blob *)
let copy_png (_st : S.t Signal.state) = png_unavailable ()

let save_to_file (st : S.t Signal.state) =
  let cur = S.cur st in
  match cur.fmt, cur.content with
  | S.Png, _ -> png_unavailable ()
  | _, None -> ()
  | fmt, Some content ->
      let ext, mime =
        match fmt with
        | S.Text -> "txt", "text/plain"
        | S.Opml -> "opml", "text/xml"
        | S.Html -> "html", "text/html"
        | S.Edn -> "edn", "application/edn"
        | S.Png -> assert false
      in
      let filename =
        Printf.sprintf "logseq_%Ld.%s"
          (Int64.of_float (Ui_services.time_now ())) ext
      in
      Ui_services.files_download_text ~filename ~mime content
