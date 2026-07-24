module Common_namespace = Melange_common.Namespace
(** Shared Common JavaScript-boundary representations. *)

module Runtime_codec = Melange_cljs_runtime_spec.Value_codec
module Common_runtime = Melange_common_runtime.Common_runtime

module Namespace = struct
  let namespacePage = Common_namespace.namespace_page
  let getLastPart = Common_namespace.get_last_part
end

module Common_page_ref = Melange_common.Page_ref

module PageRef = struct
  let leftBrackets = Common_page_ref.left_brackets
  let rightBrackets = Common_page_ref.right_brackets
  let leftAndRightBrackets = Common_page_ref.left_and_right_brackets
  let pageRefRe = Js.Re.fromString Common_page_ref.page_ref_pattern

  let pageRefWithoutNestedRe =
    Js.Re.fromString Common_page_ref.page_ref_without_nested_pattern

  let pageRefAnyRe = Js.Re.fromString Common_page_ref.page_ref_any_pattern

  let markdownPageRefRe =
    Js.Re.fromString Common_page_ref.markdown_page_ref_pattern

  let getFileBasename = Common_page_ref.get_file_basename
  let isPageRef = Common_page_ref.is_page_ref
  let toPageRef = Common_page_ref.to_page_ref
  let getPageName = Common_page_ref.get_page_name
  let getPageNameOrSelf = Common_page_ref.get_page_name_or_self
end

module Common_block_ref = Melange_common.Block_ref

module BlockRef = struct
  let leftParens = Common_block_ref.left_parens
  let rightParens = Common_block_ref.right_parens
  let leftAndRightParens = Common_block_ref.left_and_right_parens
  let blockRefRe = Js.Re.fromString Common_block_ref.block_ref_pattern
  let getBlockRefId = Common_block_ref.get_block_ref_id
  let getStringBlockRefId = Common_block_ref.get_string_block_ref_id
  let isBlockRef = Common_block_ref.is_block_ref
  let isStringBlockRef = Common_block_ref.is_string_block_ref
  let toBlockRef = Common_block_ref.to_block_ref
end

module Common_macro = Melange_common.Macro

module Macro = struct
  let isMacro = Common_macro.is_macro

  let expandValueIfMacro value lookup =
    Common_macro.expand_value_if_macro value (fun name ->
        lookup name |> Js.Nullable.toOption)
end

module Common_config = Melange_common.Config

module Config = struct
  let appName = Common_config.app_name
  let dbVersionPrefix = Common_config.db_version_prefix
  let fileVersionPrefix = Common_config.file_version_prefix
  let localAssetsDir = Common_config.local_assets_dir
  let unlinkedGraphsDir = Common_config.unlinked_graphs_dir
  let favoritesPageName = Common_config.favorites_page_name
  let viewsPageName = Common_config.views_page_name
  let libraryPageName = Common_config.library_page_name
  let quickAddPageName = Common_config.quick_add_page_name
  let recyclePageName = Common_config.recycle_page_name
  let blockPattern = Common_config.block_pattern

  let unusedInDbGraphsDeprecation =
    Common_config.unused_in_db_graphs_deprecation

  let stripLeadingDbVersionPrefix value =
    value |> Js.Nullable.toOption
    |> Option.map Common_config.strip_leading_db_version_prefix
    |> Js.Nullable.fromOption

  let canonicalizeDbVersionRepo value =
    value |> Js.Nullable.toOption |> fun value ->
    Option.bind value Common_config.canonicalize_db_version_repo
    |> Js.Nullable.fromOption

  let isLocalRelativeAsset value =
    value |> Js.Nullable.toOption
    |> Option.fold ~none:false ~some:Common_config.is_local_relative_asset

  let isLocalProtocolAsset value =
    value |> Js.Nullable.toOption
    |> Option.fold ~none:false ~some:Common_config.is_local_protocol_asset

  let isProtocolPath value =
    value |> Js.Nullable.toOption
    |> Option.fold ~none:false ~some:Common_config.is_protocol_path

  let removeAssetProtocol value =
    value |> Js.Nullable.toOption
    |> Option.map Common_config.remove_asset_protocol
    |> Js.Nullable.fromOption

  let isTextFormat = Common_config.is_text_format
  let isImageFormat = Common_config.is_image_format
  let imageFormatKeys = Common_config.image_format_keys

  let isHidden path patterns =
    path |> Js.Nullable.toOption
    |> Option.fold ~none:false ~some:(fun path ->
        Common_config.is_hidden path patterns)

  let fileOnlyConfigKeys = Common_config.file_only_config_keys
  let fileOnlyConfigDescription = Common_config.file_only_config_description
