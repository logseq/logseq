(* Native twin of src/render/pdf_annotation.ml — the cljs
   block.cljs annotation prefix (.prefix-link > .hl-page) +
   extensions/pdf/assets.cljs area-display. The area image resolves to
   the on-disk assets/<uuid>.png and copies through the host's binary
   image clipboard. *)

open Promise_ext
module D = Logseq_el
module W = Wire

(* per-block resolved hl-image record: src drives the async render *)
type hl_img = { src : string; width : int option; asset_uuid : string }

let hl_img_sigs : (string, hl_img option Signal.state) Hashtbl.t =
  Hashtbl.create 8

let hl_img_sig (b : Model.block) context =
  let uuid = Option.value b.Model.block_uuid ~default:"" in
  let cache_key = Runtime.repo () ^ "\000" ^ uuid in
  match Hashtbl.find_opt hl_img_sigs cache_key with
  | Some st -> st
  | None ->
      let st = Signal.state context.Lui_ui.ui_scheduler None in
      Hashtbl.replace hl_img_sigs cache_key st;
      (match b.Model.block_hl_image with
       | None -> ()
       | Some db_id ->
           ignore
             ((let* w = Properties_data.entity (W.Int db_id) in
               let w = Properties_data.untag w in
               let width =
                 match W.get w "logseq.property.asset/resize-metadata" with
                 | Some m -> W.map_get_int m "width"
                 | None -> None
               in
               match W.map_get_uuid w "block/uuid" with
               | Some u ->
                   let src =
                     Platform.resource_url
                       (Filename.concat
                          (Asset_store.asset_dir (Runtime.repo ()))
                          (u ^ ".png"))
                   in
                   Runtime.signal_set st
                     (Some { src; width; asset_uuid = u });
                   Js.Promise.resolve ()
               | None -> Js.Promise.resolve ())
              |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())));
      st

let copy_image_to_clipboard asset_uuid =
  try
    let path =
      Filename.concat
        (Asset_store.asset_dir (Runtime.repo ()))
        (asset_uuid ^ ".png")
    in
    let png =
      let ic = open_in_bin path in
      Fun.protect
        ~finally:(fun () -> close_in_noerr ic)
        (fun () ->
          let length = in_channel_length ic in
          Bytes.of_string (really_input_string ic length))
    in
    let task = Platform.clipboard_write_image_png png in
    ignore
      (Ui_task.catch
         (Ui_task.bind task (fun () ->
            Toast.success (I18n.t "notification/copied");
            Ui_task.resolve ()))
         (fun _ -> Ui_task.resolve ()))
  with _ -> ()

(* cljs area-display: .hl-area(style?) > .asset-container >
   .asset-action-bar + img.w-full *)
let area_display (b : Model.block) context : Lui_elements.t =
  let st = hl_img_sig b context in
  reactive ~equal:( = ) (fun r ->
      match r with
      | None -> Lui_elements.spacer ~key:"hla-none" []
      | Some r ->
          D.el ~key:"hl-a" ~tag:"div" ~style_class:"hl-area"
              [ D.el ~key:"hl-ab" ~tag:"span"
                  ~style_class:"asset-action-bar"
                  [ Lui_elements.icon_button ~key:"hl-ref"
                      ~label:(I18n.t "asset/ref-block")
                      ~data_attrs:[ ("tabindex", "-1") ]
                      ~icon:(`app "file-symlink")
                      ~on_press:(fun _ ->
                        Pdf_assets.goto_asset_block r.asset_uuid)
                      []
                  ; Lui_elements.icon_button ~key:"hl-cp"
                      ~label:(I18n.t "asset/copy")
                      ~data_attrs:[ ("tabindex", "-1") ]
                      ~icon:(`app "copy")
                      ~on_press:(fun _ ->
                        copy_image_to_clipboard r.asset_uuid)
                      []
                  ; Lui_elements.icon_button ~key:"hl-max"
                      ~label:(I18n.t "asset/maximize")
                      ~data_attrs:[ ("tabindex", "-1") ]
                      ~icon:(`app "maximize")
                      ~on_press:(fun _ ->
                        Asset_dom.open_image_lightbox ~source:r.src
                          ~alt:(r.asset_uuid ^ ".png"))
                      []
                  ]
              ; Lui_elements.image ~key:"hl-img" ~url:r.src
                  ?width:r.width ~alt:(r.asset_uuid ^ ".png")
                  ~accessibility_identifier:
                    ("hl-area-img-"
                    ^ Option.value b.Model.block_uuid ~default:"")
                  []
              ]) (Signal.value (st))

(* cljs hl-ref prefix-link — pointerdown opens the pdf at the hl
   (unless the click lands on a .blank span inside an area hl) *)
let prefix_el (b : Model.block) : Lui_elements.t =
 fun context parent ->
  let area = b.Model.block_hl_type = Some "area" in
  let page =
    match b.Model.block_hl_page with
    | Some p -> "P" ^ string_of_int p
    | None -> "P?"
  in
  (* pointerdown reads the event target's class via pointer_detail *)
  (Lui_elements.text ~key:"pf" 
     ~on_pointer_down:(fun d ->
           let blank =
             d.Lui_protocol.target_class
             |> String.split_on_char ' '
             |> List.mem "blank"
           in
           if not (area && blank) then Pdf_assets.open_block_ref b)
     ([ Lui_elements.text ~key:"pfp" 
          [ Lui_elements.text ~key:"pfs" ~as_:`Strong
               ~value:page [] ]
      ]
      @
      if area && b.Model.block_hl_image <> None then
        [ area_display b context ]
      else []))
    context parent
