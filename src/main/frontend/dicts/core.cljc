(ns ^:bb-compatible frontend.dicts.core
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

(def ^:large-vars/data-var dicts
  {:en      en/application
   :de      de/application
   :nl      nl/application
   :fr      fr/application
   :zh-CN   zh-CN/application
   :zh-Hant zh-Hant/application
   :af      af/application
   :es      es/application
   :nb-NO   nb-NO/application
   :pt-BR   pt-BR/application
   :pt-PT   pt-PT/application
   :ru      ru/application
   :ja      ja/application
   :it      it/application
   :tr      tr/application
   :ko      ko/application
   :pl      pl/application
   :sk      sk/application
   :uk      uk/application})
   
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
