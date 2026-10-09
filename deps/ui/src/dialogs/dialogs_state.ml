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

type t =
  { dialogs : string list (* bottom..top *)
  ; confirm : confirm option
  ; prompt : prompt option
  ; ui_request : ui_request option
  }

let initial = { dialogs = []; confirm = None; prompt = None; ui_request = None }

include State_cell.Make (struct
  type nonrec t = t
  let name = "dialogs"
end)

let ensure ctx = mount ctx initial

(* modal layer order (cljs shui modal stack): the most recently opened
   layer renders on top. ids: dialog names | "cmdk" | "prompt" |
   "confirm" — cmdk and other hosts stamp their own id here. *)
let layer_order : string list ref = ref []

let touch id = Overlay.touch layer_order id
let release id = Overlay.release layer_order id
let z_index id = Overlay.z_index ~base:999 layer_order id

(* drop layer ids whose layer is gone — runs inside every set so any
   removal path (close_top/close_named/close_all) stays in sync *)
let sync_layers (d : t) =
  layer_order :=
    List.filter
      (fun id ->
        id = "cmdk"
        || (id = "confirm" && Option.is_some d.confirm)
        || (id = "prompt" && Option.is_some d.prompt)
        || List.mem id d.dialogs)
      !layer_order

(* radix FocusScope restores focus to the element that held it before
   the modal opened when the last layer unmounts *)
let return_focus : Web_dom.el option ref = ref None

let has_layer (d : t) =
  d.dialogs <> [] || Option.is_some d.confirm
  || Option.is_some d.prompt || Option.is_some d.ui_request

