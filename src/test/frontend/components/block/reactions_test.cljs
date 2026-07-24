(ns frontend.components.block.reactions-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
            [frontend.components.block :as block]
            [frontend.db.hooks :as db-hooks]
            [frontend.handler.user :as user-handler]
            [goog.object :as gobj]))

(defn- render-static
  [element]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup react-dom-server element)
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(deftest block-reactions-request-one-final-summary-by-uuid-test
  (let [target-uuid (random-uuid)
        current-user-uuid (random-uuid)
        resource-calls (atom [])]
    (with-redefs [user-handler/user-uuid (constantly (str current-user-uuid))
                  db-hooks/use-resource
                  (fn [resource-key]
                    (swap! resource-calls conj resource-key)
                    [])]
      (is (= ""
             (render-static
              (block/block-reactions {:block/uuid target-uuid}))))
      (is (= [[:block-reactions target-uuid current-user-uuid]]
             @resource-calls)))))
