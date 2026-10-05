(** Bindings for the [playwright] npm package and the [expect] assertion
    exported by [@playwright/test]. Only the surface used by the e2e suite is
    bound. *)

type browser_type
type browser
type context
type page
type locator
type keyboard
type console_message
type bounding_box
type download
type assertion
type file_chooser
type dialog

external error_name : Js.Promise.error -> string option = "name" [@@mel.get]
external error_message : Js.Promise.error -> string option = "message"
[@@mel.get]

(* an OCaml exception rejected through a promise surfaces as a
   MelangeError whose .message loses the payload — the exception id is
   in MEL_EXN_ID and the first arg in the compiled `_1` field *)
external error_mel_id : Js.Promise.error -> string option = "MEL_EXN_ID"
[@@mel.get]

external error_arg1 : Js.Promise.error -> string option = "_1" [@@mel.get]

external error_arg1_json : Js.Promise.error -> Js.Json.t = "_1" [@@mel.get]

let is_timeout_error e = error_name e = Some "TimeoutError"

exception Promise_error of string

let throw_error e =
  let msg =
    match (error_name e, error_message e) with
    | Some "MelangeError", m -> (
        match Js.Json.classify (error_arg1_json e) with
        | Js.Json.JSONString s -> (
            match error_mel_id e with
            | Some id -> id ^ ": " ^ s
            | None -> s)
        | Js.Json.JSONObject _ -> Js.Json.stringify (error_arg1_json e)
        | _ -> Option.value ~default:"MelangeError" m)
    | Some n, Some m -> n ^ ": " ^ m
    | Some n, None -> n
    | None, Some m -> m
    | None, None -> "unknown JS error"
  in
  raise (Promise_error msg)

(* {2 Browser type} *)

external chromium : browser_type = "chromium" [@@mel.module "playwright"]

external launch :
  browser_type -> 'opts Js.t -> browser Js.Promise.t = "launch"
[@@mel.send]

let launch ?(headless = true) ?(slow_mo = 0.) bt =
  launch bt [%mel.obj { headless; slowMo = slow_mo }]

(* {2 Browser} *)

external new_context : browser -> context Js.Promise.t = "newContext"
[@@mel.send]

external new_page : context -> page Js.Promise.t = "newPage" [@@mel.send]

external browser_new_page : browser -> page Js.Promise.t = "newPage"
[@@mel.send]

external browser_close : browser -> unit Js.Promise.t = "close" [@@mel.send]
external browser_version : browser -> string = "version" [@@mel.send]
external browser_contexts : browser -> context array = "contexts" [@@mel.send]

(* {2 Context} *)

external context_browser : context -> browser = "browser" [@@mel.send]
external context_pages : context -> page array = "pages" [@@mel.send]
external context_close : context -> unit Js.Promise.t = "close" [@@mel.send]

external context_new_context : browser -> context Js.Promise.t = "newContext"
[@@mel.send]

external grant_permissions :
  context -> string array -> unit Js.Promise.t = "grantPermissions"
[@@mel.send]

external add_init_script :
  context -> string -> unit Js.Promise.t = "addInitScript" [@@mel.send]

external context_set_default_timeout :
  context -> float -> unit = "setDefaultTimeout" [@@mel.send]

(* {2 Page} *)

external page_context : page -> context = "context" [@@mel.send]
external page_keyboard : page -> keyboard = "keyboard" [@@mel.get]
external page_url : page -> string = "url" [@@mel.send]
external page_close : page -> unit Js.Promise.t = "close" [@@mel.send]

external page_is_closed : page -> bool = "isClosed" [@@mel.send]
external reload : page -> 'a Js.Promise.t = "reload" [@@mel.send]
external go_back : page -> 'a Js.Promise.t = "goBack" [@@mel.send]
external go_forward : page -> 'a Js.Promise.t = "goForward" [@@mel.send]

external goto : page -> string -> 'opts Js.t -> 'a Js.Promise.t = "goto"
[@@mel.send]