end

module Common_cognito_config = Melange_common.Cognito_config

module CognitoConfig = struct
  let cognitoClientId = Common_cognito_config.cognito_client_id
  let cliCognitoClientId = Common_cognito_config.cli_cognito_client_id
  let oauthDomain = Common_cognito_config.oauth_domain
  let oauthScope = Common_cognito_config.oauth_scope
end

module Common_string_util = Melange_common.String_util

module StringUtil = struct
  let splitFirst pattern value =
    Common_string_util.split_first pattern value |> Js.Nullable.fromOption

  let splitLast pattern value =
    Common_string_util.split_last pattern value |> Js.Nullable.fromOption

  let isValidTag = Common_string_util.is_valid_tag
  let safeSubstring value start = Common_string_util.safe_substring value ~start

  let safeSubstringRange value start end_ =
    Common_string_util.safe_substring_range value ~start ~end_

  let isWrappedByQuotes = Common_string_util.is_wrapped_by_quotes
  let isWrappedByParens = Common_string_util.is_wrapped_by_parens
  let zeroPad = Common_string_util.zero_pad
  let clearMarkdownHeading = Common_string_util.clear_markdown_heading
  let normalizeNfc = Common_string_util.normalize_nfc

  let removeBoundarySlashes value =
    value |> Js.Nullable.toOption
    |> Option.map Common_string_util.remove_boundary_slashes
    |> Js.Nullable.fromOption

  let splitNamespacePages value =
    value |> Common_string_util.split_namespace_pages |> Rrbvec.to_array

  let pageNameSanityLower = Common_string_util.page_name_sanity_lower

  let capitalizeAll value =
    value |> Js.Nullable.toOption |> Option.value ~default:""
    |> Common_string_util.capitalize_all

  let safeDecodeUriComponent value on_failure =
    match Common_string_util.decode_uri_component value with
    | Ok decoded -> decoded
    | Error original ->
        on_failure original;
        original

  let isUrl value =
    value |> Js.Nullable.toOption
    |> Option.fold ~none:false ~some:Common_string_util.is_url

  let urlEncodedPattern =
    Js.Re.fromStringWithFlags Common_string_util.url_encoded_pattern_text
      ~flags:"i"

  let normalizeFormatName value =
    value |> Js.Nullable.toOption
    |> Option.map Common_string_util.normalize_format_name
    |> Js.Nullable.fromOption

  let fileFormatName value =
    Option.bind (Js.Nullable.toOption value) Common_string_util.file_format_name
    |> Js.Nullable.fromOption

  let fileExtension value =
    Option.bind (Js.Nullable.toOption value) Common_string_util.file_extension
    |> Js.Nullable.fromOption

  let joinPathSegments segments =
    segments |> Rrbvec.of_array |> Common_string_util.join_path_segments

  let escapeRegexChars = Common_string_util.escape_regex_chars
  let replaceIgnoreCase = Common_string_util.replace_ignore_case

  let isValidEdnKeyword value =
    value |> Js.Nullable.toOption
    |> Option.fold ~none:false ~some:Common_string_util.is_valid_edn_keyword

  type trace_callback = Common_runtime.Regexp_runtime.trace_callback

  let safeReFindValueWith = Common_runtime.Regexp_runtime.safe_find_value
