(* Page export plumbing — cljs components/export.cljs
   reset-export-content! + <export-edn-helper + copy/save. Text goes
   through :thread-api/export-blocks-as-format :markdown; OPML/HTML get
   :thread-api/export-get-blocks-data and are formatted client-side in
   Export_formats (mldoc is native-only); EDN via :thread-api/export-edn. *)

module W = Wire
module B = Browser_ui
module S = Export_state
module F = Export_formats

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
  Runtime.invoke "thread-api/export-blocks-as-format"
    [ W.String (repo ())
    ; uuids_v st
    ; W.Keyword "markdown"
    ; options_v st
    ; content_config ]
  |> Js.Promise.then_ (fun w ->
         Js.Promise.resolve (Option.value ~default:"" (W.as_string w)))

let export_structured (st : S.t) =
  Runtime.invoke "thread-api/export-get-blocks-data"
    [ W.String (repo ()); uuids_v st; tree_opts_v st; content_config ]
  |> Js.Promise.then_ (fun w ->
         let content = map_str w "content" in
         let title = map_str w "title" in
         Js.Promise.resolve
           (match st.fmt with
            | S.Opml -> F.opml ~title ~indent_unit content
            | S.Html -> F.html ~indent_unit content
            | _ -> content))

let export_edn (st : S.t) =
  let page_id =
    match st.page_uuid with
    | Some u -> W.List [ W.Keyword "block/uuid"; W.Uuid u ]
    | None -> (
        match st.page_db_id with
        | Some id -> W.Int id
        | None -> W.Nil)
  in
  Runtime.invoke2 "thread-api/export-edn" (W.String (repo ()))
    (W.Map [ (W.kw "export-type", W.Keyword "page"); (W.kw "page-id", page_id) ])
  |> Js.Promise.then_ (fun w -> Js.Promise.resolve (Edn.to_string w))

(* cljs reset-export-content! — refetch when tab/options change *)
let regen (st : S.t Signal.state) =
  let cur = Signal.get_state st in
  Signal.update st (fun s -> { s with copied = false });
  let p =
    match cur.fmt with
    | S.Text -> export_text cur
    | S.Opml | S.Html -> export_structured cur
    | S.Edn -> export_edn cur
  in
  p
  |> Js.Promise.then_ (fun content ->
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

external clipboard_write : string -> unit Js.Promise.t
  = "navigator.clipboard.writeText"

(* cljs :on-click #(copy-to-clipboard content) — e2e reads the textarea *)
let copy (st : S.t Signal.state) =
  match (Signal.get_state st).content with
  | Some c ->
      clipboard_write c
      |> Js.Promise.then_ (fun _ ->
             Signal.update st (fun s -> { s with copied = true });
             Runtime.flush ();
             B.later ~ms:2000 (fun () ->
                 Signal.update st (fun s -> { s with copied = false });
                 Runtime.flush ());
             Js.Promise.resolve ())
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
      |> ignore
  | None -> ()

(* cljs filename: "logseq_" + (t/now) + ext — txt for text else format *)
let save_to_file (st : S.t Signal.state) =
  let cur = Signal.get_state st in
  match cur.content with
  | Some content ->
      let ext =
        match cur.fmt with
        | S.Text -> "txt"
        | S.Opml -> "opml"
        | S.Html -> "html"
        | S.Edn -> "edn"
      in
      let mime =
        match cur.fmt with
        | S.Text -> "text/plain"
        | S.Opml -> "text/xml"
        | S.Html -> "text/html"
        | S.Edn -> "text/plain"
      in
      B.download_text
        ~filename:
          (Printf.sprintf "logseq_%s.%s" (B.fmt_time (B.now_ms ())) ext)
        ~mime content
  | None -> ()
