(ns frontend.tools.tongue
  (:require [tongue.core :as tongue]
            [frontend.state :as state]))


;; TODO
;; - [ ] Localizing Number Formats
;; - [ ] Localizing Dates
;; - [ ] Create dicts from edn files like /languages/{lang}.edn
;; - [ ] Add a build script to take the languages from github repo 

(def dicts
  {:en {:color "Color"
        :flowor "Flower"
        :weather/rain "Rain"
        :weather/clouds "Clouds"}
   :tongue/fallback :en})

(def languages [{:label "English" :value :en}])

(def translate
  (tongue/build-translate dicts))