let goto ?(wait_until = "commit") page url =
  goto page url [%mel.obj { waitUntil = wait_until }]

external set_default_timeout : page -> float -> unit = "setDefaultTimeout"
[@@mel.send]

external wait_for_timeout : page -> float -> unit Js.Promise.t
  = "waitForTimeout"
[@@mel.send]

external locator :
  page -> string -> 'opts Js.t -> locator = "locator" [@@mel.send]

let locator ?has ?has_not ?has_text ?has_not_text page selector =
  locator page selector
    [%mel.obj
      { has = Js.Undefined.fromOption has
      ; hasNot = Js.Undefined.fromOption has_not
      ; hasText = Js.Undefined.fromOption has_text
      ; hasNotText = Js.Undefined.fromOption has_not_text
      }]

external get_by_test_id : page -> string -> locator = "getByTestId" [@@mel.send]

external get_by_text : page -> string -> 'opts Js.t -> locator = "getByText"
[@@mel.send]

let get_by_text ?(exact = false) page text =
  get_by_text page text [%mel.obj { exact }]

external get_by_label : page -> string -> 'opts Js.t -> locator = "getByLabel"
[@@mel.send]

let get_by_label ?(exact = false) page text =
  get_by_label page text [%mel.obj { exact }]

external get_by_role : page -> string -> 'opts Js.t -> locator = "getByRole"
[@@mel.send]

let get_by_role ?name page role =
  get_by_role page role
    [%mel.obj { name = Js.Undefined.fromOption name }]

external wait_for_selector :
  page -> string -> 'opts Js.t -> 'a Js.Promise.t = "waitForSelector"
[@@mel.send]

let wait_for_selector ?(state = "visible") ?timeout page selector =
  wait_for_selector page selector
    [%mel.obj { state; timeout = Js.Undefined.fromOption timeout }]

external evaluate : page -> string -> 'a Js.Promise.t = "evaluate" [@@mel.send]

external evaluate_arg :
  page -> string -> 'arg -> 'a Js.Promise.t = "evaluate" [@@mel.send]

external on : page -> string -> (console_message -> unit [@mel.uncurry]) -> unit
  = "on"
[@@mel.send]

let on_console page cb = on page "console" cb

