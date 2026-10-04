(* export-blocks dialog body — cljs components/export.cljs :export-blocks.
   Format tabs + persisted text-transform options drive a signal-bound
   preview textarea; every change re-runs the export. *)

open Lui_elements

let dom = Logseq_dom.dom
module S = Export_state
module P = Export_page

let vis show = if show then "visible" else "hidden"

let in_text st = st.S.fmt = S.Text

let in_structured st =
  match st.S.fmt with S.Text | S.Opml | S.Html -> true | S.Edn | S.Png -> false

let style_attr v = ("style", "visibility: " ^ v)

let vis_attrs _st show extra =
  extra @ [ style_attr (vis show) ]

let btn_cls =
  "ui__button inline-flex cursor-pointer items-center justify-center \
   whitespace-nowrap rounded-md text-sm gap-1 font-medium \
   ring-offset-background transition-colors focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring \
   focus-visible:ring-offset-2 disabled:pointer-events-none \
   disabled:opacity-50 select-none bg-primary/90 hover:bg-primary/100 \
   active:opacity-90 text-primary-foreground \
   hover:text-primary-foreground as-solid h-7 rounded px-3 py-1"

let checkbox_cls =
  "ui__checkbox peer h-4 w-4 shrink-0 cursor-pointer rounded-sm \
   border border-primary ring-offset-background \
   focus-visible:outline-none focus-visible:ring-2 \
   focus-visible:ring-ring focus-visible:ring-offset-2 \
   disabled:cursor-not-allowed disabled:opacity-50 \
   data-[checked]:bg-primary data-[checked]:text-primary-foreground"

(* shui/checkbox: button[role=checkbox] + check svg only when checked *)
let checkbox ctx ~key ~cls ~show ~on ~on_toggle =
  dom ~key ~tag:"button" ~style_class:(checkbox_cls ^ " " ^ cls)
    ~attrs_signal_v:(Logseq_dom.reactive_attrs
         (fun (st : S.t) ->
           let chk = if on st then "checked" else "unchecked" in
           vis_attrs st (show st)
             [ ("type", "button"); ("role", "checkbox")
             ; ("aria-checked", string_of_bool (on st))
             ; ("data-" ^ chk, ""); ("data-state", chk) ])
         (Signal.value (S.st ctx)))
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_toggle ())
    [ if_
        ~test:(Signal.map on (Signal.value (S.st ctx)))
        (dom ~key:(key ^ "-in") ~tag:"span"
           ~attrs:[ ("data-state", "checked") ]
           [ dom ~key:(key ^ "-ck") ~tag:"svg" ~style_class:"h-4 w-4"
               ~attrs:
                 [ ("viewBox", "0 0 24 24"); ("fill", "none")
                 ; ("stroke", "currentColor"); ("stroke-width", "2")
                 ; ("stroke-linecap", "round")
                 ; ("stroke-linejoin", "round") ]
               [ dom ~key:(key ^ "-p") ~tag:"path"
                   ~attrs:[ ("d", "M20 6 9 17l-5-5") ] [] ] ]) ]

(* option label div with the same visibility as its checkbox *)
let opt_label ctx ~key ~show ~text =
  dom ~key
    ~attrs_signal_v:(Logseq_dom.reactive_attrs
         (fun (st : S.t) -> [ ("style", "visibility: " ^ vis (show st)) ])
         (Signal.value (S.st ctx)))
    ~text []

(* cljs emits :value on the select (React sets .value, no attribute);
   the matching rendered state is the selected option *)
let select_el ctx ~key ~cls ~show ~value ~options ~on_change =
  dom ~key ~tag:"select" ~style_class:cls
    ~attrs_signal_v:(Logseq_dom.reactive_attrs (fun (st : S.t) -> vis_attrs st (show st) [])
         (Signal.value (S.st ctx)))
    ~events:"change"
    ~on_dom_event:(fun n payload ->
      if n = "change" then
        match payload with
        | Some _ -> on_change (Platform.payload_str payload "value")
        | None -> ())
    (List.map
       (fun (v, label) ->
         let cur = value (Signal.get_state (S.st ctx)) in
         dom ~key:(key ^ "-" ^ v) ~tag:"option"
           ~attrs:
             ([ ("value", v) ]
             @ if cur = v then [ ("selected", "") ] else [])
           ~text:label [])
       options)

