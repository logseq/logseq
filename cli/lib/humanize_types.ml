let format_count = Humanize.intcomma
let pluralize_noun = Humanize.pluralize_noun
let format_count_with_noun n noun = format_count n ^ " " ^ pluralize_noun n noun
let format_filesize = function None -> "-" | Some n -> Humanize.filesize n

let relative_datetime ~then_ms ~now_ms =
  Humanize.relative_datetime ~now:(Int64.div now_ms 1_000L)
    ~number_format:string_of_int ~max_terms:1 (Int64.div then_ms 1_000L)
