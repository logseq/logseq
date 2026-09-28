(* Emoji dataset + search — bindings over the bundled @emoji-mart/data
   and emoji-mart npm packages (cljs ui.cljs + icon.cljs). init must run
   once before <em-emoji> elements render glyphs or SearchIndex works. *)

external mart_categories : Js.Json.t = "categories"
  [@@mel.module "@emoji-mart/data"]

external mart_emojis : Js.Json.t = "emojis"
  [@@mel.module "@emoji-mart/data"]

external mart_aliases : Js.Json.t = "aliases"
  [@@mel.module "@emoji-mart/data"]

external mart_sheet : Js.Json.t = "sheet"
  [@@mel.module "@emoji-mart/data"]

external mart_init : Js.Json.t -> unit = "init" [@@mel.module "emoji-mart"]

external mart_search_index : Js.Json.t = "SearchIndex"
  [@@mel.module "emoji-mart"]

external mart_search :
  Js.Json.t -> string -> Js.Json.t array Js.Promise.t
  = "search" [@@mel.send]

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    let data = Js.Dict.empty () in
    Js.Dict.set data "categories" mart_categories;
    Js.Dict.set data "emojis" mart_emojis;
    Js.Dict.set data "aliases" mart_aliases;
    Js.Dict.set data "sheet" mart_sheet;
    let opts = Js.Dict.empty () in
    Js.Dict.set opts "data" (Js.Json.object_ data);
    mart_init (Js.Json.object_ opts)
  end

(* frontend.reaction/emoji-id-valid? *)
let emoji_id_valid (id : string) : bool =
  id <> ""
  &&
  match Js.Json.decodeObject mart_emojis with
  | Some dict -> Js.Dict.get dict id <> None
  | None -> false

let json_str (j : Js.Json.t) (k : string) : string option =
  Js.Json.decodeString (Platform.json_prop j k)

(* search entries arrive as {id, name, skins} *)
let entry_of_json (j : Js.Json.t) : (string * string) option =
  match json_str j "id" with
  | Some id -> Some (id, Option.value (json_str j "name") ~default:id)
  | None -> None

(* search a query; resolves to (id, name) pairs *)
let search (q : string) (f : (string * string) list -> unit) =
  if String.trim q = "" then f []
  else
    ignore
      (mart_search mart_search_index q
      |> Js.Promise.then_ (fun arr ->
             Js.Promise.resolve
               (f (List.filter_map entry_of_json (Array.to_list arr))))
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("emoji search failed", e);
             Js.Promise.resolve (f [])))