let indent_select ctx =
  select_el ctx ~key:"export-indent"
    ~cls:"block my-2 text-lg rounded border py-0 px-1" ~show:in_text
    ~value:(fun st -> st.S.indent_style)
    ~options:
      [ ("dashes", I18n.t "export/indent-style-dashes")
      ; ("spaces", I18n.t "export/indent-style-spaces")
      ; ("no-indent", I18n.t "export/indent-style-none") ]
    ~on_change:(fun v ->
      let st = S.st ctx in
      P.opt_change st (fun s -> { s with indent_style = v }))

let level_select ctx =
  select_el ctx ~key:"export-level"
    ~cls:"block my-2 text-lg rounded border px-2 py-0" ~show:in_structured
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

let fmt_btn ctx key label fmt cls =
  dom ~key ~tag:"button" ~style_class:(btn_cls ^ " " ^ cls)
    ~attrs:[ ("type", "button") ] ~events:"click"
    ~on_dom_event:(fun n _ ->
      if n = "click" then P.set_fmt (S.st ctx) fmt)
    ~text:label []

let copy_save_row ctx =
  if_
    ~test:
      (Signal.map
         (fun (st : S.t) -> st.content <> None || st.png <> None)
         (Signal.value (S.st ctx)))
    (dom ~key:"export-btns" ~style_class:"mt-4 flex flex-row gap-2"
    [ dom ~key:"export-copy" ~tag:"button"
        ~style_class:(btn_cls ^ " mr-4")
        ~attrs:[ ("type", "button") ] ~events:"click"
        ~on_dom_event:(fun n _ ->
          if n = "click" then
            match (Signal.get_state (S.st ctx)).S.fmt with
            | S.Png -> P.copy_png (S.st ctx)
            | _ -> P.copy (S.st ctx))
        ~text_signal:(Logseq_dom.reactive_text
             (fun (st : S.t) ->
               if st.copied then I18n.t "export/copied-to-clipboard"
               else I18n.t "ui/copy-to-clipboard")
             (Signal.value (S.st ctx)))
        []
    ; dom ~key:"export-save" ~tag:"button" ~style_class:btn_cls
        ~attrs:[ ("type", "button") ] ~events:"click"
        ~on_dom_event:(fun n _ ->
          if n = "click" then P.save_to_file (S.st ctx))
        ~text:(I18n.t "export/save-to-file") [] ])

let options_rows ctx =
  let st_sig = Signal.value (S.st ctx) in
  dom ~key:"export-opts"
    [ dom ~key:"row-indent" ~style_class:"flex items-center"
        [ dom ~key:"indent-l" ~tag:"label" ~style_class:"mr-4"
            ~attrs_signal_v:(Logseq_dom.reactive_attrs
                 (fun (st : S.t) ->
                   [ ("style", "visibility: " ^ vis (in_text st)) ])
                 st_sig)
            ~text:(I18n.t "export/indent-style-label") []
        ; indent_select ctx ]
    ; dom ~key:"row-rm" ~style_class:"flex items-center"
        [ checkbox ctx ~key:"cb-page-ref" ~cls:"mr-2" ~show:in_structured
            ~on:(fun st -> removal st "page-ref")
            ~on_toggle:(fun () -> toggle_removal ctx "page-ref")
        ; opt_label ctx ~key:"lb-page-ref" ~show:in_structured
            ~text:(I18n.t "export/page-ref-text")
        ; checkbox ctx ~key:"cb-emphasis" ~cls:"mr-2 ml-4" ~show:in_structured
            ~on:(fun st -> removal st "emphasis")
            ~on_toggle:(fun () -> toggle_removal ctx "emphasis")
        ; opt_label ctx ~key:"lb-emphasis" ~show:in_structured
            ~text:(I18n.t "export/remove-emphasis")
        ; checkbox ctx ~key:"cb-tag" ~cls:"mr-2 ml-4" ~show:in_structured
            ~on:(fun st -> removal st "tag")
            ~on_toggle:(fun () -> toggle_removal ctx "tag")
        ; opt_label ctx ~key:"lb-tag" ~show:in_structured
            ~text:(I18n.t "export/remove-tags") ]
    ; dom ~key:"row-nl" ~style_class:"flex items-center"
        [ checkbox ctx ~key:"cb-newline" ~cls:"mr-2" ~show:in_text
            ~on:(fun st -> st.S.newline_after_block)
            ~on_toggle:(fun () ->
              P.opt_change (S.st ctx) (fun s ->
                  { s with newline_after_block = not s.newline_after_block }))
        ; opt_label ctx ~key:"lb-newline" ~show:in_text
            ~text:(I18n.t "export/newline-after-block")
        ; checkbox ctx ~key:"cb-property" ~cls:"mr-2 ml-4" ~show:in_text
            ~on:(fun st -> removal st "property")
            ~on_toggle:(fun () -> toggle_removal ctx "property")
        ; opt_label ctx ~key:"lb-property" ~show:in_text
            ~text:(I18n.t "export/remove-properties") ]
    ; dom ~key:"row-open" ~style_class:"flex items-center"
        [ checkbox ctx ~key:"cb-open" ~cls:"mr-2" ~show:in_structured
            ~on:(fun st -> st.S.open_blocks_only)
            ~on_toggle:(fun () ->
              P.opt_change (S.st ctx) (fun s ->
                  { s with open_blocks_only = not s.open_blocks_only }))
        ; opt_label ctx ~key:"lb-open" ~show:in_structured
            ~text:(I18n.t "export/open-blocks-only") ]
    ; dom ~key:"row-level" ~style_class:"flex items-center"
        [ dom ~key:"level-l" ~tag:"label" ~style_class:"mr-2"
            ~attrs_signal_v:(Logseq_dom.reactive_attrs
                 (fun (st : S.t) ->
                   [ ("style", "visibility: " ^ vis (in_structured st)) ])
                 st_sig)
            ~text:(I18n.t "export/level-lte") []
        ; level_select ctx ] ]

