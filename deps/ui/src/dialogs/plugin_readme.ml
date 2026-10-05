(* plugin-readme dialog — cljs plugins.cljs open-readme! +
   local/remote-readme-display.

   Items carrying :repo open remote-readme-display (iframe
   ./marketplace.html?repo=). Repo-less items go through
   local-markdown-display: the readme renders as sanitized HTML inside
   .cp__plugins-details.

   Web deviations from cljs (documented in docs/migrate-report.md):
   - load_plugin_readme is a web stub (Plugin_host nil_fn), so the
     readme is fetched from the item's :url like marketplace.html does:
     raw.githubusercontent.com master|main README.md|readme.md for
     owner/repo urls, <url>/readme.md then <url>/README.md for http(s)
     urls.
   - markdown is parsed with window.marked + DOMPurify (the same
     pipeline marketplace.html runs in the iframe) instead of mldoc
     format/to-html.
   - readme <a> clicks open a new window since apis.openExternal only
     exists inside the plugin sandbox. *)

open Lui_elements
open Promise_ext
let dom = Logseq_dom.dom

external fetch_ : string -> Js.Json.t Js.Promise.t = "fetch"
  [@@mel.scope "window"]

external resp_status : Js.Json.t -> int = "status" [@@mel.get]
external resp_text : Js.Json.t -> string Js.Promise.t = "text" [@@mel.send]

type target =
  { url : string
  ; repo : string
  ; repository : string
  ; html : string }

let pending : target option ref = ref None

(* -- readme fetch, mirroring resources/marketplace.html -- *)

let endpoints url =
  let gh repo =
    let base = "https://raw.githubusercontent.com/" ^ repo in
    [ base ^ "/master/README.md"; base ^ "/main/README.md"
    ; base ^ "/master/readme.md"; base ^ "/main/readme.md" ]
  in
  if
    String.length url > 0
    && url.[0] <> '/'
    && not (I18n.contains_ci url "://")
  then (
    match String.split_on_char '/' url with
    | [ _; _ ] -> gh url
    | _ -> [])
  else if I18n.contains_ci url "://" then
    [ url ^ "/readme.md"; url ^ "/README.md" ]
  else []

let rec fetch_first urls : (string * string) option Js.Promise.t =
  match urls with
  | [] -> Js.Promise.resolve None
  | u :: rest ->
      (let* r = fetch_ u in
       if resp_status r = 200 then
         let* s = resp_text r in
         Js.Promise.resolve (Some (u, s))
       else fetch_first rest)
      |> Js.Promise.catch (fun _ -> fetch_first rest)

let strip_dots s =
  let rec go s =
    if String.length s >= 2 && String.sub s 0 2 = "./" then
      go (String.sub s 2 (String.length s - 2))
    else s
  in
  go s

(* cljs parse-user-md-content rewrites ![alt](href "title") whose href
   does not start with "http" against the plugin url *)
let abs_image_links dir content =
  let n = String.length content in
  let b = Buffer.create (n + 64) in
  let find_from ch i =
    let rec go j =
      if j >= n then None else if content.[j] = ch then Some j else go (j + 1)
    in
    go i
  in
  let rec emit i =
    if i >= n then ()
    else if i + 1 < n && content.[i] = '!' && content.[i + 1] = '[' then
      match find_from ']' (i + 2) with
      | Some j when j + 1 < n && content.[j + 1] = '(' -> (
          match find_from ')' (j + 2) with
          | Some k ->
              let inner =
                String.trim (String.sub content (j + 2) (k - j - 2))
              in
              let href, rest =
                match String.index_opt inner ' ' with
                | Some p ->
                    ( String.sub inner 0 p
                    , String.sub inner p (String.length inner - p) )
                | None -> (inner, "")
              in
              if
                href <> ""
                && not
                     (String.length href >= 4
                      && String.sub href 0 4 = "http")
              then (
                Buffer.add_string b "![";
                Buffer.add_substring b content (i + 2) (j - i - 2);
                Buffer.add_string b "](";
                Buffer.add_string b (dir ^ strip_dots href);
                Buffer.add_string b rest;
                Buffer.add_char b ')';
                emit (k + 1))
              else (
                Buffer.add_substring b content i (k + 1 - i);
                emit (k + 1))
          | None -> (
              Buffer.add_char b content.[i];
              emit (i + 1)))
      | _ -> (
          Buffer.add_char b content.[i];
          emit (i + 1))
    else (
      Buffer.add_char b content.[i];
      emit (i + 1))
  in
  emit 0;
  Buffer.contents b

let readme_html url : string option Js.Promise.t =
  let* found = fetch_first (endpoints url) in
  match found with
  | Some (readme_url, md) when String.trim md <> "" ->
      let dir =
        match String.rindex_opt readme_url '/' with
        | Some i -> String.sub readme_url 0 (i + 1)
        | None -> readme_url ^ "/"
      in
      Js.Promise.resolve
        (Some (Markdown.markdown_to_html (abs_image_links dir md)))
  | _ -> Js.Promise.resolve None

(* cljs open-readme! *)
let open_readme (item : Js.Json.t) =
  let open Plugin_host in
  let url = jstr item "url" in
  let repo = jstr item "repo" in
  let repository =
    let r = jstr item "repository" in
    if r <> "" then r else jstr (getf item "repository") "url"
  in
  if repo <> "" then (
    pending := Some { url; repo; repository; html = "" };
    Dialogs_state.open_ "plugin-readme")
  else
    ignore
      (let* html = readme_html url in
       match html with
       | Some html ->
           pending := Some { url; repo = ""; repository; html };
           Dialogs_state.open_ "plugin-readme";
           (match Web_dom.query_selector "#ls-plugin-readme-content" with
            | Some el -> Web_dom.el_set_inner_html el html
            | None -> ());
           Js.Promise.resolve ()
       | None ->
           Toast.warning I18n.plugin_readme_empty;
           Js.Promise.resolve ())

(* cljs local-markdown-display *)
let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  (match !pending with
   | Some t when t.repo <> "" ->
       (* cljs remote-readme-display *)
       dom ~key:"readme-frame" ~tag:"iframe"
         ~style_class:"lsp-frame-readme"
         ~attrs:[ ("src", "./marketplace.html?repo=" ^ t.repo) ]
         []
   | Some t ->
       dom ~key:"rd" ~style_class:"cp__plugins-details"
         ~attrs:[ ("data-capture-click", "") ]
         ~events:"click"
         ~on_dom_event:(fun name payload ->
           if name = "click" then
          let href = Platform.payload_str payload "href" in
          if String.trim href <> "" then Web_dom.win_open href)
         [ (if t.repository = "" then Logseq_dom.nothing
            else
              dom ~key:"rd-repo"
                ~style_class:"ls-readme-repo"
                [ dom ~key:"rd-repo-s" ~tag:"strong"
                    [ dom ~key:"rd-repo-a" ~tag:"a"
                        ~style_class:"ls-readme-repo-link"
                        ~attrs:
                          [ ("href", t.repository); ("target", "_blank") ]
                        [ dom ~key:"rd-repo-i" ~tag:"span"
                            ~style_class:"ls-readme-repo-icon"
                            [ Icons.icon ~size:25. "brand-github" ]
                        ; dom ~key:"rd-repo-t" ~tag:"span"
                            ~text:t.repository [] ]
                    ]
                ])
         ; dom ~key:"rd-body"
             ~style_class:"ls-readme-body ls-block"
             ~attrs:[ ("id", "ls-plugin-readme-content") ]
             [] ]
   | None -> Logseq_dom.nothing)
    ctx parent
