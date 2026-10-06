(** Ergonomic page operations over {!Env.t}, mirroring wally's API surface.
    Functions suffixed [_l] take a locator; the rest take a CSS selector. *)

open Fest.Promise

let page env = env.Env.page
let q env selector = Playwright.locator (page env) selector

let qq env ?has ?has_not ?has_text ?has_not_text selector =
  Playwright.locator ?has ?has_not ?has_text ?has_not_text (page env) selector

let qs env selector = Playwright.locator_all (q env selector)
let sub loc selector = Playwright.locator_locator loc selector
let sub_first loc selector = Playwright.locator_first (sub loc selector)

(* {2 Actions} *)

let click env selector = Playwright.click (q env selector)
let click_l ?button ?timeout ?modifiers loc =
  Playwright.click ?button ?timeout ?modifiers loc
let click_right env selector = click_l ~button:"right" (q env selector)
let dblclick env selector = Playwright.dblclick (q env selector)
let fill env selector value = Playwright.fill (q env selector) value
let fill_l ?timeout loc value = Playwright.fill ?timeout loc value
let hover_l ?timeout loc = Playwright.hover ?timeout loc

(* {2 Waiting / state} *)

let wait_for env ?state ?timeout selector =
  Playwright.wait_for_selector ?state ?timeout (page env) selector

let wait_for_hidden env ?timeout selector =
  wait_for env ~state:"hidden" ?timeout selector

let wait_for_l ?state ?timeout loc =
  Playwright.locator_wait_for ?state ?timeout loc

let wait_for_hidden_l ?timeout loc = wait_for_l ~state:"hidden" ?timeout loc
let visible env selector = Playwright.is_visible (q env selector)
let visible_l loc = Playwright.is_visible loc
let count env selector = Playwright.count (q env selector)
let count_l loc = Playwright.count loc
let all_text env selector = Playwright.all_text_contents (q env selector)

let all_text_l loc = Playwright.all_text_contents loc

let text_of_l loc =
  let* contents = Playwright.all_text_contents loc in
  match Array.to_list contents with
  | [ content ] -> Js.Promise.resolve content
  | [] -> Js.Promise.resolve ""
  | _ -> Js.Promise.reject (Failure "text_of_l: query matches more than 1 element")

let attr env selector name = Playwright.get_attribute (q env selector) name
let attr_l loc name = Playwright.get_attribute loc name
let input_value env selector = Playwright.input_value (q env selector)
let input_value_l loc = Playwright.input_value loc

let bounding_xy_l loc =
  (* boundingBox resolves null while the element is mid-remount (detached or
     not yet laid out); poll briefly instead of failing on the transient. *)
  let rec go attempts_left =
    let* box = Playwright.bounding_box loc in
    match Js.Nullable.toOption box with
    | Some b -> Js.Promise.resolve (Playwright.box_x b, Playwright.box_y b)
    | None ->
        if attempts_left <= 0 then
          Js.Promise.reject (Failure "bounding_xy_l: element not visible")
        else
          let* () =
            Playwright.wait_for_timeout (Playwright.locator_page loc) 50.
          in
          go (attempts_left - 1)
  in
  go 60

(* {2 Navigation} *)

let navigate env url = Playwright.goto (page env) url
let refresh env = Playwright.reload (page env)
let go_back env = Playwright.go_back (page env)
let go_forward env = Playwright.go_forward (page env)
let url env = Playwright.page_url (page env)
let wait_timeout env ms = Playwright.wait_for_timeout (page env) ms

(* {2 Keyboard} *)

let press env ?delay key =
  Playwright.keyboard_press ?delay (Playwright.page_keyboard (page env)) key

let press_all env ?delay keys =
  List.fold_left
    (fun p key ->
      Js.Promise.then_
        (fun () ->
          Playwright.keyboard_press ?delay
            (Playwright.page_keyboard (page env))
            key)
        p)
    (Js.Promise.resolve ()) keys

(* {2 Get-by queries} *)

let get_by_test_id env testid = Playwright.get_by_test_id (page env) testid
let get_by_text env ?exact text = Playwright.get_by_text ?exact (page env) text
let get_by_label env ?exact text = Playwright.get_by_label ?exact (page env) text
let get_by_role env ?name role = Playwright.get_by_role ?name (page env) role

