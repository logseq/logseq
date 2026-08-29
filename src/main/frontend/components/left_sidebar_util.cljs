(ns frontend.components.left-sidebar-util
  (:require [logseq.common.uuid :as common-uuid]))

(def tag-nav-class-idents
  "Built-in class pages that can appear under Navigations."
  {:tag/tasks :logseq.class/Task
   :tag/assets :logseq.class/Asset})

(defn built-in-class-uuid
  "Page uuid for a built-in class. This is a function of :db/ident and does not
   need the db worker or a restored datascript conn."
  [class-ident]
  (common-uuid/gen-uuid :db-ident-block-uuid class-ident))

(defn built-in-nav-class-ident->uuid
  "Task and Asset page uuids for sidebar tag navigations."
  []
  (into {}
        (map (fn [[_nav class-ident]]
               [class-ident (built-in-class-uuid class-ident)]))
        tag-nav-class-idents))

(defn nav-class-ident->uuid
  "Resolves tag-nav class page uuids without waiting for worker/conn readiness.
   File graphs have no built-in Task/Asset class pages."
  [db-graph?]
  (when db-graph?
    (built-in-nav-class-ident->uuid)))

(defn tag-nav-page-uuid
  "Returns the class page uuid for a tag nav when it is present and non-nil."
  [nav class-ident->uuid]
  (when-let [class-ident (get tag-nav-class-idents nav)]
    (get class-ident->uuid class-ident)))

(defn visible-tag-navs
  "Checked tag navigations that should mount in the sidebar."
  [checked-navs class-ident->uuid]
  (filterv #(tag-nav-page-uuid % class-ident->uuid) checked-navs))

(defn mobile-navigation-target?
  [target]
  (boolean
   (some (fn [selector] (.closest target selector))
         [".sidebar-navigations a"
          ".favorites .bd"
          ".recent .bd"
          ".nav-header"])))
