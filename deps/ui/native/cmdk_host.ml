(* Native (gpui) implementation of the cmdk services seam — same record
   as src/cmdk/cmdk_host.ml, wired to the native emulation modules
   (native/js.ml Promise/Json/Date, native/web_dom.ml element ops,
   native icon_picker/sidebar_state/plugin_host/fuzzy/dates). *)

module Svs = Cmdk_services
module D = Ui_services

let js_random () = Random.float 1.

(* native str_normalize is documented as identity (no ICU) *)
let str_normalize (s : string) = s

(* Js.Promise -> Ui_task — native Promise.error is already exn *)
let task_of (p : 'a Js.Promise.t) : 'a Ui_task.t =
  Ui_task.create (fun ~resolve ~reject ->
      ignore
        (Js.Promise.catch
           (fun e ->
             reject e;
             Js.Promise.resolve ())
           (Js.Promise.then_
              (fun v ->
                resolve v;
                Js.Promise.resolve ())
              p)))

let cmd_of (c : Commands_data.cmd) : Svs.cmd =
  { Svs.id = c.Commands_data.id
  ; label = c.Commands_data.label
  ; i18n = c.Commands_data.i18n
  ; sc = Commands_data.display c.Commands_data.sc
  ; dev = c.Commands_data.dev }

(* go_to_journals_target only ever yields #/ (Home) or #/all-journals *)
let nav_target = function
  | Model.Home -> Svs.Nav_home
  | Model.Journals -> Svs.Nav_journals
  | _ -> invalid_arg "Cmdk_host: unexpected journals target"

let route_of_target = function
  | Svs.Nav_home -> Model.Home
  | Svs.Nav_journals -> Model.Journals
  | Svs.Nav_all_graphs -> Model.All_graphs
  | Svs.Nav_graph_view -> Model.Graph_view
  | Svs.Nav_all_pages -> Model.All_pages

let route_page () =
  match Runtime.route () with
  | Model.Page p | Model.Block_zoom p -> Some p
  | _ -> None

let icon_choice = function
  | Icon_picker.Remove -> Svs.Icon_remove
  | Icon_picker.Emoji id -> Svs.Icon_emoji id
  | Icon_picker.Tabler (id, color) -> Svs.Icon_tabler (id, color)

let with_sidebar f =
  match !Sidebar_state.st_ref with
  | Some sst -> f sst
  | None -> ()

let services : unit -> Svs.t =
 fun () ->
  { Svs.publishing = Platform.publishing
  ; is_mac = Platform.is_mac
  ; dev_build = (fun () -> Platform.dev_build)
  ; random = js_random
  ; now_ms = Js.Date.now
  ; console_error = (fun label e -> Platform.console_error (label, e))
  ; i18n = I18n.t
  ; i18nf = I18n.tf
  ; normalize = str_normalize
  ; today_journal_day = Dates.today_journal_day
  ; rel_journal_day =
      (fun delta -> Dates.journal_day_of (Dates.add_days (Dates.date_now ()) delta))
  ; journal_title_of_day =
      (fun day ->
        Dates.journal_title_of
          (Ui_services.time_of_fields
             { year = day / 10000
             ; month = day / 100 mod 100
             ; day = day mod 100
             ; wday = 0
             ; hours = 0
             ; minutes = 0
             ; seconds = 0
             ; ms = 0
             }))
  ; repo = (fun () -> (Runtime.model ()).Model.repo)
  ; route_is_page =
      (fun () -> (Runtime.model ()).Model.route_page <> None)
  ; route_page_uuid =
      (fun () ->
        Option.bind (Runtime.model ()).Model.route_page
          (fun p -> p.Model.page_uuid))
  ; route_page_journal_day =
      (fun () ->
        Option.bind (Runtime.model ()).Model.route_page
          (fun p -> p.Model.page_journal_day))
  ; invoke = (fun name args -> task_of (Runtime.invoke name args))
  ; mark_nav = Runtime.mark_nav
  ; nav_hash = Runtime.nav_hash
  ; on_page_loaded = Runtime.on_page_loaded
  ; journals_target =
      (fun () ->
        task_of
          (Js.Promise.then_
             (fun (h, r) -> Js.Promise.resolve (h, nav_target r))
             (Router.go_to_journals_target ())))
  ; send_navigate =
      (fun target -> Runtime.send (Action.Navigate_to (route_of_target target)))
  ; resolve_route = Router.resolve
  ; scroll_to_top = Router.scroll_to_top
  ; set_input_value =
      (fun v ->
        match Ui_services.dom_query ".cp__cmdk-search-input" with
        | Some el -> el.Ui_services.set_value v
        | None -> ())
  ; focus_search_input =
      (fun () ->
        match Ui_services.dom_query ".cp__cmdk-search-input" with
        | Some el -> el.Ui_services.focus ()
        | None -> ())
  ; focus_input_init =
      (fun q ->
        let rec go tries =
          match Ui_services.dom_query ".cp__cmdk-search-input" with
          | Some el ->
              el.Ui_services.focus ();
              if q <> "" then (
                el.Ui_services.set_value q;
                el.Ui_services.set_selection_range 0 (String.length q))
          | None ->
              if tries > 0 then
                ignore
                  (Ui_services.timers_timeout (fun () -> go (tries - 1)) 20)
        in
        ignore (Ui_services.timers_timeout (fun () -> go 20) 0))
  ; scroll_row_index =
      (fun i ->
        match Ui_services.dom_query ".cp__cmdk .cp__cmdk-scroller" with
        | Some scroller -> (
            match
              scroller.Ui_services.query
                (Printf.sprintf "[data-item-index=\"%d\"]" i)
            with
            | Some row ->
                Ui_services.dom_scroll_row_into_view ~scroller ~row
            | None -> ())
        | None -> ())
  ; set_timeout =
      (fun f ms -> ignore (Ui_services.timers_timeout f ms))
  ; install_listeners =
      (fun h ->
        let open Svs in
        Ui_services.dom_on_document_event ~capture:true "keydown"
          (fun ev ->
            let a =
              h.key
                { key = (match ev.Ui_services.key with Some k -> k | None -> "")
                ; meta = ev.Ui_services.meta
                ; ctrl = ev.Ui_services.ctrl; shift = ev.Ui_services.shift
                ; alt = ev.Ui_services.alt }
            in
            if a.prevent then ev.Ui_services.prevent_default ();
            if a.stop then ev.Ui_services.stop_propagation ());
        Ui_services.dom_on_document_event ~capture:true "click"
          (fun ev ->
            match ev.Ui_services.target with
            | Some el ->
                h.click
                  { search_button =
                      el.Ui_services.closest "#search-button" <> None
                  ; inside_modal =
                      el.Ui_services.closest ".cp__cmdk__modal" <> None
                  ; item_key =
                      (match
                         el.Ui_services.closest ".cp__cmdk [data-item-key]"
                       with
                       | Some wrap -> wrap.Ui_services.attr "data-item-key"
                       | None -> None) }
            | None -> ());
        Ui_services.dom_on_document_event ~capture:true "mousemove"
          (fun ev ->
            match ev.Ui_services.target with
            | Some el ->
                h.mousemove
                  { inside_cmdk = el.Ui_services.closest ".cp__cmdk" <> None
                  ; item_index =
                      (match
                         el.Ui_services.closest
                           ".cp__cmdk [data-item-index]"
                       with
                       | Some wrap ->
                           Option.bind (wrap.Ui_services.attr "data-item-index")
                             int_of_string_opt
                       | None -> None)
                  ; moved =
                      ev.Ui_services.movement_x <> 0.
                      || ev.Ui_services.movement_y <> 0.
                  }
            | None -> ()))
  ; toast =
      (fun msg cls ->
        Ui_services.dom_dispatch_json "ls:toast"
          (Json.Object
             [ ("message", Json.String msg); ("type", Json.String cls) ]))
  ; fuzzy_search = Fuzzy.fuzzy_search
  ; fuzzy_search_multi = Fuzzy.fuzzy_search_multi
  ; commands = (fun () -> List.map cmd_of Commands_data.table)
  ; plugin_commands =
      (fun () -> List.map cmd_of (Plugin_host.palette_commands ()))
  ; exec_palette_command = Plugin_host.exec_palette_command
  ; hook_app =
      (fun name -> Plugin_host.hook_app name Js.Json.null Js.Json.null)
  ; editor_ready = Editor_state.ready
  ; editing_uuid = Editor_state.editing_uuid
  ; editing = (fun () -> Editor_state.editing () <> None)
  ; selected_uuids = Editor_actions.selected_uuids
  ; selected_set =
      (fun () -> Editor_state.String_set.elements (Editor_state.selected ()))
  ; find_parent_uuid =
      (fun u ->
        match Editor_state.find_parent u with
        | Some (Some p, _) -> p.Model.block_uuid
        | _ -> None)
  ; mk_op = Outliner_ops.op
  ; create_page_op = Outliner_ops.create_page
  ; create_class_op = Outliner_ops.create_class
  ; move_blocks_bottom_op = Outliner_ops.move_blocks_bottom
  ; apply_ops =
      (fun ops -> task_of (Outliner_ops.apply_and_refresh ops))
  ; refresh_page = (fun () -> ignore (Outliner_ops.refresh_page ()))
  ; entity_has_prop =
      (fun ~uuid ~prop ->
        task_of
          (Js.Promise.then_
             (fun first ->
               Js.Promise.resolve
                 (Properties_data.getf (Properties_data.untag first) prop
                  <> None))
             (Properties_data.entity_by_uuid uuid)))
  ; open_property_dialog =
      (fun uuid ->
        match uuid with
        | Some u -> Properties_dialog.open_for_block u
        | None -> Properties_dialog.open_for_current ())
  ; open_named_property =
      (fun ~uuids ~ident ->
        match uuids with
        | u :: _ -> Properties_dialog.open_for_block_with_property ~uuids u ~ident
        | [] -> ())
  ; toggle_hidden_props =
      (fun () ->
        Properties_state.toggle_hidden ();
        Properties_state.refresh_all ())
  ; pick_emoji =
      (fun ~block_uuid ~on_chosen ->
        match
          Ui_services.dom_query
            ("[data-blockid='" ^ block_uuid ^ "']")
        with
        | Some anchor ->
            Icon_picker.open_picker_with_opts ~anchor ~del:false
              ~opts:{ Icon_picker.emoji_only = true; sub = false }
              ~on_chosen:(fun c ->
                match c with Icon_picker.Emoji id -> on_chosen id | _ -> ())
        | None -> ())
  ; pick_icon =
      (fun ~block_uuid ~del ~on_chosen ->
        match
          Ui_services.dom_query
            ("[data-blockid='" ^ block_uuid ^ "']")
        with
        | Some anchor ->
            Icon_picker.open_picker ~anchor ~del
              ~on_chosen:(fun c -> on_chosen (icon_choice c))
        | None -> ())
  ; appearance_popup =
      (fun () ->
        match Ui_services.dom_query ".toolbar-dots-btn" with
        | Some el ->
            let (x, y, w, h) = el.Ui_services.rect () in
            Runtime.send
              (Action.Appearance_set (Some (x +. w, y +. h +. 4.)))
        | None -> ())
  ; dialogs_open = Dialogs_state.open_
  ; dialogs_close = Dialogs_state.close_named
  ; dialogs_is_open = Dialogs_state.is_open
  ; settings_open_at = Settings_state.open_at
  ; settings_toggle_wide = Settings_state.toggle_wide_mode
  ; settings_toggle_theme = (fun () -> Settings_view.toggle_theme ())
  ; config_toggle = (fun name default -> Settings_state.config_toggle name ~default)
  ; sidebar_add_search =
      (fun q ->
        with_sidebar (fun sst -> Sidebar_state.add_search_item sst q))
  ; sidebar_open_uuid =
      (fun uuid -> with_sidebar (fun sst -> Sidebar_state.open_uuid sst uuid))
  ; sidebar_open_uuids =
      (fun us ->
        with_sidebar (fun sst ->
            Sidebar_state.ensure_right_open ();
            List.iter (fun u -> Sidebar_state.open_uuid sst u) us))
  ; sidebar_clear =
      (fun () ->
        with_sidebar (fun sst ->
            List.iter
              (fun (i : Sidebar_state.item) ->
                Sidebar_state.remove_item sst i.Sidebar_state.key)
              (Runtime.signal_get sst.Sidebar_state.items)))
  ; sidebar_close_top =
      (fun () ->
        with_sidebar (fun sst ->
            match List.rev (Runtime.signal_get sst.Sidebar_state.items) with
            | top :: _ -> Sidebar_state.remove_item sst top.Sidebar_state.key
            | [] -> ()))
  ; sidebar_ensure_contents =
      (fun () ->
        with_sidebar (fun sst ->
            Sidebar_state.ensure_right_open ();
            Sidebar_state.ensure_contents sst))
  ; sidebar_open_cards = Sidebar_state.open_cards
  ; sidebar_toggle_favorite =
      (fun () -> with_sidebar Sidebar_state.toggle_favorite)
  ; sidebar_recent_ids = Sidebar_state.recent_ids_of_storage
  ; exit_edit = (fun () -> Editor_actions.exit_edit ~select:false)
  ; append_block = Editor_actions.append_block
  ; clear_selection = Editor_actions.clear_selection
  ; select_all = Editor_actions.select_all
  ; copy_selection = Editor_actions.copy_selection_text
  ; delete_selection = Editor_actions.delete_selection
  ; extend_selection = Editor_actions.extend_selection
  ; move_selection_focus = Editor_actions.move_selection_focus
  ; indent =
      (fun up -> Editor_actions.indent_or_outdent ~indent:up)
  ; move_blocks_vert = Editor_actions.move_blocks_up_down
  ; select_single = Editor_actions.select_single
  ; enter_edit = Editor_actions.enter_edit
  ; toggle_collapse = Editor_actions.toggle_collapse
  ; set_collapsed = Editor_actions.set_collapsed
  ; toggle_open_blocks = Editor_actions.toggle_open_blocks
  ; cycle_todo = (fun us -> List.iter Editor_commands.cycle_todo us)
  ; undo = Editor_actions.undo
  ; redo = Editor_actions.redo
  ; quick_add = Editor_actions.quick_add
  ; toggle_own_list =
      (fun us -> List.iter (fun u -> Editor_commands.toggle_own_list u 0) us)
  ; ensure_comments =
      (fun ~repo ~uuids ->
        ignore
          (Runtime.invoke2 "thread-api/ensure-comments-area-for-blocks"
             (Wire.String repo)
             (Wire.Array (List.map (fun u -> Wire.Uuid u) uuids))
         |> Js.Promise.then_ (fun _ ->
                ignore (Outliner_ops.refresh_page ());
                Js.Promise.resolve ())))
  ; toggle_left_sidebar = (fun () -> Runtime.send Action.Toggle_left_sidebar)
  ; toggle_right_sidebar = (fun () -> Runtime.send Action.Toggle_right_sidebar)
  ; toggle_help = (fun () -> Runtime.send Action.Help_toggle)
  ; rtc_start = Rtc_ops.start
  ; rtc_stop = Rtc_ops.stop
  ; export_graph_html = (fun () -> ignore (Exporter.export_html ()))
  }