(* {2 JS evaluation} *)

(** Playwright [evaluate] has no timeout: when the evaluated expression
    returns a promise resolved by the worker (comlink remoteInvoke), a
    worker busy applying a remote backlog leaves the call pending forever
    — the suite then hangs at 0% CPU with no error. Race every evaluation
    against a deadline so a wedged call fails instead of hanging the
    whole suite. *)
let eval_timeout_ms = 90000.

let with_eval_timeout env label p =
  Js.Promise.race
    [| p
     ; (let* () = Playwright.wait_for_timeout (page env) eval_timeout_ms in
        Js.Promise.reject
          (Failure (Printf.sprintf "eval timeout after %.0fs: %s"
                      (eval_timeout_ms /. 1000.) label)))
     |]

let eval_js env js =
  with_eval_timeout env
    (String.sub js 0 (min 80 (String.length js)))
    (Playwright.evaluate (page env) js)

external json_stringify : 'a -> string = "stringify" [@@mel.scope "JSON"]

(** Playwright's [evaluate] never invokes a string that merely evaluates to a
    function, even when an arg is passed — wally's [eval-js] semantics are
    recovered by inlining the JSON-encoded arg: [(fn)(arg)]. *)
let eval_js_arg env js arg =
  let call =
    Printf.sprintf "(%s)(%s)" js (json_stringify arg)
  in
  with_eval_timeout env
    (String.sub call 0 (min 80 (String.length call)))
    (Playwright.evaluate (page env) call)

(** [eval_on_element env selector js]: [js] is an element function body like
    [wally]'s [eval-js] on a locator — e.g. ["element => element.id"]. Locator
    [evaluate] never invokes a function string (it serializes the function
    object itself, returning undefined), so we evaluate at page level against
    the first element matching [selector]. *)
let eval_on_element env selector js =
  (* Locator.evaluate serializes a function string instead of invoking it,
     so we evaluate at page level. [selector] may use Playwright-only
     pseudos; the only one the suite needs is :has-text, handled by a
     textContent filter fallback. *)
  eval_js_arg env
    (Printf.sprintf
       "sel => { const m = sel.match(/^(.*):has-text\\('([^']*)'\\)$/);         const element = m ? [...document.querySelectorAll(m[1])].find(e => e.textContent.includes(m[2]))         : document.querySelector(sel); return (%s)(element); }"
       js)
    selector

(* {2 Misc} *)

let on_console env cb = Playwright.on_console (page env) cb
let screenshot env ~path = Playwright.screenshot ~path (page env)

let clipboard_text env =
  eval_js env "() => navigator.clipboard.readText()"

let grant_permissions env permissions =
  Playwright.grant_permissions (Playwright.page_context (page env)) permissions

let set_default_timeout env ms =
  Playwright.set_default_timeout (page env) ms

(** wally's [maybe]: run a promise; a Playwright TimeoutError resolves to
    [None] instead of rejecting. *)
let maybe p =
  Js.Promise.catch
    (fun e ->
      if Playwright.is_timeout_error e then Js.Promise.resolve None
      else Playwright.throw_error e)
    (Js.Promise.then_ (fun v -> Js.Promise.resolve (Some v)) p)

(** [with_timeout_error p f] resolves to [f ()] on TimeoutError, otherwise
    rethrows — for wally's [(try ... (catch TimeoutError ...))] patterns. *)
let catch_timeout p f =
  Js.Promise.catch
    (fun e ->
      if Playwright.is_timeout_error e then f ()
      else Playwright.throw_error e)
    p

(** [ignore_timeout p] resolves to [()] on TimeoutError, otherwise rethrows. *)
let ignore_timeout p = catch_timeout p (fun () -> Js.Promise.resolve ())

let find_one_by_text env selector text =
  let* locs = qs env selector in
  let rec go i =
    if i >= Array.length locs then Js.Promise.resolve None
    else
      let* contents = Playwright.all_text_contents locs.(i) in
      if Array.to_list contents = [ text ] then
        Js.Promise.resolve (Some locs.(i))
      else go (i + 1)
  in
  go 0

let drag_to ?target_x ?target_y ?steps source_l target_l =
  Playwright.drag_to ?target_x ?target_y ?steps source_l target_l
