(ns ^:node-only logseq.publishing
  "This node only ns provides api fns for exporting a publishing app"
  (:require [logseq.publishing.export :as publish-export]
            [logseq.publishing.html :as publish-html]))

(defn- default-notification-fn [msg]
  (if (= "error" (:type msg))
    (throw (ex-info (:payload msg) {}))
    (js/console.log (:payload msg))))

(defn export
  "Exports the given graph-dir and db to the specific output-dir. Most of the graph
configuration is done through logseq/config.edn. There are a few explicit options that
can be passed:
* :ui/theme - Theme mode that can either be 'light' or 'dark'.
* :ui/radix-color - Accent color. See available values in Settings.
* :default-notification-fn - Configure how errors are reported when creating the export.
  Default is to throw an exception when it occurs."
  [db static-dir graph-dir output-dir {:keys [notification-fn dev?]
                                       :or {notification-fn default-notification-fn}
                                       :as options}]
  (let [options' (cond-> options
                   (:ui/theme options)
                   (assoc-in [:app-state :ui/theme] (:ui/theme options))
                   (:ui/radix-color options)
                   (assoc-in [:app-state :ui/radix-color] (:ui/radix-color options)))
        {:keys [html asset-filenames]} (publish-html/build-html db options')]
    (publish-export/create-export html static-dir graph-dir output-dir {:asset-filenames asset-filenames
                                                                        :notification-fn notification-fn
                                                                        :dev? dev?})))
