open Lui_elements
module Prop = Ui_components.Prop

let t = I18n.t
let mono="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"

let sanitize_platform value =
  let buffer=Buffer.create (String.length value) and separator=ref false in
  String.iter (fun character ->
    let accepted=match character with
      | 'a'..'z' | 'A'..'Z' | '0'..'9' | '_' | '/' | '.' | '(' | ')' -> true
      | _ -> false in
    if accepted then (Buffer.add_char buffer character;separator:=false)
    else if not !separator then (Buffer.add_char buffer ' ';separator:=true)) value;
  Buffer.contents buffer

let issue_url () =
  let plugins=Plugin_host.diagnostic_plugins ()
    |> List.map (fun (id,version) -> id ^ " (" ^ version ^ ")")
    |> String.concat ", " in
  let platform="App Version: " ^ Version.app ^ "\nGit Revision: " ^ Version.revision () ^
    "\nPlatform: " ^ sanitize_platform (Ui_services.env_user_agent ()) ^
    "\nLanguage: " ^ Ui_services.env_language () ^ "\nPlugins: " ^ plugins in
  "https://github.com/logseq/db-test/issues/new?title=&template=bug_report.yaml&labels=from:in-app&platform=" ^
  Ui_services.uri_encode_component platform

let open_issue () = Ui_services.env_open_url (issue_url ())
let navigate hash = Ui_services.nav_set_hash hash

let title ?(size=24) ?(line=32) key =
  heading ~level:1 ~margin:0 ~font_size:(string_of_int size ^ "px")
    ~font_weight:400 ~line_height:(string_of_int line ^ "px") ~value:(t key) []

let faded_text key = Ui_components.with_props [Prop.opacity 0.6] (text ~value:(t key) [])

let diagnostic_action title_key description_key icon action =
  Ui_components.with_props [Prop.font_size "16px";Prop.line_height "24px";Prop.font_weight 400]
    (button ~variant:`ghost ~label:(t title_key) ~padding_horizontal:16 ~padding_vertical:8
      ~margin_vertical:8 ~min_height:64 ~border_width:0 ~corner_radius:8 ~gap:8
      ~main:`start ~cross:`center ~background:"var(--ls-quaternary-background-color)"
      ~foreground:"var(--lx-accent-11)" ~text_alignment:`start
      ~style_class:"cp__bug-report-item-button" ~on_press:(fun _ -> action ())
      [Icons.icon ~size:18. icon;
       column ~min_width:0 [text ~value:(t title_key) [];faded_text description_key]])

let body content = Ui_components.with_props
  [Prop.font_size "16px";Prop.line_height "24px";Prop.font_weight 400]
  (column ~min_width:0 content)

let view () =
  body [column ~cross:`center
    [row ~cross:`center ~gap:8 ~margin_bottom:8
      [Icons.icon ~size:18. "bug";title ~size:30 ~line:36 "bug-report/title"];
     faded_text "bug-report/desc"];
    column ~padding:32 ~margin_top:32 ~corner_radius:8 ~min_width:0
      ~background:"var(--ls-tertiary-background-color)" ~style_class:"cp__bug-report-reporter"
      [title "bug-report.clipboard/title";
       faded_text "bug-report.clipboard/desc";
       diagnostic_action "bug-report.clipboard/action-title" "bug-report.clipboard/action-desc" "clipboard"
         (fun () -> navigate "#/bug-report-tool/clipboard-data-inspector");
       spacer ~height:16 [];
       title "bug-report.issue/title";
       faded_text "bug-report.issue/desc";
       diagnostic_action "bug-report.issue/action-title" "bug-report.issue/action-desc" "message-report" open_issue]]

