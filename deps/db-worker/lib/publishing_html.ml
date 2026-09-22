(* Faithful port of deps/publishing/src/logseq/publishing/html.cljs —
   the index.html builder behind build-publishing-html.

   init() wiring: none — called by Endpoint_publish. *)

open Datascript

(* cljs escape-html — copied from hiccup but tweaked for publish usage.
   The logseq____ prefix is intentional: the client unescapes it. *)
let escape_html (text : string) : string =
  let replace s pat rep =
    let n = String.length s and m = String.length pat in
    if m = 0 then s
    else begin
      let b = Buffer.create n in
      let i = ref 0 in
      while !i <= n - m do
        if String.sub s !i m = pat then begin
          Buffer.add_string b rep;
          i := !i + m
        end else begin
          Buffer.add_char b s.[!i];
          incr i
        end
      done;
      Buffer.add_substring b s !i (n - !i);
      Buffer.contents b
    end
  in
  text
  |> fun s -> replace s "&" "logseq____&amp;"
  |> fun s -> replace s "<" "logseq____&lt;"
  |> fun s -> replace s ">" "logseq____&gt;"
  |> fun s -> replace s "\"" "logseq____&quot;"
  |> fun s -> replace s "'" "logseq____&apos;"

(* cljs html — vectors are [tag attrs? & elts], maps are attr maps
   (nil values skipped), seqs join with " ", anything else is str. *)
type html_node =
  | Hvec of html_node list
  | Hmap of (string * string option) list
  | Hseq of html_node list
  | Hstr of string

let rec html (v : html_node) : string =
  match v with
  | Hvec (tag :: rest) -> (
      let tag_name = match tag with Hstr s -> s | _ -> "" in
      let attrs, elts =
        match rest with
        | Hmap kvs :: rest' -> (Hmap kvs, rest')
        | _ -> (Hmap [], rest)
      in
      Printf.sprintf "<%s%s>%s</%s>\n" tag_name (html attrs)
        (html (Hseq elts)) tag_name)
  | Hvec [] -> ""
  | Hmap kvs ->
      String.concat ""
        (List.filter_map
           (fun (k, v) ->
             match v with
             | Some s -> Some (Printf.sprintf " %s=\"%s\"" k s)
             | None -> None)
           kvs)
  | Hseq xs -> String.concat " " (List.map html xs)
  | Hstr s -> s

let json_string_of (s : string) : string =
  let b = Buffer.create (String.length s + 2) in
  Buffer.add_char b '"';
  String.iter
    (fun c ->
      match c with
      | '"' -> Buffer.add_string b "\\\""
      | '\\' -> Buffer.add_string b "\\\\"
      | '\n' -> Buffer.add_string b "\\n"
      | '\r' -> Buffer.add_string b "\\r"
      | '\t' -> Buffer.add_string b "\\t"
      | '\b' -> Buffer.add_string b "\\b"
      | '\012' -> Buffer.add_string b "\\f"
      | c when Char.code c < 0x20 ->
          Buffer.add_string b (Printf.sprintf "\\u%04x" (Char.code c))
      | c -> Buffer.add_char b c)
    s;
  Buffer.add_char b '"';
  Buffer.contents b

let opt_str (m : Sqlite_build.BM.t) (k : string) : string option =
  match Sqlite_build.bm_get_opt m k with
  | Some (String s) -> Some s
  | _ -> None

