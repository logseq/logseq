(* Dialog stack state for the generic dialog host (dialogs_view).
   Names: "new-graph" | "settings" | "login" | "import" | "export" —
   opened via open_ directly or a document 'ls:open-dialog' CustomEvent
   { detail: { name } }. 'ls:close-dialog' closes the topmost layer.
   Escape key closes the topmost layer too. *)

type confirm =
  { title : string
  ; desc : string
  ; on_confirm : unit -> unit
  }

type prompt =
  { title : string
  ; desc : string (* optional subtitle (cljs pdf-password-input) *)
  ; on_submit : string -> unit (* handler closes via close_prompt *)
  }

(* db-worker/ui-request layer: the worker asks the UI for an e2ee
   password (request-e2ee-password). ur_reject reports cancellation
   back to the worker; the resolver lives in ui_requests.ml. *)
type ui_request =
  { ur_id : string
  ; ur_reason : string
  ; ur_reject : unit -> unit
  }

(* pdf docinfo payload — rendered `key::` / `value` run pairs plus the
   flat text Copy all writes to the clipboard (cljs docinfo-display:
   `<strong>k::</strong>  <i>json</i>` rows; innerText joined by \n) *)
type docinfo =
  { di_rows : (string * string) list
  ; di_text : string
  }

type layer = Named of string | Confirm | Prompt | Ui_request | Docinfo

type t =
  { order : layer list (* bottom..top *)
  ; dialogs : string list
  ; confirm : confirm option
  ; prompt : prompt option
  ; ui_request : ui_request option
  ; docinfo : docinfo option
  }

let initial =
  { order = []; dialogs = []; confirm = None; prompt = None
  ; ui_request = None; docinfo = None }

include State_cell.Make (struct
  type nonrec t = t
  let name = "dialogs"
end)

let ensure ctx = mount ctx initial

let sync_layers (d : t) =
  { d with order = List.filter (function
      | Named name -> List.mem name d.dialogs
      | Confirm -> Option.is_some d.confirm
      | Prompt -> Option.is_some d.prompt
      | Ui_request -> Option.is_some d.ui_request
      | Docinfo -> Option.is_some d.docinfo) d.order }

let push_layer layer order = List.filter (( <> ) layer) order @ [ layer ]

(* Host focus handles are captured before mounting a layer. Each nested
   close returns to its own trigger; a newer layer invalidates the return. *)
let focus_returns : (layer * Ui_services.el option) list ref = ref []

let has_layer (d : t) =
  d.dialogs <> [] || Option.is_some d.confirm
  || Option.is_some d.prompt || Option.is_some d.ui_request
  || Option.is_some d.docinfo

let set f =
  let before = value () in
  let next = sync_layers (f before) in
  let opened = List.filter (fun layer -> not (List.mem layer before.order)) next.order in
  List.iter (fun layer ->
      focus_returns := (layer, Ui_services.dom_active_element ())
        :: List.remove_assoc layer !focus_returns) opened;
  let closed = List.filter (fun layer -> not (List.mem layer next.order)) before.order in
  let return_to = match List.rev before.order with
    | top :: _ when List.mem top closed -> List.assoc_opt top !focus_returns
    | _ -> None
  in
  focus_returns := List.filter (fun (layer, _) -> not (List.mem layer closed)) !focus_returns;
  if List.mem "settings" before.dialogs && not (List.mem "settings" next.dialogs)
  then Settings_state.deactivate ();
  Signal.set (state ()) next;
  Runtime.flush ();
  match return_to with
  | Some (Some el) when el.Ui_services.connected () ->
      Ui_services.timers_later ~ms:0 (fun () ->
          if (value ()).order = next.order && el.Ui_services.connected ()
          then el.Ui_services.focus ())
  | _ -> ()

let is_open name = List.mem name (value ()).dialogs

let open_ name =
  if not (is_open name) then
    set (fun d -> { d with dialogs = d.dialogs @ [ name ];
      order = push_layer (Named name) d.order })

let close_top () =
  (match List.rev (value ()).order, (value ()).ui_request with
   | Ui_request :: _, Some request -> request.ur_reject ()
   | _ -> ());
  set (fun d -> match List.rev d.order with
      | Prompt :: _ -> { d with prompt = None }
      | Confirm :: _ -> { d with confirm = None }
      | Ui_request :: _ -> { d with ui_request = None }
      | Docinfo :: _ -> { d with docinfo = None }
      | Named name :: _ -> { d with dialogs = List.filter (( <> ) name) d.dialogs }
      | [] -> d)

(* cljs close-e2ee-blocking-ui!: a ui-request closes every other layer
   and sits on top until resolved/rejected *)
let open_ui_request r =
  set (fun _ -> { initial with order = [ Ui_request ]; ui_request = Some r })

let clear_ui_request () = set (fun d -> { d with ui_request = None })

