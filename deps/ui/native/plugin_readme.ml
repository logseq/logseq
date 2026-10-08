(* plugin-readme dialog — native twin of src/dialogs/plugin_readme.ml.

   Same readme fetch + render pipeline, minus the iframe: there is no
   webview on the native host, so repo items take the same inline
   rendered-readme path as repo-less items (the readme endpoints are
   derived from :repo itself, which is what resources/marketplace.html
   does inside the iframe on web). markdown -> html uses
   Render_html.markdown_to_html (a minimal readme subset) instead of
   window.marked + DOMPurify — documented approximation in
   docs/gpui-gaps.md. *)

open Lui_elements
open Promise_ext

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
      (let* r = Fetch.fetch u in
       if r.Fetch.Response.status = 200 then
         let* s = Fetch.Response.text r in
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
        (Some (Render_html.markdown_to_html (abs_image_links dir md)))
  | _ -> Js.Promise.resolve None

(* cljs open-readme! — on native the :repo iframe path folds into the
   inline renderer: readme endpoints resolve from the repo the same
   way marketplace.html resolves them in the iframe *)
let open_readme (item : Js.Json.t) =
  let open Plugin_host in
  let url = jstr item "url" in
  let repo = jstr item "repo" in
  let repository =
    let r = jstr item "repository" in
    if r <> "" then r
    else (
      match Js.Json.decodeObject (getf item "repository") with
      | Some _ -> jstr (getf item "repository") "url"
      | None -> "")
  in
  let readme_url = if repo <> "" then repo else url in
  ignore
    (let* html = readme_html readme_url in
     match html with
     | Some html ->
         pending := Some { url; repo = ""; repository; html };
         Dialogs_state.open_ "plugin-readme";
         Js.Promise.resolve ()
     | None ->
         Toast.warning I18n.plugin_readme_empty;
         Js.Promise.resolve ())

(* cljs local-markdown-display — the native body always renders inline
   (no iframe host; see header comment) *)
let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  (match !pending with
   | Some t ->
       Logseq_el.el ~key:"rd"
         ~attrs:[ ("data-capture-click", "") ]
         ~events:"click"
         ~on_dom_event:(fun name payload ->
           if name = "click" then
             let href = Platform.payload_str payload "href" in
             if String.trim href <> "" then Platform.open_url href)
         [ (if t.repository = "" then spacer ~key:"rd-none" []
            else
              box ~key:"rd-repo"
                ~style_class:"ls-readme-repo"
                [ link ~key:"rd-repo-a" ~url:t.repository
                    ~style_class:"ls-readme-repo-link" ~gap:4
                    ~icon:(`app "brand-github")
                    ~text:t.repository [] ])
         ; box ~key:"rd-body"
             ~style_class:"ls-readme-body ls-block"
             (Render_html.els_of_string t.html) ]
   | None -> spacer ~key:"rd-empty" [])
    ctx parent
