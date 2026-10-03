(ns electron.mcp-native
  (:require [electron.mcp-compat :as compat]
            [promesa.core :as p]))

(defn get-block
  [api-fn args]
  (let [block-uuid (compat/validated-uuid (aget args "block_uuid"))]
    (p/let [response (api-fn "logseq.Editor.getBlock"
                            [block-uuid #js {:includeChildren false :includePage true :camelCase false}])
            block (some-> (js->clj response :keywordize-keys true) (dissoc :children))]
      (cond
        (and response (aget response "error"))
        (p/rejected (js/Error. (str (aget response "error"))))

        (and block (not= block-uuid (:uuid block)))
        (p/rejected (js/Error. "Application block API returned a different UUID"))

        :else
        (compat/block-result block-uuid (if block [block] []))))))