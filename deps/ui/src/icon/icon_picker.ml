(* .ls-icon-picker emoji picker popup — mirrors cljs icon.cljs:
   outer .ls-icon-picker > .cp__emoji-icon-picker{data-keep-selection}
   > .hd > .search-input > input  +  .bd > .content-pane > .search-result
   > button:has(em-emoji[id])  +  .ft > button[data-action='del'] *)

module D = struct include Editor_dom include Properties_dom end
module E = Editor_dom
module I = Ui_strings

type choice =
  | Emoji of string
  | Tabler of string
  | Remove

let em_emoji_el ?(cls = "") (id : string) : E.el =
  D.mk ~cls ~attrs:[ ("id", id) ] "em-emoji"

(* icon value {type,id} -> display element *)
let icon_el ?(cls = "") (ty, id) : E.el =
  match ty with
  | "emoji" -> em_emoji_el ~cls id
  | _ ->
      let i = D.mk ~cls:("ti ti-" ^ id) "i" in
      let span =
        D.mk ~cls:("ui__icon ti ls-icon-" ^ id ^ " " ^ cls) "span"
      in
      D.el_append_child span i;
      span

let result_btn (id, name) (pick : choice -> unit) : E.el =
  let b =
    D.mk ~cls:"text-2xl w-9 h-9 transition-opacity"
      ~attrs:[ ("title", name); ("type", "button") ] "button"
  in
  D.el_append_child b (em_emoji_el id);
  D.on_click b (fun _ -> pick (Emoji id));
  b

let render_results (grid : E.el) (pick : choice -> unit)
    (entries : (string * string) list) =
  D.el_clear grid;
  List.iter (fun e -> D.el_append_child grid (result_btn e pick)) entries

let popular_emojis () : (string * string) list =
  match Js.Json.decodeObject Icons.mart_emojis with
  | Some dict ->
      Js.Dict.keys dict |> Array.to_list
      |> List.filteri (fun i _ -> i < 60)
      |> List.map (fun id -> (id, id))
  | None -> []

let footer (pick : choice -> unit) : E.el =
  let ft = D.mk ~cls:"ft" "div" in
  let b =
    D.mk ~cls:"ui__button"
      ~attrs:
        [ ("data-action", "del"); ("type", "button");
          ("title", I.t "ui/delete") ]
      "button"
  in
  D.el_append_child b (D.mk ~cls:"ti ti-x" "i");
  D.on_click b (fun _ -> pick Remove);
  D.el_append_child ft b;
  ft

(* open_picker ~anchor ~del ~on_chosen — anchor = element to position under *)
let open_picker ~(anchor : E.el) ~(del : bool)
    ~(on_chosen : choice -> unit) : unit =
  Icons.install ();
  let root =
    D.mk ~cls:"cp__emoji-icon-picker"
      ~attrs:[ ("data-keep-selection", "true") ] "div"
  in
  let hd = D.mk ~cls:"hd bg-popover" "div" in
  let si = D.mk ~cls:"search-input" "div" in
  let input =
    D.mk ~attrs:[ ("placeholder", I.t "icon/search-emojis") ] "input"
  in
  D.el_append_child si input;
  D.el_append_child hd si;
  let bd = D.mk ~cls:"bd bd-scroll" "div" in
  let pane = D.mk ~cls:"content-pane" "div" in
  let grid = D.mk ~cls:"search-result" "div" in
  D.el_append_child pane grid;
  D.el_append_child bd pane;
  D.el_append_child root hd;
  D.el_append_child root bd;
  let pick (c : choice) =
    Properties_state.pop_overlay ();
    on_chosen c
  in
  if del then D.el_append_child root (footer pick);
  render_results grid pick (popular_emojis ());
  D.el_listen input "input"
    (fun _ ->
      let q = String.trim (D.el_value input) in
      if q = "" then render_results grid pick (popular_emojis ())
      else Icons.search q (fun entries -> render_results grid pick entries))
    true;
  ignore
    (Properties_popup.open_anchored ~cls:"ls-icon-picker" anchor root);
  D.el_focus input
