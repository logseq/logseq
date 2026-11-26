external decode_jpeg : bytes -> int * int * bytes = "logseq_native_decode_jpeg"

let decode encoded =
  match Lui_image.sniff encoded with
  | Some Lui_image.Jpeg ->
      (try
         let width,height,pixels=decode_jpeg encoded in
         Ok (Lui_scene.new_image ~w:width ~h:height pixels)
       with Failure message -> Error message)
  | _ -> Result.map Lui_image.to_scene_image (Lui_image.decode encoded)
