(ns frontend.components.property.property-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.components.property :as property-component]
            [frontend.components.property.config :as property-config]
            [frontend.components.property.default-value :as property-default-value]
            [frontend.components.property.value :as property-value]
            [frontend.db.async :as db-async]
            [frontend.db.hooks :as db-hooks]
            [frontend.handler.property :as property-handler]
            [goog.object :as gobj]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

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

(deftest property-configuration-subscribes-to-current-property-data-test
  (let [property-uuid (random-uuid)
        owner-uuid (random-uuid)
        property {:block/uuid property-uuid
                  :db/ident :user.property/choices}
        owner {:block/uuid owner-uuid}
        calls (atom [])]
    (with-redefs [db-hooks/use-block
                  (fn [block-uuid]
                    (swap! calls conj block-uuid)
                    (cond
                      (= block-uuid property-uuid)
                      (assoc property :property/closed-values [{:db/id 1}])

                      (= block-uuid owner-uuid)
                      owner))]
      (render-static (property-config/property-dropdown property owner {}))
      (is (= [property-uuid owner-uuid] @calls)
          "Property configuration must subscribe instead of retaining popup snapshots."))))

(deftest default-value-editor-subscribes-to-current-property-data-test
  (let [property-uuid (random-uuid)
        property {:block/uuid property-uuid
                  :db/ident :user.property/default}
        calls (atom [])]
    (with-redefs [db-hooks/use-block
                  (fn [block-uuid]
                    (swap! calls conj block-uuid)
                    property)]
      (render-static (property-default-value/default-value-config property))
      (is (= [property-uuid] @calls)
          "The default-value editor must own a live property subscription."))))

