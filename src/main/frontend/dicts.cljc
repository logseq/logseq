(ns ^:bb-compatible frontend.dicts
  "Provides dictionary entries for most of the application"
  (:require [frontend.dicts.en :as en]
            [frontend.dicts.de :as de]
            [frontend.dicts.nl :as nl]
            [frontend.dicts.fr :as fr]
            [frontend.dicts.zh-cn :as zh-CN]
            [frontend.dicts.zh-hant :as zh-Hant]
            [frontend.dicts.af :as af]
            [frontend.dicts.es :as es]
            [frontend.dicts.nb-no :as nb-NO]
            [frontend.dicts.pt-br :as pt-BR]
            [frontend.dicts.pt-pt :as pt-PT]
            [frontend.dicts.ru :as ru]
            [frontend.dicts.ja :as ja]
            [frontend.dicts.it :as it]
            [frontend.dicts.tr :as tr]
            [frontend.dicts.ko :as ko]
            [frontend.dicts.pl :as pl]
            [frontend.dicts.sk :as sk]
            [frontend.dicts.uk :as uk]))

(def categories
  "Shortcut categories described in default language"
  (set (filter #(= "shortcut.category" (namespace %)) (keys en/dicts))))

(def abbreviated-commands
  "Commands defined in default language and in a format that
  frontend.modules.shortcut.* namespaces understand e.g. :date-picker/complete
  instead of :command.date-picker/complete"
  (set (keys (:commands en/dicts))))

(defn- decorate-namespace [k]
  (let [n (name k)
        ns (namespace k)]
    (keyword (str "command." ns) n)))

(def ^:private en-dicts
  (merge (dissoc en/dicts :commands)
         ;; Dynamically add :command ns prefix since command descriptions have to
         ;; stay in sync with frontend.modules.shortcut.config keywords which do not
         ;; have the prefix
         (update-keys (:commands en/dicts) decorate-namespace)))

(def dicts
  {:en      en-dicts
   :de      de/dicts
   :nl      nl/dicts
   :fr      fr/dicts
   :zh-CN   zh-CN/dicts
   :zh-Hant zh-Hant/dicts
   :af      af/dicts
   :es      es/dicts
   :nb-NO   nb-NO/dicts
   :pt-BR   pt-BR/dicts
   :pt-PT   pt-PT/dicts
   :ru      ru/dicts
   :ja      ja/dicts
   :it      it/dicts
   :tr      tr/dicts
   :ko      ko/dicts
   :pl      pl/dicts
   :sk      sk/dicts
   :uk      uk/dicts})

(def languages [{:label "English" :value :en}
                {:label "Français" :value :fr}
                {:label "Deutsch" :value :de}
                {:label "Dutch (Nederlands)" :value :nl}
                {:label "简体中文" :value :zh-CN}
                {:label "繁體中文" :value :zh-Hant}
                {:label "Afrikaans" :value :af}
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
                {:label "Slovenčina" :value :sk}])
