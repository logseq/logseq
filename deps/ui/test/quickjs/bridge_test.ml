open Plugin_protocol

let queue = Queue.create ()
let owner = Domain.self ()
let () = Ui_task.install {
  enqueue = (fun callback -> Queue.add callback queue);
  assert_owner = (fun () -> if Domain.self () <> owner then failwith "Foreign task owner");
}

let get = function Ok value -> value | Error error -> failwith (error_name error)
let context = get (editing_context
  ~block_uuid:"12345678-1234-1234-1234-123456789abc" ~text:"portable 中文 🦉")
let capabilities = [Editor_read; Editor_command]
let flush () =
  let remaining = ref 1024 in
  while not (Queue.is_empty queue) do
    decr remaining;
    if !remaining < 0 then failwith "Task queue failed to yield";
    Queue.take queue ()
  done

let observe task =
  let result = ref None in
  ignore (Ui_task.catch
    (Ui_task.bind task (fun value -> result := Some value; Ui_task.resolve ()))
    (fun error ->
      result := Some (Error (match error with Ui_task.Cancelled -> Cancelled | _ -> Runtime_failure));
      Ui_task.resolve ()));
  result

let until runtime condition =
  let deadline = Unix.gettimeofday () +. 3. in
  while not (condition ()) do
    if Unix.gettimeofday () > deadline then failwith "Native bridge did not settle";
    Quickjs_runtime.pump runtime;
    flush ()
  done

type change = None_pending | Stale_pending | Unload_pending | Cancel_pending
type case = {
  name : string;
  source : string;
  grants : capability list;
  change : change;
  repeat : bool;
  expected : (action list, error) result;
}

let case ?(grants = capabilities) ?(change = None_pending) ?(repeat = false) name source expected =
  { name; source; grants; change; repeat; expected }

let cases = [
  case "typed Promise read and configured result"
    {|export async function run(host) { const c = await host.getEditingContext();
      return [{kind:"insertText",text:c.text},{kind:"showDatePicker"}]; }|}
    (Ok [Insert_text "portable 中文 🦉"; Show_date_picker]);
  case "no blocking shared-memory intrinsics"
    {|export function run() { if (typeof Atomics !== "undefined" ||
      typeof SharedArrayBuffer !== "undefined") throw new Error("blocking intrinsic"); return []; }|}
    (Ok []);
  case ~grants:[Editor_command] "read capability required"
    {|export async function run(host) { await host.getEditingContext(); return []; }|}
    (Error Permission_denied);
  case ~grants:[Editor_read] "command capability required"
    {|export function run() { return []; }|} (Error Permission_denied);
  case "no UI source execution"
    {|export function run() { return [{kind:"eval",text:"anything"}]; }|} (Error Unsupported);
  case "unknown fields rejected"
    {|export function run() { return [{kind:"insertText",text:"x",html:"x"}]; }|}
    (Error Invalid_request);
  case "accessors are not invoked"
    {|export function run() { return [{get kind(){throw new Error("executed")}}]; }|}
    (Error Invalid_request);
  case "proxy values rejected"
    {|export function run() { return new Proxy([], {ownKeys(){throw new Error("executed")}}); }|}
    (Error Invalid_request);
  case "cyclic values rejected"
    {|export function run() { const a=[]; a.push(a); return a; }|} (Error Invalid_request);
  case "invalid Unicode rejected"
    {|export function run() { return [{kind:"insertText",text:"\ud800"}]; }|}
    (Error Invalid_request);
  case "message budget enforced"
    {|export function run() { return [{kind:"insertText",text:"x".repeat(32769)}]; }|}
    (Error Resource_limit);
  case "terminal ordering enforced"
    {|export function run() { return [{kind:"exitEditing"},{kind:"insertText",text:"x"}]; }|}
    (Error Invalid_request);
  case "imports disabled" {|import "os"; export function run(){return [];}|} (Error Unsupported);
  case "execution deadline enforced"
    {|export function run() { for (;;) {} }|} (Error Resource_limit);
  case "heap allocation bounded"
    {|export async function run() { return new Uint8Array(32*1024*1024); }|} (Error Resource_limit);
  case ~change:Stale_pending "stale async completion rejected"
    {|export async function run(host){ await host.getEditingContext(); return [{kind:"exitEditing"}]; }|}
    (Error Stale_context);
  case ~change:Unload_pending "unload invalidates pending read"
    {|export async function run(host){ await host.getEditingContext(); return []; }|} (Error Cancelled);
  case ~change:Cancel_pending "cancellation retires queued continuations"
    {|export async function run(host){ await host.getEditingContext(); return []; }|} (Error Cancelled);
  case ~repeat:true "retained host cannot access next invocation"
    {|let saved; export async function run(host){
      if (!saved) { saved=host; return []; } await saved.getEditingContext(); return []; }|}
    (Error Cancelled);
  case ~grants:[Editor_read] "registration requires command authority"
    {|export async function run(host){
      await host.registerEditorCommand({key:"test",label:"Test"},()=>[]); return [];
    }|} (Error Permission_denied);
  case "callback slots cannot be supplied by JavaScript"
    {|export async function run(host){
      await host.registerEditorCommand({key:"test",label:"Test"},1); return [];
    }|} (Error Invalid_request);
  case "duplicate command keys rejected"
    {|export async function run(host){
      await host.registerEditorCommand({key:"test",label:"Test"},()=>[]);
      await host.registerEditorCommand({key:"test",label:"Other"},()=>[]); return [];
    }|} (Error Invalid_request);
  case "command metadata bounded"
    {|export async function run(host){
      await host.registerEditorCommand({key:"test",label:"x".repeat(129)},()=>[]); return [];
    }|} (Error Resource_limit);
  case "command metadata accessors rejected"
    {|export async function run(host){
      await host.registerEditorCommand({get key(){throw new Error("accessor")},label:"Test"},()=>[]); return [];
    }|} (Error Invalid_request);
  case ~repeat:true "successful jobs drain before another epoch"
    {|let turn=0, completed=0;
      export function run(){
        if (turn++ && completed!==96) throw new Error("unfinished epoch");
        let chain=Promise.resolve();
        for(let i=0;i<96;i++) chain=chain.then(()=>{completed++});
        return [];
      }|} (Ok []);
  case "successful infinite job chain retires under budget"
    {|export function run(){
      function loop(){Promise.resolve().then(loop)} loop(); return [];
    }|} (Error Resource_limit);
]

