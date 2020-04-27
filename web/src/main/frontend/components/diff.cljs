(ns frontend.components.diff
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.reference :as reference]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.git :as git]
            [goog.object :as gobj]
            [promesa.core :as p]))

(defonce diffs (atom nil))
(rum/defcs diff < rum/reactive
  {:will-mount (fn [state]
                 (let [repo (state/get-current-repo)]
                   (handler/get-latest-commit
                    repo
                    (fn [commit]
                      (let [local-oid (gobj/get commit "oid")
                            remote-oid (db/get-key-value repo
                                                         :git/latest-commit)]
                        (p/let [result (git/get-local-diffs repo remote-oid local-oid)]
                          (reset! diffs result))))))
                 state)}
  [state]
  (let [diffs (rum/react diffs)]
    (sidebar/sidebar
     [:div#diffs
      [:h1 "Diffs"]
      (for [{:keys [type path]} diffs]
        [:div {:key path}
         path])])))
