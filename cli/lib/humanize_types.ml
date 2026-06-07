let format_count = Humanize.intcomma
let pluralize_noun = Humanize.pluralize_noun

let format_count_with_noun count noun =
  format_count count ^ " " ^ pluralize_noun count noun

let format_filesize = function
  | None -> "-"
  | Some bytes -> Humanize.filesize bytes

let datetime = Humanize.datetime

let relative_datetime ~then_time ~now_time =
  let now = Time.time_to_epoch_seconds now_time in
  let then_time = Time.time_to_epoch_seconds then_time in
  Humanize.relative_datetime ~now ~number_format:string_of_int ~max_terms:1
    then_time
