external decode_platform : bytes -> int * int * bytes = "logseq_native_decode_platform"

let platform_decode encoded =
  try
    let width,height,pixels=decode_platform encoded in
    Ok (Lui_scene.new_image ~w:width ~h:height pixels)
  with Failure message -> Error message

let sniff_webp encoded =
  Bytes.length encoded >= 12
  && Bytes.sub_string encoded 0 4 = "RIFF"
  && Bytes.sub_string encoded 8 4 = "WEBP"

let sniff_heif encoded =
  Bytes.length encoded >= 12
  && Bytes.sub_string encoded 4 4 = "ftyp"
  && (match Bytes.sub_string encoded 8 4 with
      | "avif" | "heic" | "heix" | "mif1" -> true
      | _ -> false)

let decode encoded =
  match Lui_image.sniff encoded with
  | Some Lui_image.Jpeg -> platform_decode encoded
  | Some _ -> Result.map Lui_image.to_scene_image (Lui_image.decode encoded)
  | None when Host_platform.is_macos || sniff_webp encoded || sniff_heif encoded -> platform_decode encoded
  | None -> Result.map Lui_image.to_scene_image (Lui_image.decode encoded)
