(ns logseq.e2e.api
  (:require
   [clojure.string :as string]
   [jsonista.core :as json]
   [wally.main :as w]))

(defn- to-snake-case
  "Converts a string to snake_case. Handles camelCase, PascalCase, spaces, hyphens, and existing underscores.
   Examples:
     'HelloWorld' -> 'hello_world'
     'Hello World' -> 'hello_world'
     'hello-world' -> 'hello_world'
     'Hello__World' -> 'hello_world'"
  [s]
  (when (string? s)
    (-> s
      ;; Normalize input: replace hyphens/spaces with underscores, collapse multiple underscores
        (string/replace #"[-\s]+" "_")
      ;; Split on uppercase letters (except at start) and join with underscore
        (string/replace #"(?<!^)([A-Z])" "_$1")
      ;; Remove redundant underscores and trim
        (string/replace #"_+" "_")
        (string/trim)
        ;; Convert to lowercase
        (string/lower-case))))

(defn ls-api-call!
  [api-keyword & args]
  (let [tag (name api-keyword)
        ns' (string/split tag #"\.")
        ns? (and (seq ns') (= (count ns') 2))
        inbuilt? (contains? #{"app" "editor"} (first ns'))
        ns1 (string/lower-case (if (and ns? (not inbuilt?))
                                 (str "sdk." (first ns')) "api"))
        name1 (if ns? (to-snake-case (last ns')) tag)
        estr (format "s => { const args = JSON.parse(s);const o=logseq.%1$s; return o['%2$s']?.apply(null, args || []); }" ns1 name1)
        args (json/write-value-as-string (vec args))]
    ;; (prn "Debug: eval-js #" estr args)
    (w/eval-js estr args)))
