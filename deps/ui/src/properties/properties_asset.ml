open Promise_ext
open Lui_elements
module W = Wire
module D = Properties_data
module S = Properties_state
module Keys = Set.Make (String)

let values value =
  let values =
    match value with
    | W.Set xs | W.Array xs | W.List xs -> xs
    | value -> [ value ]
  in
  List.filter (fun value -> not (D.value_empty_p value)) values

let asset_key asset =
  match (D.entity_id_of asset, D.entity_uuid_of asset) with
  | Some id, _ -> string_of_int id
  | _, Some uuid -> uuid
  | _ -> (
      match asset with
      | W.Int id -> string_of_int id
      | W.Uuid uuid -> uuid
      | _ -> invalid_arg "Asset property value has no identity")

let asset_ref asset =
  match (D.entity_id_of asset, D.entity_uuid_of asset) with
  | Some id, _ -> W.Int id
  | _, Some uuid -> W.Uuid uuid
  | _ -> invalid_arg "Asset property value has no identity"

let title asset = Option.value (D.entity_title_of asset) ~default:""

let extension asset =
  Option.value (D.gets (D.untag asset) "logseq.property.asset/type") ~default:""
  |> String.lowercase_ascii

let is_image asset =
  List.mem (extension asset)
    [
      "png";
      "jpg";
      "jpeg";
      "gif";
      "webp";
      "svg";
      "bmp";
      "avif";
      "ico";
      "cr2";
      "jxl";
      "heic";
    ]

let asset_icon asset =
  match extension asset with
  | "mp4" | "webm" | "mov" | "m4v" -> "movie"
  | "mp3" | "wav" | "ogg" | "m4a" | "flac" -> "music"
  | _ -> "file"

