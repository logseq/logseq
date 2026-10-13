let check message condition = if not condition then failwith message

let () =
  let disposed = ref 0 in
  let backend = Lui_protocol.{backend_profile=generic_profile (); apply_batch=(fun _ -> true)} in
  let app : (Model.t, Action.t) Lui_app.reducer_app =
    Lui_app.create backend Model.initial (fun model _ -> model)
      (fun context _ _ ->
        Signal.on_dispose context.Lui_ui.ui_scope (fun () ->
          Native_embed.assert_entry_owner ();
          incr disposed);
        Lui_elements.column [])
  in
  Native_embed.current_app := Some app;
  ignore (Native_embed.dispose ());
  check "Native disposal skipped UI cleanup" (!disposed = 1);
  check "Native disposal retained its application" (!(Native_embed.current_app) = None);
  ignore (Native_embed.dispose ());
  check "Native disposal ran cleanup twice" (!disposed = 1);
  Native_embed.with_entry_lock Native_embed.assert_entry_owner;
  print_endline "native lifecycle: OK"
