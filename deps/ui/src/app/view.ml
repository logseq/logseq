(* Root view: shell + current route page. The view builds once; model
   changes flow through signal-driven props and reactive children. *)

open Lui_elements

let font_family ~apple () =
  let font = Settings_state.current_editor_font () in
  Settings_state.editor_font_family ~apple
    (if font.fglobal then font.ftype else "default")

let view _context model_source _send : t =
 fun ctx parent ->
  Settings_state.ensure ctx;
  ignore (Outline_viewport_state.ensure ctx model_source);
  (Ui_parts.string_prop Lui_protocol.FontFamily
     ~value:(reactive (fun _ -> font_family ~apple:(Lui_ui.host ctx = Lui_protocol.SwiftUIHost) ()) (Settings_state.signal ()))
     (Ui_components.with_props
        [
          Ui_components.Prop.foreground
            "var(--lx-gray-12, var(--ls-primary-text-color, \
             hsl(var(--foreground))))";
          Ui_components.Prop.background
            "var(--lx-gray-01, var(--ls-primary-background-color, \
             hsl(var(--background))))";
          Ui_components.Prop.font_size "var(--ls-page-text-size)";
          Ui_components.Prop.font_weight Ui_theme.typography.weight_regular;
          Ui_components.Prop.line_height "var(--lx-line-height)";
        ]
        (Chrome.shell model_source))) ctx parent