let thumbnail ~width ~height asset =
  if is_image asset then Asset_dom.gallery_cover ~width ~height (D.untag asset)
  else box ~width ~height [ icon ~name:(`app (asset_icon asset)) [] ]

let property_ident property =
  match D.getk (D.untag property) "db/ident" with
  | Some ident -> ident
  | None -> invalid_arg "Asset property has no db/ident"

let load_assets repo =
  Runtime.invoke2 "thread-api/q" (W.String repo)
    (W.Array
       [
         W.String
           "[:find [(pull ?b [*]) ...] :where [?c :db/ident \
            :logseq.class/Asset] [?b :block/tags ?c]]";
       ])

let entity repo uuid =
  Runtime.invoke2 "thread-api/entity" (W.String repo) (D.uuid_ref uuid)

let report_error error =
  Ui_services.log_error ("Asset property operation failed", error);
  Toast.error (I18n.t "asset/picker-set-failed")

let picker ~block_uuids ~property ~refresh ~on_close : t =
 fun context parent ->
  let first_owner =
    match block_uuids with
    | uuid :: _ -> uuid
    | [] -> invalid_arg "Asset picker requires at least one owner"
  in
  let ident = property_ident property in
  let many = D.row_many (W.Map [ (W.String "property", property) ]) in
  let repo = Runtime.repo () in
  let revision = (Runtime.model ()).Model.context_revision in
  let alive = ref true in
  Signal.on_dispose context.Lui_ui.ui_scope (fun () -> alive := false);
  let current () =
    !alive
    && Runtime.repo () = repo
    && (Runtime.model ()).Model.context_revision = revision
  in
  let scheduler = context.Lui_ui.ui_scheduler in
  let viewport =
    Ui_services.viewport_width_signal ~scheduler ~scope:context.Lui_ui.ui_scope
  in
  let picker_width width = max 0 (min 640 (int_of_float width - 32)) in
  let columns width = max 1 ((picker_width width - 24 + 8) / 148) in
  let tile_width width =
    let count = columns width in
    max 0 ((picker_width width - 24 - ((count - 1) * 8)) / count)
  in
  let assets = Signal.state scheduler None in
  let selected = Signal.state scheduler Keys.empty in
  let saving = Signal.state scheduler false in
  let ready = Signal.state scheduler false in
  let finish () = if current () then Signal.set saving false in
  let run action =
    if current () && Signal.get_state ready && not (Signal.get_state saving)
    then (
      Signal.set saving true;
      ignore
        (Js.Promise.catch
           (fun error ->
             if current () then (
               finish ();
               report_error error);
             Js.Promise.resolve ())
           (let* () = action () in
            finish ();
            Js.Promise.resolve ())))
  in
  let rec write owners value remove =
    match owners with
    | [] -> Js.Promise.resolve ()
    | uuid :: rest ->
        if not (current ()) then Js.Promise.resolve ()
        else
          let* _ =
            if remove && many then
              D.delete_property_value ~block_uuid:uuid ~ident ~value
            else if remove then D.remove_block_property ~block_uuid:uuid ~ident
            else D.set_block_property ~block_uuid:uuid ~ident ~value
          in
          write rest value remove
  in
  let choose asset remove =
    let* () = write block_uuids (asset_ref asset) remove in
    (if current () then
       let key = asset_key asset in
       let previous = Signal.get_state selected in
       Signal.set selected
         (if remove then Keys.remove key previous
          else if many then Keys.add key previous
          else Keys.singleton key));
    Js.Promise.resolve ()
  in
  let after_write ~close =
    if current () then (
      if close then on_close ();
      refresh ())
  in
  let toggle asset =
    run (fun () ->
        let remove = Keys.mem (asset_key asset) (Signal.get_state selected) in
        let* () = choose asset remove in
        after_write ~close:((not many) && not remove);
        Js.Promise.resolve ())
  in
  let upload files =
    run (fun () ->
        let* asset_class =
          Runtime.invoke3 "thread-api/pull" (W.String repo)
            (W.Array [ W.Keyword "block/uuid" ])
            (W.Keyword "logseq.class/Asset")
        in
        let target =
          match D.entity_uuid_of asset_class with
          | Some uuid -> uuid
          | None -> failwith "Asset class has no UUID"
        in
        let rec save acc = function
          | [] -> Js.Promise.resolve (List.rev acc)
          | file :: rest ->
              if not (current ()) then Js.Promise.resolve (List.rev acc)
              else
                let name = file.Ui_services.file_name in
                let ext =
                  match String.rindex_opt name '.' with
                  | Some i when i + 1 < String.length name ->
                      String.sub name (i + 1) (String.length name - i - 1)
                      |> String.lowercase_ascii
                  | _ -> ""
                in
                if ext = "" then (
                  Toast.error (I18n.t1 "asset/invalid-ext-error" name);
                  save acc rest)
                else
                  let* binary =
                    Subs_state.promise_of_task (file.Ui_services.file_binary ())
                  in
                  let u8 = Str_util.binary_to_u8 binary in
                  let* checksum = Asset_store.sha256_hex u8 in
                  let uuid = Ui_services.env_random_uuid () in
                  if not (current ()) then Js.Promise.resolve (List.rev acc)
                  else
                    let* () =
                      Asset_store.write_asset ~repo ~name:(uuid ^ "." ^ ext) ~u8
                    in
                    let asset =
                      W.Map
                        [
                          (W.String "block/uuid", W.Uuid uuid);
                          ( W.String "block/title",
                            W.String
                              (String.sub name 0
                                 (String.length name - String.length ext - 1))
                          );
                          (W.String "logseq.property.asset/type", W.String ext);
                          ( W.String "logseq.property.asset/size",
                            W.Int64 (Int64.of_float file.Ui_services.file_size)
                          );
                          ( W.String "logseq.property.asset/checksum",
                            W.String checksum );
                          ( W.String "block/tags",
                            W.Set [ W.Keyword "logseq.class/Asset" ] );
                        ]
                    in
                    if not (current ()) then Js.Promise.resolve (List.rev acc)
                    else
                      let* _ =
                        Sdk_util.apply_op_for_repo repo "insert-blocks"
                          [
                            W.List [ asset ];
                            W.Uuid target;
                            W.Map
                              [
                                (W.Keyword "keep-uuid?", W.Bool true);
                                (W.Keyword "bottom?", W.Bool true);
                                (W.Keyword "sibling?", W.Bool false);
                              ];
                          ]
                      in
                      let* saved = entity repo uuid in
                      save (saved :: acc) rest
        in
        let* saved = save [] files in
        (if current () then
           let previous = Option.value (Signal.get_state assets) ~default:[] in
           Signal.set assets (Some (List.rev_append (List.rev previous) saved)));
        let rec select = function
          | [] -> Js.Promise.resolve ()
          | asset :: rest ->
              let* () = choose asset false in
              select rest
        in
        let chosen =
          if many then saved
          else match saved with [] -> [] | asset :: _ -> [ asset ]
        in
        let* () = select chosen in
        if chosen <> [] then after_write ~close:(not many);
        Js.Promise.resolve ())
  in
  ignore
    (Js.Promise.catch
       (fun error ->
         if current () then report_error error;
         Js.Promise.resolve ())
       (let* all = load_assets repo in
        let* owner = entity repo first_owner in
        if current () then (
          let all = W.elems all in
          let owned =
            Option.value (W.get (D.untag owner) ident) ~default:W.Nil |> values
          in
          Signal.set selected (Keys.of_list (List.map asset_key owned));
          Signal.set assets (Some all);
          Signal.set ready true);
        Js.Promise.resolve ()));
  (Ui_parts.int_prop Lui_protocol.WidthValue
     ~value:(reactive picker_width viewport)
     (column ~gap:8 ~padding:12 ~max_width:640 ~min_width:0
        [
          row ~main:`end_ ~min_width:0
            [
              Ui_components.button ~variant:`outline ~size:`sm
                ~label:(I18n.t "asset/add-assets")
                ~icon:(`app "upload")
                ~disabled:
                  (reactive
                     (fun ready saving -> (not ready) || saving)
                     (Signal.value ready) (Signal.value saving))
                ~on_press:(fun _ ->
                  Ui_services.files_pick_files ~multiple:true upload)
                [];
            ];
          if_ ~test:(Signal.value saving) (text ~value:(I18n.t "ui/loading") []);
          reactive
            (fun all ->
              match all with
              | None -> text ~value:(I18n.t "ui/loading") []
              | Some [] ->
                  column ~gap:4
                    [
                      text ~value:(I18n.t "asset/picker-empty") [];
                      text ~value:(I18n.t "asset/picker-empty-hint") [];
                    ]
              | Some all ->
                  scroll ~max_height:400
                    [
                      Ui_parts.int_prop Lui_protocol.GridColumns
                        ~value:(reactive columns viewport)
                        (grid ~gap:8
                           [
                             keyed ~key:asset_key ~cmp:String.compare
                               ~source:
                                 (reactive
                                    (fun selected ->
                                      let picked, others =
                                        List.partition
                                          (fun asset ->
                                            Keys.mem (asset_key asset) selected)
                                          all
                                      in
                                      List.rev_append (List.rev picked) others)
                                    (Signal.value selected))
                               ~mount:(fun asset_signal ->
                                 reactive
                                   (fun asset ->
                                     let body =
                                       button ~padding:0 ~border_width:1
                                         ~corner_radius:4
                                         ~background:"hsl(var(--background))"
                                         ~label:(title asset)
                                         ~selected:
                                           (reactive
                                              (Keys.mem (asset_key asset))
                                              (Signal.value selected))
                                         ~disabled:
                                           (reactive Fun.id
                                              (Signal.value saving))
                                         ~on_press:(fun _ -> toggle asset)
                                         [
                                           column ~gap:4 ~grow:1.
                                             ~cross:`stretch ~min_width:0
                                             [
                                               text ~value:(title asset)
                                                 ~font_size:"0.75rem"
                                                 ~padding_horizontal:4
                                                 ~padding_vertical:2
                                                 ~line_clamp:1 [];
                                               row ~main:`center ~cross:`center
                                                 ~grow:1.
                                                 [
                                                   thumbnail ~width:104
                                                     ~height:72 asset;
                                                 ];
                                               Ui_components.with_props
                                                 [
                                                   Ui_components.Prop
                                                   .pointer_enabled false;
                                                 ]
                                                 (row ~main:`end_ ~padding:4
                                                    [
                                                      Ui_components.checkbox
                                                        ~checked:
                                                          (reactive
                                                             (Keys.mem
                                                                (asset_key asset))
                                                             (Signal.value
                                                                selected))
                                                        ~disabled:true
                                                        ~label:(title asset) [];
                                                    ]);
                                             ];
                                         ]
                                     in
                                     let body =
                                       Ui_components.with_props
                                         [
                                           Ui_components.Prop.padding_horizontal
                                             0;
                                           Ui_components.Prop.padding_vertical 0;
                                           Ui_components.Prop.overflow `hidden;
                                         ]
                                         body
                                     in
                                     let body =
                                       Ui_parts.string_prop
                                         Lui_protocol.BorderColorValue
                                         ~value:
                                           (reactive
                                              (fun selected ->
                                                if
                                                  Keys.mem (asset_key asset)
                                                    selected
                                                then "hsl(var(--primary))"
                                                else "hsl(var(--border))")
                                              (Signal.value selected))
                                         body
                                     in
                                     let body =
                                       Ui_parts.int_prop
                                         Lui_protocol.HeightValue
                                         ~value:(reactive tile_width viewport)
                                         body
                                     in
                                     Ui_parts.int_prop Lui_protocol.WidthValue
                                       ~value:(reactive tile_width viewport)
                                       body)
                                   asset_signal);
                           ]);
                    ])
            (Signal.value assets);
        ]))
    context parent

