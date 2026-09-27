(* Route-driven imperative mounts: the all-graphs view (#graphs) and the
   recycle content (.ls-recycle-page-content) live outside the LUI tree —
   page.ml renders an empty box for All_graphs and the Recycle page
   renders through the normal page pipeline, so we inject siblings under
   #main-content-container (whose only LUI child is static).

   TODO(shared): pages area owns route content — ideally a hook in
   page.ml would call into here. Until then we subscribe to the model. *)

let sub : Signal.subscription option ref = ref None

let on_model (m : Model.t) =
  match m.phase, m.route with
  | Model.Ready, Model.All_graphs ->
      Recycle.hide ();
      Graphs_view.show ()
  | Model.Ready, Model.Page name when name = "Recycle" ->
      Graphs_view.hide ();
      Recycle.show ()
  | Model.Ready, _ ->
      Graphs_view.hide ();
      Recycle.hide ()
  | _ -> ()

let init (ms : Model.t Signal.signal) =
  match !sub with
  | Some _ -> ()
  | None ->
      sub :=
        Some (Signal.subscribe ~emit_initial:true ms on_model)
