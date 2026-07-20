module Authorization : sig
  val verifyJwtDefault :
    string -> string -> string -> string -> Js.Json.t Js.Nullable.t Js.Promise.t
end

module BlockRef : sig
  val blockRefRe : Js.Re.t
  val getBlockRefId : string -> string option
  val getStringBlockRefId : string -> string
  val isBlockRef : string -> bool
  val isStringBlockRef : string -> bool
  val leftAndRightParens : string
  val leftParens : string
  val rightParens : string
  val toBlockRef : string -> string
end

module CognitoConfig : sig
  val cliCognitoClientId : string
  val cognitoClientId : string
  val oauthDomain : string
  val oauthScope : string
end

module Config : sig
  val appName : string
  val blockPattern : string
  val canonicalizeDbVersionRepo : string Js.Nullable.t -> string Js.Nullable.t
  val dbVersionPrefix : string
  val favoritesPageName : string
  val fileOnlyConfigDescription : string -> string option
  val fileOnlyConfigKeys : unit -> string array
  val fileVersionPrefix : string
  val imageFormatKeys : unit -> string array
  val isHidden : string Js.Nullable.t -> string array -> bool
  val isImageFormat : string -> bool
  val isLocalProtocolAsset : string Js.Nullable.t -> bool
  val isLocalRelativeAsset : string Js.Nullable.t -> bool
  val isProtocolPath : string Js.Nullable.t -> bool
  val isTextFormat : string -> bool
  val libraryPageName : string
  val localAssetsDir : string
  val quickAddPageName : string
  val recyclePageName : string
  val removeAssetProtocol : string Js.Nullable.t -> string Js.Nullable.t
  val stripLeadingDbVersionPrefix : string Js.Nullable.t -> string Js.Nullable.t
  val unlinkedGraphsDir : string
  val unusedInDbGraphsDeprecation : string
  val viewsPageName : string
end

module DateTime : sig
  val defaultJournalTitleFormatter : string

  val formatDateTime :
    int ->
    int ->
    int ->
    int ->
    int ->
    int ->
    string Js.Nullable.t ->
    string Js.Nullable.t

  val formatJournalDay :
    int Js.Nullable.t -> string Js.Nullable.t -> string Js.Nullable.t

  val isJournalTitle : string Js.Nullable.t -> string Js.Nullable.t -> bool
  val isJournalTitleWithSlash : string Js.Nullable.t -> bool
  val journalDayOfMs : float Js.Nullable.t -> int Js.Nullable.t
  val journalDayToUtcMs : int Js.Nullable.t -> float Js.Nullable.t

  val journalTitleFormatters :
    string Js.Nullable.t -> string Js.Nullable.t array

  val localDateMsOfJournalDay : int -> float
  val nowMs : unit -> float

  val parseJournalTitleDay :
    string Js.Nullable.t -> string Js.Nullable.t array -> int Js.Nullable.t

  val safeJournalTitleFormatters : string Js.Nullable.t -> string array
end

module Graph : sig
  val isIgnoredPath : string -> string -> bool
end

module GraphDir : sig
  val decodeGraphDirName : string Js.Nullable.t -> string Js.Nullable.t
  val decodeLegacyGraphDirName : string Js.Nullable.t -> string Js.Nullable.t
  val encodeGraphDirName : string Js.Nullable.t -> string
  val graphDirKeyToEncodedDirName : string Js.Nullable.t -> string Js.Nullable.t
  val repoIdentity : string Js.Nullable.t -> string Js.Nullable.t
  val repoToEncodedGraphDirName : string Js.Nullable.t -> string Js.Nullable.t
  val repoToGraphDirKey : string Js.Nullable.t -> string Js.Nullable.t
  val sameRepo : string Js.Nullable.t -> string Js.Nullable.t -> bool
end

module GraphRegistry : sig
  type encoded_value_result

  val normalizeValueWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    encoded_value_result

  val resolveTargetValueWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val upsertValueWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    encoded_value_result
end

module Macro : sig
  val expandValueIfMacro : string -> (string -> string Js.Nullable.t) -> string
  val isMacro : string -> bool
end

module Namespace : sig
  val getLastPart : string -> string option
  val namespacePage : string -> bool
end

