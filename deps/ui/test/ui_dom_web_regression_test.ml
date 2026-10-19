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

let clipboard_event : unit -> Js.Json.t = [%mel.raw
  "function () {
    const values = {'text/plain': '<b>café 中文 😀</b>', 'text/html': '<b>café 中文 😀</b>', 'application/x-parity': 'opaque', Files: ''};
    return {reads: 0, clipboardData: {
      types: {0: 'text/plain', 1: 'text/html', 2: 'application/x-parity', 3: 'Files', length: 4},
      items: {0: {kind: 'string', type: 'text/plain'}, 1: {kind: 'file', type: 'image/png'}, length: 2},
      files: {0: {name: 'attachment.png', size: 12, type: 'image/png'}, length: 1},
      getData(type) { this.owner.reads++; return values[type]; }
    }};
  }"]
let attach_clipboard_owner : Js.Json.t -> unit = [%mel.raw "e => {e.clipboardData.owner=e}"]
let clipboard_reads : Js.Json.t -> int = [%mel.raw "e => e.reads"]

let run () =
  let raw=clipboard_event () in
  attach_clipboard_owner raw;
  let clip=Ui_dom_web.ev_of raw in
  check "Clipboard inspection does not read payloads during event construction" (clipboard_reads raw=0);
  let snapshot=clip.Ui_services.clipboard_snapshot () in
  check "Clipboard inspection preserves actual array-like MIME entries and Unicode"
    (snapshot.Ui_services.clipboard_formats=
      ["text/plain",{js|<b>café 中文 😀</b>|js};"text/html",{js|<b>café 中文 😀</b>|js};
       "application/x-parity","opaque";"Files",""]);
  check "Clipboard inspection reads each admitted format exactly once" (clipboard_reads raw=4);
  check "Clipboard inspection preserves item kinds and MIME types"
    (snapshot.clipboard_items=["string","text/plain";"file","image/png"]);
  check "Clipboard inspection retains file metadata without reading contents"
    (snapshot.clipboard_files=["attachment.png","image/png",12.]);
  check "Non-clipboard events expose an empty inspection"
    ((Ui_dom_web.ev_of (Js.Json.object_ (Js.Dict.empty ()))).Ui_services.clipboard_snapshot ()=
     Ui_services.empty_clipboard_snapshot);
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
