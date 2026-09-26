(* Port of src/electron/electron/context_menu.cljs — right-click menu
   for the main-window webContents (spellcheck suggestions, look-up,
   google search, editing roles, image actions via electron-dl). *)

open Electron_bindings

(* electron-dl (CJS named export). *)
external download :
  Browser_window.t -> string -> 'a Js.Promise.t = "download"
  [@@mel.module "electron-dl"]

external download_opts :
  Browser_window.t -> string -> 'a -> 'b Js.Promise.t = "download"
  [@@mel.module "electron-dl"]

module Url = struct
  type t
  type search_params

  external make : string -> t = "URL" [@@mel.new]
  external search_params : t -> search_params = "searchParams"
    [@@mel.get]
  external search_params_set :
    search_params -> string -> string -> unit = "set" [@@mel.send]
  external href : t -> string = "href" [@@mel.get]
end

(* webContents context-menu params object. *)
type params
type edit_flags

external params_dictionary_suggestions :
  params -> string array = "dictionarySuggestions" [@@mel.get]
external params_edit_flags : params -> edit_flags = "editFlags"
  [@@mel.get]
external params_is_editable : params -> bool = "isEditable" [@@mel.get]
external params_selection_text : params -> string = "selectionText"
  [@@mel.get]
external params_link_url : params -> string = "linkURL" [@@mel.get]
external params_media_type : params -> string = "mediaType" [@@mel.get]
external params_misspelled_word : params -> string = "misspelledWord"
  [@@mel.get]
external params_src_url : params -> string = "srcURL" [@@mel.get]

external edit_can_cut : edit_flags -> bool = "canCut" [@@mel.get]
external edit_can_copy : edit_flags -> bool = "canCopy" [@@mel.get]
external edit_can_paste : edit_flags -> bool = "canPaste" [@@mel.get]
external edit_can_select_all : edit_flags -> bool = "canSelectAll"
  [@@mel.get]

(* electron-dl may attach a `transform` fn to the menu item. *)
external menu_item_transform :
  Menu_item.t -> 'a Js.Undefined.t = "transform" [@@mel.get]
external menu_item_apply_transform :
  Menu_item.t -> string -> string = "transform" [@@mel.send]

let non_empty (s : string) : string option =
  if String.equal s "" then None else Some s

(* %mel.obj emits a literal `type_` field, so the reserved `type` key
   is set through Js.Dict instead. *)
let separator_item () : Menu_item.t =
  Menu_item.make
    (Js.Json.object_
       (Js.Dict.fromList [ ("type", Js.Json.string "separator") ]))

(* Registered on the window's webContents in
   Electron_window.setup_window; returns the handler for `.off`. *)
let setup_context_menu (win : Browser_window.t) :
    'a -> params -> unit [@u] =
  let web_contents = Browser_window.web_contents win in
  let context_menu_handler =
    fun [@u] (_event : 'a) (params : params) ->
    let menu = menu_make () in
    let suggestions = params_dictionary_suggestions params in
    let edit_flags = params_edit_flags params in
    let editable = params_is_editable params in
    let selection_text = params_selection_text params in
    let has_text = not (String.equal selection_text "") in
    let link_url = non_empty (params_link_url params) in
    let media_type = params_media_type params in

    Array.iter
      (fun suggestion ->
         menu_append menu
           (Menu_item.make
              [%mel.obj
                { label = suggestion
                ; click =
                    (fun [@u] () ->
                       web_contents_replace_misspelling web_contents
                         suggestion)
                }]))
      suggestions;

    (match non_empty (params_misspelled_word params) with
     | Some misspelled_word ->
         menu_append menu
           (Menu_item.make
              [%mel.obj
                { label = Electron_i18n.t "electron/add-to-dictionary" [||]
                ; click =
                    (fun [@u] () ->
                       session_add_word_to_spell_checker_dictionary
                         (web_contents_session web_contents)
                         misspelled_word)
                }]);
         menu_append menu (separator_item ())
     | None -> ());

    (if Electron_state.mac && has_text && Option.is_none link_url
     then
       menu_append menu
         (Menu_item.make
            [%mel.obj
              { label = Electron_i18n.t "electron/look-up" [||]
              ; click =
                  (fun [@u] () ->
                     web_contents_show_definition_for_selection
                       web_contents)
              }]));

    (if has_text then (
       menu_append menu
         (Menu_item.make
            [%mel.obj
              { label = Electron_i18n.t "electron/search-with-google" [||]
              ; click =
                  (fun [@u] () ->
                     let url =
                       Url.make "https://www.google.com/search"
                     in
                     Url.search_params_set (Url.search_params url) "q"
                       selection_text;
                     ignore (Shell_.open_external (Url.href url)))
              }]);
       menu_append menu (separator_item ())));

    (if editable then (
       (if has_text then (
          menu_append menu
            (Menu_item.make
               [%mel.obj
                 { label = Electron_i18n.t "editor/cut" [||]
                 ; enabled = edit_can_cut edit_flags
                 ; role = "cut" }]);
          menu_append menu
            (Menu_item.make
               [%mel.obj
                 { label = Electron_i18n.t "ui/copy" [||]
                 ; enabled = edit_can_copy edit_flags
                 ; role = "copy" }])));
       menu_append menu
         (Menu_item.make
            [%mel.obj
              { label = Electron_i18n.t "editor/paste" [||]
              ; enabled = edit_can_paste edit_flags
              ; role = "paste" }]);
       menu_append menu
         (Menu_item.make
            [%mel.obj
              { label = Electron_i18n.t "view.table/select-all" [||]
              ; enabled = edit_can_select_all edit_flags
              ; role = "selectAll" }])));

    (if String.equal media_type "image" then (
       let src_url () = params_src_url params in
       let resolve_url (menu_item : Menu_item.t) : string =
         let url = src_url () in
         match Js.Undefined.toOption (menu_item_transform menu_item) with
         | Some _ -> menu_item_apply_transform menu_item url
         | None -> url
       in
       menu_append menu
         (Menu_item.make
            [%mel.obj
              { label = Electron_i18n.t "electron/save-image" [||]
              ; click =
                  (fun [@u] (menu_item : Menu_item.t) ->
                     ignore (download win (resolve_url menu_item)))
              }]);
       menu_append menu
         (Menu_item.make
            [%mel.obj
              { label = Electron_i18n.t "electron/save-image-as" [||]
              ; click =
                  (fun [@u] (menu_item : Menu_item.t) ->
                     ignore
                       (download_opts win (resolve_url menu_item)
                          [%mel.obj { saveAs = true }]))
              }]);
       menu_append menu
         (Menu_item.make
            [%mel.obj
              { label = Electron_i18n.t "electron/copy-image" [||]
              ; click =
                  (fun [@u] () ->
                     let path =
                       String.sub (src_url ()) 7
                         (String.length (src_url ()) - 7)
                     in
                     Clipboard.write_image
                       (Native_image.create_from_path path))
              }])));

    if Array.length (menu_items menu) > 0 then menu_popup menu
  in
  web_contents_on2 web_contents "context-menu" context_menu_handler;
  context_menu_handler
