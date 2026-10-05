(* export-blocks dialog body — cljs components/export.cljs :export-blocks.
   Format tabs + persisted text-transform options drive a signal-bound
   preview; every change re-runs the export. *)

open Lui_elements

module S = Export_state
module P = Export_page

let in_text st = st.S.fmt = S.Text

let in_structured st =
  match st.S.fmt with S.Text | S.Opml | S.Html -> true | S.Edn | S.Png -> false

let st_sig ctx = Signal.value (S.st ctx)

(* visibility:hidden parity — the option keeps its layout slot when the
   fmt tab hides it (cljs inline style -> .invisible class signal) *)
let shown ctx show (elem : t) : t =
  Ui_parts.class_signal (st_sig ctx)
    (fun (st : S.t) -> if show st then "" else "invisible")
    elem

(* shui/checkbox -> checkbox kind; the kind draws its own check
   indicator, so the cljs check svg child is gone *)
let checkbox ctx ~key ~show ~on ~on_toggle ?text () =
  Ui_parts.class_signal (st_sig ctx)
    (fun (st : S.t) ->
      "ui__checkbox" ^ if show st then "" else " invisible")
    (checkbox ~key
       ~checked:(reactive on (st_sig ctx))
       ~on_toggle:(fun _ -> on_toggle ())
       ?text [])

(* cljs <select>/<option> -> select trigger + anchored dropdown_menu of
   menu_items (same pattern as settings rows); the select label tracks
   the current option *)
let select_el ctx ~key ~show ~value ~options ~on_change =
  let st_sig = st_sig ctx in
  let open_st = Signal.state ctx.Lui_ui.ui_scheduler false in
  let label_of v =
    match List.assoc_opt v options with Some l -> l | None -> v
  in
  let close () =
    Signal.set open_st false;
    Runtime.flush ()
  in
  shown ctx show
    (box ~key:(key ^ "-w")
       [ select ~key
           ~text:(reactive (fun st -> label_of (value st)) st_sig)
           ~on_press:(fun _ ->
             Signal.set open_st (not (Signal.get_state open_st));
             Runtime.flush ())
           []
       ; reactive (fun open_ ->
             if open_ then
               dropdown_menu ~key:(key ^ "-m") ~anchor:`below
                 ~anchor_alignment:`start
                 ~style_class:"ui__dropdown-menu-content ui__select-content"
                 ~on_dismiss:(fun _ -> close ())
                 (List.map
                    (fun (v, label) ->
                      menu_item ~key:(key ^ "-mi-" ^ v) ~text:label
                        ~selected:(v = value (Signal.get_state (S.st ctx)))
                        ~style_class:"ui__dropdown-menu-item"
                        ~on_press:(fun _ ->
                          on_change v;
                          close ())
                        [])
                    options)
             else spacer ~key:(key ^ "-mx") [])
           (Signal.value open_st)
       ])

let indent_select ctx =
  select_el ctx ~key:"export-indent" ~show:in_text
    ~value:(fun st -> st.S.indent_style)
    ~options:
      [ ("dashes", I18n.t "export/indent-style-dashes")
      ; ("spaces", I18n.t "export/indent-style-spaces")
      ; ("no-indent", I18n.t "export/indent-style-none") ]
    ~on_change:(fun v ->
      let st = S.st ctx in
      P.opt_change st (fun s -> { s with indent_style = v }))

let level_select ctx =
  select_el ctx ~key:"export-level" ~show:in_structured
    ~value:(fun st ->
      match st.S.level_lte with None -> "all" | Some n -> string_of_int n)
    ~options:
      (("all", "all")
      :: List.init 9 (fun i ->
             (string_of_int (i + 1), string_of_int (i + 1))))
    ~on_change:(fun v ->
      let st = S.st ctx in
      P.opt_change st (fun s ->
          { s with
            level_lte =
              (if v = "all" then None else int_of_string_opt v) }))

let removal st k = List.mem k st.S.remove_options

let toggle_removal ctx k =
  let st = S.st ctx in
  P.opt_change st (fun s ->
      { s with
        remove_options =
          (if List.mem k s.remove_options then
             List.filter (fun x -> x <> k) s.remove_options
           else s.remove_options @ [ k ]) })

let fmt_btn ctx key label fmt =
  button ~key ~variant:`primary ~size:`sm ~width:80
    ~style_class:"ui__button as-solid" ~text:label
    ~on_press:(fun _ -> P.set_fmt (S.st ctx) fmt)
    []

let copy_save_row ctx =
  if_
    ~test:
      (Signal.map
         (fun (st : S.t) -> st.content <> None || st.png <> None)
         (st_sig ctx))
    (row ~key:"export-btns" ~gap:8
    [ button ~key:"export-copy" ~variant:`primary ~size:`sm
        ~style_class:"ui__button as-solid"
        ~on_press:(fun _ ->
          match (Signal.get_state (S.st ctx)).S.fmt with
          | S.Png -> P.copy_png (S.st ctx)
          | _ -> P.copy (S.st ctx))
        ~text:(reactive
             (fun (st : S.t) ->
               if st.copied then I18n.t "export/copied-to-clipboard"
               else I18n.t "ui/copy-to-clipboard")
             (st_sig ctx))
        []
    ; button ~key:"export-save" ~variant:`primary ~size:`sm
        ~style_class:"ui__button as-solid"
        ~text:(I18n.t "export/save-to-file")
        ~on_press:(fun _ -> P.save_to_file (S.st ctx))
        [] ])

