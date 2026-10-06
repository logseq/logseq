(* cljs block.cljs annotation prefix (.prefix-link > .hl-page) +
   extensions/pdf/assets.cljs area-display + open-lightbox! — the
   Pdf-annotation ref-block chrome rendered inside .block-title-wrap. *)

open Lui_elements
module D = Render_dom
(* ---------- cljs area-display ---------- *)

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
      ignore
        ((let ( let* ) p f = Js.Promise.then_ f p in
          let* uuid_w = Pdf_assets.hl_image_block b in
          match uuid_w with
          | Some u, w ->
              let* src =
                Asset_store.object_url ~repo:(Runtime.repo ())
                  ~name:(u ^ ".png") ~mime:"image/png"
              in
              Runtime.signal_set st
                (Some { src; width = w; asset_uuid = u });
              Js.Promise.resolve ()
          | None, _ -> Js.Promise.resolve ())
         |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()));
      st

(* clipboard.write ClipboardItem — cljs util/copy-image-to-clipboard *)
external clipboard_write : Js.Json.t array -> unit Js.Promise.t
  = "write" [@@mel.send] [@@mel.scope ("navigator", "clipboard")]

external new_clipboard_item : Js.Json.t -> Js.Json.t
  = "ClipboardItem" [@@mel.new]

external fetch_blob : string -> Js.Json.t Js.Promise.t = "fetch"
  [@@mel.scope "window"]

external resp_blob : Js.Json.t -> Js.Json.t Js.Promise.t = "blob"
  [@@mel.send]

external blob_type : Js.Json.t -> string = "type" [@@mel.get]

let copy_image_to_clipboard src =
  ignore
    (let ( let* ) p f = Js.Promise.then_ f p in
     let* resp = fetch_blob src in
     let* blob = resp_blob resp in
     let item = new_clipboard_item blob in
     let* () =
       clipboard_write
         [| Js.Json.object_
              (Js.Dict.fromList [ blob_type blob, item ]) |]
     in
     Toast.success (I18n.t "notification/copied");
     Js.Promise.resolve ()
     |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()))

(* ---------- cljs open-lightbox! (.hl-area img, y/x sorted, clicked
   first) ---------- *)

external img_nat_w : Web_dom.el -> float = "naturalWidth"
  [@@mel.get]

external img_nat_h : Web_dom.el -> float = "naturalHeight"
  [@@mel.get]

external el_y : Web_dom.el -> float = "offsetTop" [@@mel.get]

external el_x : Web_dom.el -> float = "offsetLeft" [@@mel.get]

let hl_area_imgs () = Web_dom.query_selector_all_arr ".hl-area img"

let open_hl_lightbox ?clicked_id () =
  let imgs = hl_area_imgs () in
  let n = Array.length imgs in
  if n > 0 then begin
    let sorted =
      Array.copy imgs |> Array.to_list
      |> List.stable_sort (fun a b ->
             compare (el_y a, el_x a) (el_y b, el_x b))
      |> Array.of_list
    in
    let idx =
      match clicked_id, n with
      | Some id, n when n > 1 ->
          (* #hl-area-img-<uuid> ids the .lui-image wrapper — the
             sorted imgs are the inner .lui-image-pixels *)
          let rec find i =
            if i >= n then 0
            else if
              (match Web_dom.el_parent sorted.(i) with
               | Some p ->
                   Option.value (Web_dom.el_get_attr p "id") ~default:""
               | None -> "")
              = id
            then i
            else find (i + 1)
          in
          find 0
      | _ -> 0
    in
    let items =
      Array.init n (fun j ->
          let img = sorted.((idx + j) mod n) in
          Web_dom.json_props
            [ "src",
              Js.Json.string
                (Option.value (Web_dom.el_get_attr img "src")
                   ~default:"")
            ; "w", Js.Json.string (Printf.sprintf "%.0f" (img_nat_w img))
            ; "h", Js.Json.string (Printf.sprintf "%.0f" (img_nat_h img)) ])
    in
    Asset_dom.preview_images items
  end

(* cljs asset-action-bar button inside .hl-area — ~label: carries the
   tip (aria-label feeds the app tooltip like the cljs title attr did) *)
let area_btn ~key ~title ~icon ~onclick : t =
  button ~key ~style_class:"asset-action-btn"
    ~label:title
    ~data_attrs:[ ("tabindex", "-1") ]
    ~icon:(`app icon)
    ~on_press:(fun _ -> onclick ())
    []

(* cljs area-display: .hl-area(style?) > .asset-container >
   .asset-action-bar + img.w-full *)
let area_display (b : Model.block) context : t =
  let st = hl_img_sig b context in
  reactive (fun r ->
      match r with
      | None -> Logseq_dom.nothing
      | Some r ->
          (* asset-container is width:auto unless hl-area pins a px
             width — then it fills *)
          let container_cls =
            match r.width with
            | Some _ -> "asset-container w-full"
            | None -> "asset-container"
          in
          box ~key:"hl-a" ~style_class:"hl-area" ?width:r.width
            [ box ~key:"hl-ac" ~style_class:container_cls
                  [ box ~key:"hl-ab" ~style_class:"asset-action-bar"
                      [ area_btn ~key:"hl-ref" ~title:(I18n.t "asset/ref-block")
                          ~icon:"file-symlink" ~onclick:(fun () ->
                            Pdf_assets.goto_asset_block r.asset_uuid)
                      ; area_btn ~key:"hl-cp" ~title:(I18n.t "asset/copy")
                          ~icon:"copy" ~onclick:(fun () ->
                            copy_image_to_clipboard r.src)
                      ; area_btn ~key:"hl-max"
                          ~title:(I18n.t "asset/maximize")
                          ~icon:"maximize" ~onclick:(fun () ->
                            open_hl_lightbox
                              ~clicked_id:
                                ("hl-area-img-"
                                ^ Option.value b.Model.block_uuid
                                    ~default:"")
                              ())
                      ]
                  ; (* #hl-area-img-<uuid> ids the .lui-image wrapper —
                       the lightbox reaches the pixels img through its
                       parent *)
                    image ~key:"hl-img"
                      ~url:r.src
                      ~accessibility_identifier:
                        ("hl-area-img-"
                        ^ Option.value b.Model.block_uuid ~default:"")
                      ~style_class:"w-full" []
                  ]
              ])
    st.Signal.state_signal

(* cljs hl-ref prefix-link — pointerdown opens the pdf at the hl
   (unless the click lands on a .blank span inside an area hl) *)
let prefix_el (b : Model.block) : t =
 fun context parent ->
  let area = b.Model.block_hl_type = Some "area" in
  let page =
    match b.Model.block_hl_page with
    | Some p -> "P" ^ string_of_int p
    | None -> "P?"
  in
  (* pointerdown reads the event target's class via pointer_detail
     (deepest hit element's class list) *)
  (text ~key:"pf" ~style_class:"prefix-link"
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
     ([ text ~key:"pfp" ~style_class:"hl-page"
          [ text ~key:"pfs" ~as_:`Strong ~style_class:"forbid-edit"
              ~value:page [] ]
      ]
      @
      if area && b.Model.block_hl_image <> None then
        [ area_display b context ]
      else []))
    context parent
