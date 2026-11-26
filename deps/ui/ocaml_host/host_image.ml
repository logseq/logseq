external decode_platform : bytes -> int * int * bytes = "logseq_native_decode_platform"

let platform_decode encoded =
  try
    let width,height,pixels=decode_platform encoded in
    Ok (Lui_scene.new_image ~w:width ~h:height pixels)
  with Failure message -> Error message

let decode encoded =
  match Lui_image.sniff encoded with
  | Some Lui_image.Jpeg -> platform_decode encoded
  | Some _ -> Result.map Lui_image.to_scene_image (Lui_image.decode encoded)
  | None when Host_platform.is_macos -> platform_decode encoded
  | None -> Result.map Lui_image.to_scene_image (Lui_image.decode encoded)