(defn- property-source
  []
  (.toString
   (fs/readFileSync
    (node-path/join (.cwd js/process)
                    "src/main/frontend/components/property.cljs")
    "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (some->> ["\n(hsx/defc "
                            "\n(defn"
                            "\n(def "]
                           (keep #(string/index-of source % (inc start)))
                           seq
                           (apply min))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(deftest available-choices-subscribe-to-current-choice-data-test
  (let [source (.toString
                (fs/readFileSync
                 (node-path/join
                  (.cwd js/process)
                  "src/main/frontend/components/property/config.cljs")
                 "utf8"))
        choices-source (form-source source "(hsx/defc choices-sub-pane")]
    (is (some? choices-source))
    (when choices-source
      (is (string/includes? choices-source "db-hooks/use-resource"))
      (is (string/includes? choices-source
                            "[:property-choices (:block/uuid property)]")))))

(def ^:private local-derived-read-markers
  ["block.temp/"
   "db-async/"
   "react/q"
   "db-hooks/use-query"
   "rfx/use-entity"
   "hooks/use-effect"
   "hooks/use-state"
   "hooks/use-atom"])

(defn- hook-names
  [source]
  (set (re-seq #"db-hooks/[a-z-]+" source)))

(defn- assert-no-local-derived-read!
  [source]
  (doseq [marker local-derived-read-markers]
    (is (not (string/includes? source marker))
        (str "Unexpected local graph read: " marker))))

(deftest removing-status-from-task-view-preserves-task-tag-test
  (async done
         (let [block-id (random-uuid)
               calls* (atom [])
               block {:block/uuid block-id}
               status-property {:db/ident :logseq.property/status}
               on-chosen (#'property-component/property-input-on-chosen
                          block (atom nil) (atom nil) nil
                          {:remove-property? true
                           :view-parent {:db/ident :logseq.class/Task}})]
           (p/with-redefs [db-async/<get-block (fn [& _] (p/resolved status-property))
                           property-value/batch-operation? (constantly false)
                           property-value/get-operating-blocks (fn [_] [block])
                           property-handler/batch-remove-block-property!
                           (fn [& args] (swap! calls* conj args))
                           shui/popup-hide! (constantly nil)]
             (-> (on-chosen {:value :logseq.property/status
                             :property status-property})
                 (p/then (fn []
                           (is (= [[[block-id]
                                   :logseq.property/status
                                   {:preserve-task-tag? true}]]
                                  @calls*))))
                 (p/catch (fn [error]
                            (is false (str error))))
                 (p/finally done))))))

(deftest choosing-existing-closed-value-property-reuses-picker-data-test
  (async done
         (let [block {:block/uuid (random-uuid)}
               property {:block/uuid (random-uuid)
                         :db/ident :user.property/priority
                         :block/tags [{:db/ident :logseq.class/Property}]
                         :logseq.property/type :default
                         :property/closed-values
                         [{:block/uuid (random-uuid)
                           :block/title "High"}]}
               *property (atom nil)
               *property-key (atom nil)
               *show-new-property-config? (atom true)
               on-chosen (#'property-component/property-input-on-chosen
                          block *property *property-key
                          *show-new-property-config? {})]
           (p/with-redefs [db-async/<get-block
                           (fn [& _]
                             (throw (js/Error. "Picker data must avoid a second block fetch")))
                           property-value/batch-operation? (constantly false)]
             (-> (on-chosen {:value (:block/uuid property)
                             :label "Priority"
                             :property property})
                 (p/then (fn []
                           (is (= property @*property))
                           (is (= "Priority" @*property-key))
                           (is (false? @*show-new-property-config?))))
                 (p/catch (fn [error]
                            (is false (str error))))
                 (p/finally done))))))

(deftest toggle-hidden-properties-visibility-test
  (let [block-uuid (random-uuid)]
    (is (false? (property-component/hidden-properties-visible? block-uuid)))
    (property-component/toggle-hidden-properties-visibility! block-uuid)
    (is (true? (property-component/hidden-properties-visible? block-uuid)))
    (property-component/toggle-hidden-properties-visibility! block-uuid)
    (is (false? (property-component/hidden-properties-visible? block-uuid)))))

(deftest show-property-panel-edit-button-test
  (is (false? (#'property-component/show-property-panel-edit-button?
               {:logseq.property/type :date}
               {}))
      "Date edit button should be hidden outside bottom properties")
  (is (false? (#'property-component/show-property-panel-edit-button?
               {:logseq.property/type :datetime}
               {}))
      "Datetime edit button should be hidden outside bottom properties")
  (is (true? (#'property-component/show-property-panel-edit-button?
              {:logseq.property/type :datetime}
              {:property-position :block-below}))
      "Datetime edit button should be shown for bottom properties"))

(deftest show-property-panel-bullet-for-closed-value-test
  (is (true?
       (boolean
        (#'property-component/show-property-panel-bullet?
         {:logseq.property/type :default
          :property/closed-values [{:db/id 1}]}
         {:db/id 1}))))
  (is (false?
       (#'property-component/show-property-panel-bullet?
        {:logseq.property/type :default}
        {:db/id 1}))))

(deftest display-properties-use-one-complete-explicit-resource-key-test
  (let [source (property-source)
        key-source (form-source source "(defn- display-properties-resource-key")
        consumer-source (form-source source "(defn- use-display-properties")]
    (is (some? key-source)
        "Display properties expose one serializable resource-key builder.")
    (when key-source
      (is (string/includes? key-source ":block-display-properties"))
      (is (string/includes? key-source "block-uuid"))
      (doseq [context-key [":gallery-view?"
                           ":page-title?"
                           ":sidebar-properties?"
                           ":tag-dialog?"
                           ":publishing?"
                           ":state-hide-empty-properties?"
                           ":show-empty-and-hidden-properties?"]]
        (is (string/includes? key-source context-key)
            (str "Missing display context: " context-key))))
    (is (some? consumer-source))
    (when consumer-source
      (is (= #{"db-hooks/use-resource"} (hook-names consumer-source)))
      (is (string/includes? consumer-source "display-properties-resource-key"))
      (assert-no-local-derived-read! consumer-source))))

(deftest display-property-rows-hydrate-only-their-property-uuid-test
  (let [source (property-source)
        row-source (form-source source "(hsx/defc property-cp")]
    (is (some? row-source))
    (when row-source
      (is (string/includes? row-source "property-uuid"))
      (is (string/includes? row-source
                            "(db-hooks/use-block property-uuid)"))
      (is (= #{"db-hooks/use-block"} (hook-names row-source)))
      (assert-no-local-derived-read! row-source))))

(deftest bidirectional-properties-use-one-explicit-resource-test
  (let [source (property-source)
        area-source (form-source source "(hsx/defc bidirectional-properties-area")]
    (is (some? area-source))
    (when area-source
      (is (string/includes? area-source ":block-bidirectional-properties"))
      (is (string/includes? area-source "block-uuid"))
      (is (= #{"db-hooks/use-resource"} (hook-names area-source)))
      (is (not (string/includes? area-source "load-bidirectional-properties")))
      (is (not (string/includes? area-source "bundled-bidirectional-properties")))
      (assert-no-local-derived-read! area-source))))

(deftest bidirectional-groups-hydrate-class-and-entity-uuids-at-row-boundaries-test
  (let [source (property-source)
        group-source (form-source source "(hsx/defc bidirectional-property-group")
        values-source (form-source source "(hsx/defc bidirectional-values-cp")]
    (is (some? group-source)
        "Each class tab owns one canonical class subscription.")
    (when group-source
      (is (string/includes? group-source "class-uuid"))
      (is (string/includes? group-source "entity-uuids"))
      (is (string/includes? group-source "(db-hooks/use-block class-uuid)"))
      (is (= #{"db-hooks/use-block"} (hook-names group-source)))
      (assert-no-local-derived-read! group-source))
    (is (some? values-source))
    (when values-source
      (is (string/includes? values-source "entity-uuids"))
      (is (string/includes? values-source
                            "blocks-container config entity-uuids"))
      (is (not (string/includes? values-source "[entities]"))
          "Bidirectional values cross the UI boundary only as UUIDs."))))
