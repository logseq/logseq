(* Link against the real native conduit. A shared source offset has two
   independently keyed caret rectangles at a soft wrap. *)
let check label condition = if not condition then failwith label

let () =
  let previous_host = !Host.host_op in
  let previous_affinity = !Logseq_editor.geometry_affinity in
  let requests = ref [] in
  let block = "native-wrap-affinity-fixture" in
  Fun.protect ~finally:(fun () ->
    Host.set_host_op previous_host;
    Logseq_editor.configure_geometry ~affinity:previous_affinity;
    Host.drain ()) (fun () ->
    Host.set_host_op (fun operation payload -> requests := (operation, payload) :: !requests);
    Logseq_editor.configure_geometry ~affinity:true;
    let conduit = Option.get (Logseq_editor.conduit block) in
    let caret affinity = conduit.Edit_input.caret_rect ~affinity 5 in
    check "upstream starts without fabricated geometry" (caret Edit_model.Upstream = None);
    check "downstream starts without fabricated geometry" (caret Edit_model.Downstream = None);
    let reply affinity y epoch =
      Logseq_editor.note_measurement "caret-rect" (Js.Json.JObject
        ["block-id",Js.Json.JString block;"offset",Js.Json.JNumber 5.;
         "affinity",Js.Json.JString affinity;"geometry-epoch",Js.Json.JNumber epoch;
         "x",Js.Json.JNumber 10.;"y",Js.Json.JNumber y;"h",Js.Json.JNumber 20.]) in
    reply "upstream" 0. 0.;
    reply "downstream" 20. 0.;
    check "upstream cache keeps the previous visual row"
      (match caret Edit_model.Upstream with Some rect -> rect.Edit_input.y = 0 | None -> false);
    check "downstream cache keeps the following visual row"
      (match caret Edit_model.Downstream with Some rect -> rect.Edit_input.y = 20 | None -> false);
    check "each actual caret request carries its chosen affinity"
      (List.for_all (fun affinity ->
        List.exists (fun (operation,payload) -> operation="dom-op"
          && String.starts_with ~prefix:"caret-rect\n" payload
          && let json = Js.Json.parseExn (String.sub payload 11 (String.length payload - 11)) in
             Logseq_editor.jstr "affinity" json = Some affinity) !requests)
        ["upstream";"downstream"]);
    ignore (conduit.Edit_input.offset_at ~x:90 ~y:10);
    Logseq_editor.note_measurement "offset-at" (Js.Json.JObject
      ["block-id",Js.Json.JString block;"x",Js.Json.JNumber 90.;"y",Js.Json.JNumber 10.;
       "offset",Js.Json.JNumber 5.;"affinity",Js.Json.JString "upstream";
       "geometry-epoch",Js.Json.JNumber 0.]);
    check "native hit retains both byte offset and affinity"
      (conduit.Edit_input.offset_at ~x:90 ~y:10
       = Some (Edit_model.position ~affinity:Edit_model.Upstream 5));
    Logseq_editor.invalidate block;
    reply "upstream" 99. 0.;
    check "old epochs cannot restore upstream geometry" (caret Edit_model.Upstream = None);
    check "old epochs cannot restore downstream geometry" (caret Edit_model.Downstream = None);
    Logseq_editor.configure_geometry ~affinity:false;
    let legacy = "native-downstream-geometry-fixture" in
    let conduit = Option.get (Logseq_editor.conduit legacy) in
    ignore (conduit.Edit_input.caret_rect ~affinity:Edit_model.Upstream 5);
    Logseq_editor.note_measurement "caret-rect" (Js.Json.JObject
      ["block-id",Js.Json.JString legacy;"offset",Js.Json.JNumber 5.;
       "geometry-epoch",Js.Json.JNumber 0.;"x",Js.Json.JNumber 10.;
       "y",Js.Json.JNumber 40.;"h",Js.Json.JNumber 20.]);
    check "other native hosts retain their byte-only downstream geometry"
      (match conduit.Edit_input.caret_rect ~affinity:Edit_model.Upstream 5 with
       | Some rect -> rect.Edit_input.y = 40 | None -> false));
  print_endline "PASS native caret affinity, hit positions, epoch rejection and other-host compatibility"