let execute case =
  let broker = Plugin_broker.create () in
  let session = Plugin_broker.open_session broker (get (plugin_id "bridge-test")) case.grants in
  let runtime = get (Quickjs_runtime.create broker session) in
  Fun.protect ~finally:(fun () -> Quickjs_runtime.close runtime; flush ()) (fun () ->
    match Quickjs_runtime.load runtime ~source:case.source with
    | Error error -> Error error
    | Ok callback ->
        let invoke () =
          let current = ref true and pending = ref None in
          let services : Plugin_broker.services = {
            current = (fun () -> !current);
            get_editing_context = (fun () ->
              match case.change with
              | None_pending -> Ui_task.resolve (Ok context)
              | Stale_pending | Unload_pending | Cancel_pending ->
                  let task, resolve, _ = Ui_task.pending () in
                  pending := Some resolve;
                  task);
          } in
          let invocation = Plugin_broker.begin_invocation broker session services in
          let task = Quickjs_runtime.invoke_command runtime invocation callback in
          let result = observe task in
          (match case.change with
          | None_pending -> ()
          | Stale_pending | Unload_pending | Cancel_pending ->
              until runtime (fun () -> Option.is_some !pending);
              (match case.change with
              | Stale_pending -> current := false
              | Unload_pending -> Quickjs_runtime.close runtime
              | Cancel_pending ->
                  (Option.get !pending) (Ok context);
                  flush ();
                  Ui_task.cancel task
              | None_pending -> assert false));
          until runtime (fun () -> Option.is_some !result);
          let settled = Option.get !result in
          if case.change = Cancel_pending &&
             Quickjs_runtime.load runtime ~source:case.source <> Error Cancelled then
            failwith "Cancelled instance allowed reuse with queued continuations";
          Option.iter (fun resolve -> resolve (Ok context)) !pending;
          flush ();
          if !result <> Some settled then failwith "Late result changed settled invocation";
          (match settled with
          | Ok program when actions program = [Insert_text "portable 中文 🦉"; Show_date_picker] ->
              if Plugin_configured.output program <> Wire.Array [
                Wire.Array [Wire.kw "editor/input"; Wire.str "portable 中文 🦉"];
                Wire.Array [Wire.kw "editor/show-date-picker"]] then
                failwith "Configured command contract changed"
          | Ok _ | Error _ -> ());
          Result.map actions settled
        in
        if case.repeat && invoke () <> Ok [] then failwith "First invocation failed";
        invoke ())

let () =
  List.iter (fun case ->
    let result = execute case in
    if result <> case.expected then
      failwith (case.name ^ ": " ^ (match result with
        | Ok _ -> "unexpected program" | Error error -> error_name error));
    Printf.printf "PASS %s\n%!" case.name) cases
