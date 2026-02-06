(ns frontend.handler.reaction
  "Reactions handler"
  (:require [frontend.handler.notification :as notification]
            [frontend.handler.user :as user-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.reaction :as reaction]))

(defn toggle-reaction!
  [target-uuid emoji-id]
  (if (reaction/emoji-id-valid? emoji-id)
    (let [user-uuid (when-let [id-str (user-handler/user-uuid)]
                      (uuid id-str))]
      (ui-outliner-tx/transact! {:outliner-op :toggle-reaction}
                                (outliner-op/toggle-reaction! target-uuid emoji-id user-uuid)))
    (do
      (notification/show! "Unsupported reaction emoji." :warning)
      false)))