let close_named name =
  set (fun d ->
      { d with dialogs = List.filter (fun n -> n <> name) d.dialogs })

let close_all () =
  (match (value ()).ui_request with
   | Some r -> r.ur_reject ()
   | None -> ());
  set (fun _ -> initial)

let ask ~title ~desc ~on_confirm () =
  set (fun d -> { d with confirm = Some { title; desc; on_confirm };
    order = push_layer Confirm d.order })

let close_confirm () = set (fun d -> { d with confirm = None })

let confirm () =
  match (value ()).confirm with
  | Some c ->
      close_confirm ();
      c.on_confirm ()
  | None -> ()

let prompt ~title ?(desc = "") ~on_submit () =
  set (fun d -> { d with prompt = Some { title; desc; on_submit };
    order = push_layer Prompt d.order })

let submit_prompt v =
  match (value ()).prompt with
  | Some p -> p.on_submit v
  | None -> ()

let close_prompt () = set (fun d -> { d with prompt = None })

(* pdf_toolbar opens the docinfo modal once get_metadata resolves — the
   metadata json is flattened to run pairs there so the layer carries
   ready-to-render text. *)
let open_docinfo di =
  set (fun d -> { d with docinfo = Some di; order = push_layer Docinfo d.order })

let close_docinfo () = set (fun d -> { d with docinfo = None })

let detail_field (ev : Ui_services.ev) key =
  Option.value (ev.Ui_services.detail key) ~default:""

let init_done = ref false

(* -- modal focus trap (radix Dialog/AlertDialog): Tab/Shift+Tab cycle
   inside the topmost dialog content; focus leaving the layer wraps
   back to its first/last focusable *)
let focusable_sel =
  "a[href],button:not([disabled]),input:not([disabled])\
   ,textarea:not([disabled]),select:not([disabled])\
   ,[tabindex]:not([tabindex='-1'])"

let top_content () =
  match
    Ui_services.dom_query_all
      ".ui__alert-dialog-content,.lui-dialog"
  with
  | [] -> None
  | els -> Some (List.nth els (List.length els - 1))

(* the services layer offers no element-identity op: two els bound to
   the same host element contain each other, and nothing else does.
   (On the native host contains never self-matches, so these checks
   conservatively stay off there.) *)
let same_el (a : Ui_services.el) (b : Ui_services.el) =
  a.Ui_services.contains b && b.Ui_services.contains a

let trap_tab ev =
  match top_content () with
  | None -> ()
  | Some content -> (
      let fs = content.Ui_services.query_all focusable_sel in
      match fs with
      | [] ->
          ev.Ui_services.prevent_default ();
          content.Ui_services.focus ()
      | first :: _ ->
          let last = List.nth fs (List.length fs - 1) in
          (match Ui_services.dom_active_element () with
           | Some a when content.Ui_services.contains a ->
               (* inside the dialog: wrap at both ends; the container
                  itself (tabindex -1) counts as before-first *)
               if same_el a content then (
                 ev.Ui_services.prevent_default ();
                 (if ev.Ui_services.shift then last else first)
                   .Ui_services.focus ())
               else if same_el a last && not ev.Ui_services.shift then (
                 ev.Ui_services.prevent_default ();
                 first.Ui_services.focus ())
               else if same_el a first && ev.Ui_services.shift then (
                 ev.Ui_services.prevent_default ();
                 last.Ui_services.focus ())
           | Some a -> (
               (* focus outside the dialog but inside a higher layer
                  (open menu/popup) belongs to that layer's own trap —
                  only pull focus in when the page body holds it *)
               if same_el a (Ui_services.dom_body ()) then (
                 ev.Ui_services.prevent_default ();
                 (if ev.Ui_services.shift then last else first)
                   .Ui_services.focus ()))
           | None ->
               ev.Ui_services.prevent_default ();
               first.Ui_services.focus ()))

(* names this host renders — other components own the rest (e.g. "cards") *)
let known name =
  List.mem name
    [ "new-graph"; "add-graph"; "settings"; "login"; "import"; "importer"
    ; "export"; "export-graph"; "export-page"; "publish-page"; "plugins"
    ; "plugin-readme"; "plugin-settings"; "sync-server"; "publish-server"
    ; "rtc-collaborators"; "quick-add" ]

let init () =
  if !init_done then ()
  else (
    init_done := true;
    Ui_services.dom_on_document_event "ls:open-dialog" (fun ev ->
        match detail_field ev "name" with
        | "" -> ()
        | name -> if known name then open_ name);
    Ui_services.dom_on_document_event "ls:close-dialog" (fun _ ->
        close_top ());
    Ui_services.dom_on_document_event "keydown" (fun ev ->
        if
          ev.Ui_services.key = Some "Tab" && ready ()
          && not ev.Ui_services.composing
        then trap_tab ev))
