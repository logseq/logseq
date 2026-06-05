open Js_of_ocaml
open Lwt.Infix

module JS = struct
  type value = Js.Unsafe.any

  let string value = Js.Unsafe.inject (Js.string value)
  let to_string value = Js.to_string (Js.Unsafe.coerce value)

  let to_int value =
    value |> Js.Unsafe.coerce |> Js.float_of_number |> int_of_float

  let get object_ property = Js.Unsafe.get object_ property
  let fun_call fn args = Js.Unsafe.fun_call fn args
  let meth_call object_ name args = Js.Unsafe.meth_call object_ name args
  let new_obj constructor args = Js.Unsafe.new_obj constructor args
  let obj fields = Js.Unsafe.obj fields
  let callback fn = Js.Unsafe.inject (Js.wrap_callback fn)
  let null = Js.Unsafe.inject Js.null
  let global = Js.Unsafe.global

  let is_function_expr =
    Js.Unsafe.pure_js_expr
      "(function(value) { return typeof value === 'function'; })"

  let is_function value =
    fun_call is_function_expr [| Js.Unsafe.inject value |]
    |> Js.Unsafe.coerce |> Js.to_bool

  let require_global_function name =
    let value = get global name in
    if is_function value then value else failwith (name ^ " is not available")
end

let node_builtin_module name =
  let process = JS.get JS.global "process" in
  let get_builtin_module = JS.get process "getBuiltinModule" in
  let module_ = JS.get JS.global "module" in
  let require = JS.get module_ "require" in
  if JS.is_function get_builtin_module then
    JS.fun_call get_builtin_module [| JS.string name |]
  else if JS.is_function require then
    JS.meth_call module_ "require" [| JS.string name |]
  else failwith "Node module loader is not available"

let hostname () =
  let os = node_builtin_module "os" in
  let hostname = JS.get os "hostname" in
  if JS.is_function hostname then JS.fun_call hostname [||] |> JS.to_string
  else failwith "os.hostname is not available"

module HTTP = struct
  let js_error_message error =
    try
      let text = JS.get error "message" |> JS.to_string in
      if String.trim text = "" then "JavaScript error" else text
    with _ -> "JavaScript error"

  let promise_to_lwt ?(cancel = fun () -> ()) promise =
    let task, resolver = Lwt.wait () in
    let finish result =
      if Lwt.is_sleeping task then Lwt.wakeup resolver result;
      JS.null
    in
    let on_ok value = finish (Ok value) in
    let on_error error = finish (Error (js_error_message error)) in
    ignore
      (JS.meth_call promise "then" [| JS.callback on_ok; JS.callback on_error |]
        : JS.value);
    Lwt.on_cancel task cancel;
    task >>= function
    | Ok value -> Lwt.return value
    | Error message -> Lwt.fail_with message

  let timeout_seconds = function
    | Some timeout_span when Ptime.Span.compare timeout_span Ptime.Span.zero > 0
      ->
        Some (Ptime.Span.to_float_s timeout_span)
    | _ -> None

  let with_timeout ?(cancel = fun () -> ()) timeout_span operation =
    match timeout_seconds timeout_span with
    | None -> operation
    | Some seconds ->
        let timeout =
          Js_of_ocaml_lwt.Lwt_js.sleep seconds >>= fun () ->
          cancel ();
          Lwt.fail_with "request timeout"
        in
        Lwt.finalize
          (fun () -> Lwt.pick [ operation; timeout ])
          (fun () ->
            Lwt.cancel timeout;
            Lwt.return_unit)

  let headers_to_js headers =
    Cohttp.Header.to_list headers
    |> List.map (fun (name, value) -> (name, JS.string value))
    |> Array.of_list |> JS.obj

  let response_headers response =
    let pairs = ref [] in
    let headers = JS.get response "headers" in
    let collect value name =
      pairs := (Js.to_string name, Js.to_string value) :: !pairs
    in
    ignore
      (JS.meth_call headers "forEach"
         [| Js.Unsafe.inject (Js.wrap_callback collect) |]
        : unit);
    Cohttp.Header.of_list (List.rev !pairs)

  let response_of_fetch response body_text =
    let status =
      JS.get response "status" |> JS.to_int |> Cohttp.Code.status_of_code
    in
    let headers = response_headers response in
    Cohttp.Response.make ~status
      ~encoding:(Cohttp.Transfer.Fixed (Int64.of_int (String.length body_text)))
      ~headers ()

  let abort_controller controller =
    ignore (JS.meth_call controller "abort" [||] : JS.value)

  let body_field meth body_text =
    match (meth, body_text) with
    | (`GET | `HEAD), "" | _, "" -> []
    | (`GET | `HEAD), _ ->
        invalid_arg "GET and HEAD requests must not include a body"
    | _, body -> [ ("body", JS.string body) ]

  let fetch_init meth headers body_text controller =
    let method_ = Cohttp.Code.string_of_method meth in
    let fields =
      [
        ("method", JS.string method_);
        ("headers", Js.Unsafe.inject (headers_to_js headers));
      ]
      @ [ ("signal", JS.get controller "signal") ]
      @ body_field meth body_text
    in
    JS.obj (Array.of_list fields)

  let make_abort_controller () =
    JS.new_obj (JS.require_global_function "AbortController") [||]

  let request ?timeout_span meth uri ~headers ~body =
    let operation =
      Cohttp_lwt.Body.to_string body >>= fun body_text ->
      let controller = make_abort_controller () in
      let cancel () = abort_controller controller in
      let fetch = JS.require_global_function "fetch" in
      let init = fetch_init meth headers body_text controller in
      let promise =
        JS.fun_call fetch
          [| JS.string (Uri.to_string uri); Js.Unsafe.inject init |]
      in
      let operation =
        promise_to_lwt ~cancel promise >>= fun response ->
        let text_promise : JS.value = JS.meth_call response "text" [||] in
        promise_to_lwt text_promise >>= fun text ->
        let body_text = JS.to_string text in
        Lwt.return
          ( response_of_fetch response body_text,
            Cohttp_lwt.Body.of_string body_text )
      in
      with_timeout ~cancel timeout_span operation
    in
    Cli_effect.of_lwt operation
end
