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
            [promesa.core :as p]
            [frontend.github :as github]
            [frontend.diff :as diff]
            [medley.core :as medley]))

(defonce diffs (atom nil))
(defonce remote-hash-id (atom nil))

;; TODO: `n` shortcut for next diff, `p` for previous diff
(rum/defcc diff < rum/reactive
  {:will-mount
   (fn [state]
     (let [repo (state/get-current-repo)]
       (handler/get-latest-commit
        repo
        (fn [commit]
          (let [local-oid (gobj/get commit "oid")
                remote-oid (db/get-key-value repo
                                             :git/latest-commit)]
            (p/let [result (git/get-local-diffs repo remote-oid local-oid)]
              (reset! diffs result)
              (reset! remote-hash-id remote-oid)
              (doseq [{:keys [type path]} result]
                (when (contains? #{"add" "modify"}
                                 type)
                  (github/get-content
                   (handler/get-github-token)
                   repo
                   path
                   remote-oid
                   (fn [{:keys [repo-url path ref content]}]
                     (swap! state/state
                            assoc-in [:github/contents repo-url remote-oid path] content))
                   (fn [error]
                     ;; TODO:
                     )))))))))
     state)}
  [component]
  (let [diffs (rum/react diffs)
        remote-oid (rum/react remote-hash-id)
        repo (state/get-current-repo)
        contents (if remote-oid (state/sub [:github/contents repo remote-oid]))]
    (sidebar/sidebar
     [:div#diffs {:style {:margin-bottom 200}}
      [:h1 "Diffs"]
      (for [{:keys [type path]} diffs]
        [:div {:key path}
         path

         (if-let [content (get contents path)]
           (let [local-content (db/get-file path)
                 local-content local-content
                 diff (medley/indexed (diff/diff local-content content))]
             [:div.grid.grid-cols-2.gap-1
              [:div.pre-line-white-space
               [:h2 "Local"]
               local-content]
              [:div.pre-line-white-space
               [:h2 "Remote"]
               (for [[idx {:keys [added removed value]}] diff]
                 (let [bg-color (cond
                                  added "lightgreen"
                                  removed "salmon"
                                  :else
                                  "initital")]
                   [:span.diff {:key idx
                                :style {:background-color bg-color}}
                    value]))
               [:p.mt-3
                (ui/button "Use this"
                  (fn []
                    ;; overwrite the file
                    (handler/alter-file repo path content
                                        {:commit? false})
                    (rum/request-render component)))]]])
           [:div "loading..."])])

      [:div
       (ui/button "Commit"
         (fn []
           ;; overwrite the file
           (prn "Commit!")))]])))
