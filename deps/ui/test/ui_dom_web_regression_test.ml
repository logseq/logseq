open Test_check

(* A FileList is array-like, including during protected dragover mode. *)
let event : string -> bool -> Js.Json.t = [%mel.raw
  "function (channel, protectedMode) {
    const files = protectedMode ? {length: 0} : {
      0: {name: 'attachment.png', size: 12}, length: 1
    };
    return {[channel]: {files, types: ['Files']}, prevented: false,
      preventDefault() {this.prevented = true},
      stopPropagation() {}, stopImmediatePropagation() {}};
  }"]

let prevented : Js.Json.t -> bool = [%mel.raw "e => e.prevented"]

let run () =
  List.iter (fun channel ->
      let ev = Ui_dom_web.ev_of (event channel false) in
      check (channel ^ " retains an array-like FileList")
        (match ev.Ui_services.files with
         | [ f ] -> f.file_name = "attachment.png" && f.file_size = 12.
         | _ -> false)) [ "clipboardData"; "dataTransfer" ];
  let raw = event "dataTransfer" true in
  Editor_keys.on_file_dragover (Ui_dom_web.ev_of raw);
  check "protected file dragover enables the later drop" (prevented raw);
  let text_event = Js.Json.object_ (Js.Dict.fromList
      [ "dataTransfer", Js.Json.object_ (Js.Dict.fromList
          [ "files", Js.Json.array [||]
          ; "types", Js.Json.array [| Js.Json.string "text/plain" |] ]) ]) in
  let ev = Ui_dom_web.ev_of text_event in
  let cancelled = ref false in
  Editor_keys.on_file_dragover { ev with prevent_default = (fun () -> cancelled := true) };
  check "text drags retain their default behavior" (not !cancelled)
