(* logseq.common.plural — pluralize.js core: rules + API. *)

(* Rule storage (mirrors the JS atoms; append order matters —
   sanitization iterates from the END of the vector). *)
let plural_rules : (Regexp.t * string) list ref = ref []
let singular_rules : (Regexp.t * string) list ref = ref []
let uncountables : (string, bool) Hashtbl.t = Hashtbl.create 127
let irregular_plurals : (string, string) Hashtbl.t = Hashtbl.create 63
let irregular_singles : (string, string) Hashtbl.t = Hashtbl.create 63

let lower = Unicode.lowercase
let upper = Unicode.uppercase

let is_upper s = s = upper s
let is_lower s = s = lower s

(* restore-case: replicate casing of `word` onto `token`. *)
let restore_case (word : string) (token : string) : string =
  if word = token then token
  else if is_lower word then lower token
  else if is_upper word && String.length word > 1 then upper token
  else if
    String.length word > 0
    && is_upper (String.sub word 0 1)
  then
    upper (String.sub token 0 1) ^ lower (String.sub token 1 (String.length token - 1))
  else lower token

(* interpolate: replace $1..$12 in `s` using JS replace args
   (index 0 = match, index i = group i). *)
let interpolate (s : string) ~(js_args : string option array) : string =
  let re = Regexp.compile "\\$(\\d{1,2})" in
  Regexp.replace re
    ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
      match groups with
      | [| _; Some idx |] ->
          (match int_of_string_opt idx with
           | Some i when i < Array.length js_args ->
               Option.value js_args.(i) ~default:""
           | _ -> "")
      | _ -> "")
    s

(* replace-with-rule: apply [re,repl] to word with casing
   restoration (matches JS .replace behavior — first match only). *)
let replace_with_rule (word : string) ((re, repl) : Regexp.t * string) : string =
  Regexp.replace re
    ~f:(fun ~match_ ~groups ~offset ~input:_ ->
      (* js-args: [match g1 g2 ... offset input] — groups here are
         [match; captures...]; interpolate indexes captures at 1. *)
      let js_args = groups in
      let result = interpolate repl ~js_args in
      if match_ = "" then
        (* match empty => restore based on char before match *)
        let c = String.sub word (offset - 1) 1 in
        restore_case c result
      else
        restore_case match_ result)
    word

(* sanitize-word: empty or uncountable token returns word; else apply
   the LAST matching rule (JS iterates rules end-to-start). *)
let sanitize_word (token : string) (word : string)
    (rules : (Regexp.t * string) list) : string =
  if token = "" || Hashtbl.mem uncountables token then word
  else begin
    match
      List.find_opt (fun (re, _) -> Regexp.test re word) (List.rev rules)
    with
    | Some rule -> replace_with_rule word rule
    | None -> word
  end

let replace_word ~(replace_map : (string, string) Hashtbl.t)
    ~(keep_map : (string, string) Hashtbl.t)
    ~(rules : (Regexp.t * string) list) (word : string) : string =
  let token = lower word in
  if Hashtbl.mem keep_map token then restore_case word token
  else
    match Hashtbl.find_opt replace_map token with
    | Some rep -> restore_case word rep
    | None -> sanitize_word token word rules

let check_word ~(replace_map : (string, string) Hashtbl.t)
    ~(keep_map : (string, string) Hashtbl.t)
    ~(rules : (Regexp.t * string) list) (word : string) : bool =
  let token = lower word in
  if Hashtbl.mem keep_map token then true
  else if Hashtbl.mem replace_map token then false
  else sanitize_word token token rules = token

let plural (word : string) : string =
  replace_word ~replace_map:irregular_singles ~keep_map:irregular_plurals
    ~rules:!plural_rules word

let singular (word : string) : string =
  replace_word ~replace_map:irregular_plurals ~keep_map:irregular_singles
    ~rules:!singular_rules word

let is_plural (word : string) : bool =
  check_word ~replace_map:irregular_singles ~keep_map:irregular_plurals
    ~rules:!plural_rules word

