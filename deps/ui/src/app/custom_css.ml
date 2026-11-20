(* cljs util/add-style! + handler.ui/{add-style-if-exists!,reset-custom-css!}
   — inject logseq/custom.css (or :custom-css-url) as #logseq-custom-theme-id. *)

open Promise_ext

let theme_id = "logseq-custom-theme-id"
let file_path = "logseq/custom.css"

let remove () =
  match Web_dom.get_element_by_id theme_id with
  | Some el -> Web_dom.el_remove el
  | None -> ()

(* cljs util/add-style!: (string/starts-with? style "http") — also
   matches https:// *)
let starts_with_http s = String.starts_with ~prefix:"http" (String.trim s)

let add_style = function
  | None -> ()
  | Some s when String.trim s = "" -> ()
  | Some s ->
      remove ();
      let href =
        if starts_with_http s then String.trim s
        else
          "data:text/css;charset=utf-8,"
          ^ Ui_services.uri_encode_component s
      in
      match Web_dom.query_selector "head" with
      | Some head ->
          let link = Web_dom.create_element "link" in
          Web_dom.el_set_attr link "id" theme_id;
          Web_dom.el_set_attr link "rel" "stylesheet";
          Web_dom.el_set_attr link "type" "text/css";
          Web_dom.el_set_attr link "href" href;
          Web_dom.el_set_attr link "media" "all";
          Web_dom.el_append_child head link
      | None -> ()

let apply_content content = add_style (Some content)

let custom_css_url_of_config = function
  | Wire.Map _ as c -> (
      match Wire.get c "custom-css-url" with
      | Some (Wire.String url) when String.trim url <> "" -> Some (String.trim url)
      | _ -> None)
  | _ -> None

let apply_for_repo repo =
  match custom_css_url_of_config (Runtime.model ()).Model.graph_config with
  | Some url ->
      add_style (Some url);
      Js.Promise.resolve ()
  | None ->
      let* w =
        Runtime.invoke2 "thread-api/get-file-content" (Wire.String repo)
          (Wire.String file_path)
      in
      (match w with
       | Wire.String s -> add_style (Some s)
       | _ -> remove ());
      Js.Promise.resolve ()

let reset_for_repo repo =
  remove ();
  apply_for_repo repo

let on_file_saved path content =
  if path = file_path then apply_content content