let options_rows ctx =
  box ~key:"export-opts"
    [ row ~key:"row-indent" ~cross:`center ~gap:16
        [ shown ctx in_text
            (label ~key:"indent-l"
               ~value:(I18n.t "export/indent-style-label") [])
        ; indent_select ctx ]
    ; row ~key:"row-rm" ~cross:`center ~gap:16
        [ checkbox ctx ~key:"cb-page-ref" ~show:in_structured
            ~on:(fun st -> removal st "page-ref")
            ~on_toggle:(fun () -> toggle_removal ctx "page-ref")
            ~text:(I18n.t "export/page-ref-text") ()
        ; checkbox ctx ~key:"cb-emphasis" ~show:in_structured
            ~on:(fun st -> removal st "emphasis")
            ~on_toggle:(fun () -> toggle_removal ctx "emphasis")
            ~text:(I18n.t "export/remove-emphasis") ()
        ; checkbox ctx ~key:"cb-tag" ~show:in_structured
            ~on:(fun st -> removal st "tag")
            ~on_toggle:(fun () -> toggle_removal ctx "tag")
            ~text:(I18n.t "export/remove-tags") () ]
    ; row ~key:"row-nl" ~cross:`center ~gap:16
        [ checkbox ctx ~key:"cb-newline" ~show:in_text
            ~on:(fun st -> st.S.newline_after_block)
            ~on_toggle:(fun () ->
              P.opt_change (S.st ctx) (fun s ->
                  { s with newline_after_block = not s.newline_after_block }))
            ~text:(I18n.t "export/newline-after-block") ()
        ; checkbox ctx ~key:"cb-property" ~show:in_text
            ~on:(fun st -> removal st "property")
            ~on_toggle:(fun () -> toggle_removal ctx "property")
            ~text:(I18n.t "export/remove-properties") () ]
    ; row ~key:"row-open" ~cross:`center
        [ checkbox ctx ~key:"cb-open" ~show:in_structured
            ~on:(fun st -> st.S.open_blocks_only)
            ~on_toggle:(fun () ->
              P.opt_change (S.st ctx) (fun s ->
                  { s with open_blocks_only = not s.open_blocks_only }))
            ~text:(I18n.t "export/open-blocks-only") () ]
    ; row ~key:"row-level" ~cross:`center ~gap:8
        [ shown ctx in_structured
            (label ~key:"level-l" ~value:(I18n.t "export/level-lte") [])
        ; level_select ctx ] ]

(* cljs PNG preview: loading spinner until the blob lands, then
   img#export-preview shows it — overlay stacks the spinner on the img *)
let png_preview ctx =
  overlay ~key:"export-preview-png" ~alignment:`center
    [ (* TODO(component): blob-url img — export_page.ml queries
         "#export-preview" and pokes el.src imperatively (object URL +
         natural-size measure); the image kind takes an image handle,
         not a URL, so this stays a minimal dom until image gains a
         source/url prop or the imperative side moves to a node id *)
      Logseq_dom.dom ~key:"export-preview-img" ~tag:"img"
        ~style_class:"my-4"
        ~attrs_signal_v:(Logseq_dom.reactive_attrs
             (fun (st : S.t) ->
               [ ("id", "export-preview"); ("alt", I18n.export_preview_alt)
               ; ( "style"
                 , if st.png = None then "visibility: hidden" else "" ) ])
             (st_sig ctx))
        []
    ; if_
        ~test:(Signal.map (fun (st : S.t) -> st.png = None) (st_sig ctx))
        (icon ~key:"png-loading" ~name:(`app "loader-2") []) ]

(* cljs swaps the whole options block for the transparent-bg checkbox
   when the PNG tab is active *)
let lower_options ctx =
  reactive
    (fun fmt ->
      match fmt with
      | S.Png ->
          row ~key:"png-opts" ~cross:`center ~gap:16
            [ text ~key:"png-tb-l" ~value:I18n.export_transparent_bg []
            ; checkbox ctx ~key:"cb-tb"
                ~show:(fun _ -> true)
                ~on:(fun st -> st.S.png_transparent)
                ~on_toggle:(fun () -> P.set_png_transparent (S.st ctx)) () ]
      | _ -> options_rows ctx)
    (Signal.map (fun (st : S.t) -> st.fmt) (st_sig ctx))

let body (_ms : Model.t Signal.signal) : t =
  fun ctx parent ->
    S.open_ ctx;
    P.regen (S.st ctx);
    column ~key:"export-page" ~style_class:"export"
      [ column ~key:"export-inner" ~padding:24 ~gap:12
          [ row ~key:"export-tabs" ~gap:16
              ([ fmt_btn ctx "ft-text" (I18n.t "export/format-text") S.Text
               ; fmt_btn ctx "ft-opml" "OPML" S.Opml
               ; fmt_btn ctx "ft-html" "HTML" S.Html ]
               (* cljs hides the PNG tab once the export has top-level
                  uuids *)
               @ (if (Signal.get_state (S.st ctx)).S.has_top_level then
                    []
                  else [ fmt_btn ctx "ft-png" "PNG" S.Png ])
               @ [ fmt_btn ctx "ft-edn" "EDN" S.Edn ])
          ; reactive
              (fun fmt ->
                match fmt with
                | S.Png -> png_preview ctx
                | _ ->
                    (* readonly preview textarea — the kind has no
                       ~readonly prop; the displayed text is regenerated
                       from state on every change anyway *)
                    textarea ~key:"export-preview" ~height:384
                      ~text:(reactive
                           (fun (st : S.t) ->
                             Option.value ~default:"" st.content)
                           (st_sig ctx))
                      [])
              (Signal.map
                 (fun (st : S.t) -> st.fmt) (st_sig ctx))
          ; lower_options ctx
          ; copy_save_row ctx ] ]
      ctx parent
