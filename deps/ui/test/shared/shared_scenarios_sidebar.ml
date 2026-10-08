(* Batch-3b shared behavior scenarios: sidebar state retention, nav
   context, right-sidebar toggle, and theme/language settings updates —
   driven through the real Sidebar_state / Settings_view entries on a
   mounted app so the same file runs inside both the Melange stub-DOM
   suite (test/test_drive_sidebar.ml) and the native drive
   (gpui/drive_test.ml).

   "Restart" is exercised as the remount the runtime supports: closing
   and reopening the sidebar or the settings dialog remounts those
   views while the persisted storage contract
   (ls-left-sidebar-open? / ls-sidebar-navigations / theme /
   preferred-language) keeps the restored state observable. *)

module M = Drive.Model
module S = Drive.Session

type ('model, 'action) host =
  { base : ('model, 'action) Shared_scenarios.host
  ; storage_set : string -> string -> unit
  ; toggle_right_sidebar : unit -> unit
  ; push_right_item : string -> string -> unit
  ; toggle_nav : string -> bool -> unit
  ; set_theme : string -> unit
  ; set_language : string -> unit
  }

let check h msg b = h.base.Shared_scenarios.check msg b
let session h = h.base.Shared_scenarios.session ()
let flush h = h.base.Shared_scenarios.flush ()
let tree h = (session h).S.tree
let nodes h = M.all_nodes (tree h)

let has_class n cls =
  match M.string_prop n "style-class" with
  | Some classes -> List.mem cls (String.split_on_char ' ' classes)
  | None -> false

let has_cls h cls = List.exists (fun n -> has_class n cls) (nodes h)
let absent_cls h cls = not (has_cls h cls)

let by_identifier h id =
  List.find_opt
    (fun n -> M.string_prop n "accessibility-identifier" = Some id)
    (nodes h)

let left_sidebar_open h =
  match by_identifier h "left-sidebar" with
  | Some n -> has_class n "is-open"
  | None -> false

(* left sidebar open/close round-trips through the persisted flag *)
let sidebar_open_close_state h =
  let b = h.base in
  let open0 = left_sidebar_open h in
  b.Shared_scenarios.toggle_sidebar ();
  flush h;
  check h "left sidebar toggles open/close"
    (left_sidebar_open h = not open0);
  check h "open state persists to storage"
    (b.Shared_scenarios.storage_get "ls-left-sidebar-open?"
    = Some (if open0 then "false" else "true"));
  b.Shared_scenarios.toggle_sidebar ();
  flush h;
  check h "left sidebar toggles back"
    (left_sidebar_open h = open0);
  check h "closed state persists to storage"
    (b.Shared_scenarios.storage_get "ls-left-sidebar-open?"
    = Some (if open0 then "true" else "false"))

(* nav-item choice persists: toggling a nav row off writes storage, the
   choice survives a sidebar close/reopen (vnode remount), and the
   restored storage string still seeds the same context *)
let sidebar_nav_context h =
  let b = h.base in
  if not (left_sidebar_open h) then begin
    b.Shared_scenarios.toggle_sidebar ();
    flush h
  end;
  h.toggle_nav "graph-view" false;
  flush h;
  check h "graph nav row removed" (absent_cls h "graph-view-nav");
  check h "nav choice persists to storage"
    (b.Shared_scenarios.storage_get "ls-sidebar-navigations"
    = Some "(:flashcards :all-pages)");
  b.Shared_scenarios.toggle_sidebar ();
  flush h;
  check h "sidebar closes for reopen" (not (left_sidebar_open h));
  b.Shared_scenarios.toggle_sidebar ();
  flush h;
  check h "sidebar reopens" (left_sidebar_open h);
  check h "nav choice survives sidebar reopen"
    (absent_cls h "graph-view-nav");
  check h "all-pages still rendered" (has_cls h "all-pages-nav");
  h.toggle_nav "graph-view" true;
  flush h;
  check h "graph nav restored" (has_cls h "graph-view-nav");
  check h "nav storage restored"
    (b.Shared_scenarios.storage_get "ls-sidebar-navigations"
    = Some "(:flashcards :all-pages :graph-view)");
  (* leave the sidebar closed — the persisted flag is also a startup
     contract (native state-dir isolation test asserts it stays false) *)
  b.Shared_scenarios.toggle_sidebar ();
  flush h

(* right sidebar open/close through the real toggle action *)
let right_sidebar_toggle h =
  h.push_right_item "pg-rs" "Right Page";
  let open0 = has_cls h "cp__right-sidebar-inner" in
  h.toggle_right_sidebar ();
  flush h;
  check h "right sidebar toggles" (has_cls h "cp__right-sidebar-inner" = not open0);
  h.toggle_right_sidebar ();
  flush h;
  check h "right sidebar toggles back"
    (has_cls h "cp__right-sidebar-inner" = open0)

(* theme change persists through storage and survives the settings
   dialog remount *)
let settings_theme_persist h =
  let b = h.base in
  b.Shared_scenarios.open_settings ();
  flush h;
  h.set_theme "dark";
  flush h;
  check h "theme persists to storage"
    (b.Shared_scenarios.storage_get "theme" = Some "\"dark\"");
  check h "dark theme applied to host"
    (b.Shared_scenarios.theme_snapshot ()).Shared_scenarios.root_dark;
  b.Shared_scenarios.close_settings ();
  flush h;
  b.Shared_scenarios.open_settings ();
  flush h;
  check h "dark theme survives settings remount"
    (b.Shared_scenarios.theme_snapshot ()).Shared_scenarios.root_dark;
  check h "theme storage kept across remount"
    (b.Shared_scenarios.storage_get "theme" = Some "\"dark\"");
  h.set_theme "light";
  b.Shared_scenarios.close_settings ();
  flush h

(* language preference update persists *)
let settings_language_update h =
  let b = h.base in
  h.set_language "fr";
  check h "language persists to storage"
    (b.Shared_scenarios.storage_get "preferred-language"
    = Some "\"fr\"");
  h.set_language "en";
  check h "language restored"
    (b.Shared_scenarios.storage_get "preferred-language"
    = Some "\"en\"")

let all h =
  sidebar_open_close_state h;
  sidebar_nav_context h;
  right_sidebar_toggle h;
  settings_theme_persist h;
  settings_language_update h
