(ns logseq.shui.cmdk.v2
  (:require 
    [clojure.string :as str]
    [logseq.shui.util :as util]
    [rum.core :as rum]))

(rum/defc root 
  [{:keys [intent text] :or {intent :primary}} context]
  [:button.shui__button 
   [:div.shui__border] 
   text])
   