end

module Common_util = Melange_common.Util

module Util = struct
  type now_callback = (unit -> float[@u])

  type compare_callback =
    (Runtime_codec.cljs_value -> Runtime_codec.cljs_value -> int[@u])

  type read_callback =
    (Runtime_codec.cljs_value -> string -> Runtime_codec.cljs_value[@u])

  type read_error_callback = (Js.Exn.t -> unit[@u])

  type encoded_sort_criterion = {
    getValue : Runtime_codec.callback;
    ascending : bool;
  }

  let pageTitle title name =
    Common_util.page_title
      ~title:(Js.Nullable.toOption title)
      ~name:(Js.Nullable.toOption name)
    |> Js.Nullable.fromOption

  let removeNilEntries entries =
    entries
    |> Array.map (fun (key, value) -> (key, Js.Nullable.toOption value))
    |> Rrbvec.of_array |> Common_util.remove_nil_entries |> Rrbvec.to_array

  let concatPresentValues collections =
    collections
    |> Array.map (fun values ->
        values |> Array.map Js.Nullable.toOption |> Rrbvec.of_array)
    |> Rrbvec.of_array |> Common_util.concat_present_values |> Rrbvec.to_array

  let distinctLazyWith = Common_runtime.Util_runtime.distinct_lazy
  let fastRemoveNilsWith = Common_runtime.Util_runtime.fast_remove_nils
  let distinctByLastWinsWith = Common_runtime.Util_runtime.distinct_by_last_wins

  let blockWithTimestampsWith =
    Common_runtime.Util_runtime.block_with_timestamps

  let compareByWith runtime compare sorting left right =
    sorting
    |> Array.map (fun (criterion : encoded_sort_criterion) ->
        ({
           Common_runtime.Util_runtime.get_value = criterion.getValue;
           ascending = criterion.ascending;
         }
          : Common_runtime.Util_runtime.sort_criterion))
    |> fun criteria ->
    Common_runtime.Util_runtime.compare_by runtime compare criteria left right

  let safeReadStringWith = Common_runtime.Util_runtime.safe_read_string
  let safeReadMapStringWith = Common_runtime.Util_runtime.safe_read_map_string
end

module Common_uuid = Melange_common.Uuid

let required_string label value =
  match Js.Nullable.toOption value with
  | Some value -> value
  | None -> invalid_arg (label ^ " is required")

