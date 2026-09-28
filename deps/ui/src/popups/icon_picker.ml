(* .cp__emoji-icon-picker — cljs components/icon.cljs icon-search/icon-picker.
   Anchored popup: `.hd` search input + `.bd` results grid. Picking an
   emoji writes logseq.property/icon = {type: :emoji, id} through
   set-block-property; em-emoji elements render via emoji-mart's init.

   Divergence: only the emoji source is implemented (no tabler-icon tab
   enumeration yet — the cljs version also searches @tabler/icons). *)

open Editor_dom
open Properties_dom
module S = Properties_state
module D = Properties_data
module W = Wire
module U = Ui_strings

(* emoji-mart: init({data}) defines the <em-emoji> custom element and
   registers the search index; without it bare <em-emoji> nodes stay
   empty/invisible. *)
external em_init : Js.Json.t -> unit = "init" [@@mel.module "emoji-mart"]
external em_data : Js.Json.t = "default" [@@mel.module "@emoji-mart/data"]
external em_index : Js.Json.t = "SearchIndex" [@@mel.module "emoji-mart"]

external em_search : Js.Json.t -> string -> Js.Json.t Js.Promise.t = "search"
  [@@mel.send]

external obj_values : Js.Json.t -> Js.Json.t array = "values"
  [@@mel.scope "Object"]

external from_entries : Js.Json.t -> Js.Json.t = "fromEntries"
  [@@mel.scope "Object"]

(* tuples compile to JS pairs, so an OCaml (k*v) array is iterable *)
external pairs_json : (string * Js.Json.t) array -> Js.Json.t = "%identity"

let inited = ref false

let init_emoji () =
  if !inited then ()
  else (
    inited := true;
    try em_init (from_entries (pairs_json [| ("data", em_data) |]))
    with _ -> ())

let jstr j key = Js.Json.decodeString (Platform.json_prop j key)

let pick uuid ty id =
  S.pop_overlay ();
  D.set_block_property ~block_uuid:uuid ~ident:"logseq.property/icon"
    ~value:
      (W.Map [ (W.Keyword "type", W.Keyword ty); (W.Keyword "id", W.String id) ])
  |> ignore;
  S.refresh_all ()

let emoji_btn uuid em =
  match jstr em "id" with
  | Some id ->
      let btn =
        mk ~cls:"text-2xl w-9 h-9 transition-opacity" "button"
          ~attrs:
            [ ("type", "button")
            ; ("title", Option.value (jstr em "name") ~default:id)
            ]
      in
      let em_el = mk ~attrs:[ ("id", id) ] "em-emoji" in
      set_style em_el "line-height:1;pointer-events:none";
      el_append_child btn em_el;
      on_click btn (fun _ -> pick uuid "emoji" id);
      btn
  | None -> mk "span"

(* cljs pane-section: .hd label + .its icon grid *)
let render_pane pane uuid label (items : Js.Json.t array) =
  el_clear pane;
  if Array.length items = 0 then ()
  else (
    let section = mk ~cls:"pane-section" "div" in
    ignore
      (child_text "strong"
         "text-xs font-medium text-gray-07 dark:opacity-80" label
         (let hd = mk ~cls:"hd px-1 pb-1 leading-none" "div" in
          el_append_child section hd;
          hd));
    let row = mk ~cls:"its icons-row" "div" in
    el_append_child section row;
    Array.iter (fun em -> el_append_child row (emoji_btn uuid em)) items;
    el_append_child pane section)

let default_emojis () =
  match Js.Json.decodeObject em_data with
  | Some _ -> (
      let all = obj_values (Platform.json_prop em_data "emojis") in
      let n = min 64 (Array.length all) in
      Array.sub all 0 n)
  | None -> [||]

let on_input pane uuid input =
  let q = String.trim (el_value input) in
  if q = "" then render_pane pane uuid "" [||]
  else
    em_search em_index q
    |> Js.Promise.then_ (fun res ->
           let items =
             match Js.Json.decodeArray res with
             | Some a -> a
             | None -> [||]
           in
           render_pane pane uuid
             (U.tf "icon/matched-count"
                [ string_of_int (Array.length items) ])
             items;
           Js.Promise.resolve ())
    |> ignore

(* open the picker anchored under `anchor`, writing the icon on `uuid` *)
let open_picker ~uuid ~anchor =
  init_emoji ();
  let left, _top, _right, bottom, _w = el_rect anchor in
  let root =
    mk ~cls:"cp__emoji-icon-picker" "div"
      ~attrs:
        [ ("data-keep-selection", "true")
        ; ( "style"
          , Printf.sprintf
              "position:fixed;left:%.0fpx;top:%.0fpx;z-index:9999;\
               min-width:300px;max-height:320px;overflow:auto;\
               background:var(--lx-popover-bg,Canvas);border-radius:8px;\
               box-shadow:0 4px 16px rgba(0,0,0,.25)"
              left (bottom +. 4.) )
        ]
  in
  let hd = mk ~cls:"hd bg-popover" "div" in
  let search = mk ~cls:"search-input" "div" in
  let input =
    mk ~cls:"w-full" "input"
      ~attrs:[ ("placeholder", U.t "icon/search-emojis") ]
  in
  el_append_child search input;
  el_append_child hd search;
  el_append_child root hd;
  let bd = mk ~cls:"bd bd-scroll" "div" in
  let pane = mk ~cls:"content-pane" "div" in
  el_append_child bd pane;
  el_append_child root bd;
  el_listen input "input" (fun _ -> on_input pane uuid input) true;
  el_listen input "keydown"
    (fun ev -> if ev_key ev = "Escape" then S.pop_overlay ())
    true;
  S.push_overlay root ~on_escape:(fun () -> ());
  let defaults = default_emojis () in
  render_pane pane uuid
    (U.tf "icon/emojis-count" [ string_of_int (Array.length defaults) ])
    defaults;
  el_focus input
