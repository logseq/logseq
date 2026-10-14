let check name condition = if not condition then failwith name

let () =
  Platform.install_ui_services ~assert_owner:(fun () -> ())
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  List.iter (fun scale ->
      let store = Lui_store.create () in
      let backend =
        { Lui_protocol.backend_profile =
            Lui_protocol.profile Lui_protocol.LinuxOS Lui_protocol.GenericHost
        ; apply_batch = (fun batch -> Lui_store.apply_batch store batch; true) } in
      let registry = Lui_extension.registry () in
      Logseq_editor.register registry;
      let app = Lui_app.create_with_extensions backend registry
          (Edit_model.create ~units:Edit_model.Bytes "abcd")
          (fun _ next -> next)
          (fun context model _send ->
             Lui_elements.column ~padding_horizontal:10 ~padding_vertical:12
               [ Edit_view.view ~model
               ~frame:(Signal.value
                 (Signal.state context.Lui_ui.ui_scheduler Edit_input.empty_frame))
               ~block_id:"geometry" ~on_input:(fun _ -> ()) ~cls:"" ]) in
      ignore (Lui_app.start app);
      ignore (Lui_app.flush app);
      let layout = Lui_layout.create () in
      let measure _ text = float (String.length text * 10) *. scale, 24. *. scale in
      Lui_layout.sync ~scale ~width:(300. *. scale) ~height:(48. *. scale)
        ~measure:(fun id text _ _ -> Some (measure id text)) layout store;
      let rect_of id = Option.value (Lui_layout.rect layout id)
          ~default:(Lui_scene.rect 0. 0. 0. 0.) in
      let env : Host_requests.env =
        { store; ui = Lui_window.Ui.create (); rects = Lui_window.Rects.create ()
        ; rect_of; scale = (fun () -> scale); measure
        ; apply_batch = (fun _ -> ()); apply_actions = (fun _ -> ())
        ; set_ime_rect = (fun _ -> ()); focused_text_input = (fun _ -> ())
        ; repaint = (fun () -> ()) } in
      Native_embed.replies := [];
      Host_requests.dom_op env "caret-rect"
        {|{"block-id":"geometry","offset":2}|};
      let reply = List.hd !Native_embed.replies in
      let json = Yojson.Safe.from_string
          (String.sub reply 11 (String.length reply - 11)) in
      let number key = Host_requests.jfloat key json in
      Printf.printf "native caret at scale %.0f: %.0f,%.0f height %.0f\n%!"
        scale (number "x") (number "y") (number "h");
      check "editor caret replies use logical glyph coordinates at every backing scale"
        (number "x" = 20. && number "y" = 0. && number "h" = 24.
         && number "ox" = 10. && number "oy" = 12.);
      Native_embed.replies := [];
      Host_requests.dom_op env "offset-at"
        {|{"block-id":"geometry","x":20,"y":12}|};
      let reply = List.hd !Native_embed.replies in
      let json = Yojson.Safe.from_string
          (String.sub reply 10 (String.length reply - 10)) in
      check "logical pointer coordinates hit the same model offset at every backing scale"
        (Host_requests.jint_opt "offset" json = Some 2);
      Native_embed.replies := [];
      Host_requests.dom_op env "scroll-height" {|{"block-id":"geometry"}|};
      let reply = List.hd !Native_embed.replies in
      let json = Yojson.Safe.from_string
          (String.sub reply 14 (String.length reply - 14)) in
      check "editor height replies remain logical at every backing scale"
        (Host_requests.jfloat "height" json = 24.);
      ignore (Lui_app.dispose app)) [ 1.; 2. ];
  print_endline "native editor coordinate contract: OK"