let snapshot_json (snapshot : Ui_services.clipboard_snapshot) =
  let array convert values=Json.Array (Array.of_list (List.map convert values)) in
  Json.Object [
    "items",array (fun (kind,mime) -> Json.Object ["kind",Json.String kind;"type",Json.String mime]) snapshot.clipboard_items;
    "types",array (fun (mime,data) -> Json.Object ["type",Json.String mime;"data",Json.String data]) snapshot.clipboard_formats;
    "files",array (fun (name,mime,size) -> Json.Object ["name",Json.String name;"type",Json.String mime;"size",Json.Number size]) snapshot.clipboard_files]

let control key action =
  Ui_components.button ~variant:`primary ~size:`sm ~label:(t key) ~text:(t key)
    ~on_press:(fun _ -> action ()) []

let action_row description key action =
  row ~main:`space_between ~cross:`center ~margin_top:8
    [text ~width:0 ~grow:1. ~min_width:0 ~value:(t description) [];control key action]

let result_view ~reset value context parent =
  let alive=ref true and pending=ref None in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () ->
    alive:=false;Option.iter Ui_task.cancel !pending);
  let copy () =
    Option.iter Ui_task.cancel !pending;
    let task=Ui_services.clipboard_write_text value in
    pending:=Some task;
    let completed=Ui_task.catch
      (Ui_task.bind task (fun () -> Ui_task.resolve true))
      (fun error ->
        (match error with
         | Ui_task.Cancelled -> ()
         | _ -> if !alive then Toast.error (t "bug-report.inspector/copy-error"));
        Ui_task.resolve false) in
    ignore (Ui_task.bind completed (fun ok ->
      if ok && !alive then Toast.success (t "bug-report.inspector/copied");
      Ui_task.resolve ())) in
  column ~min_width:0
    [text ~value:(t "bug-report.inspector/clipboard-desc") [];
     action_row "bug-report.inspector/copy-desc" "bug-report.inspector/copy" copy;
     action_row "bug-report.inspector/create-issue-desc" "bug-report.inspector/create-issue" open_issue;
     action_row "bug-report.inspector/tip" "bug-report.inspector/back" reset;
     text ~as_:`Pre ~padding:8 ~margin_vertical:16 ~font_family:mono ~font_size:"16px"
       ~foreground:"var(--lx-gray-12)"
       ~line_height:"1.45em" ~background:"var(--ls-secondary-background-color)" ~white_space:"pre-wrap"
       [text ~as_:`Code ~font_size:"0.85em" ~accessibility_identifier:"clipboard-inspection-result"
         ~value []]] context parent

let inspector () context parent =
  let result=Signal.state context.Lui_ui.ui_scheduler None in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () -> Signal.dispose_signal (Signal.value result));
  let reset ()=Runtime.signal_set result None;Runtime.flush () in
  let initial context parent =
    Paste_capture.acquire ~scope:context.Lui_ui.ui_scope (fun event ->
      Runtime.signal_set result (Some (Json.stringify_pretty (snapshot_json (event.Ui_services.clipboard_snapshot ()))));
      Runtime.flush ());
    let shortcut=if Ui_services.env_is_mac () then {js|⌘+V|js} else "Ctrl+V" in
    let instructions=I18n.tf "bug-report.inspector/desc" [shortcut] |> String.split_on_char '\n' in
    column ~min_width:0
      (List.map (fun line -> text ~text_alignment:`center ~value:line []) instructions @
       [Ui_components.with_props
         [Prop.font_size "14px";Prop.line_height "20px";Prop.padding_left 8;Prop.padding_right 12]
         (Ui_components.input ~height:38 ~margin_top:4 ~padding_vertical:8
           ~placeholder:(t "bug-report.inspector/placeholder")
           ~accessibility_identifier:"clipboard-inspector-input" []);
        action_row "bug-report.inspector/tip" "bug-report.inspector/back"
          (fun () -> navigate "#/bug-report")]) context parent in
  body [row ~main:`center ~cross:`center ~gap:6 ~margin_bottom:16
    [Icons.icon ~size:18. "clipboard";title "bug-report.inspector/title"];
    reactive (function None -> initial | Some value -> result_view ~reset value) (Signal.value result)]
    context parent
