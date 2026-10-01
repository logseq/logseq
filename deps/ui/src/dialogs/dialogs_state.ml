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

let st : t Signal.state option ref = ref None

let ensure (ctx : Lui_ui.ui_context) =
  match !st with
  | Some _ -> ()
  | None -> st := Some (Signal.state ctx.ui_scheduler initial)

let state () =
  match !st with
  | Some s -> s
  | None -> failwith "dialogs state not mounted"

let ready () = Option.is_some !st
let value () = Signal.get_state (state ())
let signal () = (state ()).Signal.state_signal

(* modal layer order (cljs shui modal stack): the most recently opened
   layer renders on top. ids: dialog names | "cmdk" | "prompt" |
   "confirm" — cmdk and other hosts stamp their own id here. *)
let layer_order : string list ref = ref []

let touch id = Overlay.touch layer_order id
let release id = Overlay.release layer_order id
let z_index id = Overlay.z_index ~base:50 layer_order id

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

let set f =
  let s = state () in
  (* cljs settings-effect cleanup: body[data-settings-tab] is removed
     when the settings panel unmounts. Signal.update only queues the
     value, so capture the next state inside the update fn. *)
  let had = List.mem "settings" (Signal.get_state s).dialogs in
  let removed = ref false in
  Signal.update s (fun d ->
      let d' = f d in
      removed := had && not (List.mem "settings" d'.dialogs);
      sync_layers d';
      d');
  if !removed then Settings_state.deactivate ();
  Runtime.flush ()

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

let prompt ~title ~on_submit () =
  set (fun d -> { d with prompt = Some { title; on_submit } });
  touch "prompt"

let submit_prompt v =
  match (value ()).prompt with
  | Some p -> p.on_submit v
  | None -> ()

let close_prompt () = set (fun d -> { d with prompt = None })

let detail_field ev key =
  Js.Json.decodeString
    (Platform.json_prop (Platform.json_prop ev "detail") key)
  |> Option.value ~default:""

let init_done = ref false

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
    Platform.on_document_event "ls:open-dialog" (fun ev ->
        match detail_field ev "name" with
        | "" -> ()
        | name -> if known name then open_ name);
    Platform.on_document_event "ls:close-dialog" (fun _ -> close_top ());
    Browser_ui.on_document "keydown" (fun ev ->
        if Platform.event_str ev "key" = "Escape" && ready () then
          close_top ()))
