(* Web-entry scenarios for the shared editor view + input layer.

   Owns everything that cannot compile or does not mean the same thing
   under native compilation:
   - Stub_dom browser globals (Melange-only externals)
   - UTF-16 code-unit model semantics (Edit_model.U16 over real JS
     strings — see Edit_view_test.run_web)
   - the web Asset_dom view (the native Asset_dom module is a
     different surface with no ready_for/asset_container API)

   The runtime-portable scenarios live in Edit_view_test.run — this
   entry supplies the web [env] and also drives run_web so the
   U16-only suites keep executing here. *)

open Test_check
module DM = Drive.Model
module S = Drive.Session

let env : Edit_view_test.env =
  { install = Stub_dom.install
  ; utf16 = true
  ; register_extensions =
      (fun registry ->
        Logseq_emoji.register registry;
        Logseq_katex.register registry;
        Logseq_el.register registry;
        Logseq_editor.register registry;
        Logseq_codemirror.register registry;
        Logseq_virt.register registry)
  }

let sel str =
  match DM.selector_of_string str with
  | Some x -> x
  | None -> failwith ("bad selector " ^ str)

let test_loaded_asset () =
  env.install ();
  let uuid = "loaded-image-regression" in
  let original = Test_check.block uuid "Image" in
  let b = { original with Model.block_asset_type = Some "png" } in
  let view _context _model _send context parent =
    let ready = Asset_dom.ready_for uuid "png" context in
    Signal.set ready true;
    Asset_dom.asset_container uuid b context parent
  in
  (try
     let s = S.mount ~profile:Logseq_editor.web_profile ~initial:()
       ~reducer:(fun () () -> ()) ~view () in
     check "loaded asset mounts without interrupting the page flush"
       (Option.is_some (DM.first s.S.tree (sel "prop:accessibility-identifier=\"asset-img-loaded-image-regression\"")))
   with Invalid_argument message ->
     check ("loaded asset mounts without interrupting the page flush: " ^ message) false);
  Hashtbl.remove Asset_dom.ready_sigs uuid

let run () =
  Edit_view_test.run ~env;
  Edit_view_test.run_web ~env;
  test_loaded_asset ()