external on_event :
  page -> string -> ('a -> unit [@mel.uncurry]) -> unit = "on" [@@mel.send]

external off_event :
  page -> string -> ('a -> unit [@mel.uncurry]) -> unit = "off" [@@mel.send]

external file_chooser_set_files :
  file_chooser -> string array -> unit Js.Promise.t = "setFiles" [@@mel.send]

external dialog_type : dialog -> string = "type" [@@mel.send]
external dialog_message : dialog -> string = "message" [@@mel.send]
external dialog_accept : dialog -> unit Js.Promise.t = "accept" [@@mel.send]
external dialog_dismiss : dialog -> unit Js.Promise.t = "dismiss" [@@mel.send]

external wait_for_event :
  page -> string -> 'opts Js.t -> 'a Js.Promise.t = "waitForEvent"
[@@mel.send]

let wait_for_event ?timeout page event =
  wait_for_event page event
    [%mel.obj { timeout = Js.Undefined.fromOption timeout }]

external screenshot : page -> 'opts Js.t -> 'a Js.Promise.t = "screenshot"
[@@mel.send]

let screenshot ~path page = screenshot page [%mel.obj { path }]

external page_wait_for_url : page -> 'a -> 'opts Js.t -> unit Js.Promise.t
  = "waitForURL"
[@@mel.send]

(* {2 Keyboard} *)

external keyboard_press :
  keyboard -> string -> 'opts Js.t -> unit Js.Promise.t = "press" [@@mel.send]

let keyboard_press ?(delay = 0.) keyboard key =
  keyboard_press keyboard key [%mel.obj { delay }]

external keyboard_insert_text :
  keyboard -> string -> unit Js.Promise.t = "insertText" [@@mel.send]

(* {2 Locator} *)

external locator_locator :
  locator -> string -> 'opts Js.t -> locator = "locator" [@@mel.send]

let locator_locator ?has ?has_not ?has_text ?has_not_text loc selector =
  locator_locator loc selector
    [%mel.obj
      { has = Js.Undefined.fromOption has
      ; hasNot = Js.Undefined.fromOption has_not
      ; hasText = Js.Undefined.fromOption has_text
      ; hasNotText = Js.Undefined.fromOption has_not_text
      }]

external click : locator -> 'opts Js.t -> unit Js.Promise.t = "click"
[@@mel.send]

let click ?button ?timeout ?(modifiers = [||]) loc =
  click loc
    [%mel.obj
      { button = Js.Undefined.fromOption button
      ; timeout = Js.Undefined.fromOption timeout
      ; modifiers
      }]

external dblclick : locator -> 'opts Js.t -> unit Js.Promise.t = "dblclick"
[@@mel.send]

let dblclick ?timeout loc =
  dblclick loc [%mel.obj { timeout = Js.Undefined.fromOption timeout }]

external fill : locator -> string -> 'opts Js.t -> unit Js.Promise.t = "fill"
[@@mel.send]

let fill ?timeout loc value =
  fill loc value [%mel.obj { timeout = Js.Undefined.fromOption timeout }]

external press_sequentially :
  locator -> string -> 'opts Js.t -> unit Js.Promise.t = "pressSequentially"
[@@mel.send]

let press_sequentially ?(delay = 0.) loc text =
  press_sequentially loc text [%mel.obj { delay }]

external locator_wait_for :
  locator -> 'opts Js.t -> unit Js.Promise.t = "waitFor" [@@mel.send]

let locator_wait_for ?(state = "visible") ?timeout loc =
  locator_wait_for loc
    [%mel.obj { state; timeout = Js.Undefined.fromOption timeout }]

external text_content : locator -> string option Js.Promise.t = "textContent"
[@@mel.send]

external all_text_contents : locator -> string array Js.Promise.t
  = "allTextContents"
[@@mel.send]

external input_value : locator -> string Js.Promise.t = "inputValue"
[@@mel.send]

external get_attribute : locator -> string -> string option Js.Promise.t
  = "getAttribute"
[@@mel.send]

external bounding_box : locator -> bounding_box option Js.Promise.t
  = "boundingBox"
[@@mel.send]

external box_x : bounding_box -> float = "x" [@@mel.get]
external box_y : bounding_box -> float = "y" [@@mel.get]
external box_width : bounding_box -> float = "width" [@@mel.get]
external box_height : bounding_box -> float = "height" [@@mel.get]

external locator_evaluate : locator -> string -> 'a Js.Promise.t = "evaluate"
[@@mel.send]

external locator_evaluate_arg :
  locator -> string -> 'arg -> 'a Js.Promise.t = "evaluate" [@@mel.send]

external focus : locator -> unit Js.Promise.t = "focus" [@@mel.send]

external count : locator -> int Js.Promise.t = "count" [@@mel.send]
external is_visible : locator -> bool Js.Promise.t = "isVisible" [@@mel.send]
external is_hidden : locator -> bool Js.Promise.t = "isHidden" [@@mel.send]

external locator_first : locator -> locator = "first" [@@mel.send]
external locator_last : locator -> locator = "last" [@@mel.send]
external locator_nth : locator -> int -> locator = "nth" [@@mel.send]
external locator_or : locator -> locator -> locator = "or" [@@mel.send]
external locator_and : locator -> locator -> locator = "and" [@@mel.send]

external locator_filter : locator -> 'opts Js.t -> locator = "filter"
[@@mel.send]

let locator_filter ?has ?has_not ?has_text ?has_not_text loc =
  locator_filter loc
    [%mel.obj
      { has = Js.Undefined.fromOption has
      ; hasNot = Js.Undefined.fromOption has_not
      ; hasText = Js.Undefined.fromOption has_text
      ; hasNotText = Js.Undefined.fromOption has_not_text
      }]

external locator_all : locator -> locator array Js.Promise.t = "all"
[@@mel.send]

external hover : locator -> 'opts Js.t -> unit Js.Promise.t = "hover"
[@@mel.send]

let hover ?timeout loc =
  hover loc [%mel.obj { timeout = Js.Undefined.fromOption timeout }]

external set_input_files :
  locator -> 'files -> 'opts Js.t -> unit Js.Promise.t = "setInputFiles"
[@@mel.send]

let set_input_files ?timeout loc files =
  set_input_files loc files
    [%mel.obj { timeout = Js.Undefined.fromOption timeout }]

external locator_drag_to :
  locator -> locator -> 'opts Js.t -> unit Js.Promise.t = "dragTo" [@@mel.send]

let drag_to ?timeout ?target_x ?target_y ?steps loc target =
  let pos =
    match (target_x, target_y) with
    | Some x, Some y -> Js.Undefined.return [%mel.obj { x; y }]
    | _ -> Js.Undefined.empty
  in
  locator_drag_to loc target
    [%mel.obj
      { timeout = Js.Undefined.fromOption timeout
      ; targetPosition = pos
      ; steps = Js.Undefined.fromOption steps
      }]

external locator_press :
  locator -> string -> 'opts Js.t -> unit Js.Promise.t = "press" [@@mel.send]

let locator_press ?(delay = 0.) ?timeout loc key =
  locator_press loc key
    [%mel.obj { delay; timeout = Js.Undefined.fromOption timeout }]

external locator_get_by_text :
  locator -> string -> 'opts Js.t -> locator = "getByText" [@@mel.send]

let locator_get_by_text ?(exact = false) loc text =
  locator_get_by_text loc text [%mel.obj { exact }]

external select_option :
  locator -> 'value -> 'opts Js.t -> string array Js.Promise.t = "selectOption"
[@@mel.send]

(* {2 Console message} *)

external console_text : console_message -> string = "text" [@@mel.send]
external console_type : console_message -> string = "type" [@@mel.send]

(* {2 Download} *)

external download_suggested_filename : download -> string
  = "suggestedFilename"
[@@mel.send]

external download_path : download -> string Js.Promise.t = "path" [@@mel.send]

(** [page.waitForFunction "expr"] — polls until the page expression is truthy. *)
external wait_for_function :
  page -> string -> 'a Js.Promise.t = "waitForFunction" [@@mel.send]

(* {2 Assertions from @playwright/test} *)

external expect : locator -> assertion = "expect"
[@@mel.module "@playwright/test"]

external expect_configure : 'opts Js.t -> unit = "expect.configure"
[@@mel.module "@playwright/test"]

external expect_is_visible_opts :
  (assertion[@mel.this]) -> 'opts Js.t -> unit Js.Promise.t = "toBeVisible"
[@@mel.send]

let expect_is_visible ?timeout assertion =
  expect_is_visible_opts assertion
    [%mel.obj { timeout = Js.Undefined.fromOption timeout }]

external expect_is_hidden : (assertion[@mel.this]) -> unit Js.Promise.t
  = "toBeHidden"
[@@mel.send]

external expect_has_count :
  (assertion[@mel.this]) -> int -> unit Js.Promise.t = "toHaveCount"
[@@mel.send]

external expect_to_have_text :
  (assertion[@mel.this]) -> 'expected -> 'opts Js.t -> unit Js.Promise.t
  = "toHaveText"
[@@mel.send]

external expect_to_contain_text :
  (assertion[@mel.this]) -> 'expected -> 'opts Js.t -> unit Js.Promise.t
  = "toContainText"
[@@mel.send]

external expect_has_value :
  (assertion[@mel.this]) -> string -> unit Js.Promise.t = "toHaveValue"
[@@mel.send]

external not_ : assertion -> assertion = "not" [@@mel.get]
