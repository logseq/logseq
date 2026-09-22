(* Melange implementation of spec/platform/emoji_data.mli via the
   "@emoji-mart/data" npm package. *)

type skin = < native : string > Js.t

type emoji = < skins : skin array > Js.t

external emojis : emoji Js.Dict.t = "emojis" [@@mel.module "@emoji-mart/data"]

let all_emoji_icons () : (string * int option) list =
  Js.Dict.values emojis
  |> Array.to_list
  |> List.concat_map (fun emoji ->
         emoji##skins
         |> Array.to_list
         |> List.mapi (fun skin_index skin ->
                let native = skin##native in
                ( native
                , if skin_index > 0 then Some (skin_index + 1) else None )))
