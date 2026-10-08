(* The same behavior assertions run against the production app in each
   runtime. Entries supply host input and storage access; tree inspection
   and typed LUI event dispatch remain shared. *)

module M = Drive.Model
module S = Drive.Session

type ('model, 'action) host =
  { session : unit -> ('model, 'action) S.t
  ; check : string -> bool -> unit
  ; keydown : meta:bool -> string -> unit
  ; toggle_sidebar : unit -> unit
  ; storage_get : string -> string option
  ; open_settings : unit -> unit
  ; close_settings : unit -> unit
  ; wide_mode_label : string
  ; flush : unit -> unit
  }

let tree h = (h.session ()).S.tree
let nodes h = M.all_nodes (tree h)
let has_class n cls =
  match M.string_prop n "style-class" with
  | Some classes -> List.mem cls (String.split_on_char ' ' classes)
  | None -> false

let exists_class h cls = List.exists (fun n -> has_class n cls) (nodes h)
let by_identifier h id =
  List.find (fun n -> M.string_prop n "accessibility-identifier" = Some id)
    (nodes h)

let has_attr n key value =
  match M.string_prop n "data-attrs" with
  | Some data -> List.assoc_opt key (Lui_protocol.data_attrs_decode data) = Some value
  | None -> false

let sidebar h =
  h.check "left sidebar starts closed"
    (not (has_class (by_identifier h "left-sidebar") "is-open"));
  h.toggle_sidebar ();
  h.flush ();
  h.check "sidebar opens through its host action"
    (has_class (by_identifier h "left-sidebar") "is-open");
  h.check "main follows sidebar state"
    (has_class (by_identifier h "main-container") "is-left-sidebar-open");
  h.check "sidebar preference persists"
    (h.storage_get "ls-left-sidebar-open?" = Some "true");
  h.toggle_sidebar ();
  h.flush ();
  h.check "sidebar closes through its host action"
    (not (has_class (by_identifier h "left-sidebar") "is-open"));
  h.check "closed sidebar preference persists"
    (h.storage_get "ls-left-sidebar-open?" = Some "false")

let palette h =
  h.keydown ~meta:true "k";
  h.flush ();
  h.check "cmdk opens" (exists_class h "cp__cmdk__modal");
  let input = List.find (fun n -> has_class n "cp__cmdk-search-input") (nodes h) in
  S.text_changed (h.session ()) input.M.id "a";
  h.flush ();
  h.check "cmdk shows results after typing"
    (List.exists (fun n -> has_attr n "data-cmdk-item" "true") (nodes h));
  h.keydown ~meta:false "ArrowDown";
  h.flush ();
  h.check "cmdk keyboard movement highlights a result"
    (List.exists (fun n -> has_attr n "data-highlighted" "true") (nodes h));
  h.keydown ~meta:false "Escape";
  h.flush ();
  h.check "first Escape clears the query and keeps cmdk open"
    (exists_class h "cp__cmdk__modal");
  h.keydown ~meta:false "Escape";
  h.flush ();
  h.check "second Escape closes cmdk"
    (not (exists_class h "cp__cmdk__modal"))

let rec contains h n pred =
  pred n || List.exists (fun child -> contains h child pred)
    (M.children (tree h) n.M.id)

let wide_switch h =
  let row = List.find (fun n -> has_class n "it" &&
    contains h n (fun n -> M.string_prop n "text" = Some h.wide_mode_label)) (nodes h) in
  List.find (fun n -> n.M.kind = "switch" &&
    contains h row (fun child -> child.M.id = n.M.id)) (nodes h)

let checked n = Hashtbl.find n.M.props "checked" = Lui_protocol.BoolValue true

let select_editor h =
  S.press (h.session ()) (by_identifier h "editor").M.id;
  h.flush ()

let settings h =
  h.open_settings ();
  h.flush ();
  h.check "settings dialog mounts its real content" (exists_class h "ui__dialog-content");
  select_editor h;
  h.check "editor settings tab becomes selected"
    (Hashtbl.find (by_identifier h "editor").M.props "selected" = Lui_protocol.BoolValue true);
  let switch = wide_switch h in
  let before = checked switch in
  S.toggle (h.session ()) switch.M.id (not before);
  h.flush ();
  h.check "wide mode changes visibly through the switch" (checked (wide_switch h) <> before);
  h.check "wide mode preference persists"
    (h.storage_get "wide-mode" = Some (if before then "\"false\"" else "\"true\""));
  h.close_settings ();
  h.flush ();
  h.check "settings closes" (not (exists_class h "ui__dialog-content"));
  h.open_settings ();
  h.flush ();
  select_editor h;
  h.check "wide mode survives settings remount" (checked (wide_switch h) <> before);
  S.toggle (h.session ()) (wide_switch h).M.id before;
  h.flush ();
  h.close_settings ();
  h.flush ()
