(* Port of electron.interop — ESM/CJS interop helpers. *)

(* (or (when (fn? (.-default module)) (.-default module)) module) —
   typed 'a -> 'a so callers can ascribe the function signature they
   need, mirroring the cljs dynamic call. *)
external default_ : 'a -> 'a Js.Undefined.t = "default" [@@mel.get]

let default_function_or_module (m : 'a) : 'a =
  match Js.Undefined.toOption (default_ m) with
  | Some f when Js.typeof f = "function" -> f
  | _ -> m
