(* Web adapter for the logseq-codemirror extension.

   Extension props land after create, so the host element carries a
   __lsCm record and the interior DOM materializes once "source-role"
   arrives (the cm constructor emits it last).

   source-role "block" — interior
   <textarea id=edit-block-<uuid> data-lang>; the host is
   display:contents so the .CodeMirror wrapper fromTextArea inserts
   keeps the flex slot it had as a direct .code-editor child.
   Code_mirror.mount_async binds the vendored CM5 (deduped against the
   document scan in code_mirror.ml by uuid/bound).

   source-role "query" — interior
   <pre class=CodeMirror-line contenteditable role=textbox
   spellcheck=false>; input/keydown ride the cm-event channel
   (Enter/Escape preventDefault applies synchronously in the adapter
   listener before emit). *)

open Lui_protocol
open Lui_web_types
module W = Webapi.Dom
module D = Web_dom

type emit_fn = string -> wire_value String_map.t -> unit

external element_to_json : W.Element.t -> D.el = "%identity"

external remove_listener : D.el -> string -> (D.ev -> unit) -> unit =
  "removeEventListener" [@@mel.send]

let set_class el s = W.Element.setClassName el s

type cm_state =
  { doc : W.Document.t
  ; emit : emit_fn
  ; mutable uuid : string
  ; mutable lang : string
  ; mutable value : string
  ; mutable read_only : bool
  ; mutable role : string
  ; mutable built : bool
  ; mutable line : D.el option
  ; mutable listeners : (D.el * string * (D.ev -> unit)) list
  }

external cm_state_get : W.Element.t -> cm_state Js.Undefined.t = "__lsCm"
  [@@mel.get]

external cm_state_set : W.Element.t -> cm_state -> unit = "__lsCm"
  [@@mel.set]

let state_of el =
  match Js.Undefined.toOption (cm_state_get el) with
  | Some st -> st
  | None -> invalid_arg "logseq-codemirror: element missing __lsCm state"

let emit_cm st name ?value ?key () =
  let fields =
    String_map.empty |> String_map.add "name" (StringValue name)
  in
  let fields =
    match value with
    | Some v -> String_map.add "value" (StringValue v) fields
    | None -> fields
  in
  let fields =
    match key with
    | Some k -> String_map.add "key" (StringValue k) fields
    | None -> fields
  in
  st.emit "cm-event" fields

let build_block el st =
  (* display:contents keeps the textarea + .CodeMirror wrapper in the
     .code-editor row's flex layout exactly where the old direct child
     sat *)
  W.Element.setAttribute "style" "display:contents" el;
  let textarea =
    element_to_json (W.Document.createElement "textarea" st.doc)
  in
  if st.uuid <> "" then D.el_set_id textarea ("edit-block-" ^ st.uuid);
  if st.lang <> "" then D.el_set_attr textarea "data-lang" st.lang;
  D.el_set_value textarea st.value;
  D.el_set_text_content textarea st.value;
  if st.read_only then D.el_set_attr textarea "readonly" "";
  D.el_append_child (element_to_json el) textarea;
  st.line <- Some textarea;
  if st.uuid <> "" then
    Code_mirror.mount_async ~read_only:st.read_only st.uuid textarea

let build_query el st =
  let line =
    element_to_json (W.Document.createElement "pre" st.doc)
  in
  D.el_set_class line "CodeMirror-line";
  if not st.read_only then D.el_set_attr line "contenteditable" "true";
  D.el_set_attr line "role" "textbox";
  D.el_set_attr line "spellcheck" "false";
  D.el_set_text_content line st.value;
  D.el_append_child (element_to_json el) line;
  st.line <- Some line;
  let on_input _ =
    emit_cm st "input" ~value:(D.el_text_content line) ()
  in
  let on_keydown ev =
    match D.ev_key ev with
    | ("Enter" | "Escape") as key ->
        D.ev_prevent_default ev;
        emit_cm st "key" ~key ~value:(D.el_text_content line) ()
    | _ -> ()
  in
  D.el_on line "input" on_input;
  D.el_on line "keydown" on_keydown;
  st.listeners <-
    [ (line, "input", on_input); (line, "keydown", on_keydown) ]

let build el st =
  if st.built then ()
  else begin
    st.built <- true;
    match st.role with
    | "block" -> build_block el st
    | "query" -> build_query el st
    | role ->
        invalid_arg ("logseq-codemirror: unknown source-role " ^ role)
  end

(* textarea value/attr and query line text follow prop updates, but a
   mounted CM doc ignores textarea.value writes — same observable
   behavior as the old dom path (sync_titles pushes real updates through
   the instance). Line writes are skipped while focused so an eval echo
   can't clobber the caret. *)
let set_property el prop value =
  let st = state_of el in
  match (prop, value) with
  | "uuid", StringValue v -> (
      st.uuid <- v;
      match (st.line, st.role) with
      | Some line, "block" -> D.el_set_id line ("edit-block-" ^ v)
      | _ -> ())
  | "lang", StringValue v -> (
      st.lang <- v;
      match (st.line, st.role) with
      | Some line, "block" -> D.el_set_attr line "data-lang" v
      | _ -> ())
  | "value", StringValue v -> (
      st.value <- v;
      match st.line with
      | Some line
        when (match D.active_element () with
              | Some a -> a != line
              | None -> true) -> (
          match st.role with
          | "query" ->
              if D.el_text_content line <> v then
                D.el_set_text_content line v
          | _ ->
              if D.el_value line <> v then D.el_set_value line v)
      | _ -> ())
  | "read-only", BoolValue b -> (
      st.read_only <- b;
      match st.role with
      | "block" ->
          if st.uuid <> "" then Code_mirror.set_read_only st.uuid b
      | "query" -> (
          match st.line with
          | Some line ->
              if b then D.el_remove_attr line "contenteditable"
              else D.el_set_attr line "contenteditable" "true"
          | None -> ())
      | _ -> ())
  | "source-role", StringValue v ->
      if v <> "" then begin
        st.role <- v;
        build el st
      end
  | "style-class", StringValue v -> set_class el v
  | "accessibility-identifier", StringValue v ->
      W.Element.setAttribute "id" v el
  | _ -> ()

let remove_property el prop =
  match prop with
  | "source-role" -> ()
  | "read-only" -> set_property el prop (BoolValue false)
  | "accessibility-identifier" -> W.Element.removeAttribute "id" el
  | _ -> set_property el prop (StringValue "")

let cleanup el =
  match Js.Undefined.toOption (cm_state_get el) with
  | None -> ()
  | Some st ->
      List.iter
        (fun (target, name, f) -> remove_listener target name f)
        st.listeners;
      st.listeners <- [];
      if st.role = "block" && st.uuid <> "" then
        Code_mirror.unmount st.uuid

let adapter : web_extension_adapter =
  { web_extension_create =
      (fun _node document emit ->
        let el = W.Document.createElement "div" document in
        cm_state_set el
          { doc = document
          ; emit
          ; uuid = ""
          ; lang = ""
          ; value = ""
          ; read_only = false
          ; role = ""
          ; built = false
          ; line = None
          ; listeners = []
          };
        el)
  ; web_extension_set_property = set_property
  ; web_extension_remove_property = remove_property
  ; web_extension_cleanup = cleanup
  }