let view ~block_uuid ~refresh property_row : t =
 fun context parent ->
  let opened = Signal.state context.Lui_ui.ui_scheduler false in
  let preview_key = Properties_popup.next_key () in
  let close key () = S.remove_view_overlay key in
  Signal.on_dispose context.Lui_ui.ui_scope (close preview_key);
  let preview asset =
    let on_close = close preview_key in
    ignore
      (S.push_view_overlay context ~key:preview_key ~on_escape:on_close
         ~view:
           (Ui_components.dialog ~key:preview_key ~text:(title asset)
              ~on_dismiss:(fun _ -> on_close ())
              [ Asset_dom.gallery_cover ~width:600 ~height:400 (D.untag asset) ]))
  in
  (column ~min_width:0 ~grow:1.
     [
       row ~gap:8 ~cross:`center ~min_width:0 ~flex_wrap:`wrap
         (List.map
            (fun asset ->
              if is_image asset then
                Ui_components.button ~variant:`ghost ~padding:0 ~width:80
                  ~height:80 ~key:(asset_key asset)
                  ~label:(I18n.t "asset/maximize")
                  ~on_press:(fun _ -> preview asset)
                  [ thumbnail ~width:80 ~height:80 asset ]
              else
                row ~key:(asset_key asset) ~gap:4
                  [
                    icon ~name:(`app (asset_icon asset)) [];
                    text ~value:(title asset) [];
                  ])
            (values (D.row_value property_row))
         @ [
             Ui_components.button ~variant:`ghost ~size:`icon
               ~label:(I18n.t "asset/picker-open")
               ~icon:`plus
               ~on_press:(fun _ -> Signal.set opened true)
               [];
           ]);
       if_ ~test:(Signal.value opened)
         (popover ~anchor:`below ~anchor_alignment:`start ~anchor_offset:4.
            ~padding:0 ~corner_radius:6 ~border_width:1
            ~background:"hsl(var(--popover))" ~border_color:"hsl(var(--border))"
            ~on_dismiss:(fun _ -> Signal.set opened false)
            [
              picker ~block_uuids:[ block_uuid ]
                ~property:(D.row_prop property_row) ~refresh
                ~on_close:(fun () -> Signal.set opened false);
            ]);
     ])
    context parent