module PageRef : sig
  val getFileBasename : string -> string option
  val getPageName : string -> string option
  val getPageNameOrSelf : string -> string
  val isPageRef : string -> bool
  val leftAndRightBrackets : string
  val leftBrackets : string
  val markdownPageRefRe : Js.Re.t
  val pageRefAnyRe : Js.Re.t
  val pageRefRe : Js.Re.t
  val pageRefWithoutNestedRe : Js.Re.t
  val rightBrackets : string
  val toPageRef : string -> string
end

module Path : sig
  val basename : string -> string
  val fileExt : string -> string
  val fileUrlOrPathToPath : string -> string
  val filename : string -> string Js.Nullable.t
  val isAbsolute : string -> bool
  val isProtocolUrl : string -> bool
  val parent : string -> string Js.Nullable.t
  val pathJoin : string Js.Nullable.t -> string Js.Nullable.t array -> string
  val pathNormalize : string -> string
  val prependProtocol : string -> string -> string
  val trimDirPrefix : string -> string -> string Js.Nullable.t
  val urlToPath : string -> string
end

module StringUtil : sig
  type trace_callback = (unit -> unit[@u])

  val capitalizeAll : string Js.Nullable.t -> string
  val clearMarkdownHeading : string -> string
  val escapeRegexChars : string -> string
  val fileExtension : string Js.Nullable.t -> string Js.Nullable.t
  val fileFormatName : string Js.Nullable.t -> string Js.Nullable.t
  val isUrl : string Js.Nullable.t -> bool
  val isValidEdnKeyword : string Js.Nullable.t -> bool
  val isValidTag : string -> bool
  val isWrappedByParens : string -> bool
  val isWrappedByQuotes : string -> bool
  val joinPathSegments : string array -> string
  val normalizeFormatName : string Js.Nullable.t -> string Js.Nullable.t
  val normalizeNfc : string -> string
  val pageNameSanityLower : string -> string
  val removeBoundarySlashes : string Js.Nullable.t -> string Js.Nullable.t
  val replaceIgnoreCase : string -> string -> string -> string
  val safeDecodeUriComponent : string -> (string -> unit) -> string

  val safeReFindValueWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Js.Re.t ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    trace_callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val safeSubstring : string -> int -> string
  val safeSubstringRange : string -> int -> int -> string
  val splitFirst : string -> string -> (string * string) Js.Nullable.t
  val splitLast : string -> string -> (string * string) Js.Nullable.t
  val splitNamespacePages : string -> string array
  val urlEncodedPattern : Js.Re.t
  val zeroPad : int -> string
end

module Util : sig
  type now_callback = (unit -> float[@u])

  type compare_callback =
    (Melange_cljs_runtime_spec.Value_codec.cljs_value ->
     Melange_cljs_runtime_spec.Value_codec.cljs_value ->
     int
    [@u])

  type read_callback =
    (Melange_cljs_runtime_spec.Value_codec.cljs_value ->
     string ->
     Melange_cljs_runtime_spec.Value_codec.cljs_value
    [@u])

  type read_error_callback = (Js.Exn.t -> unit[@u])

  type encoded_sort_criterion = {
    getValue : Melange_cljs_runtime_spec.Value_codec.callback;
    ascending : bool;
  }

  val blockWithTimestampsWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    now_callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val compareByWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    compare_callback ->
    encoded_sort_criterion array ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    int

  val concatPresentValues : 'a Js.Nullable.t array array -> 'a array

  val distinctByLastWinsWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val distinctLazyWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val fastRemoveNilsWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val pageTitle :
    string Js.Nullable.t -> string Js.Nullable.t -> string Js.Nullable.t

  val removeNilEntries : ('a * 'b Js.Nullable.t) array -> ('a * 'b) array

  val safeReadMapStringWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    read_callback ->
    read_error_callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    string ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val safeReadStringWith :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    read_callback ->
    read_error_callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    string ->
    bool ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value
end

module Uuid : sig
  val builtinBlock : string Js.Nullable.t -> string
  val dbIdentBlock : string Js.Nullable.t -> string Js.Nullable.t -> string
  val generate : ((unit -> 'uuid)[@u]) -> 'uuid
  val isString : string Js.Nullable.t -> bool
  val journalPage : int -> string
  val journalTemplate : string -> string -> string
  val viewBlock : string Js.Nullable.t -> string
end

module Version : sig
  val formatVersion : string -> string -> string
end
