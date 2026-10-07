(* Native twin of src/render/pdf_annotation.ml — the cljs
   block.cljs annotation prefix (.prefix-link > .hl-page) +
   extensions/pdf/assets.cljs area-display. The area image resolves to
   the on-disk assets/<uuid>.png; the image lightbox and
   image-to-clipboard button are unported (no preview_images host op
   natively — see NOTES.md). *)

open Promise_ext
module D = Logseq_el
module W = Wire

(* per-block resolved hl-image record: src drives the async render *)
type hl_img = { src : string; width : int option; asset_uuid : string }

let hl_img_sigs : (string, hl_img option Signal.state) Hashtbl.t =
  Hashtbl.create 8

let hl_img_sig (b : Model.block) context =
  let uuid = Option.value b.Model.block_uuid ~default:"" in
  match Hashtbl.find_opt hl_img_sigs uuid with
  | Some st -> st
  | None ->
      let st = Signal.state context.Lui_ui.ui_scheduler None in
      Hashtbl.replace hl_img_sigs uuid st;
      (match b.Model.block_hl_image with
       | None -> ()
       | Some db_id ->
           ignore
             ((let* w = Properties_data.entity (W.Int db_id) in
               let width =
                 match W.get w "logseq.property.asset/resize-metadata" with
                 | Some m -> W.map_get_int m "width"
                 | None -> None
               in
               match W.map_get_uuid w "block/uuid" with
               | Some u ->
                   let src =
                     Filename.concat
                       (Asset_store.asset_dir (Runtime.repo ()))
                       (u ^ ".png")
                   in
                   Runtime.signal_set st
                     (Some { src; width; asset_uuid = u });
                   Js.Promise.resolve ()
               | None -> Js.Promise.resolve ())
              |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())));
      st

(* cljs area-display: .hl-area(style?) > .asset-container >
   .asset-action-bar + img.w-full *)
let area_display (b : Model.block) context : Lui_elements.t =
  let st = hl_img_sig b context in
  reactive ~equal:( = ) (fun r ->
      match r with
      | None -> Lui_elements.spacer ~key:"hla-none" []
      | Some r ->
          let w_style =
            match r.width with
            | Some w -> "width:" ^ string_of_int w ^ "px"
            | None -> ""
          in
          D.el ~key:"hl-a" ~tag:"div" ~style_class:"hl-area"
              ~attrs:
                (if w_style = "" then [] else [ ("style", w_style) ])
              [ D.el ~key:"hl-ac" ~tag:"div" ~style_class:"asset-container"
                  ~attrs:
                    [ ( "style"
                      , "width:" ^ if w_style = "" then "auto" else "100%"
                      ) ]
                  [ D.el ~key:"hl-ab" ~tag:"span"
                      ~style_class:"asset-action-bar"
                      [ Lui_elements.button ~key:"hl-ref"
                          ~label:"ref-block"
                          ~data_attrs:[ ("tabindex", "-1") ]
                          ~icon:(`app "file-symlink")
                          ~on_press:(fun _ ->
                            Pdf_assets.goto_asset_block r.asset_uuid)
                          []
                      ]
                  ; D.el ~key:"hl-img" ~tag:"img"
                      ~style_class:"w-full"
                      ~attrs:
                        [ ("src", r.src)
                        ; ( "id"
                          , "hl-area-img-"
                            ^ Option.value b.Model.block_uuid
                                ~default:"" ) ]
                      []
                  ]
              ]) st.Signal.state_signal

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
     ~on_pointer_down:(fun ev ->
       match ev with
       | Lui_protocol.PointerDown (_, d) ->
           let blank =
             d.Lui_protocol.target_class
             |> String.split_on_char ' '
             |> List.mem "blank"
           in
           if not (area && blank) then Pdf_assets.open_block_ref b
       | _ -> ())
     ([ Lui_elements.text ~key:"pfp" 
          [ Lui_elements.text ~key:"pfs" ~as_:`Strong
               ~value:page [] ]
      ]
      @
      if area && b.Model.block_hl_image <> None then
        [ area_display b context ]
      else []))
    context parent
