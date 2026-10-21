(* Port of electron.release-warning — wrong-build (x64 on Apple Silicon)
   warning dialog. *)

let stable_release_url =
  "https://github.com/logseq/logseq/releases/latest"

let nightly_release_url =
  "https://github.com/logseq/logseq/releases/tag/nightly"

type system_info =
  { platform : string
  ; arch : string
  ; running_under_arm64_translation : bool
  }

let x64_on_apple_silicon (i : system_info) : bool =
  i.platform = "darwin" && i.arch = "x64"
  && i.running_under_arm64_translation

let selected_release_url (response : int) : string option =
  match response with
  | 0 -> Some stable_release_url
  | 1 -> Some nightly_release_url
  | _ -> None

(* The cljs version returns a clj map that the caller turns into a JS
   object and assoc's :title onto. A Js.Dict lets the caller do the
   same (Js.Dict.set opts "title" ...). *)
let warning_dialog_options (t : string -> string) : Js.Json.t Js.Dict.t =
  let d = Js.Dict.empty () in
  Js.Dict.set d "type" (Js.Json.string "warning");
  Js.Dict.set d "buttons"
    (Js.Json.stringArray
       [| t "electron/wrong-release-open-stable"
        ; t "electron/wrong-release-open-nightly"
        ; t "electron/cancel" |]);
  Js.Dict.set d "defaultId" (Js.Json.number 0.);
  Js.Dict.set d "cancelId" (Js.Json.number 2.);
  Js.Dict.set d "message"
    (Js.Json.string (t "electron/wrong-release-warning-title"));
  Js.Dict.set d "detail"
    (Js.Json.string (t "electron/wrong-release-warning-detail"));
  d
