(ns logseq.shui.context
  (:require 
    [frontend.colors :as colors]
    [frontend.db :as db]
    [frontend.db.utils :as db-utils]
    [frontend.handler.search :as search-handler]
    [frontend.state :as state]))

(defn inline->inline-block [inline block-config]
  (fn [_context item]
    (inline block-config item)))

(defn inline->map-inline-block [inline block-config]
  (let [inline* (inline->inline-block inline block-config)]
    (fn [context col]
      (map #(inline* context %) col))))

(defn make-context [{:keys [block-config app-config inline int->local-time-2 blocks-container page-cp page]}]
  {;; Shui needs access to the global configuration of the application
   :config app-config
   ;; Until components are converted over, they need to fallback to the old inline function 
   ;; Wrap the old inline function to allow for interception, but fallback to the old inline function
   :inline-block (inline->inline-block inline block-config) 
   :map-inline-block (inline->map-inline-block inline block-config)
   ;; Currently frontend component are provided an object map containin at least the following keys:
   ;; These will be passed through in a whitelisted fashion so as to be able to track the dependencies  
   ;; back to the core application
   ;; TODO: document the following
   :block (:block block-config)  ;; the db entity of the current block
   :block? (:block? block-config)
   :blocks-container-id (:blocks-container-id block-config)
   :editor-box (:editor-box block-config)
   :id (:id block-config) 
   :mode? (:mode? block-config)
   :query-result (:query-result block-config)
   :sidebar? (:sidebar? block-config)
   :start-time (:start-time block-config)
   :uuid (:uuid block-config)
   :whiteboard? (:whiteboard? block-config)
   ;; Some functions from logseq's application will be used in the shui components. To avoid circular dependencies,
   ;; they will be provided via the context object
   :int->local-time-2 int->local-time-2
   ;; We need some variable from the state to carry over 
   :color-accent (state/get-color-accent) 
   :color-gradient (state/get-color-gradient)
   :sub-color-gradient-bg-styles state/sub-color-gradient-bg-styles 
   :sub-color-gradient-text-styles state/sub-color-gradient-text-styles
   :linear-gradient colors/linear-gradient
   :state state/state
   ;; Add search to context 
   :search search-handler/search
   :entity db-utils/entity
   :blocks-container blocks-container
   :get-block-and-children db/get-block-and-children
   :get-block-children db/get-block-children
   :get-current-repo state/get-current-repo
   :get-page-blocks-no-cache db/get-page-blocks-no-cache
   :get-page db/get-page
   :page-cp page-cp
   :page page})
