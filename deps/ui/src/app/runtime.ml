(* Runtime services — the mutable side of the app, mirroring cljs
   frontend.state atoms: the worker client and the LUI app handle. *)

let worker : Worker_client.t option ref = ref None
let app_send : (Action.t -> bool) ref = ref (fun _ -> false)
let app_flush : (unit -> unit) ref = ref (fun () -> ())

(* mirrors of model fields for non-view consumers (sdk bridge, events) *)
let current_repo : string option ref = ref None
let current_page : Model.page option ref = ref None
let current_route : Model.route option ref = ref None

let track action =
  match action with
  | Action.Boot_graph_ready repo -> current_repo := Some repo
  | Action.Page_loaded page -> current_page := Some page
  | Action.Navigate_to r ->
      current_page := None;
      current_route := Some r
  | _ -> ()

let send action =
  track action;
  ignore (!app_send action)
let flush () = !app_flush ()

(* Convenience for feature modules: update a signal state and flush so the
   DOM re-renders outside the LUI event loop (async callbacks, timers). *)
let signal_set (state : 'a Signal.state) (v : 'a) =
  Signal.set state v;
  flush ()

let worker_or_fail () =
  match !worker with
  | Some w -> w
  | None -> failwith "db-worker not started"

let invoke name args = Worker_client.invoke (worker_or_fail ()) name args
let invoke1 name a = invoke name [ a ]
let invoke2 name a b = invoke name [ a; b ]
let invoke3 name a b c = invoke name [ a; b; c ]
