(ns frontend.handler.project
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.config :as config]
            [frontend.handler :as handler]))

;; project exists and current user owns it
;; if project not exists, the server will create it
(defn project-exists?
  [project]
  (let [projects (set (map :name (:projects (state/get-me))))]
    (and (seq projects) (contains? projects project))))

(defn create!
  ([ok-handler]
   (create! (state/get-current-project) ok-handler))
  ([project ok-handler]
   (let [config (state/get-config)]
     (let [data {:name project
                 :description (get config :description "")
                 :repo (state/get-current-repo)}]
       (util/post (str config/api "projects")
                  data
                  (fn [result]
                    (swap! state/state
                           update-in [:me :projects]
                           (fn [projects]
                             (util/distinct-by :name (conj projects result))))
                    (ok-handler project))
                  (fn [error]
                    (js/console.dir error)
                    (handler/show-notification! (util/format "Project \"%s\" already taken, please change to another name." project) :error)))))))

(defn exists-or-create!
  [ok-handler]
  (if-let [project (state/get-current-project)]
    (if (project-exists? project)
      (ok-handler project)
      (create! ok-handler))
    (state/set-state! :modal/input-project true)))

(defn add-project!
  [project]
  (handler/set-config! :project project)
  (create! project
           (fn []
             (handler/show-notification! (util/format "Project \"%s\" was created successfully." project) :success)
             (state/set-state! :modal/input-project false))))
