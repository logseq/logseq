module Common_path = Melange_common.Path
(** Path JavaScript-boundary conversions. *)

let optional_segments segments = Array.map Js.Nullable.toOption segments

module Path = struct
  let filename value = Common_path.filename value |> Js.Nullable.fromOption
  let fileExt = Common_path.file_ext

  let pathJoin base segments =
    Common_path.path_join
      (Js.Nullable.toOption base)
      (optional_segments segments)

  let prependProtocol = Common_path.prepend_protocol
  let pathNormalize = Common_path.path_normalize
  let urlToPath = Common_path.url_to_path
  let fileUrlOrPathToPath = Common_path.file_url_or_path_to_path

  let trimDirPrefix base path =
    Common_path.trim_dir_prefix base path |> Js.Nullable.fromOption

  let parent value = Common_path.parent value |> Js.Nullable.fromOption
  let basename = Common_path.basename
  let isAbsolute = Common_path.is_absolute
  let isProtocolUrl = Common_path.is_protocol_url
end