(* cljs publishing-html *)
let publishing_html (transit_db : string) (app_state : value)
    (options : value) : string =
  let m = Sqlite_build.bm_of_value options in
  let name' = opt_str m "name" in
  let icon = Option.value ~default:"static/img/logo.png" (opt_str m "icon") in
  (* cljs (or alias name') — nil project/title/description mean the html
     attr is skipped, not rendered empty *)
  let project =
    match opt_str m "alias" with
    | Some a -> Some a
    | None -> name'
  in
  let title = opt_str m "title" in
  let description = opt_str m "description" in
  let url = opt_str m "url" in
  let app_state_str = Ds_wire.edn_of_transit (Ds_wire.transit_of_value app_state) in
  let head =
    Hvec
      [ Hstr "head"
      ; Hvec [ Hstr "meta"; Hmap [ "charset", Some "utf-8" ] ]
      ; Hvec
          [ Hstr "meta"
          ; Hmap
              [ ( "content"
                , Some
                    "minimum-scale=1, initial-scale=1, width=device-width, \
                     shrink-to-fit=no" )
              ; "name", Some "viewport" ] ]
      ; Hvec
          [ Hstr "link"
          ; Hmap
              [ "type", Some "text/css"; "href", Some "static/css/style.css"
              ; "rel", Some "stylesheet" ] ]
      ; Hvec
          [ Hstr "link"
          ; Hmap
              [ "type", Some "text/css"; "href", Some "static/css/custom.css"
              ; "rel", Some "stylesheet" ] ]
      ; Hvec
          [ Hstr "link"
          ; Hmap
              [ "type", Some "text/css"; "href", Some "static/css/export.css"
              ; "rel", Some "stylesheet" ] ]
      ; Hvec
          [ Hstr "link"
          ; Hmap
              [ "href", Some icon; "type", Some "image/png"
              ; "rel", Some "shortcut icon" ] ]
      ; Hvec
          [ Hstr "link"
          ; Hmap
              [ "href", Some icon; "sizes", Some "192x192"
              ; "rel", Some "shortcut icon" ] ]
      ; Hvec
          [ Hstr "link"
          ; Hmap
              [ "href", Some icon; "rel", Some "apple-touch-icon" ] ]
      ; Hvec
          [ Hstr "meta"
          ; Hmap [ "name", Some "apple-mobile-web-app-title"; "content", project ] ]
      ; Hvec
          [ Hstr "meta"
          ; Hmap [ "name", Some "apple-mobile-web-app-capable"; "content", Some "yes" ] ]
      ; Hvec
          [ Hstr "meta"
          ; Hmap [ "name", Some "apple-touch-fullscreen"; "content", Some "yes" ] ]
      ; Hvec
          [ Hstr "meta"
          ; Hmap
              [ "name", Some "apple-mobile-web-app-status-bar-style"
              ; "content", Some "black-translucent" ] ]
      ; Hvec
          [ Hstr "meta"
          ; Hmap [ "name", Some "mobile-web-app-capable"; "content", Some "yes" ] ]
      ; Hvec
          [ Hstr "meta"; Hmap [ "content", title; "property", Some "og:title" ] ]
      ; Hvec
          [ Hstr "meta"; Hmap [ "content", Some "site"; "property", Some "og:type" ] ]
      ; (match url with
         | Some u ->
             Hvec [ Hstr "meta"; Hmap [ "content", Some u; "property", Some "og:url" ] ]
         | None -> Hstr "")
      ; Hvec
          [ Hstr "meta"; Hmap [ "content", Some icon; "property", Some "og:image" ] ]
      ; Hvec
          [ Hstr "meta"
          ; Hmap [ "content", description; "property", Some "og:description" ] ]
      ; Hvec [ Hstr "title"; Hstr (Option.value ~default:"" title) ]
      ; Hvec
          [ Hstr "meta"; Hmap [ "content", project; "property", Some "og:site_name" ] ]
      ; Hvec [ Hstr "meta"; Hmap [ "description", description ] ] ]
  in
  let body =
    Hvec
      [ Hstr "body"
      ; Hvec [ Hstr "div"; Hmap [ "id", Some "root" ] ]
      ; Hvec
          [ Hstr "script"
          ; Hstr
              ("window.logseq_db="
               ^ json_string_of (escape_html transit_db)) ]
      ; Hvec
          [ Hstr "script"
          ; Hstr ("window.logseq_state=" ^ json_string_of app_state_str) ]
      ; Hvec
          [ Hstr "script"; Hmap [ "type", Some "text/javascript" ]
          ; Hstr
              "// Single Page Apps for GitHub Pages\n      // https://github.com/rafgraph/spa-github-pages\n      // Copyright (c) 2016 Rafael Pedicini, licensed under the MIT License\n      // ----------------------------------------------------------------------\n      // This script checks to see if a redirect is present in the query string\n      // and converts it back into the correct url and adds it to the\n      // browser's history using window.history.replaceState(...),\n      // which won't cause the browser to attempt to load the new url.\n      // When the single page app is loaded further down in this file,\n      // the correct url will be waiting in the browser's history for\n      // the single page app to route accordingly.\n      (function(l) {\n        if (l.search) {\n          var q = {};\n          l.search.slice(1).split('&').forEach(function(v) {\n            var a = v.split('=');\n            q[a[0]] = a.slice(1).join('=').replace(/~and~/g, '&');\n          });\n          if (q.p !== undefined) {\n            window.history.replaceState(null, null,\n              l.pathname.slice(0, -1) + (q.p || '') +\n              (q.q ? ('?' + q.q) : '') +\n              l.hash\n            );\n          }\n        }\n      }(window.location))" ]
      ; Hvec [ Hstr "script"; Hmap [ "src", Some "static/js/react.production.min.js" ] ]
      ; Hvec [ Hstr "script"; Hmap [ "src", Some "static/js/react-dom.production.min.js" ] ]
      ; Hvec [ Hstr "script"; Hmap [ "src", Some "static/js/main.js" ] ]
      ; Hvec
          [ Hstr "script"
          ; Hmap [ "defer", Some "true"; "src", Some "static/js/interact.min.js" ] ]
      ; Hvec
          [ Hstr "script"
          ; Hmap [ "defer", Some "true"; "src", Some "static/js/highlight.min.js" ] ]
      ; Hvec
          [ Hstr "script"
          ; Hmap [ "defer", Some "true"; "src", Some "static/js/katex.min.js" ] ]
      ; Hvec
          [ Hstr "script"
          ; Hmap
              [ "defer", Some "true"; "type", Some "module"
              ; "src", Some "static/js/pdfjs/pdf.mjs" ] ]
      ; Hvec
          [ Hstr "script"
          ; Hmap [ "defer", Some "true"; "src", Some "static/js/pdf_viewer3.mjs" ] ]
      ; Hvec
          [ Hstr "script"
          ; Hmap [ "defer", Some "true"; "src", Some "static/js/html2canvas.min.js" ] ]
      ; Hvec
          [ Hstr "script"
          ; Hmap [ "defer", Some "true"; "src", Some "static/js/code-editor.js" ] ]
      ; Hvec
          [ Hstr "script"
          ; Hmap [ "defer", Some "true"; "src", Some "static/js/custom.js" ] ] ]
  in
  "<!DOCTYPE html>\n" ^ html (Hseq [ head; body ])

(* cljs build-html *)
let build_html (db : db) (options : value) : value =
  let m = Sqlite_build.bm_of_value options in
  let repo = opt_str m "repo" in
  let app_state = Sqlite_build.bm_get m "app-state" in
  let repo_config = Sqlite_build.bm_of_value (Sqlite_build.bm_get m "repo-config") in
  let html_options = Sqlite_build.bm_get m "html-options" in
  let dev = Sqlite_build.truthy (Sqlite_build.bm_get m "dev?") in
  let all_pages_public =
    match Sqlite_build.bm_get_opt repo_config "publishing/all-pages-public?" with
    | Some v -> Sqlite_build.truthy v
    | None -> Sqlite_build.truthy (Sqlite_build.bm_get repo_config "all-pages-public?")
  in
  let db', asset_filenames' =
    if all_pages_public then Publishing_db.clean_export db
    else Publishing_db.filter_only_public_pages_and_blocks db
  in
  let asset_filenames = List.filter (fun s -> s <> "") asset_filenames' in
  if dev then
    Printf.printf "Exporting %d of %d datoms and %d asset(s)...\n%!"
      (List.length (List.of_seq (datoms db' Eavt ())))
      (List.length (List.of_seq (datoms db Eavt ())))
      (List.length asset_filenames);
  let db_str =
    Transit_codec.to_string
      (Ds_wire.transit_of_serializable_db (Datascript.serializable db'))
  in
  (* cljs (assoc app-state :git/current-repo repo :config {repo repo-config}) *)
  let state =
    let m' = Sqlite_build.bm_of_value app_state in
    let m' =
      match repo with
      | Some r ->
          let m' =
            Sqlite_build.BM.put m' "git/current-repo" (String r)
          in
          Sqlite_build.BM.put m' "config"
            (Map [ String r, Sqlite_build.map_of_bm repo_config ])
      | None -> m'
    in
    Sqlite_build.map_of_bm m'
  in
  let raw_html = publishing_html db_str state html_options in
  Map
    [ Keyword "html", String raw_html
    ; Keyword "asset-filenames",
      Vector (List.map (fun s -> String s) asset_filenames) ]
