(ns frontend.components.repo
  (:require [rum.core :as rum]
            [frontend.mui :as mui]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler :as handler]
            [clojure.string :as string]))

(defn add-repo
  [repo-url]
  [:form {:style {:min-width 300}}
   (mui/grid
    {:container true
     :direction "column"}
    (mui/text-field {:id "standard-basic"
                     :style {:margin-bottom 12}
                     :label "Repo url"
                     :on-change (fn [event]
                                  (let [v (util/evalue event)]
                                    (swap! state/state assoc :repo-url v)))
                     :value repo-url
                     })
    (mui/button {:variant "contained"
                 :color "primary"
                 :on-click (fn []
                             (handler/add-repo-and-clone repo-url))}
      "Sync"))])
