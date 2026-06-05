let format_count = Humanize.intcomma
let pluralize_noun = Humanize.pluralize_noun
let format_count_with_noun n noun = format_count n ^ " " ^ pluralize_noun n noun
let format_filesize = function None -> "-" | Some n -> Humanize.filesize n

let relative_datetime ~then_time ~now_time =
  Humanize.relative_datetime
    ~now:(Ptime_util.time_to_epoch_seconds now_time)
    ~number_format:string_of_int ~max_terms:1
    (Ptime_util.time_to_epoch_seconds then_time)
