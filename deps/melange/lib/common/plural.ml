type rule = { regexp : Js.Re.t; replacement : string }

let rule pattern replacement =
  { regexp = Js.Re.fromStringWithFlags pattern ~flags:"i"; replacement }

let lower = Js.String.toLowerCase
let upper = Js.String.toUpperCase

let restore_case word token =
  if String.equal word token then token
  else if String.equal word (lower word) then lower token
  else if String.equal word (upper word) then upper token
  else if
    String.length word > 0
    && String.equal
         (Js.String.substring ~start:0 ~end_:1 word)
         (upper (Js.String.substring ~start:0 ~end_:1 word))
  then
    upper (Js.String.substring ~start:0 ~end_:1 token)
    ^ lower (Js.String.substring ~start:1 token)
  else lower token

let capture captures index =
  if index < Array.length captures then
    captures.(index) |> Js.Nullable.toOption |> Option.value ~default:""
  else ""

let interpolate replacement captures =
  let length = String.length replacement in
  let digit character =
    if character >= '0' && character <= '9' then
      Some (Char.code character - Char.code '0')
    else None
  in
  let rec loop index result =
    if index >= length then result
    else if replacement.[index] = '$' && index + 1 < length then
      match digit replacement.[index + 1] with
      | None -> loop (index + 1) (result ^ "$")
      | Some first ->
          let capture_index, next =
            if index + 2 < length then
              match digit replacement.[index + 2] with
              | Some second -> ((first * 10) + second, index + 3)
              | None -> (first, index + 2)
            else (first, index + 2)
          in
          loop next (result ^ capture captures capture_index)
    else loop (index + 1) (result ^ String.make 1 replacement.[index])
  in
  loop 0 ""

let replace_with_rule word rule =
  match Js.Re.exec ~str:word rule.regexp with
  | None -> word
  | Some result ->
      let captures = Js.Re.captures result in
      let matched = capture captures 0 in
      let offset = Js.Re.index result in
      let replacement = interpolate rule.replacement captures in
      let case_source =
        if String.equal matched "" then
          Js.String.substring ~start:(offset - 1) ~end_:offset word
        else matched
      in
      let prefix = Js.String.substring ~start:0 ~end_:offset word in
      let suffix =
        Js.String.substring ~start:(offset + String.length matched) word
      in
      prefix ^ restore_case case_source replacement ^ suffix

let irregular_pairs =
  [|
    ("I", "we");
    ("me", "us");
    ("he", "they");
    ("she", "they");
    ("them", "them");
    ("myself", "ourselves");
    ("yourself", "yourselves");
    ("itself", "themselves");
    ("herself", "themselves");
    ("himself", "themselves");
    ("themself", "themselves");
    ("is", "are");
    ("was", "were");
    ("has", "have");
    ("this", "these");
    ("that", "those");
    ("my", "our");
    ("its", "their");
    ("his", "their");
    ("her", "their");
    ("echo", "echoes");
    ("dingo", "dingoes");
    ("volcano", "volcanoes");
    ("tornado", "tornadoes");
    ("torpedo", "torpedoes");
    ("genus", "genera");
    ("viscus", "viscera");
    ("stigma", "stigmata");
    ("stoma", "stomata");
    ("dogma", "dogmata");
    ("lemma", "lemmata");
    ("schema", "schemata");
    ("anathema", "anathemata");
    ("ox", "oxen");
    ("axe", "axes");
    ("die", "dice");
    ("yes", "yeses");
    ("foot", "feet");
    ("eave", "eaves");
    ("goose", "geese");
    ("tooth", "teeth");
    ("quiz", "quizzes");
    ("human", "humans");
    ("proof", "proofs");
    ("carve", "carves");
    ("valve", "valves");
    ("looey", "looies");
    ("thief", "thieves");
    ("groove", "grooves");
    ("pickaxe", "pickaxes");
    ("passerby", "passersby");
    ("canvas", "canvases");
  |]

let irregular_singles = Hashtbl.create (Array.length irregular_pairs)
let irregular_plurals = Hashtbl.create (Array.length irregular_pairs)

let () =
  Array.iter
    (fun (single, plural) ->
      Hashtbl.replace irregular_singles (lower single) (lower plural);
      Hashtbl.replace irregular_plurals (lower plural) (lower single))
    irregular_pairs

let plural_rules =
  [|
    rule "s?$" "s";
    rule "[^\\u0000-\\u007F]$" "$0";
    rule "([^aeiou]ese)$" "$1";
    rule "(ax|test)is$" "$1es";
    rule "(alias|[^aou]us|t[lm]as|gas|ris)$" "$1es";
    rule "(e[mn]u)s?$" "$1s";
    rule "([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$" "$1";
    rule
      "(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$"
      "$1i";
    rule "(alumn|alg|vertebr)(?:a|ae)$" "$1ae";
    rule "(seraph|cherub)(?:im)?$" "$1im";
    rule "(her|at|gr)o$" "$1oes";
    rule
      "(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$"
      "$1a";
    rule
      "(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$"
      "$1a";
    rule "sis$" "ses";
    rule "(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$" "$1$2ves";
    rule "([^aeiouy]|qu)y$" "$1ies";
    rule "([^ch][ieo][ln])ey$" "$1ies";
    rule "(x|ch|ss|sh|zz)$" "$1es";
    rule "(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$" "$1ices";
    rule "\\b((?:tit)?m|l)(?:ice|ouse)$" "$1ice";
    rule "(pe)(?:rson|ople)$" "$1ople";
    rule "(child)(?:ren)?$" "$1ren";
    rule "eaux$" "$0";
    rule "m[ae]n$" "men";
    rule "^thou$" "you";
  |]
  |> Rrbvec.of_array

