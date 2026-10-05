(* logseq-em-emoji — apple twin: emits the generic logseq-em-emoji
   element so the Swift-side wire shape stays identical (attrs JSON
   carrying id + data-emoji); no dedicated schema is registered. *)
let identifier = "logseq-em-emoji"

let el ?key ~name () : Lui_elements.t =
  let ch =
    match (try Emoji_mart.emoji_char name with _ -> None) with
    | Some c -> c
    | None -> ""
  in
  Logseq_dom.dom ?key ~tag:"em-emoji"
    ~attrs:[ ("id", name); ("data-emoji", ch) ]
    []
