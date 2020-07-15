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
  []
  (let [projects (set (map :name (:projects (state/get-me))))]
    (when-let [project (:project (state/get-config))]
      (when-not (string/blank? project)
        (and (seq projects) (contains? projects project))))))

(defn create!
  [ok-handler]
  (let [config (state/get-config)
        project (:project config)]
    (if-not (string/blank? project)
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
                     (handler/show-notification! (util/format "Project \"%s\" already exists, please change another name." project) :error))))
      (handler/show-notification! "Please add a project name like `:project \"your-project-name\"` in the file logseq/config.edn." :error))))

(defn exists-or-create!
  [create-ok-handler]
  (when-not (project-exists?)
    (create! create-ok-handler)))