(* cljs PNG preview: loading spinner until the blob lands, then
   img#export-preview shows it *)
let png_preview ctx =
  dom ~key:"export-preview-png"
    ~style_class:"flex items-center justify-center relative"
    [ if_
        ~test:
          (Signal.map
             (fun (st : S.t) -> st.png = None)
             (Signal.value (S.st ctx)))
        (dom ~key:"png-loading" ~style_class:"absolute"
           [ Icons.icon "loader-2" ])
    ; dom ~key:"export-preview-img" ~tag:"img" ~style_class:"my-4"
        ~attrs_signal_v:(Logseq_dom.reactive_attrs
             (fun (st : S.t) ->
               [ ("id", "export-preview"); ("alt", I18n.export_preview_alt)
               ; ( "style"
                 , if st.png = None then "visibility: hidden" else "" ) ])
             (Signal.value (S.st ctx)))
        [] ]

(* cljs swaps the whole options block for the transparent-bg checkbox
   when the PNG tab is active *)
let lower_options ctx =
  dyn ~equal:Stdlib.( = )
    (fun fmt ->
      match fmt with
      | S.Png ->
          dom ~key:"png-opts" ~style_class:"flex items-center"
            [ dom ~key:"png-tb-l" ~text:I18n.export_transparent_bg []
            ; checkbox ctx ~key:"cb-tb" ~cls:"mr-2 ml-4"
                ~show:(fun _ -> true)
                ~on:(fun st -> st.S.png_transparent)
                ~on_toggle:(fun () -> P.set_png_transparent (S.st ctx)) ]
      | _ -> options_rows ctx)
    (Signal.map (fun (st : S.t) -> st.fmt) (Signal.value (S.st ctx)))

let body (_ms : Model.t Signal.signal) : t =
  fun ctx parent ->
    S.open_ ctx;
    P.regen (S.st ctx);
    dom ~key:"export-page" ~style_class:"export resize -m-5"
      [ dom ~key:"export-inner" ~style_class:"p-6"
          [ dom ~key:"export-tabs" ~style_class:"flex pb-3"
              ([ fmt_btn ctx "ft-text" (I18n.t "export/format-text") S.Text "mr-4 w-20"
               ; fmt_btn ctx "ft-opml" "OPML" S.Opml "mr-4 w-20"
               ; fmt_btn ctx "ft-html" "HTML" S.Html "mr-4 w-20" ]
               (* cljs hides the PNG tab once the export has top-level
                  uuids *)
               @ (if (Signal.get_state (S.st ctx)).S.has_top_level then
                    []
                  else [ fmt_btn ctx "ft-png" "PNG" S.Png "mr-4 w-20" ])
               @ [ fmt_btn ctx "ft-edn" "EDN" S.Edn "w-20" ])
          ; dyn ~equal:Stdlib.( = )
              (fun fmt ->
                match fmt with
                | S.Png -> png_preview ctx
                | _ ->
                    dom ~key:"export-preview" ~tag:"textarea"
                      ~style_class:"overflow-y-auto h-96 w-full"
                      ~attrs:[ ("readonly", "") ]
                      ~text_signal:(Logseq_dom.reactive_text
                           (fun (st : S.t) ->
                             Option.value ~default:"" st.content)
                           (Signal.value (S.st ctx)))
                      [])
              (Signal.map
                 (fun (st : S.t) -> st.fmt) (Signal.value (S.st ctx)))
          ; lower_options ctx
          ; copy_save_row ctx ] ]
      ctx parent
