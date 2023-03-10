(ns frontend.fs.sync-schema
  "malli schema for frontend.fs.sync"
  (:require [cljs-time.core :as t]))


(def graph-uuid-schema
  [:string {:min 36 :max 36}])

(def state-schema
  [:enum
   :frontend.fs.sync/starting
   :frontend.fs.sync/need-password
   :frontend.fs.sync/idle
   :frontend.fs.sync/local->remote
   :frontend.fs.sync/remote->local
   :frontend.fs.sync/local->remote-full-sync
   :frontend.fs.sync/remote->local-full-sync
   :frontend.fs.sync/pause
   :frontend.fs.sync/stop])

(def recent-remote->local-file-item-schema
  [:map {:closed true}
   [:remote->local-type [:enum :delete :update]]
   [:checksum :string]
   [:path :string]])

(def history-item-schema
  [:and
   [:map {:closed true}
    [:path :string]
    [:time :any]]
   [:fn #(t/date? (:time %))]])

(def ^:private file-change-event-schema
  [:fn #(= "frontend.fs.sync/FileChangeEvent" (type->str (type %)))])

(def ^:private file-metadata-schema
  [:fn #(= "frontend.fs.sync/FileMetadata" (type->str (type %)))])

(def sync-state-schema
  [:map {:closed true}
   [:current-syncing-graph-uuid [:maybe graph-uuid-schema]]
   [:state state-schema]
   [:full-local->remote-files [:set file-change-event-schema]]
   [:full-remote->local-files [:set file-metadata-schema]]
   [:current-local->remote-files [:set :string]]
   [:current-remote->local-files [:set :string]]
   [:queued-local->remote-files [:set file-change-event-schema]]
   ;; Downloading files from remote will trigger filewatcher events,
   ;; causes unreasonable information in the content of :queued-local->remote-files,
   ;; use :recent-remote->local-files to filter such events
   [:recent-remote->local-files [:set recent-remote->local-file-item-schema]]
   [:history [:sequential history-item-schema]]])

(def diff-schema
  [:map {:closed true}
   [:TXId [:int {:min 1}]]
   [:TXType [:enum "update_files" "delete_files" "rename_file"]]
   [:TXContent [:sequential
                [:catn
                 [:to-path :string]
                 [:from-path [:maybe :string]]
                 [:checksum [:maybe :string]]]]]])



(def sync-local->remote!-result-schema
  [:or
   [:enum {:desc "add first map to avoid {:succ true} be treated as the property map "}
    {:succ true}
    {:stop true}
    {:pause true}
    {:need-sync-remote true}
    {:graph-has-been-deleted true}]
   [:map {:closed true}
    [:unknown :some]]])


(def sync-remote->local!-result-schema
  [:or
   [:enum {:desc "add first map to avoid {:succ true} be treated as the property map "}
    {:succ true}
    {:stop true}
    {:pause true}
    {:need-remote->local-full-sync true}]
   [:map {:closed true}
    [:unknown :some]]])

(def sync-local->remote-all-files!-result-schema
  [:or
   [:enum {:desc "add first map to avoid {:succ true} be treated as the property map "}
    {:succ true}
    {:stop true}
    {:need-sync-remote true}
    {:graph-has-been-deleted true}]
   [:map {:closed true}
    [:unknown :some]]])
