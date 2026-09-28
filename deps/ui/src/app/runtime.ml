(* Runtime services — the mutable side of the app, mirroring cljs
   frontend.state atoms: the worker client and the LUI app handle. *)

let worker : Worker_client.t option ref = ref None
let app_send : (Action.t -> bool) ref = ref (fun _ -> false)
let app_flush : (unit -> unit) ref = ref (fun () -> ())

(* mirrors of model fields for non-view consumers (sdk bridge, events) *)
let current_repo : string option ref = ref None
let current_page : Model.page option ref = ref None
let current_route : Model.route option ref = ref None
(* journals view renders several pages at once — editor actions like
   append/find need access to every journal item's blocks *)
let current_journals : Model.page list ref = ref []
(* set by the router per route — lets outliner_ops refresh views whose
   content isn't covered by current_page (e.g. the journals list) *)
let reload_current_view : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> Js.Promise.resolve ())

(* generation counter for async page loads — several Page_loaded
   producers (route loads, refresh_page, block zoom) can be in flight at
   once and their fetches can resolve out of order; bump on initiation
   and only commit when the captured generation is still current, so the
   latest-initiated load always wins *)
let load_gen : int ref = ref 0

let track action =
  match action with
  | Action.Boot_graph_ready repo -> current_repo := Some repo
  | Action.Page_loaded page -> current_page := Some page
  | Action.Journals_loaded js -> current_journals := js
  | Action.Navigate_to r ->
      current_page := None;
      current_journals := [];
      current_route := Some r
  | _ -> ()

let flush () = !app_flush ()

let send action =
  track action;
  ignore (!app_send action);
  flush ()

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
