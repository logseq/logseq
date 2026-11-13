(* Drive the actual value Button, anchored chooser and selected ListItem.
   Worker replies are held at each read boundary; no callback is copied out of
   the production producer and no OS window or worker process is started. *)
let run ~check () =
  let module P = Lui_protocol in
  let module W = Wire in
  let module D = Properties_data in
  let previous_app = !Native_embed.current_app
  and previous_reader = !Runtime.read_model and previous_flush = !Runtime.app_flush
  and previous_send = !Runtime.app_send
  and previous_worker = !Runtime.worker and previous_host = !Host.host_op
  and previous_provider = !Dom_ext.doc_elements_provider
  and previous_subtree = !Dom_ext.subtree_elements_provider
  and previous_overlays = !Properties_state.view_overlays_state
  and previous_generation = !Properties_state.overlay_generation in
  Fun.protect ~finally:(fun () ->
    Native_embed.current_app := previous_app;
    Runtime.read_model := previous_reader; Runtime.app_flush := previous_flush;
    Runtime.app_send := previous_send;
    Runtime.worker := previous_worker; Host.set_host_op previous_host;
    Dom_ext.doc_elements_provider := previous_provider;
    Dom_ext.subtree_elements_provider := previous_subtree;
    Properties_state.view_overlays_state := previous_overlays;
    Properties_state.overlay_generation := previous_generation) (fun () ->
    List.iter (fun (boundary, retirement) ->
      Properties_state.view_overlays_state := None;
      let uuid = "23456789-1234-4abc-8def-000000000777" in
      let ident = "fixture/owned-node" in
      let already_selected = retirement="current-remove" || retirement="graph-remove" in
      let model = ref {Model.initial with repo=Some "picker-origin"} in
      let pending = ref None and holding = ref false
      and writes = ref [] and reads = ref [] in
      let choice = W.Map [W.kw "db/id",W.Int 92;
        W.kw "block/uuid",W.Uuid "23456789-1234-4abc-8def-000000000778";
        W.kw "block/title",W.String "Origin node option"] in
      let block = W.Map [W.kw "db/id",W.Int 77;W.kw "block/uuid",W.Uuid uuid;
        W.kw ident,W.Set [W.Keyword "fixture/prior-node"]] in
      let prior = W.Map [W.kw "db/id",W.Int (if already_selected then 92 else 93);
        W.kw "db/ident",W.Keyword "fixture/prior-node"] in
      let handler method_ args =
        match method_,args with
        | "thread-api/get-property-node-selector-data",[W.String repo;_] ->
            reads := (repo,"choices") :: !reads;
            Js.Promise.resolve (W.Map [W.kw "initial-choices",W.Array [choice]])
        | "thread-api/entity",[W.String repo;reference] ->
            let kind,value = if reference=D.uuid_ref uuid then "block",block
              else "reference",prior in
            reads := (repo,kind) :: !reads;
            if !holding && boundary=kind then begin
              let promise,resolve,_ = Js.Promise.pending () in
              check "one actual picker read owns the pending reply" (!pending=None);
              pending := Some (fun () -> resolve value);
              promise
            end else Js.Promise.resolve value
        | "thread-api/apply-outliner-ops",[W.String repo;operations;_] ->
            writes := (repo,operations) :: !writes;
            Js.Promise.resolve (W.Map [W.kw "result",W.Nil])
        | "thread-api/get-latest-journals",_ -> Js.Promise.resolve (W.Array [])
        | _ -> Js.Promise.resolve W.Nil in
      let make_worker () : Worker_client.t =
        {invoke_fn=handler;on_message=(fun _ _ -> ());dead=Js.Promise.liveness ();
         capture_restore_fn=(fun () -> fun () -> Js.Promise.resolve ())} in
      Runtime.worker := Some (make_worker ());
      Runtime.read_model := (fun () -> !model);
      Runtime.app_send := (fun _ -> false);
      Dom_ext.doc_elements_provider := Native_embed.collect_elements;
      Dom_ext.subtree_elements_provider := Native_embed.collect_subtree;
      let ctx : Properties_value.ctx =
        {owner_key="picker-origin";block_uuid=uuid;block_id=Some 77;
         refresh=(fun () -> ());is_page=false;class_schema=false} in
      let row = W.Map [W.kw "property-id",W.Keyword ident;
        W.kw "property",W.Map [W.kw "db/id",W.Int 91;W.kw "db/ident",W.Keyword ident;
          W.kw "block/title",W.String "Owned node";W.kw "logseq.property/type",W.Keyword "node";
          W.kw "db/cardinality",W.Keyword "db.cardinality/many"];
        W.kw "value",W.Set []] in
      let backend : P.backend =
        {backend_profile=P.profile P.MacOS P.NshHost;apply_batch=(fun _ -> true)} in
      let app = Lui_app.create backend !model (fun value (_ : Action.t) -> value)
        (fun context _ _ ->
          let overlays = Properties_state.view_overlays context in
          Lui_elements.column [Properties_value.node_view ~jump_target:false ctx row;
            reactive (fun entries -> Lui_elements.column
              (List.map (fun (entry : Properties_state.view_overlay) -> entry.vo_view) entries)) overlays]) in
      let measured = ref None and deferred_geometry = ref None in
      Fun.protect ~finally:(fun () ->
        Option.iter (fun node -> Native_embed.platform_event ("node-rect\n" ^
          Js.Json.stringify (Js.Json.object_list ["nodeId",Js.Json.number (float_of_int node)]))) !measured;
        ignore (Lui_app.dispose app)) (fun () ->
        Native_embed.current_app := Some app;
        Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
        ignore (Lui_app.start app); ignore (Lui_app.flush app);
        let runtime = Lui_app.runtime app in
        let find property value = Hashtbl.fold (fun node properties found ->
          if P.Property_map.find_opt property properties=Some (P.StringValue value)
          then Some node else found) runtime.Lui_runtime.runtime_properties None |> Option.get in
        let trigger = find P.AccessibilityIdentifier
          ("property-node-picker-origin-" ^ uuid ^ "-" ^ ident) in
        measured := Some trigger;
        Host.set_host_op (fun operation payload ->
          if operation="dom-op" && String.starts_with ~prefix:"measure-node\n" payload then begin
            let body=String.sub payload 13 (String.length payload-13) in
            let fields=match Js.Json.parseExn body with
              | Js.Json.JObject fields -> fields
              | _ -> failwith "Picker measurement must be an object" in
            let reference=List.assoc "ref" fields in
            let reply () = Native_embed.platform_event ("node-rect\n" ^ Js.Json.stringify (Js.Json.object_list
              ["nodeId",Js.Json.number (float_of_int trigger);"ref",reference;
               "rect",Js.Json.object_list ["left",Js.Json.number 80.;"top",Js.Json.number 100.;
                 "width",Js.Json.number 120.;"height",Js.Json.number 28.]])) in
            if boundary="measurement" then deferred_geometry := Some reply else reply ()
          end else previous_host operation payload);
        let settle () = Host.drain (); ignore (Lui_app.flush app) in
        let timer_before = !Host.timer_next in
        ignore (Native_embed.press trigger); settle ();
        if boundary="measurement" then begin
          check "the actual trigger awaits native measurement before popup mount"
            (Option.is_some !deferred_geometry && not (Properties_state.view_overlay_open ()));
          (match retirement with
           | "graph" -> model := {!model with Model.repo=Some "picker-destination";context_revision=1}
           | "worker" -> Runtime.worker := Some (make_worker ())
           | _ -> failwith "Unknown pre-mount picker retirement");
          (Option.get !deferred_geometry) ();
          (* Run only the actual retry scheduled by this trigger. It remains a
             real production callback; no replacement timer service is installed. *)
          Mutex.lock Host.timers_lock;
          let retries = Hashtbl.fold (fun id _ ids ->
            if id>timer_before then id::ids else ids) Host.timers [] in
          Mutex.unlock Host.timers_lock;
          check "one actual native-measurement retry belongs to this trigger" (List.length retries=1);
          Host.run_timer (List.hd retries) (); settle ()
        end;
        let option = find P.TextValue "Origin node option" in
        check "the actual node option is mounted in the retained picker"
          (Hashtbl.find runtime.Lui_runtime.mounted_nodes option=P.ListItem
           && Properties_state.view_overlay_open ());
        reads := []; holding := true;
        ignore (Native_embed.press option); settle ();
        if boundary="measurement" then
          check "a late-mounted option cannot adopt the graph or worker active at measurement completion"
            (!pending=None && !writes=[] && !reads=[] && not (Properties_state.view_overlay_open ()))
        else begin
        check "actual option activation reaches the requested async read boundary"
          (Option.is_some !pending && !writes=[]);
        (match retirement with
         | "graph" | "graph-remove" ->
             model := {!model with Model.repo=Some "picker-destination";context_revision=1}
         | "worker" -> Runtime.worker := Some (make_worker ())
         | "route" -> model := {!model with Model.route=Model.Page "Another page";context_revision=1}
         | "dismiss" -> Properties_state.close_all_view_overlays ();settle ()
         | "replacement" ->
             model := {!model with Model.repo=Some "picker-destination";context_revision=1};
             Properties_state.close_all_view_overlays ();settle ();
             holding := false;
             ignore (Native_embed.press trigger);settle ();
             check "a fresh destination chooser has its own option owner"
               (find P.TextValue "Origin node option"<>option
                && Properties_state.view_overlay_open ())
         | "current" | "current-remove" -> ()
         | _ -> failwith "Unknown picker retirement fixture");
        let before_reply_reads = !reads in
        let release = Option.get !pending in pending := None; holding := false;
        release (); settle ();
        if retirement="current" || retirement="current-remove" then begin
          let operation = if already_selected then "delete-property-value" else "set-block-property" in
          check "a current actual node choice writes exactly its original graph and owner"
            (!writes=["picker-origin",W.Array [W.Array [W.Keyword operation;
              W.Array [W.Uuid uuid;W.Keyword ident;W.Int 92]]]]);
          check "a current many-node picker remains mounted after its write"
            (Properties_state.view_overlay_open ())
        end else begin
          check "a retired node choice cannot mutate either graph"
            (!writes=[] && !reads=before_reply_reads);
          check "a retired async reply cannot close or adopt a replacement chooser"
            (Properties_state.view_overlay_open ()=(retirement="replacement"))
        end
        end))
      ["block","current";"reference","current";"reference","current-remove";
       "block","graph";"reference","graph";
       "block","worker";"reference","worker";
       "block","route";"reference","dismiss";"block","replacement";
       "reference","graph-remove";"measurement","graph";"measurement","worker"];
    print_endline "PASS native property node picker async graph and owner retirement")
