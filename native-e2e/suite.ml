type contract = Desktop | Api | Helper
type context =
  { repo : string; artifacts : string; mutable assertions : int;
    mutable inputs : int; mutable sdk_calls : int; mutable real_apps : int;
    mutable apps : Client.t list; mutable next_app : int }
type test = { name : string; covers : string list; additional : bool; contract : contract; run : context -> unit }
let test ?(covers = []) ?(additional = false) ?(contract = Desktop) name run = { name; covers; additional; contract; run }
let context ~repo ~artifacts = { repo; artifacts; assertions = 0; inputs = 0;
                              sdk_calls = 0; real_apps = 0; apps = []; next_app = 0 }
let check ctx message condition =
  ctx.assertions <- ctx.assertions + 1;
  if not condition then failwith ("Assertion failed: " ^ message)
let equal ctx message actual expected = check ctx message (actual = expected)
let assertions ctx = ctx.assertions
let inputs ctx = ctx.inputs
let sdk_calls ctx = ctx.sdk_calls
let real_apps ctx = ctx.real_apps
let with_app ?root ?label ?initialize ctx f =
  ctx.next_app <- ctx.next_app + 1;
  let label = Option.value label ~default:("app-" ^ string_of_int ctx.next_app) in
  let app = Client.create ?root ~repo:ctx.repo ~artifacts:ctx.artifacts ~label
      ~on_input:(fun () -> ctx.inputs <- ctx.inputs + 1)
      ~on_sdk_call:(fun () -> ctx.sdk_calls <- ctx.sdk_calls + 1) () in
  ctx.apps <- app :: ctx.apps;
  Fun.protect ~finally:(fun () -> Client.close app) (fun () ->
      try
        Option.iter (fun initialize -> initialize app) initialize;
        Client.start app;
        ctx.real_apps <- ctx.real_apps + 1;
        f app
      with exn -> Client.evidence app (Printexc.to_string exn ^ "\n" ^ Printexc.get_backtrace ()); raise exn)
let cleanup ctx = List.iter Client.close ctx.apps