let singular_rules =
  [|
    rule "s$" "";
    rule "(ss)$" "$1";
    rule "(wi|kni|(?:after|half|high|low|mid|non|night|[^\\w]|^)li)ves$" "$1fe";
    rule "(ar|(?:wo|[ae])l|[eo][ao])ves$" "$1f";
    rule "ies$" "y";
    rule "(dg|ss|ois|lk|ok|wn|mb|th|ch|ec|oal|is|ck|ix|sser|ts|wb)ies$" "$1ie";
    rule
      "\\b(l|(?:neck|cross|hog|aun)?t|coll|faer|food|gen|goon|group|hipp|junk|vegg|(?:pork)?p|charl|calor|cut)ies$"
      "$1ie";
    rule "\\b(mon|smil)ies$" "$1ey";
    rule "\\b((?:tit)?m|l)ice$" "$1ouse";
    rule "(seraph|cherub)im$" "$1";
    rule
      "(x|ch|ss|sh|zz|tto|go|cho|alias|[^aou]us|t[lm]as|gas|(?:her|at|gr)o|[aeiou]ris)(?:es)?$"
      "$1";
    rule "(analy|diagno|parenthe|progno|synop|the|empha|cri|ne)(?:sis|ses)$"
      "$1sis";
    rule "(movie|twelve|abuse|e[mn]u)s$" "$1";
    rule "(test)(?:is|es)$" "$1is";
    rule
      "(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$"
      "$1us";
    rule
      "(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|quor)a$"
      "$1um";
    rule
      "(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)a$"
      "$1on";
    rule "(alumn|alg|vertebr)ae$" "$1a";
    rule "(cod|mur|sil|vert|ind)ices$" "$1ex";
    rule "(matr|append)ices$" "$1ix";
    rule "(pe)(rson|ople)$" "$1rson";
    rule "(child)ren$" "$1";
    rule "(eau)x?$" "$1";
    rule "men$" "man";
  |]
  |> Rrbvec.of_array

let uncountables = Hashtbl.create 128

let () =
  [|
    "adulthood";
    "advice";
    "agenda";
    "aid";
    "aircraft";
    "alcohol";
    "ammo";
    "analytics";
    "anime";
    "athletics";
    "audio";
    "bison";
    "blood";
    "bream";
    "buffalo";
    "butter";
    "carp";
    "cash";
    "chassis";
    "chess";
    "clothing";
    "cod";
    "commerce";
    "cooperation";
    "corps";
    "debris";
    "diabetes";
    "digestion";
    "elk";
    "energy";
    "equipment";
    "excretion";
    "expertise";
    "firmware";
    "flounder";
    "fun";
    "gallows";
    "garbage";
    "graffiti";
    "hardware";
    "headquarters";
    "health";
    "herpes";
    "highjinks";
    "homework";
    "housework";
    "information";
    "jeans";
    "justice";
    "kudos";
    "labour";
    "literature";
    "machinery";
    "mackerel";
    "mail";
    "media";
    "mews";
    "moose";
    "music";
    "mud";
    "manga";
    "news";
    "only";
    "personnel";
    "pike";
    "plankton";
    "pliers";
    "police";
    "pollution";
    "premises";
    "rain";
    "research";
    "rice";
    "salmon";
    "scissors";
    "series";
    "sewage";
    "shambles";
    "shrimp";
    "software";
    "staff";
    "swine";
    "tennis";
    "traffic";
    "transportation";
    "trout";
    "tuna";
    "wealth";
    "welfare";
    "whiting";
    "wildebeest";
    "wildlife";
    "you";
  |]
  |> Array.iter (fun word -> Hashtbl.replace uncountables word ())

let add_passthrough_rules rules =
  [|
    "pok[e\\u00e9]mon$";
    "[^aeiou]ese$";
    "deer$";
    "fish$";
    "measles$";
    "o[iu]s$";
    "pox$";
    "sheep$";
  |]
  |> Array.fold_left
       (fun result pattern -> Rrbvec.push_back result (rule pattern "$0"))
       rules

let plural_rules = add_passthrough_rules plural_rules
let singular_rules = add_passthrough_rules singular_rules

let sanitize_word token word rules =
  if String.equal token "" || Hashtbl.mem uncountables token then word
  else
    let rec apply index =
      if index < 0 then word
      else
        let current = Rrbvec.nth rules index in
        if Js.Re.test ~str:word current.regexp then
          replace_with_rule word current
        else apply (index - 1)
    in
    apply (Rrbvec.length rules - 1)

let replace_word replace_map keep_map rules word =
  let token = lower word in
  match Hashtbl.find_opt keep_map token with
  | Some _ -> restore_case word token
  | None -> (
      match Hashtbl.find_opt replace_map token with
      | Some replacement -> restore_case word replacement
      | None -> sanitize_word token word rules)

let check_word replace_map keep_map rules word =
  let token = lower word in
  if Hashtbl.mem keep_map token then true
  else if Hashtbl.mem replace_map token then false
  else String.equal (sanitize_word token token rules) token

let plural = replace_word irregular_singles irregular_plurals plural_rules
let singular = replace_word irregular_plurals irregular_singles singular_rules
let is_plural = check_word irregular_singles irregular_plurals plural_rules
let is_singular = check_word irregular_plurals irregular_singles singular_rules

let pluralize ~word ~item_count ~inclusive =
  let value = if item_count = 1 then singular word else plural word in
  if inclusive then string_of_int item_count ^ " " ^ value else value
