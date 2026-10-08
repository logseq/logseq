type storage = {
  get : string -> string option;
  set : string -> string -> unit;
  remove : string -> unit;
}

(* Semantic theme service. Preference persistence keeps the existing raw
   storage format (cljs-quoted values under "system-theme?"/"theme") —
   callers pass and receive plain semantic values like "dark". *)
type theme = {
  mode : unit -> string;
  (* Current preference: "light" | "dark" | "system". *)
  system_default : unit -> bool;
  (* Whether "system" is the default mode on this host (desktop platforms). *)
  prefers_dark : unit -> bool;
  (* Live host appearance query — re-read on every call so a system change
     resolves the current effective mode. *)
  set_system_pref : bool -> unit;
  (* Persist the system-follow flag. *)
  set_theme_pref : string -> unit;
  (* Persist the effective theme ("dark" | "light"). *)
  apply_dataset : string -> unit;
  (* Document data attributes for the effective mode (data-theme). *)
  apply_classes : string -> unit;
  (* Document/body class swap for the effective mode. *)
}

(* Semantic navigation service — one hash route plus history and quiet
   replacement, matching the browser contract the native host emulates. *)
type nav = {
  hash : unit -> string;
  set_hash : string -> unit;
  (* Push a destination: updates the hash and notifies observers. *)
  replace_hash : string -> unit;
  (* Quiet rewrite: no history entry and no observer notification. *)
  back : unit -> unit;
  forward : unit -> unit;
  on_change : (unit -> unit) -> unit;
  (* Fires on hash changes only — navigation observers that must not also
     react to the imperative "ls:navigate" re-dispatch. *)
  on_navigate : (unit -> unit) -> unit;
  (* Fires on hash changes AND on the "ls:navigate" custom navigation event
     (imperative navigation that must resolve even when the hash repeats). *)
  search : unit -> string;
  query_param : string -> string option;
  hash_query_param : string -> string option;
  decode_uri : string -> string;
  reload : unit -> unit;
}

(* Document/app chrome state the shared layer publishes. *)
type doc = {
  set_lang : string -> unit;
  (* Preferred-language preference read/write, quoted internally. *)
  preferred_lang : unit -> string;
  set_lang_pref : string -> unit;
  set_data : string -> string -> unit;
  rm_data : string -> unit;
  (* Arbitrary document data-* attributes (accent color, font) — same
     channel theme_apply_dataset uses for "theme". *)
  reload : unit -> unit;
}

type t = {
  storage : storage;
  literal_text : string -> string;
  request_flush : unit -> unit;
  assert_owner : unit -> unit;
  theme : theme;
  nav : nav;
  doc : doc;
}

let installed : t option ref = ref None
let install services = match !installed with
  | Some _ -> invalid_arg "UI services already installed"
  | None -> services.assert_owner (); installed := Some services
let get () = match !installed with
  | None -> invalid_arg "UI services not installed"
  | Some services -> services.assert_owner (); services

let storage_get key = (get ()).storage.get key
let storage_set key value = (get ()).storage.set key value
let storage_remove key = (get ()).storage.remove key
let literal_text value = (get ()).literal_text value
let request_flush () = (get ()).request_flush ()

let theme_mode () = (get ()).theme.mode ()
let theme_system_default () = (get ()).theme.system_default ()
let theme_prefers_dark () = (get ()).theme.prefers_dark ()
let theme_set_system_pref v = (get ()).theme.set_system_pref v
let theme_set_pref v = (get ()).theme.set_theme_pref v
let theme_apply_dataset v = (get ()).theme.apply_dataset v
let theme_apply_classes v = (get ()).theme.apply_classes v

let nav_hash () = (get ()).nav.hash ()
let nav_set_hash h = (get ()).nav.set_hash h
let nav_replace_hash h = (get ()).nav.replace_hash h
let nav_back () = (get ()).nav.back ()
let nav_forward () = (get ()).nav.forward ()
let nav_on_change f = (get ()).nav.on_change f
let nav_on_navigate f = (get ()).nav.on_navigate f
let nav_search () = (get ()).nav.search ()
let nav_query_param n = (get ()).nav.query_param n
let nav_hash_query_param n = (get ()).nav.hash_query_param n
let nav_decode_uri s = (get ()).nav.decode_uri s
let nav_reload () = (get ()).nav.reload ()

let doc_set_lang l = (get ()).doc.set_lang l
let doc_preferred_lang () = (get ()).doc.preferred_lang ()
let doc_set_lang_pref l = (get ()).doc.set_lang_pref l
let doc_set_data name value = (get ()).doc.set_data name value
let doc_rm_data name = (get ()).doc.rm_data name
let doc_reload () = (get ()).doc.reload ()