let is_singular (word : string) : bool =
  check_word ~replace_map:irregular_plurals ~keep_map:irregular_singles
    ~rules:!singular_rules word

let pluralize ?(inclusive = false) (word : string) (item_count : int) : string =
  let pluralized = if item_count = 1 then singular word else plural word in
  (if inclusive then string_of_int item_count ^ " " else "") ^ pluralized

(* Rule registration — string rules compile to case-insensitive
   whole-string regexes; regexp rules keep JS syntax. *)
let add_plural_rule ~(pattern : string) ~(replacement : string) : unit =
  plural_rules := !plural_rules @ [ (Regexp.compile pattern, replacement) ]

let add_singular_rule ~(pattern : string) ~(replacement : string) : unit =
  singular_rules := !singular_rules @ [ (Regexp.compile pattern, replacement) ]

let add_uncountable_word (word : string) : unit =
  Hashtbl.replace uncountables (lower word) true

let add_uncountable_pattern (pattern : string) : unit =
  add_plural_rule ~pattern ~replacement:"$0";
  add_singular_rule ~pattern ~replacement:"$0"

let add_irregular_rule ~(single : string) ~(plural_word : string) : unit =
  Hashtbl.replace irregular_singles (lower single) (lower plural_word);
  Hashtbl.replace irregular_plurals (lower plural_word) (lower single)

(* ---- data initialization (same tables as the cljs/JS source) ---- *)

let irregulars =
  [ "I", "we"; "me", "us"; "he", "they"; "she", "they"; "them", "them";
    "myself", "ourselves"; "yourself", "yourselves"; "itself", "themselves";
    "herself", "themselves"; "himself", "themselves"; "themself", "themselves";
    "is", "are"; "was", "were"; "has", "have"; "this", "these"; "that", "those";
    "my", "our"; "its", "their"; "his", "their"; "her", "their";
    "echo", "echoes"; "dingo", "dingoes"; "volcano", "volcanoes";
    "tornado", "tornadoes"; "torpedo", "torpedoes";
    "genus", "genera"; "viscus", "viscera";
    "stigma", "stigmata"; "stoma", "stomata"; "dogma", "dogmata";
    "lemma", "lemmata"; "schema", "schemata"; "anathema", "anathemata";
    "ox", "oxen"; "axe", "axes"; "die", "dice"; "yes", "yeses";
    "foot", "feet"; "eave", "eaves"; "goose", "geese"; "tooth", "teeth";
    "quiz", "quizzes"; "human", "humans"; "proof", "proofs";
    "carve", "carves"; "valve", "valves"; "looey", "looies";
    "thief", "thieves"; "groove", "grooves"; "pickaxe", "pickaxes";
    "passerby", "passersby"; "canvas", "canvases" ]

let plural_rule_data =
  [ "s?$", "s";
    "[^\\u0000-\\u007F]$", "$0";
    "([^aeiou]ese)$", "$1";
    "(ax|test)is$", "$1es";
    "(alias|[^aou]us|t[lm]as|gas|ris)$", "$1es";
    "(e[mn]u)s?$", "$1s";
    "([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$", "$1";
    "(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$", "$1i";
    "(alumn|alg|vertebr)(?:a|ae)$", "$1ae";
    "(seraph|cherub)(?:im)?$", "$1im";
    "(her|at|gr)o$", "$1oes";
    "(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$", "$1a";
    "(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$", "$1a";
    "sis$", "ses";
    "(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$", "$1$2ves";
    "([^aeiouy]|qu)y$", "$1ies";
    "([^ch][ieo][ln])ey$", "$1ies";
    "(x|ch|ss|sh|zz)$", "$1es";
    "(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$", "$1ices";
    "\\b((?:tit)?m|l)(?:ice|ouse)$", "$1ice";
    "(pe)(?:rson|ople)$", "$1ople";
    "(child)(?:ren)?$", "$1ren";
    "eaux$", "$0";
    "m[ae]n$", "men";
    "thou", "you" ]