module Uuid = struct
  let isString value =
    value |> Js.Nullable.toOption
    |> Option.fold ~none:false ~some:Common_uuid.is_string

  let generate (squuid : (unit -> 'uuid[@u])) = squuid () [@u]
  let journalPage = Common_uuid.journal_page

  let journalTemplate journal_uuid template_block_uuid =
    Common_uuid.journal_template ~journal_uuid ~template_block_uuid

  let dbIdentBlock namespace_ name =
    Common_uuid.db_ident_block
      ~namespace_:(Js.Nullable.toOption namespace_)
      ~name:(required_string "keyword name" name)

  let builtinBlock value =
    Common_uuid.builtin_block (required_string "builtin block value" value)

  let viewBlock value =
    Common_uuid.view_block (required_string "view block value" value)
end

module Common_date_time = Melange_common.Date_time

let optional_formatters formatters =
  formatters |> Array.map Js.Nullable.toOption |> Rrbvec.of_array

module DateTime = struct
  let nowMs = Common_date_time.now_ms

  let journalDayOfMs milliseconds =
    milliseconds |> Js.Nullable.toOption
    |> Option.map Common_date_time.journal_day_of_ms
    |> Js.Nullable.fromOption

  let localDateMsOfJournalDay = Common_date_time.local_date_ms_of_journal_day

  let journalDayToUtcMs journal_day =
    journal_day |> Js.Nullable.toOption
    |> Option.map Common_date_time.journal_day_to_utc_ms
    |> Js.Nullable.fromOption

  let defaultJournalTitleFormatter =
    Common_date_time.default_journal_title_formatter

  let journalTitleFormatters custom_formatter =
    custom_formatter |> Js.Nullable.toOption
    |> Common_date_time.journal_title_formatters |> Rrbvec.to_array
    |> Array.map Js.Nullable.fromOption

  let safeJournalTitleFormatters custom_formatter =
    custom_formatter |> Js.Nullable.toOption
    |> Common_date_time.safe_journal_title_formatters |> Rrbvec.to_array

  let parseJournalTitleDay title formatters =
    let title = Js.Nullable.toOption title in
    Option.bind title (fun title ->
        Common_date_time.parse_journal_title_day ~title
          ~formatters:(optional_formatters formatters))
    |> Js.Nullable.fromOption

  let isJournalTitle title custom_formatter =
    let title =
      title |> Js.Nullable.toOption
      |> Option.map Common_string_util.capitalize_all
    in
    Option.bind title (fun title ->
        Common_date_time.parse_journal_title_day ~title
          ~formatters:
            (Common_date_time.journal_title_formatters
               (Js.Nullable.toOption custom_formatter)))
    |> Option.is_some

  let isJournalTitleWithSlash title =
    let title =
      title |> Js.Nullable.toOption
      |> Option.map Common_string_util.capitalize_all
    in
    Option.bind title (fun title ->
        Common_date_time.parse_journal_title_day ~title
          ~formatters:
            (Rrbvec.map Option.some
               Common_date_time.slash_journal_title_formatters))
    |> Option.is_some

  let formatJournalDay journal_day formatter =
    match
      (Js.Nullable.toOption journal_day, Js.Nullable.toOption formatter)
    with
    | Some journal_day, Some formatter ->
        Common_date_time.format_journal_day ~journal_day ~formatter
        |> Js.Nullable.return
    | Some _, None | None, _ -> Js.Nullable.undefined

  let formatDateTime year month day hour minute second formatter =
    formatter |> Js.Nullable.toOption
    |> Option.map (fun formatter ->
        Common_date_time.format_date_time ~year ~month ~day ~hour ~minute
          ~second ~formatter)
    |> Js.Nullable.fromOption
end

module Common_graph_dir = Melange_common.Graph_dir

module GraphDir = struct
  let encodeGraphDirName graph_name =
    graph_name |> Js.Nullable.toOption |> Common_graph_dir.encode_graph_dir_name

  let decodeGraphDirName dir_name =
    dir_name |> Js.Nullable.toOption |> Common_graph_dir.decode_graph_dir_name
    |> Js.Nullable.fromOption

  let decodeLegacyGraphDirName dir_name =
    dir_name |> Js.Nullable.toOption
    |> Common_graph_dir.decode_legacy_graph_dir_name |> Js.Nullable.fromOption

  let repoToGraphDirKey repo =
    repo |> Js.Nullable.toOption |> Common_graph_dir.repo_to_graph_dir_key
    |> Js.Nullable.fromOption

  let repoIdentity repo =
    repo |> Js.Nullable.toOption |> Common_graph_dir.repo_identity
    |> Js.Nullable.fromOption

  let sameRepo left right =
    Common_graph_dir.same_repo
      (Js.Nullable.toOption left)
      (Js.Nullable.toOption right)

  let graphDirKeyToEncodedDirName graph_dir_key =
    graph_dir_key |> Js.Nullable.toOption
    |> Common_graph_dir.graph_dir_key_to_encoded_dir_name
    |> Js.Nullable.fromOption

  let repoToEncodedGraphDirName repo =
    repo |> Js.Nullable.toOption
    |> Common_graph_dir.repo_to_encoded_graph_dir_name |> Js.Nullable.fromOption
end

module Common_graph = Melange_common.Graph

module Graph = struct
  let isIgnoredPath dir path = Common_graph.is_ignored_path ~dir ~path
end

module Common_version = Melange_common.Version

module Version = struct
  let formatVersion build_time revision =
    Common_version.format_version ~build_time ~revision
end
