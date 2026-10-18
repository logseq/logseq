(* Root view: shell + current route page. The view builds once; model
   changes flow through signal-driven props and reactive children. *)

open Lui_elements

let view _context model_source _send : t =
  Ui_components.with_props
    [
      Ui_components.Prop.foreground
        "var(--lx-gray-12, var(--ls-primary-text-color, \
         hsl(var(--foreground))))";
      Ui_components.Prop.background
        "var(--lx-gray-01, var(--ls-primary-background-color, \
         hsl(var(--background))))";
      Ui_components.Prop.font_size "var(--ls-page-text-size)";
      Ui_components.Prop.font_family
        "var(--ls-font-family), sans-serif, system-ui, -apple-system, \
         BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, \
         'Noto Sans', serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI \
         Symbol";
      Ui_components.Prop.line_height "1.5";
    ]
    (Chrome.shell model_source)
