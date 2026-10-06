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
external error_arg1 : Js.Promise.error -> string option = "_1" [@@mel.get]
val is_timeout_error : Js.Promise.error -> bool
exception Promise_error of string
val throw_error : Js.Promise.error -> 'a
external chromium : browser_type = "chromium" [@@mel.module "playwright"]
val launch :
  ?headless:bool -> ?slow_mo:float -> browser_type -> browser Js.Promise.t
external new_context : browser -> context Js.Promise.t = "newContext"
[@@mel.send]
external new_page : context -> page Js.Promise.t = "newPage" [@@mel.send]
external browser_new_page : browser -> page Js.Promise.t = "newPage"
[@@mel.send]
external browser_close : browser -> unit Js.Promise.t = "close" [@@mel.send]
external browser_version : browser -> string = "version" [@@mel.send]
external browser_contexts : browser -> context array = "contexts" [@@mel.send]
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
external page_context : page -> context = "context" [@@mel.send]
external page_keyboard : page -> keyboard = "keyboard" [@@mel.get]
external page_url : page -> string = "url" [@@mel.send]
external page_close : page -> unit Js.Promise.t = "close" [@@mel.send]
external page_is_closed : page -> bool = "isClosed" [@@mel.send]
external reload : page -> 'a Js.Promise.t = "reload" [@@mel.send]
external go_back : page -> 'a Js.Promise.t = "goBack" [@@mel.send]
external go_forward : page -> 'a Js.Promise.t = "goForward" [@@mel.send]
val goto : ?wait_until:string -> page -> string -> 'a Js.Promise.t
external set_default_timeout : page -> float -> unit = "setDefaultTimeout"
[@@mel.send]
(* Local node timer, not page.waitForTimeout — see playwright.ml. *)
val wait_for_timeout : page -> float -> unit Js.Promise.t
val locator :
  ?has:'a ->
  ?has_not:'b ->
  ?has_text:'c -> ?has_not_text:'d -> page -> string -> locator
external get_by_test_id : page -> string -> locator = "getByTestId" [@@mel.send]
val get_by_text : ?exact:bool -> page -> string -> locator
val get_by_label : ?exact:bool -> page -> string -> locator
val get_by_role : ?name:'a -> page -> string -> locator
val wait_for_selector :
  ?state:string -> ?timeout:'a -> page -> string -> 'b Js.Promise.t
external evaluate : page -> string -> 'a Js.Promise.t = "evaluate" [@@mel.send]
external evaluate_arg :
  page -> string -> 'arg -> 'a Js.Promise.t = "evaluate" [@@mel.send]
external on : page -> string -> (console_message -> unit [@mel.uncurry]) -> unit
  = "on"
[@@mel.send]
val on_console : page -> (console_message -> unit) -> unit
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
val wait_for_event : ?timeout:'a -> page -> string -> 'b Js.Promise.t
val screenshot : path:'a -> page -> 'b Js.Promise.t
external page_wait_for_url : page -> 'a -> 'opts Js.t -> unit Js.Promise.t
  = "waitForURL"
[@@mel.send]
val keyboard_press : ?delay:float -> keyboard -> string -> unit Js.Promise.t
external keyboard_insert_text :
  keyboard -> string -> unit Js.Promise.t = "insertText" [@@mel.send]
val locator_locator :
  ?has:'a ->
  ?has_not:'b ->
  ?has_text:'c -> ?has_not_text:'d -> locator -> string -> locator
val click :
  ?button:'a ->
  ?timeout:'b -> ?modifiers:'c array -> locator -> unit Js.Promise.t
val dblclick : ?timeout:'a -> locator -> unit Js.Promise.t
val fill : ?timeout:'a -> locator -> string -> unit Js.Promise.t
val press_sequentially :
  ?delay:float -> locator -> string -> unit Js.Promise.t
val locator_wait_for :
  ?state:string -> ?timeout:'a -> locator -> unit Js.Promise.t
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
external bounding_box : locator -> bounding_box Js.Nullable.t Js.Promise.t
  = "boundingBox"
[@@mel.send]
external locator_page : locator -> page = "page" [@@mel.send]
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
val locator_filter :
  ?has:'a ->
  ?has_not:'b -> ?has_text:'c -> ?has_not_text:'d -> locator -> locator
external locator_all : locator -> locator array Js.Promise.t = "all"
[@@mel.send]
val hover : ?timeout:'a -> locator -> unit Js.Promise.t
val set_input_files : ?timeout:'a -> locator -> 'b -> unit Js.Promise.t
external locator_drag_to :
  locator -> locator -> 'opts Js.t -> unit Js.Promise.t = "dragTo" [@@mel.send]
val drag_to :
  ?timeout:'a ->
  ?target_x:'b ->
  ?target_y:'c -> ?steps:'d -> locator -> locator -> unit Js.Promise.t
val locator_press :
  ?delay:float -> ?timeout:'a -> locator -> string -> unit Js.Promise.t
val locator_get_by_text : ?exact:bool -> locator -> string -> locator
external select_option :
  locator -> 'value -> 'opts Js.t -> string array Js.Promise.t = "selectOption"
[@@mel.send]
external console_text : console_message -> string = "text" [@@mel.send]
external console_type : console_message -> string = "type" [@@mel.send]
external download_suggested_filename : download -> string
  = "suggestedFilename"
[@@mel.send]
external download_path : download -> string Js.Promise.t = "path" [@@mel.send]
external wait_for_function :
  page -> string -> 'a Js.Promise.t = "waitForFunction" [@@mel.send]
external expect : locator -> assertion = "expect"
[@@mel.module "@playwright/test"]
external expect_is_visible_opts :
  (assertion[@mel.this]) -> 'opts Js.t -> unit Js.Promise.t = "toBeVisible"
[@@mel.send]
val expect_is_visible : ?timeout:'a -> assertion -> unit Js.Promise.t
external expect_is_hidden : (assertion[@mel.this]) -> unit Js.Promise.t
  = "toBeHidden"
[@@mel.send]
external expect_has_count_opts :
  (assertion[@mel.this]) -> int -> 'opts Js.t -> unit Js.Promise.t
  = "toHaveCount"
[@@mel.send]
val expect_has_count :
  ?timeout:'a -> assertion -> int -> unit Js.Promise.t
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