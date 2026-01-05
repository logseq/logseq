(ns logseq.common.plural
  "ClojureScript port of pluralize.js core (rules + API).

  Usage:
    (pluralize \"duck\" 2 true)     ;; => \"2 ducks\"
    (plural \"person\")            ;; => \"people\"
    (singular \"people\")          ;; => \"person\"
    (is-plural? \"ducks\")         ;; => true
    (is-singular? \"duck\")        ;; => true

  You can add rules at runtime:
    (add-plural-rule! #\"(ox)$\" \"$1en\")
    (add-uncountable-rule! \"metadata\")"
  (:require [clojure.string :as string]))

;; -----------------------------------------------------------------------------
;; Rule storage (mirrors original semantics)
;; pluralize and singularize must run rules sequentially.
;; -----------------------------------------------------------------------------

(defonce ^:private plural-rules (atom []))      ;; vector of [js/RegExp replacement]
(defonce ^:private singular-rules (atom []))    ;; vector of [js/RegExp replacement]
(defonce ^:private uncountables (atom {}))      ;; token -> true
(defonce ^:private irregular-plurals (atom {})) ;; plural -> singular
(defonce ^:private irregular-singles (atom {})) ;; singular -> plural

;; -----------------------------------------------------------------------------
;; Helpers
;; -----------------------------------------------------------------------------

(defn- sanitize-rule
  "If rule is a string, compile to case-insensitive regexp that matches the whole string.
   Else keep it (assumed to be js/RegExp)."
  [rule]
  (if (string? rule)
    (js/RegExp. (str "^" rule "$") "i")
    rule))

(defn- restore-case
  "Replicate casing of `word` onto `token`."
  [word token]
  (cond
    (= word token)
    token

    (= word (string/lower-case word))
    (string/lower-case token)

    (= word (string/upper-case word))
    (string/upper-case token)

    (and (seq word)
         (= (subs word 0 1) (string/upper-case (subs word 0 1))))
    (str (string/upper-case (subs token 0 1))
         (string/lower-case (subs token 1)))

    :else
    (string/lower-case token)))

(defn- interpolate
  "Replace $1..$12 etc in `s` using JS replace args (match, g1, g2 ...)."
  [s js-args]
  (.replace s (js/RegExp. "\\$(\\d{1,2})" "g")
            (fn [_ idx]
              (let [i (js/parseInt idx 10)
                    v (aget js-args i)]
                (or v "")))))

(defn- replace-with-rule
  "Apply a [re repl] rule to word with casing restoration (matches JS behavior)."
  [word [re repl]]
  (.replace word re
            (fn [& args]
              ;; args: [match g1 g2 ... offset string]
              (let [match  (nth args 0)
                    ;; In JS replace callback, second-to-last is offset
                    offset (nth args (- (count args) 2))
                    ;; interpolate expects JS-ish indexed args;
                    ;; easiest is to turn args into a JS array.
                    js-args (to-array args)
                    result (interpolate repl js-args)]
                (if (= match "")
                  ;; match empty => restore based on char before match
                  (restore-case (subs word (dec offset) offset) result)
                  (restore-case match result))))))

(defn- sanitize-word
  "Return sanitized `word` based on `token` and `rules`."
  [token word rules]
  (cond
    (or (zero? (count token))
        (contains? @uncountables token))
    word

    :else
    (let [rs rules
          ;; JS iterates from end to start
          n  (count rs)]
      (loop [i (dec n)]
        (if (neg? i)
          word
          (let [[re _ :as rule] (nth rs i)]
            (if (.test re word)
              (replace-with-rule word rule)
              (recur (dec i)))))))))

(defn- replace-word-fn
  "Build a word transformer (plural or singular)."
  [replace-map-atom keep-map-atom rules-atom]
  (fn [word]
    (let [token (string/lower-case word)
          keep-map @keep-map-atom
          replace-map @replace-map-atom
          rules @rules-atom]
      (cond
        (contains? keep-map token)
        (restore-case word token)

        (contains? replace-map token)
        (restore-case word (get replace-map token))

        :else
        (sanitize-word token word rules)))))

(defn- check-word-fn
  "Build a predicate for whether word is plural/singular (mirrors JS `checkWord`)."
  [replace-map-atom keep-map-atom rules-atom]
  (fn [word]
    (let [token (string/lower-case word)
          keep-map @keep-map-atom
          replace-map @replace-map-atom
          rules @rules-atom]
      (cond
        (contains? keep-map token) true
        (contains? replace-map token) false
        :else (= (sanitize-word token token rules) token)))))

;; -----------------------------------------------------------------------------
;; Public API (matches original surface)
;; -----------------------------------------------------------------------------

(def plural (replace-word-fn irregular-singles irregular-plurals plural-rules))
(def singular (replace-word-fn irregular-plurals irregular-singles singular-rules))

(def is-plural? (check-word-fn irregular-singles irregular-plurals plural-rules))
(def is-singular? (check-word-fn irregular-plurals irregular-singles singular-rules))

(defn pluralize
  "Pluralize or singularize based on count. If inclusive, prefix with count."
  ([word count] (pluralize word count false))
  ([word count inclusive]
   (let [pluralized (if (= count 1) (singular word) (plural word))]
     (str (when inclusive (str count " "))
          pluralized))))

(defn add-plural-rule!
  [rule replacement]
  (swap! plural-rules conj [(sanitize-rule rule) replacement]))

(defn add-singular-rule!
  [rule replacement]
  (swap! singular-rules conj [(sanitize-rule rule) replacement]))

(defn add-uncountable-rule!
  "If word is string => mark as uncountable.
   If regexp => add plural+singular passthrough rules ($0)."
  [word]
  (if (string? word)
    (swap! uncountables assoc (string/lower-case word) true)
    (do
      (add-plural-rule! word "$0")
      (add-singular-rule! word "$0"))))

(defn add-irregular-rule!
  [single plural-word]
  (let [p (string/lower-case plural-word)
        s (string/lower-case single)]
    (swap! irregular-singles assoc s p)
    (swap! irregular-plurals assoc p s)))

;; -----------------------------------------------------------------------------
;; Data initialization (same as original JS)
;; -----------------------------------------------------------------------------

(defn- init-irregulars! []
  (doseq [[s p]
          ;; Pronouns + irregulars
          [["I" "we"]
           ["me" "us"]
           ["he" "they"]
           ["she" "they"]
           ["them" "them"]
           ["myself" "ourselves"]
           ["yourself" "yourselves"]
           ["itself" "themselves"]
           ["herself" "themselves"]
           ["himself" "themselves"]
           ["themself" "themselves"]
           ["is" "are"]
           ["was" "were"]
           ["has" "have"]
           ["this" "these"]
           ["that" "those"]
           ["my" "our"]
           ["its" "their"]
           ["his" "their"]
           ["her" "their"]
           ;; Words ending with consonant + o
           ["echo" "echoes"]
           ["dingo" "dingoes"]
           ["volcano" "volcanoes"]
           ["tornado" "tornadoes"]
           ["torpedo" "torpedoes"]
           ;; Ends with us
           ["genus" "genera"]
           ["viscus" "viscera"]
           ;; Ends with ma
           ["stigma" "stigmata"]
           ["stoma" "stomata"]
           ["dogma" "dogmata"]
           ["lemma" "lemmata"]
           ["schema" "schemata"]
           ["anathema" "anathemata"]
           ;; Other irregular
           ["ox" "oxen"]
           ["axe" "axes"]
           ["die" "dice"]
           ["yes" "yeses"]
           ["foot" "feet"]
           ["eave" "eaves"]
           ["goose" "geese"]
           ["tooth" "teeth"]
           ["quiz" "quizzes"]
           ["human" "humans"]
           ["proof" "proofs"]
           ["carve" "carves"]
           ["valve" "valves"]
           ["looey" "looies"]
           ["thief" "thieves"]
           ["groove" "grooves"]
           ["pickaxe" "pickaxes"]
           ["passerby" "passersby"]
           ["canvas" "canvases"]]]
    (add-irregular-rule! s p)))

(defn- init-plural-rules! []
  (doseq [[rule repl]
          [[(js/RegExp. "s?$" "i") "s"]
           [(js/RegExp. "[^\\u0000-\\u007F]$" "i") "$0"]
           [(js/RegExp. "([^aeiou]ese)$" "i") "$1"]
           [(js/RegExp. "(ax|test)is$" "i") "$1es"]
           [(js/RegExp. "(alias|[^aou]us|t[lm]as|gas|ris)$" "i") "$1es"]
           [(js/RegExp. "(e[mn]u)s?$" "i") "$1s"]
           [(js/RegExp. "([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$" "i") "$1"]
           [(js/RegExp. "(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$" "i") "$1i"]
           [(js/RegExp. "(alumn|alg|vertebr)(?:a|ae)$" "i") "$1ae"]
           [(js/RegExp. "(seraph|cherub)(?:im)?$" "i") "$1im"]
           [(js/RegExp. "(her|at|gr)o$" "i") "$1oes"]
           [(js/RegExp. "(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$" "i") "$1a"]
           [(js/RegExp. "(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$" "i") "$1a"]
           [(js/RegExp. "sis$" "i") "ses"]
           [(js/RegExp. "(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$" "i") "$1$2ves"]
           [(js/RegExp. "([^aeiouy]|qu)y$" "i") "$1ies"]
           [(js/RegExp. "([^ch][ieo][ln])ey$" "i") "$1ies"]
           [(js/RegExp. "(x|ch|ss|sh|zz)$" "i") "$1es"]
           [(js/RegExp. "(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$" "i") "$1ices"]
           [(js/RegExp. "\\b((?:tit)?m|l)(?:ice|ouse)$" "i") "$1ice"]
           [(js/RegExp. "(pe)(?:rson|ople)$" "i") "$1ople"]
           [(js/RegExp. "(child)(?:ren)?$" "i") "$1ren"]
           [(js/RegExp. "eaux$" "i") "$0"]
           [(js/RegExp. "m[ae]n$" "i") "men"]
           ["thou" "you"]]]
    (add-plural-rule! rule repl)))

(defn- init-singular-rules! []
  (doseq [[rule repl]
          [[(js/RegExp. "s$" "i") ""]
           [(js/RegExp. "(ss)$" "i") "$1"]
           [(js/RegExp. "(wi|kni|(?:after|half|high|low|mid|non|night|[^\\w]|^)li)ves$" "i") "$1fe"]
           [(js/RegExp. "(ar|(?:wo|[ae])l|[eo][ao])ves$" "i") "$1f"]
           [(js/RegExp. "ies$" "i") "y"]
           [(js/RegExp. "(dg|ss|ois|lk|ok|wn|mb|th|ch|ec|oal|is|ck|ix|sser|ts|wb)ies$" "i") "$1ie"]
           [(js/RegExp. "\\b(l|(?:neck|cross|hog|aun)?t|coll|faer|food|gen|goon|group|hipp|junk|vegg|(?:pork)?p|charl|calor|cut)ies$" "i") "$1ie"]
           [(js/RegExp. "\\b(mon|smil)ies$" "i") "$1ey"]
           [(js/RegExp. "\\b((?:tit)?m|l)ice$" "i") "$1ouse"]
           [(js/RegExp. "(seraph|cherub)im$" "i") "$1"]
           [(js/RegExp. "(x|ch|ss|sh|zz|tto|go|cho|alias|[^aou]us|t[lm]as|gas|(?:her|at|gr)o|[aeiou]ris)(?:es)?$" "i") "$1"]
           [(js/RegExp. "(analy|diagno|parenthe|progno|synop|the|empha|cri|ne)(?:sis|ses)$" "i") "$1sis"]
           [(js/RegExp. "(movie|twelve|abuse|e[mn]u)s$" "i") "$1"]
           [(js/RegExp. "(test)(?:is|es)$" "i") "$1is"]
           [(js/RegExp. "(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$" "i") "$1us"]
           [(js/RegExp. "(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|quor)a$" "i") "$1um"]
           [(js/RegExp. "(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)a$" "i") "$1on"]
           [(js/RegExp. "(alumn|alg|vertebr)ae$" "i") "$1a"]
           [(js/RegExp. "(cod|mur|sil|vert|ind)ices$" "i") "$1ex"]
           [(js/RegExp. "(matr|append)ices$" "i") "$1ix"]
           [(js/RegExp. "(pe)(rson|ople)$" "i") "$1rson"]
           [(js/RegExp. "(child)ren$" "i") "$1"]
           [(js/RegExp. "(eau)x?$" "i") "$1"]
           [(js/RegExp. "men$" "i") "man"]]]
    (add-singular-rule! rule repl)))

(defn- init-uncountables! []
  (doseq [w
          ["adulthood" "advice" "agenda" "aid" "aircraft" "alcohol" "ammo"
           "analytics" "anime" "athletics" "audio" "bison" "blood" "bream"
           "buffalo" "butter" "carp" "cash" "chassis" "chess" "clothing" "cod"
           "commerce" "cooperation" "corps" "debris" "diabetes" "digestion" "elk"
           "energy" "equipment" "excretion" "expertise" "firmware" "flounder"
           "fun" "gallows" "garbage" "graffiti" "hardware" "headquarters" "health"
           "herpes" "highjinks" "homework" "housework" "information" "jeans"
           "justice" "kudos" "labour" "literature" "machinery" "mackerel" "mail"
           "media" "mews" "moose" "music" "mud" "manga" "news" "only" "personnel"
           "pike" "plankton" "pliers" "police" "pollution" "premises" "rain"
           "research" "rice" "salmon" "scissors" "series" "sewage" "shambles"
           "shrimp" "software" "staff" "swine" "tennis" "traffic"
           "transportation" "trout" "tuna" "wealth" "welfare" "whiting"
           "wildebeest" "wildlife" "you"]]
    (add-uncountable-rule! w))
  (doseq [re [(js/RegExp. "pok[eé]mon$" "i")
              (js/RegExp. "[^aeiou]ese$" "i")
              (js/RegExp. "deer$" "i")
              (js/RegExp. "fish$" "i")
              (js/RegExp. "measles$" "i")
              (js/RegExp. "o[iu]s$" "i")
              (js/RegExp. "pox$" "i")
              (js/RegExp. "sheep$" "i")]]
    (add-uncountable-rule! re)))

(init-irregulars!)
(init-plural-rules!)
(init-singular-rules!)
(init-uncountables!)
