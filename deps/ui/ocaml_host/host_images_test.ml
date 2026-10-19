open Lui_protocol

let check name condition=if not condition then failwith name
let png () =
  let image=Image.create_rgb ~alpha:true ~max_val:255 4 3 in
  for y=0 to 2 do for x=0 to 3 do Image.write_rgba image x y 10 20 30 255 done done;
  let encoded=Buffer.create 256 in
  ImageLib.PNG.write (ImageUtil.chunk_writer_of_buffer encoded) image;
  Buffer.to_bytes encoded
let batch ops={generation=1;ops}
let add id url=[CreateNode (id,Image);SetProp (id,UrlValue,StringValue url)]

let () =
  let execute,pump=Lui_resource.executor_queued () in
  let loads=ref 0 and changed=ref [] in
  let images=Host_images.create ~executor:execute
    ~source:(fun url -> incr loads;Lui_resource_loaders.Bytes (if url="bad" then Bytes.of_string "invalid" else png ()))
    ~on_change:(fun id -> changed:=id::!changed) () in
  let store=Lui_store.create () in
  let apply ops=let batch=batch ops in Lui_store.apply_batch store batch;Host_images.sync_batch images store batch in
  apply (add 1 "cover" @ add 2 "cover");
  check "one shared decoded entry" (Host_images.resource_count images=1 && Host_images.owner_count images=2);
  check "no image before executor" (Host_images.image_of images 1=None);
  check "shared owners start one decode task" (pump ()=1);
  check "decode alone cannot publish" (Host_images.image_of images 1=None && !changed=[]);
  Host.drain ();
  let image=Option.get (Host_images.image_of images 1) in
  check "decoded PNG dimensions" (image.Lui_scene.iw=4 && image.ih=3);
  check "two nodes share one bitmap" (Host_images.image_of images 2=Some image);
  check "foreground notifies both owners" (List.sort Int.compare !changed=[1;2]);
  apply [DropNode 1];
  check "remaining owner keeps resource" (Host_images.resource_count images=1 && Host_images.owner_count images=1);
  apply [DropNode 2];
  check "last owner retires resource" (Host_images.resource_count images=0 && Host_images.owner_count images=0);
  changed:=[];
  apply (add 3 "first");apply [SetProp (3,UrlValue,StringValue "second")];
  ignore (pump ());Host.drain ();
  check "replaced source cannot notify stale owner" (!changed=[3] && Host_images.resource_count images=1);
  apply [SetProp (3,UrlValue,StringValue "pending")];
  apply [DropNode 3];
  ignore (pump ());Host.drain ();
  check "dropped pending resource cannot publish" (Host_images.resource_count images=0 && Host_images.image_of images 3=None);
  apply (add 4 "bad");ignore (pump ());Host.drain ();
  check "decode failure stays empty" (Host_images.image_of images 4=None);
  let attempts= !loads in
  for _=1 to 20 do ignore (Host_images.image_of images 4) done;
  check "painting never retries failed loads" (!loads=attempts);
  apply [DropNode 4];
  apply (add 5 "same");
  apply ([DropNode 5] @ add 5 "same");
  ignore (pump ());Host.drain ();
  check "reused node id owns a fresh generation" (Option.is_some (Host_images.image_of images 5));
  apply ([CreateNode (10,Box)] @ add 11 "nested" @ [InsertChild (10,11,0)]);
  apply [CreateNode (10,Box)];
  check "recreating a parent releases image descendants" (Host_images.owner_count images=1);
  apply (add 11 "nested" @ [InsertChild (10,11,0)]);
  apply [DropNode 10];
  check "dropping a parent releases image descendants" (Host_images.owner_count images=1);
  apply [CreateNode (5,Box)];
  check "replacing an image with a container releases its owner" (Host_images.owner_count images=0);
  apply (add 5 "restored");
  apply [SetProp (5,ImageIdValue,IntValue 99)];
  check "registered image source releases URL ownership" (Host_images.owner_count images=0);
  apply [RemoveProp (5,ImageIdValue)];
  check "removing registered source restores URL ownership" (Host_images.owner_count images=1);
  apply (add 6 "late");Host_images.dispose images;
  ignore (pump ());Host.drain ();
  check "dispose releases all owners" (Host_images.owner_count images=0 && Host_images.resource_count images=0);
  Printf.printf "native image ownership, decoding and foreground publication: OK\n%!"

let () =
  let executor,pump=Lui_resource.executor_queued () in
  let images=Host_images.create ~executor ~source:(fun _ -> Lui_resource_loaders.Bytes (png ()))
    ~on_change:(fun _ -> ()) () in
  let store=Lui_store.create () in
  let apply ops=let batch=batch ops in Lui_store.apply_batch store batch;Host_images.sync_batch images store batch in
  apply (add 1 "cover" @ add 2 "cover");ignore (pump ());Host.drain ();
  let image=Option.get (Host_images.image_of images 1) in
  apply ([DropNode 1;DropNode 2] @ add 3 "cover");
  check "atomic owner transfer does not restart decoding" (pump ()=0);
  check "atomic owner transfer preserves the decoded bitmap" (Host_images.image_of images 3=Some image);
  apply [DropNode 3];
  check "transfer still releases the last owner" (Host_images.resource_count images=0);
  Host_images.dispose images;
  Printf.printf "native atomic image ownership transfer: OK\n%!"

let () = match Sys.getenv_opt "LOGSEQ_NATIVE_IMAGE_PROBE_URL" with
  | None -> ()
  | Some url ->
      let foreground=Domain.self () and notices=ref 0 in
      let images=Host_images.create ~on_change:(fun _ ->
        check "network completion stays on foreground" (Domain.self ()=foreground);incr notices) () in
      let store=Lui_store.create () in
      let initial=batch (add 1 url) in
      Lui_store.apply_batch store initial;Host_images.sync_batch images store initial;
      let deadline=Unix.gettimeofday () +. 35. in
      while Host_images.image_of images 1=None && Unix.gettimeofday ()<deadline do
        Host.drain ();Thread.delay 0.005
      done;
      let bitmap=Option.get (Host_images.image_of images 1) in
      check "real HTTPS image publishes once" (!notices=1);
      List.iter (fun scale ->
        let hooks={Lui_paint.default_hooks with image_of=Host_images.image_of images} in
        let host=Lui_host.create ~hooks ~layout:(module Lui_layout)
          ~renderer:{name="image-probe";render=(fun _ -> Bytes.empty)}
          ~width:300 ~height:300 ~scale () in
        ignore (Lui_host.apply_batch host (batch
          ([CreateNode (10,Root);CreateNode (20,Column);InsertChild (10,20,0)] @
           add 1 url @ [InsertChild (20,1,0);SetProp (1,WidthValue,IntValue 70)])));
        ignore (Lui_host.repaint host);
        let rect=Option.get (Lui_host.layout_rect host 1) in
        check "HTTPS image has natural rendered height" (abs_float (rect.h -. Float.round
          (70. *. float_of_int bitmap.ih /. float_of_int bitmap.iw *. scale))<0.01);
        check "HTTPS image paints through native scene" (List.exists (function
          | Lui_scene.Image op -> op.iimage=bitmap | _ -> false) (Lui_host.scene host).ops);
        Printf.printf "native HTTPS bitmap=%dx%d scale=%.0f frame=%.2fx%.2f\n%!"
          bitmap.iw bitmap.ih scale (rect.w /. scale) (rect.h /. scale)) [1.;2.];
      Host_images.dispose images