let set f =
  let s = state () in
  (* cljs settings-effect cleanup: body[data-settings-tab] is removed
     when the settings panel unmounts. Signal.update only queues the
     value, so capture the next state inside the update fn. *)
  let had = List.mem "settings" (Runtime.signal_get s).dialogs in
  let removed = ref false in
  let opened = ref false in
  let emptied = ref false in
  Signal.update s (fun d ->
      let d' = f d in
      removed := had && not (List.mem "settings" d'.dialogs);
      opened := (not (has_layer d)) && has_layer d';
      emptied := has_layer d && not (has_layer d');
      sync_layers d';
      d');
  if !removed then Settings_state.deactivate ();
  if !opened then return_focus := Web_dom.active_element ();
  Runtime.flush ();
  if !emptied then (
    (match !return_focus with
     | Some el when Web_dom.el_is_connected el ->
         ignore
           (Web_dom.set_timeout (fun () -> Web_dom.el_focus el) 0)
     | _ -> ());
    return_focus := None)

let is_open name = List.mem name (value ()).dialogs

let open_ name =
  if is_open name then ()
  else (
    set (fun d -> { d with dialogs = d.dialogs @ [ name ] });
    touch name)

let close_top () =
  (match value () with
   | { prompt = None; confirm = None; ui_request = Some r; _ } ->
       r.ur_reject ()
   | _ -> ());
  set (fun d ->
      match d.prompt with
      | Some _ -> { d with prompt = None }
      | None -> (
          match d.confirm with
          | Some _ -> { d with confirm = None }
          | None -> (
              match d.ui_request with
              | Some _ -> { d with ui_request = None }
              | None -> (
                  match List.rev d.dialogs with
                  | _ :: r -> { d with dialogs = List.rev r }
                  | [] -> d))))

(* cljs close-e2ee-blocking-ui!: a ui-request closes every other layer
   and sits on top until resolved/rejected *)
let open_ui_request r =
  set (fun _ -> { dialogs = []; confirm = None; prompt = None; ui_request = Some r })

let clear_ui_request () = set (fun d -> { d with ui_request = None })

let close_named name =
  set (fun d ->
      { d with dialogs = List.filter (fun n -> n <> name) d.dialogs })

let close_all () =
  match (value ()).ui_request with
  | Some r -> r.ur_reject ()
  | None -> ();
  set (fun _ -> initial)

let ask ~title ~desc ~on_confirm () =
  set (fun d -> { d with confirm = Some { title; desc; on_confirm } });
  touch "confirm"

let close_confirm () = set (fun d -> { d with confirm = None })

let confirm () =
  match (value ()).confirm with
  | Some c ->
      close_confirm ();
      c.on_confirm ()
  | None -> ()

let prompt ~title ?(desc = "") ~on_submit () =
  set (fun d -> { d with prompt = Some { title; desc; on_submit } });
  touch "prompt"

let submit_prompt v =
  match (value ()).prompt with
  | Some p -> p.on_submit v
  | None -> ()

let close_prompt () = set (fun d -> { d with prompt = None })

let detail_field ev key =
  Js.Json.decodeString
    (Web_dom.js_get (Web_dom.js_get ev "detail") key)
  |> Option.value ~default:""

let init_done = ref false

(* -- modal focus trap (radix Dialog/AlertDialog): Tab/Shift+Tab cycle
   inside the topmost dialog content; focus leaving the layer wraps
   back to its first/last focusable *)
let focusable_sel =
  "a[href],button:not([disabled]),input:not([disabled])\
   ,textarea:not([disabled]),select:not([disabled])\
   ,[tabindex]:not([tabindex='-1'])"

let top_content () =
  let els =
    Web_dom.query_selector_all_arr
      ".ui__dialog-content,.ui__alert-dialog-content"
  in
  if Array.length els = 0 then None
  else Some els.(Array.length els - 1)

let trap_tab ev =
  match top_content () with
  | None -> ()
  | Some content -> (
      let fs =
        Array.to_list (Web_dom.el_query_all_arr content focusable_sel)
      in
      match fs with
      | [] ->
          Web_dom.ev_prevent_default ev;
          Web_dom.el_focus content
      | first :: _ ->
          let last = List.nth fs (List.length fs - 1) in
          (match Web_dom.active_element () with
           | Some a when Web_dom.el_contains content a ->
               (* inside the dialog: wrap at both ends; the container
                  itself (tabindex -1) counts as before-first *)
               if a == content then (
                 Web_dom.ev_prevent_default ev;
                 Web_dom.el_focus
                   (if Web_dom.ev_shift ev then last else first))
               else if a == last && not (Web_dom.ev_shift ev) then (
                 Web_dom.ev_prevent_default ev;
                 Web_dom.el_focus first)
               else if a == first && Web_dom.ev_shift ev then (
                 Web_dom.ev_prevent_default ev;
                 Web_dom.el_focus last)
           | Some a -> (
               (* focus outside the dialog but inside a higher layer
                  (open menu/popup) belongs to that layer's own trap —
                  only pull focus in when the page body holds it *)
               match Web_dom.query_selector "body" with
               | Some body when a == body ->
                   Web_dom.ev_prevent_default ev;
                   Web_dom.el_focus
                     (if Web_dom.ev_shift ev then last else first)
               | _ -> ())
           | None ->
               Web_dom.ev_prevent_default ev;
               Web_dom.el_focus first))

(* names this host renders — other components own the rest (e.g. "cards") *)
let known name =
  List.mem name
    [ "new-graph"; "add-graph"; "settings"; "login"; "import"; "importer"
    ; "export"; "export-graph"; "export-page"; "publish-page"; "plugins"
    ; "plugin-readme"; "plugin-settings" ]

let init () =
  if !init_done then ()
  else (
    init_done := true;
    Web_dom.on_document_event "ls:open-dialog" (fun ev ->
        match detail_field ev "name" with
        | "" -> ()
        | name -> if known name then open_ name);
    Web_dom.on_document_event "ls:close-dialog" (fun _ -> close_top ());
    Web_dom.on_document_event "keydown" (fun ev ->
        if
          Web_dom.event_str ev "key" = "Tab" && ready ()
          && not (Web_dom.ev_composing ev)
        then trap_tab ev;
        if Web_dom.event_str ev "key" = "Escape" && ready () then
          (* defer past every same-event listener: a popup layer or
             overlay stacked ABOVE the top dialog consumes the Escape
             itself (preventDefault) — only close our top layer when the
             key was left unclaimed. Without the defer this listener
             fires before the layer listeners (it registered first) and
             tears down the whole dialog under an open menu *)
          ignore
            (Web_dom.set_timeout
               (fun () ->
                 if not (Web_dom.ev_default_prevented ev) then
                   (* the Model.confirm alert (page delete etc.) lives
                      outside this stack; Confirm_set None is a no-op
                      when nothing is open, so it is safe to always send *)
                   if
                     (value ()).dialogs = []
                     && (value ()).confirm = None
                     && (value ()).prompt = None
                     && (value ()).ui_request = None
                   then (
                     Runtime.send (Action.Confirm_set None);
                     Runtime.flush ())
                   else close_top ())
               0)))
