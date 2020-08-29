(ns frontend.handler
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.config :as config]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.date :as date]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.file :as file-handler]))

(defn load-more-journals!
  []
  (let [current-length (:journals-length @state/state)]
    (when (< current-length (db/get-journals-length))
      (state/update-state! :journals-length inc))))

(defn- watch-for-date!
  []
  (js/setInterval #(state/set-today! (date/today))
                  10000))

(defn start!
  [render]
  (let [me (and js/window.user (bean/->clj js/window.user))
        logged? (:name me)
        repos (if logged?
                (:repos me)
                [{:url config/local-repo}])]
    (when me (state/set-state! :me me))
    (state/set-db-restoring! true)
    (render)

    (util/indexeddb-check?
     (fn [_error]
       (notification/show! "Sorry, it seems that your browser doesn't support IndexedDB, we recommend to use latest Chrome(Chromium) or Firefox(Non-private mode)." :error false)
       (state/set-indexedb-support? false)))

    (-> (p/all (db/restore! (assoc me :repos repos)
                            repo-handler/db-listen-to-tx!
                            (fn [repo]
                              (file-handler/restore-config! repo false)
                              (when (and (state/logged?)
                                         (db/cloned? repo)
                                         (not (db/get-today-journal repo)))
                                (repo-handler/read-repair-journals! repo)))))
        (p/then
         (fn []
           (if (and (not logged?)
                    (not (seq (db/get-files config/local-repo))))
             (repo-handler/setup-local-repo-if-not-exists!)
             (state/set-db-restoring! false))
           (watch-for-date!)
           (when (seq (:repos me))
             ;; FIXME: handle error
             (repo-handler/request-app-tokens!
              (fn []
                (repo-handler/clone-and-pull-repos me))
              (fn []
                (js/console.error "Failed to request GitHub app tokens.")))))))))
