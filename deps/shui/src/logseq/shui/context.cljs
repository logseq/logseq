(ns logseq.shui.context)

(defn inline->inline-block [inline block-config]
  (fn [_context item]
    (inline block-config item)))

(defn inline->map-inline-block [inline block-config]
  (let [inline* (inline->inline-block inline block-config)]
    (fn [context col]
      (map #(inline* context %) col))))

(defn make-context [{:keys [block-config config inline int->local-time-2 blocks-container page-cp page] :as props}]
  (merge props {;; Until components are converted over, they need to fallback to the old inline function
                ;; Wrap the old inline function to allow for interception, but fallback to the old inline function
                :inline-block (inline->inline-block inline block-config)
                :map-inline-block (inline->map-inline-block inline block-config)
                ;; Currently frontend component are provided an object map containing at least the following keys:
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
                :whiteboard? (:whiteboard? block-config)}))
