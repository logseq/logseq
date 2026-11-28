(* Offscreen page/block PNG export: re-layout the retained store at the
   target's live width with virtualization disabled (every virtual-list
   viewport covers the full content extent), paint the whole tree into a
   fresh scene, rasterize the CPU renderer and crop the target rect.
   This mirrors the web html2canvas semantics — fresh layout at export
   dimensions, zero scroll, full content height — instead of cropping
   the window, which would clip scrolled-off content. *)

type env = {
  store : unit -> Lui_store.t;
  scale : unit -> float;
  images : Host_images.t;
  live_rect : int -> Lui_scene.rect option;
}

let find_main_content store =
  let found = ref 0 in
  Lui_store.iter_preorder store (fun id ->
      if !found = 0 then
        match Lui_store.string_prop store id "key" with
        | Some "main-content" -> found := id
        | _ -> (
            match Lui_store.string_prop store id "accessibility-identifier" with
            | Some "main-content-container" -> found := id
            | _ -> ()));
  if !found = 0 then None else Some !found

let find_block_node store uuid =
  let found = ref 0 in
  Lui_store.iter_preorder store (fun id ->
      if !found = 0 then
        match Lui_store.prop store id "block-id" with
        | Some (Lui_protocol.StringValue v) when v = uuid -> found := id
        | _ -> ());
  if !found = 0 then (
    (* fall back to the data-blockid attr mirrored on block rows *)
    Lui_store.iter_preorder store (fun id ->
        if !found = 0 then
          match Lui_store.string_prop store id "data-blockid" with
          | Some v when v = uuid -> found := id
          | _ -> ()));
  if !found = 0 then None else Some !found

let render (env : env) ~(target : [ `Page | `Block of string ]) ~transparent
    () : (string * int * int) option =
  let store = env.store () in
  let node_id =
    match target with
    | `Page -> find_main_content store
    | `Block uuid -> find_block_node store uuid
  in
  match node_id with
  | None -> None
  | Some node_id -> (
      match env.live_rect node_id with
      | None -> None
      | Some live ->
        let scale = env.scale () in
        let logical_w = live.Lui_scene.w /. scale in
        if logical_w < 1. then None
        else begin
          let width = logical_w in
          let height = 100000. in
          let engine = Lui_layout.create () in
          let scene_cell = ref None in
          let text_engine =
            Text_engine.create
              ~scene:(fun () -> Option.get !scene_cell)
              ~scale:(fun () -> scale)
              ~store:(fun () -> store)
          in
          let measure id text w _h =
            Some (Text_engine.measure_text ~width:w text_engine id text)
          in
          Lui_layout.sync ~scale ~measure
            ~vport:(fun _ -> Some (0., height))
            ~width ~height engine store;
          let rect_of id =
            match Lui_layout.rect engine id with
            | Some r -> r
            | None -> Lui_scene.rect 0. 0. 0. 0.
          in
          let target_r =
            match Lui_layout.rect engine node_id with
            | Some r -> r
            | None -> Lui_scene.rect 0. 0. 0. 0.
          in
          if target_r.Lui_scene.w < 1. || target_r.Lui_scene.h < 1. then None
          else begin
            let out_w = int_of_float (Float.ceil target_r.Lui_scene.w) in
            let out_h = int_of_float (Float.ceil target_r.Lui_scene.h) in
            let clear =
              if transparent then Lui_scene.color 0 0 0 0
              else
                match Theme_vars.color_of "--ls-primary-background-color" with
                | Some c -> c
                | None -> Lui_scene.color 255 255 255 255
            in
            let scene =
              Lui_scene.create
                ~mask_atlas:(Lui_scene.Atlas.create ~bpp:1 ~w:512 ~h:512)
                ~color_atlas:(Lui_scene.Atlas.create ~bpp:4 ~w:512 ~h:512)
            in
            scene_cell := Some scene;
            let rec hooks =
              Lui_paint.
                { color_of = Theme_vars.color_of
                ; layout = (fun id -> Lui_paint.placement_of_rect (rect_of id))
                ; state_of = (fun _ -> Lui_paint.state_neutral)
                ; hidden = (fun _ -> false)
                ; scroll_of = (fun _ -> None)
                ; mounted_children = (fun _ -> None)
                ; text_ops =
                    (fun id r fg s ->
                      Text_engine.text_ops text_engine id r fg s)
                ; text_flow = Text_engine.text_flow text_engine
                ; text_flow_ops = Text_engine.text_flow_ops text_engine
                ; image_of =
                    (fun id ->
                      if Lui_store.kind store id = "image" then
                        Host_images.image_of env.images id
                      else
                        Host_icons.image_of ~hooks store scale id (rect_of id))
                ; image_in =
                    (fun id r ->
                      if Lui_store.kind store id = "image" then
                        Host_images.image_of env.images id
                      else Host_icons.image_of ~hooks store scale id r)
                ; shadow_of =
                    (fun name ->
                      Lui_theme.shadow_of
                        ~resolve:(fun _mode s -> Theme_vars.color_of s)
                        !Theme_vars.mode name)
                }
            in
            (* the scene must cover the whole target rect in device
               px — ops outside the scene bounds are clipped by the
               rasterizer, so size it to the target's bottom edge *)
            let scene_w = int_of_float (Float.ceil (width *. scale)) in
            let scene_h =
              int_of_float
                (Float.ceil
                   (Float.min height (target_r.Lui_scene.y +. target_r.Lui_scene.h +. 2.)))
            in
            Lui_paint.paint hooks store scene
              ~width:scene_w ~height:scene_h ~scale ~clear;
            let image =
              Lui_raster.render ~scene ()
            in
            (* the scene is laid out with the target at its natural
               position; translate so the target origin lands at 0,0 and
               crop the target rect *)
            let stride = image.Lui_raster.Image.stride / 4 in
            let x0 = int_of_float (Float.floor target_r.Lui_scene.x) in
            let y0 = int_of_float (Float.floor target_r.Lui_scene.y) in
            let cropped = Bytes.create (out_w * out_h * 4) in
            let rgba = Lui_raster.Image.rgba image in
            for y = 0 to out_h - 1 do
              let sy = y0 + y in
              if sy >= 0 && sy < image.Lui_raster.Image.h then
                for x = 0 to out_w - 1 do
                  let sx = x0 + x in
                  if sx >= 0 && sx < image.Lui_raster.Image.w then begin
                    let si = (sy * stride + sx) * 4 in
                    let di = (y * out_w + x) * 4 in
                    Bytes.blit rgba si cropped di 4
                  end
                done
            done;
            let straight = Host_png.unpremultiply cropped in
            Some (Host_png.encode ~w:out_w ~h:out_h straight, out_w, out_h)
          end
        end)
