(ns frontend.extensions.draw
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.handler.draw :as draw-handler]
            [frontend.handler.notification :as notification]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))


(defn- from-json
  [text]
  (when-not (string/blank? text)
    (try
      (js/JSON.parse text)
      (catch js/Error e
        (println "from json error:")
        (js/console.dir e)
        (notification/show!
         (util/format "Could not load this invalid excalidraw file")
         :error)))))

(rum/defcs draw-container < rum/reactive
  {:init (fn [state]
           (let [[option] (:rum/args state)
                 file (:file option)
                 *data (atom nil)
                 *loading? (atom true)]
             (when file
               (draw-handler/load-draw-file
                file
                (fn [data]
                  (let [data (from-json data)]
                    (reset! *data data)
                    (reset! *loading? false)))))
             (assoc state
                    ::data *data
                    ::loading? *loading?)))}
  [state option draw-inner]
  (let [*data (get state ::data)
        *loading? (get state ::loading?)
        loading? (rum/react *loading?)
        data (rum/react *data)
        db-restoring? (state/sub :db/restoring?)]
    (when (:file option)
      (cond
        db-restoring?
        [:div.ls-center
         (ui/loading "Loading")]

        (false? loading?)
        (draw-inner data option)

        :else
        nil))))

(rum/defc draw-wrapper < rum/reactive
  [option draw-inner]
  (let [repo (state/get-current-repo)
        granted? (state/sub [:nfs/user-granted? repo])]
    ;; Web granted
    (when-not (and (config/local-db? repo)
                   (not granted?)
                   (not (util/electron?))
                   (not (mobile-util/is-native-platform?)))
      (draw-container option draw-inner))))
