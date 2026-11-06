(ns ^:bb-compatible frontend.dicts
  "Provides dictionary entries for most of the application"
  #?(:bb (:require [clojure.edn :as edn]
                   [clojure.java.io :as io])
     :clj (:require [clojure.edn :as edn]
                    [clojure.java.io :as io]
                    [shadow.resource :as rc]))
  #?(:cljs (:require [clojure.string :as string]))
  #?(:cljs (:require-macros [frontend.dicts :refer [edn-resource deferred-edn-resource]])))

#?(:clj (defn resource [file] (slurp (io/resource file))))

;; :bb needs to come first for bb to prefer it
#?(:bb (defn edn-resource [file]
         (edn/read-string {:readers {'resource resource}} (slurp (io/resource file))))
   :clj (defmacro edn-resource [file]
          (edn/read-string {:readers {'resource resource}} (rc/slurp-resource &env file))))

#?(:bb (def deferred-edn-resource edn-resource)
   :clj (defmacro deferred-edn-resource [file]
          (let [data (edn/read-string {:readers {'resource resource}} (rc/slurp-resource &env file))]
            (if (:ns &env) `(delay ~data) data))))

#?(:bb nil
   :clj
   (defmacro translation-values [translation-key]
     (let [files ["en" "de" "nl" "fr" "zh-cn" "zh-hant" "af" "ca"
                  "es" "nb-no" "pt-br" "pt-pt" "ru" "ja" "it" "tr"
                  "ko" "pl" "sk" "vi" "uk" "fa" "id" "cs" "ar"]]
       (set (keep (fn [locale]
                    (get (edn/read-string
                          {:readers {'resource resource}}
                          (rc/slurp-resource &env (str "dicts/" locale ".edn")))
                         translation-key))
                  files)))))

(defn realize-dict [dictionary]
  #?(:cljs (if (delay? dictionary) @dictionary dictionary)
     :default dictionary))

(def ^:private en-dicts (edn-resource "dicts/en.edn"))

(def categories
  "Shortcut categories described in default language"
  (set (filter #(= "shortcut.category" (namespace %)) (keys en-dicts))))

(def abbreviated-commands
  "Built-in shortcut command ids derived from flattened `:command.*` English
  translation keys, converted to the abbreviated keyword format used by
  `frontend.modules.shortcut.*`."
  (set (map (fn [k]
              (keyword (subs (namespace k) 8) (name k)))
            (filter #(some-> % namespace (.startsWith "command."))
                    (keys en-dicts)))))

(def dicts
  "Main dictionary map used by tongue to translate app"
  {:en      en-dicts
   :de      (deferred-edn-resource "dicts/de.edn")
   :nl      (deferred-edn-resource "dicts/nl.edn")
   :fr      (deferred-edn-resource "dicts/fr.edn")
   :zh-CN   (deferred-edn-resource "dicts/zh-cn.edn")
   :zh-Hant (deferred-edn-resource "dicts/zh-hant.edn")
   :af      (deferred-edn-resource "dicts/af.edn")
   :ca      (deferred-edn-resource "dicts/ca.edn")
   :es      (deferred-edn-resource "dicts/es.edn")
   :nb-NO   (deferred-edn-resource "dicts/nb-no.edn")
   :pt-BR   (deferred-edn-resource "dicts/pt-br.edn")
   :pt-PT   (deferred-edn-resource "dicts/pt-pt.edn")
   :ru      (deferred-edn-resource "dicts/ru.edn")
   :ja      (deferred-edn-resource "dicts/ja.edn")
   :it      (deferred-edn-resource "dicts/it.edn")
   :tr      (deferred-edn-resource "dicts/tr.edn")
   :ko      (deferred-edn-resource "dicts/ko.edn")
   :pl      (deferred-edn-resource "dicts/pl.edn")
   :sk      (deferred-edn-resource "dicts/sk.edn")
   :vi      (deferred-edn-resource "dicts/vi.edn")
   :uk      (deferred-edn-resource "dicts/uk.edn")
   :fa      (deferred-edn-resource "dicts/fa.edn")
   :id      (deferred-edn-resource "dicts/id.edn")
   :cs      (deferred-edn-resource "dicts/cs.edn")
   :ar      (deferred-edn-resource "dicts/ar.edn")})

#?(:cljs
   (defn- locale-chain
     "The locale and the parent tags tongue falls back through for it:
  :zh-Hant gives :zh-Hant and :zh."
     [locale]
     (let [parts (string/split (name locale) #"-")]
       (map #(keyword (string/join "-" (take % parts))) (range (count parts) 0 -1)))))

#?(:cljs
   (defn locale-dicts
     "The realized dicts tongue reads to translate into `locale`: the locale's own
  and its parent tags', plus English as the fallback when `fallback?`. Only
  these are realized, so a locale that is never shown is never read."
     ([locale fallback?]
      (locale-dicts dicts locale fallback?))
     ([all-dicts locale fallback?]
      (let [ks (cond-> (set (locale-chain locale)) fallback? (conj :en))]
        (cond-> (into {}
                      (map (fn [[k dictionary]] [k (realize-dict dictionary)]))
                      (select-keys all-dicts ks))
          fallback? (assoc :tongue/fallback :en))))))

(def languages
  "List of languages presented to user"
  [{:label "English" :value :en}
   {:label "Français" :value :fr}
   {:label "Deutsch" :value :de}
   {:label "Dutch (Nederlands)" :value :nl}
   {:label "简体中文" :value :zh-CN}
   {:label "繁體中文" :value :zh-Hant}
   {:label "Afrikaans" :value :af}
   {:label "Català" :value :ca}
   {:label "Español" :value :es}
   {:label "Tiếng Việt" :value :vi}
   {:label "Norsk (bokmål)" :value :nb-NO}
   {:label "Polski" :value :pl}
   {:label "Português (Brasileiro)" :value :pt-BR}
   {:label "Português (Europeu)" :value :pt-PT}
   {:label "Русский" :value :ru}
   {:label "日本語" :value :ja}
   {:label "Italiano" :value :it}
   {:label "Türkçe" :value :tr}
   {:label "Українська" :value :uk}
   {:label "한국어" :value :ko}
   {:label "Slovenčina" :value :sk}
   {:label "فارسی" :value :fa}
   {:label "Bahasa Indonesia" :value :id}
   {:label "Čeština" :value :cs}
   {:label "العربية" :value :ar}])

(assert (= (set (keys dicts)) (set (map :value languages)))
        "List of user-facing languages must match list of dictionaries")
