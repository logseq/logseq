(ns frontend.tools.tongue
  (:require [tongue.core :as tongue]
            [frontend.state :as state]))


;; TODO
;; - [ ] Localizing Number Formats
;; - [ ] Localizing Dates
;; - [ ] Create dicts from edn files like /languages/{lang}.edn
;; - [ ] Add a build script to take the languages from a github repo 

(def dicts
  {:en {:on-boaring {:title "Hi, welcome to Logseq!"
                     :notice "Notice that this project is in its early days and under quick development, files might be corrupted."}
        :right-side-bar {:help "Help"
                         :switch-theme #(str "Switch to " % " theme")
                         :theme #(cond 
                                   (= "white" %) "White theme"
                                   (= "dark" %) "Dark theme")
                         :page "Page graph"
                         :recent "Recent"
                         :contents "Contents"
                         :graph-ref "Graph of "
                         :block-ref "Block reference"}}
                       
   :tongue/fallback :en})

(def languages [{:label "English" :value :en}])

(def translate
  (tongue/build-translate dicts))
