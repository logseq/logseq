(* logseq-em-emoji — platform emoji glyph resolved from an emoji-mart id.

   Web emits a real <em-emoji> custom element (web_ext_adapters) that
   emoji-mart upgrades once init() runs; non-web hosts read the resolved
   native char from the data-emoji prop.

   Props:
     name       — emoji-mart id (required); web maps it to the id attr
     data-emoji — resolved native char for hosts without the mart
                  upgrade path
     style-class — same as standard props *)

open Lui_protocol

let identifier = "logseq-em-emoji"

let schema =
  Lui_extension.component identifier
    [ { profile_os = WebOS; profile_host = WebHost } ]
    false (* standard_children *)
    []    (* leaf — the glyph renders inside the custom element *)
    [ Lui_extension.property "name" Lui_extension.StringScalar true None
    ; Lui_extension.property "data-emoji" Lui_extension.StringScalar false
        None
    ; Lui_extension.property "style-class" Lui_extension.StringScalar false
        None
    ]
    []

let register registry = Lui_extension.register_component registry schema

let el ?key ~name () : Lui_elements.t =
 fun context parent ->
  let node = Lui_ui.extension context identifier in
  Option.iter (Lui_ui.key context node) key;
  Lui_ui.extension_property context node "name" (StringValue name);
  (* __emojiData is absent until install() resolves — and never exists
     under node tests — so an unresolved id emits an empty data-emoji *)
  let ch =
    match (try Emoji_mart.emoji_char name with _ -> None) with
    | Some c -> c
    | None -> ""
  in
  Lui_ui.extension_property context node "data-emoji" (StringValue ch);
  (match parent with
   | Some p -> Lui_ui.append context p node
   | None -> ());
  node
