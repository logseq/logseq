(ns frontend.extensions.code-language-registry
  (:require [clojure.string :as string]))

(def supported-sources #{:native :nextjournal :legacy :plain-text})

(def ^:private languages
  [{:id :plain-text
    :names #{"plain" "plain-text" "plaintext" "text"}
    :extensions #{"txt"}
    :source :plain-text}
   {:id :clojure
    :names #{"clj" "cljc" "cljs" "clojure" "clojurescript" "edn"}
    :extensions #{"clj" "cljc" "cljs" "edn"}
    :source :nextjournal
    :package "@nextjournal/lang-clojure"
    :entry :clojure}
   {:id :javascript
    :names #{"javascript" "js"}
    :extensions #{"cjs" "js" "mjs"}
    :source :native
    :package "@codemirror/lang-javascript"
    :entry :javascript}
   {:id :jsx
    :names #{"jsx"}
    :extensions #{"jsx"}
    :source :native
    :package "@codemirror/lang-javascript"
    :entry :javascript
    :options {:jsx true}}
   {:id :typescript
    :names #{"ts" "typescript"}
    :extensions #{"ts"}
    :source :native
    :package "@codemirror/lang-javascript"
    :entry :javascript
    :options {:typescript true}}
   {:id :tsx
    :names #{"tsx"}
    :extensions #{"tsx"}
    :source :native
    :package "@codemirror/lang-javascript"
    :entry :javascript
    :options {:jsx true
              :typescript true}}
   {:id :css
    :names #{"css"}
    :extensions #{"css"}
    :source :native
    :package "@codemirror/lang-css"
    :entry :css}
   {:id :html
    :names #{"html"}
    :extensions #{"htm" "html"}
    :source :native
    :package "@codemirror/lang-html"
    :entry :html}
   {:id :json
    :names #{"json"}
    :extensions #{"json"}
    :source :native
    :package "@codemirror/lang-json"
    :entry :json}
   {:id :markdown
    :names #{"gfm" "markdown" "md"}
    :extensions #{"markdown" "md"}
    :source :native
    :package "@codemirror/lang-markdown"
    :entry :markdown}
   {:id :python
    :names #{"py" "python"}
    :extensions #{"py" "pyw"}
    :source :native
    :package "@codemirror/lang-python"
    :entry :python}
   {:id :sql
    :names #{"sql"}
    :extensions #{"sql"}
    :source :native
    :package "@codemirror/lang-sql"
    :entry :sql}
   {:id :shell
    :names #{"bash" "shell" "sh" "zsh"}
    :extensions #{"bash" "sh" "zsh"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :shell}
   {:id :yaml
    :names #{"yaml" "yml"}
    :extensions #{"yaml" "yml"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :yaml}])

(defn- normalize-key
  [value]
  (some-> value str string/lower-case string/trim (string/replace #"^\." "")))

(defn supported-languages
  []
  languages)

(defn valid-language-descriptor?
  [descriptor]
  (and (map? descriptor)
       (keyword? (:id descriptor))
       (seq (:names descriptor))
       (contains? supported-sources (:source descriptor))
       (or (= :plain-text (:source descriptor))
           (and (string? (:package descriptor))
                (keyword? (:entry descriptor))))))

(defn- lookup-pairs
  [field]
  (mapcat
   (fn [descriptor]
     (for [lookup-key (->> (get descriptor field)
                           (map normalize-key)
                           (remove string/blank?))]
       [lookup-key descriptor]))
   languages))

(defn- duplicate-keys
  [field]
  (->> (lookup-pairs field)
       (map first)
       frequencies
       (keep (fn [[lookup-key count]]
               (when (> count 1)
                 lookup-key)))
       set))

(defn duplicate-name-keys
  []
  (duplicate-keys :names))

(defn duplicate-extension-keys
  []
  (duplicate-keys :extensions))

(def ^:private name-index
  (delay (into {} (lookup-pairs :names))))

(def ^:private extension-index
  (delay (into {} (lookup-pairs :extensions))))

(defn language-by-name
  [language-name]
  (get @name-index (normalize-key language-name)))

(defn language-by-extension
  [extension]
  (get @extension-index (normalize-key extension)))

(defn plain-text-language
  []
  (language-by-name "plain-text"))

(defn legacy-language?
  [language-name]
  (= :legacy (:source (language-by-name language-name))))
