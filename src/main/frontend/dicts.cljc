(ns ^:bb-compatible frontend.dicts
  "Provides dictionary entries for most of the application"
  (:require #?(:clj [clojure.edn :as edn])
            #?@(:bb [[clojure.java.io :as io]]
                :clj [[clojure.java.io :as io]
                      [shadow.resource :as rc]]))
  #?(:cljs (:require-macros [frontend.dicts :refer [edn-resource]])))

#?(:clj (defn resource [file] (slurp (io/resource file))))

;; :bb needs to come first for bb to prefer it
#?(:bb (defn edn-resource [file]
         (edn/read-string {:readers {'resource resource}} (slurp (io/resource file))))
   :clj (defmacro edn-resource [file]
          (edn/read-string {:readers {'resource resource}} (rc/slurp-resource &env file))))

(def ^:private en-dicts-raw (edn-resource "dicts/en.edn"))

(def categories
  "Shortcut categories described in default language"
  (set (filter #(= "shortcut.category" (namespace %)) (keys en-dicts-raw))))

(def abbreviated-commands
  "Commands defined in default language and in a format that
  frontend.modules.shortcut.* namespaces understand e.g. :date-picker/complete
  instead of :command.date-picker/complete"
  (set (keys (:commands en-dicts-raw))))

(defn- decorate-namespace [k]
  (let [n (name k)
        ns (namespace k)]
    (keyword (str "command." ns) n)))

(def ^:private en-dicts
  (merge (dissoc en-dicts-raw :commands)
         ;; Dynamically add :command ns prefix since command descriptions have to
         ;; stay in sync with frontend.modules.shortcut.config keywords which do not
         ;; have the prefix
         (update-keys (:commands en-dicts-raw) decorate-namespace)))

(def dicts
  "Main dictionary map used by tongue to translate app"
  {:en      en-dicts
   :de      (edn-resource "dicts/de.edn")
   :nl      (edn-resource "dicts/nl.edn")
   :fr      (edn-resource "dicts/fr.edn")
   :zh-CN   (edn-resource "dicts/zh-cn.edn")
   :zh-Hant (edn-resource "dicts/zh-hant.edn")
   :af      (edn-resource "dicts/af.edn")
   :ca      (edn-resource "dicts/ca.edn")
   :es      (edn-resource "dicts/es.edn")
   :nb-NO   (edn-resource "dicts/nb-no.edn")
   :pt-BR   (edn-resource "dicts/pt-br.edn")
   :pt-PT   (edn-resource "dicts/pt-pt.edn")
   :ru      (edn-resource "dicts/ru.edn")
   :ja      (edn-resource "dicts/ja.edn")
   :it      (edn-resource "dicts/it.edn")
   :tr      (edn-resource "dicts/tr.edn")
   :ko      (edn-resource "dicts/ko.edn")
   :pl      (edn-resource "dicts/pl.edn")
   :sk      (edn-resource "dicts/sk.edn")
   :uk      (edn-resource "dicts/uk.edn")
   :fa      (edn-resource "dicts/fa.edn")
   :id      (edn-resource "dicts/id.edn")
   :cs      (edn-resource "dicts/cs.edn")
   :ar      (edn-resource "dicts/ar.edn")})

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
