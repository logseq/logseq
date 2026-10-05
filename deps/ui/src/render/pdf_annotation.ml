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
          let rec find i =
            if i >= n then 0
            else if
              Option.value (Web_dom.el_get_attr sorted.(i) "id")
                ~default:""
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

(* cljs asset-action-bar button inside .hl-area *)
(* TODO(component): pointerdown/click dom events (open-lightbox ref
   tracking) plus a <i class=ti-*> icon child have no component
   equivalent *)
let area_btn ~key ~title ~icon ~onclick : t =
  D.el ~key ~tag:"button" ~style_class:"asset-action-btn"
    ~attrs:[ ("title", title); ("tabindex", "-1") ]
    ~events:"pointerdown click"
    ~on_dom_event:(fun name _ -> if name = "click" then onclick ())
    [ D.el ~key:(key ^ "-i") ~tag:"i" ~style_class:("ti ti-" ^ icon) []
    ]

(* cljs area-display: .hl-area(style?) > .asset-container >
   .asset-action-bar + img.w-full *)
(* TODO(component): inline style width + blob-URL <img> with
   #hl-area-img-<uuid> queried by the lightbox path — no component
   equivalent for style attrs / img src *)
let area_display (b : Model.block) context : t =
  let st = hl_img_sig b context in
  reactive (fun r ->
      match r with
      | None -> Logseq_dom.nothing
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
  (* TODO(component): delegated pointerdown handler that reads the
     event target's class — no component event carries the DOM target *)
  (D.el ~key:"pf" ~tag:"span" ~style_class:"prefix-link"
     ~events:"pointerdown"
     ~on_dom_event:(fun name payload ->
       match name, payload with
       | "pointerdown", (Some _ as p) ->
           let blank =
             Platform.payload_str p "targetClass"
             |> String.split_on_char ' '
             |> List.mem "blank"
           in
           if not (area && blank) then Pdf_assets.open_block_ref b
       | _ -> ())
     ([ D.el ~key:"pfp" ~tag:"span" ~style_class:"hl-page"
          [ D.el ~key:"pfs" ~tag:"strong" ~style_class:"forbid-edit"
              ~text:page [] ]
      ]
      @
      if area && b.Model.block_hl_image <> None then
        [ area_display b context ]
      else []))
    context parent
