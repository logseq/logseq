(* console.* + process stream taps for the db-worker-node log
   installer. cljs log.cljs wraps console.{log,warn,error},
   process.{stdout,stderr}.write and *print-fn* — OCaml print goes
   through process.stdout so the stream tap covers it. *)

let log s = Js.Console.log s
let warn s = Js.Console.warn s
let error s = Js.Console.error s

external console_ : Js.Json.t = "console" [@@mel.scope "globalThis"]
external stdout_ : Js.Json.t = "stdout" [@@mel.scope "process"]
external stderr_ : Js.Json.t = "stderr" [@@mel.scope "process"]

external get_index : Js.Json.t -> string -> 'a = "" [@@mel.get_index]
external set_index : Js.Json.t -> string -> 'a -> unit = "" [@@mel.set_index]

(* Saved native fns are opaque JS function objects; fn.apply(this,args)
   re-invokes them with the right `this` (streams need it). *)
type fn_obj = < > Js.t

external apply_ : fn_obj -> Js.Json.t -> 'a array -> unit = "apply" [@@mel.send]
external as_buffer : Js.Json.t -> Node.Buffer.t = "%identity"

(* cljs chunk-args->text: Buffer chunks decode utf8, anything else str. *)
let chunk_text (chunk : Js.Json.t) =
  if Node.Buffer.isBuffer chunk then Node.Buffer.toString (as_buffer chunk)
  else
    match Js.Json.classify chunk with
    | Js.Json.JSONString s -> s
    | _ -> Js.Json.stringify chunk

let tap_stdio tap =
  let saved = ref [] in
  let wrap obj name f =
    let orig : fn_obj = get_index obj name in
    saved := (obj, name, orig) :: !saved;
    set_index obj name (fun (arg : Js.Json.t) -> f arg; apply_ orig obj [| arg |])
  in
  wrap console_ "log" (fun a -> tap ~source:"console.log" ~text:(chunk_text a));
  wrap console_ "warn" (fun a -> tap ~source:"console.warn" ~text:(chunk_text a));
  wrap console_ "error" (fun a -> tap ~source:"console.error" ~text:(chunk_text a));
  wrap stdout_ "write" (fun a -> tap ~source:"stdout" ~text:(chunk_text a));
  wrap stderr_ "write" (fun a -> tap ~source:"stderr" ~text:(chunk_text a));
  fun () ->
    List.iter (fun (obj, name, orig) -> set_index obj name orig) !saved