let singular_rule_data =
  [ "s$", "";
    "(ss)$", "$1";
    "(wi|kni|(?:after|half|high|low|mid|non|night|[^\\w]|^)li)ves$", "$1fe";
    "(ar|(?:wo|[ae])l|[eo][ao])ves$", "$1f";
    "ies$", "y";
    "(dg|ss|ois|lk|ok|wn|mb|th|ch|ec|oal|is|ck|ix|sser|ts|wb)ies$", "$1ie";
    "\\b(l|(?:neck|cross|hog|aun)?t|coll|faer|food|gen|goon|group|hipp|junk|vegg|(?:pork)?p|charl|calor|cut)ies$", "$1ie";
    "\\b(mon|smil)ies$", "$1ey";
    "\\b((?:tit)?m|l)ice$", "$1ouse";
    "(seraph|cherub)im$", "$1";
    "(x|ch|ss|sh|zz|tto|go|cho|alias|[^aou]us|t[lm]as|gas|(?:her|at|gr)o|[aeiou]ris)(?:es)?$", "$1";
    "(analy|diagno|parenthe|progno|synop|the|empha|cri|ne)(?:sis|ses)$", "$1sis";
    "(movie|twelve|abuse|e[mn]u)s$", "$1";
    "(test)(?:is|es)$", "$1is";
    "(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$", "$1us";
    "(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|quor)a$", "$1um";
    "(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)a$", "$1on";
    "(alumn|alg|vertebr)ae$", "$1a";
    "(cod|mur|sil|vert|ind)ices$", "$1ex";
    "(matr|append)ices$", "$1ix";
    "(pe)(rson|ople)$", "$1rson";
    "(child)ren$", "$1";
    "(eau)x?$", "$1";
    "men$", "man" ]

let uncountable_words =
  [ "adulthood"; "advice"; "agenda"; "aid"; "aircraft"; "alcohol"; "ammo";
    "analytics"; "anime"; "athletics"; "audio"; "bison"; "blood"; "bream";
    "buffalo"; "butter"; "carp"; "cash"; "chassis"; "chess"; "clothing";
    "cod"; "commerce"; "cooperation"; "corps"; "debris"; "diabetes";
    "digestion"; "elk"; "energy"; "equipment"; "excretion"; "expertise";
    "firmware"; "flounder"; "fun"; "gallows"; "garbage"; "graffiti";
    "hardware"; "headquarters"; "health"; "herpes"; "highjinks"; "homework";
    "housework"; "information"; "jeans"; "justice"; "kudos"; "labour";
    "literature"; "machinery"; "mackerel"; "mail"; "media"; "mews"; "moose";
    "music"; "mud"; "manga"; "news"; "only"; "personnel"; "pike"; "plankton";
    "pliers"; "police"; "pollution"; "premises"; "rain"; "research"; "rice";
    "salmon"; "scissors"; "series"; "sewage"; "shambles"; "shrimp";
    "software"; "staff"; "swine"; "tennis"; "traffic"; "transportation";
    "trout"; "tuna"; "wealth"; "welfare"; "whiting"; "wildebeest";
    "wildlife"; "you" ]

let uncountable_patterns =
  [ "pok[eé]mon$"; "[^aeiou]ese$"; "deer$"; "fish$"; "measles$"; "o[iu]s$";
    "pox$"; "sheep$" ]

let () =
  List.iter (fun (s, p) -> add_irregular_rule ~single:s ~plural_word:p) irregulars;
  List.iter
    (fun (pattern, replacement) -> add_plural_rule ~pattern ~replacement)
    plural_rule_data;
  List.iter
    (fun (pattern, replacement) -> add_singular_rule ~pattern ~replacement)
    singular_rule_data;
  List.iter add_uncountable_word uncountable_words;
  List.iter add_uncountable_pattern uncountable_patterns
