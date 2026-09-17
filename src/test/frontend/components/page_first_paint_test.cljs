(ns frontend.components.page-first-paint-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.page :as page]
            [frontend.db.hooks :as db-hooks]
            [frontend.routes :as routes]
            [frontend.state :as state]))

(def ^:private tag-page
  {:block/title "Tag"
   :block/tags [{:db/ident :logseq.class/Tag}]})

(def ^:private plain-page
  {:block/title "Notes"
   :block/tags [{:db/ident :logseq.class/Page}]})

(deftest class-pages-paint-the-objects-table-before-children-test
  (is (>= @#'page/class-page-below-fold-delay-ms 400)
      "Linked refs must wait so they cannot steal the first table snapshot batch.")
  (is (true? (#'page/defer-class-page-below-fold? tag-page {}))
      "Tags and Movies must paint class-objects before children and linked refs.")
  (is (false? (#'page/defer-class-page-below-fold? tag-page {:sidebar? true})))
  (is (false? (#'page/defer-class-page-below-fold? tag-page {:tag-dialog? true})))
  (is (false? (#'page/defer-class-page-below-fold? plain-page {}))
      "Ordinary pages still load their block tree on first paint."))

(def ^:private page-uuid #uuid "11111111-1111-1111-1111-111111111111")
(def ^:private parent-uuid #uuid "22222222-2222-2222-2222-222222222222")

(defn- page-paint
  "Runs `use-page-paint` against canned snapshots and records the resource
   keys it reads."
  [option {:keys [resources block]}]
  (let [resource-keys (atom [])]
    (with-redefs [db-hooks/use-resource-snapshot
                  (fn [resource-key]
                    (swap! resource-keys conj resource-key)
                    (if resource-key
                      (get resources resource-key {:status :loading})
                      {:status :ready :value nil}))
                  db-hooks/use-block-projection-snapshot
                  (fn [block-uuid project]
                    (if block-uuid
                      (cond-> (get block block-uuid {:status :loading})
                        (= :ready (:status (get block block-uuid)))
                        (update :value project))
                      {:status :ready :value nil}))]
      {:paint (page/use-page-paint option)
       :resource-keys @resource-keys})))

(def ^:private route-option
  {:parameters {:path {:name (str page-uuid)}}
   :current-page? true})

(deftest page-paint-waits-for-identity-page-and-breadcrumb-test
  (let [identity-key [:page-identity (str page-uuid)]
        breadcrumb-key [:block-breadcrumb page-uuid 16]
        zoomed-block {:block/uuid page-uuid
                      :block/tx-id 3
                      :block/title "child"
                      :block/page {:db/id 1}}
        breadcrumb-ancestors [{:block/uuid parent-uuid :block/title "parent"}]]
    (is (= {:status :loading}
           (:paint (page-paint route-option {})))
        "Nothing paints before the route lookup resolves.")
    (is (= {:status :loading}
           (:paint (page-paint route-option
                               {:resources {identity-key {:status :ready :value page-uuid}}})))
        "A resolved uuid still waits for its block snapshot.")
    (let [{:keys [paint resource-keys]}
          (page-paint route-option
                      {:resources {identity-key {:status :ready :value page-uuid}}
                       :block {page-uuid {:status :ready :value zoomed-block}}})]
      (is (= {:status :loading} paint)
          "A zoomed block waits for its breadcrumb so the trail paints with the body.")
      (is (= [identity-key breadcrumb-key] resource-keys)))
    (is (= {:status :ready
            :page (assoc (dissoc zoomed-block :block/tx-id)
                         :block.temp/breadcrumb breadcrumb-ancestors)}
           (:paint (page-paint route-option
                               {:resources {identity-key {:status :ready :value page-uuid}
                                            breadcrumb-key {:status :ready
                                                            :value {:target-uuid page-uuid
                                                                    :ancestor-uuids [parent-uuid]
                                                                    :ancestors breadcrumb-ancestors
                                                                    :ref-titles {}}}}
                                :block {page-uuid {:status :ready :value zoomed-block}}})))
        "The first paint carries the breadcrumb inline instead of subscribing later.")))

(deftest page-paint-skips-breadcrumb-for-pages-and-reports-missing-pages-test
  (let [identity-key [:page-identity (str page-uuid)]
        page-block {:block/uuid page-uuid
                    :block/tx-id 3
                    :block/title "Notes"
                    :block/tags [{:db/ident :logseq.class/Page}]}
        {:keys [paint resource-keys]}
        (page-paint route-option
                    {:resources {identity-key {:status :ready :value page-uuid}}
                     :block {page-uuid {:status :ready :value page-block}}})]
    (is (= {:status :ready :page (dissoc page-block :block/tx-id)} paint))
    (is (= [identity-key nil] resource-keys)
        "Pages never request a breadcrumb resource.")
    (is (= {:status :ready :page nil}
           (:paint (page-paint route-option
                               {:resources {identity-key {:status :ready :value nil}}})))
        "An unresolved lookup is a ready not-found paint, not a pending one.")
    (is (= {:status :ready :page nil}
           (:paint (page-paint route-option
                               {:resources {identity-key {:status :ready :value page-uuid}}
                                :block {page-uuid {:status :missing}}})))
        "A missing block is a ready not-found paint.")
    (is (= {:status :empty} (:paint (page-paint nil {})))
        "Non-page routes gate through the same hooks with nothing to load.")))

(deftest only-page-routes-hold-the-previous-view-test
  (let [page-route {:path (str "/page/" page-uuid)
                    :data {:name :page}
                    :parameters {:path {:name (str page-uuid)}}}
        home-route {:path "/" :data {:name :home}}
        ready? (fn [route-match snapshots]
                 (with-redefs [db-hooks/use-resource-snapshot
                               (fn [resource-key]
                                 (if resource-key
                                   (get snapshots resource-key {:status :loading})
                                   {:status :ready :value nil}))
                               db-hooks/use-block-projection-snapshot
                               (fn [block-uuid _project]
                                 (if block-uuid
                                   (get snapshots block-uuid {:status :loading})
                                   {:status :ready :value nil}))]
                   (routes/use-route-paint-ready? route-match)))]
    (is (true? (ready? home-route {}))
        "Routes without async snapshots swap in immediately.")
    (is (false? (ready? page-route {}))
        "A page route keeps the previous view until its lookup resolves.")
    (is (true? (ready? page-route {[:page-identity (str page-uuid)] {:status :ready :value page-uuid}
                                   page-uuid {:status :ready
                                              :value {:block/uuid page-uuid
                                                      :block/tx-id 1
                                                      :block/title "Notes"}}})))))

(defn- page-option
  [name]
  {:page-name name
   :parameters {:path {:name name}}
   :current-page? true})

(defn- ready-page-paint
  [block-uuid title & {:keys [zoomed?]}]
  {:status :ready
   :page (cond-> {:block/uuid block-uuid
                  :block/title title}
           zoomed?
           (assoc :block/page {:db/id 1}))})

(deftest page-component-key-stays-stable-when-page-title-path-changes-test
  (with-redefs [state/get-current-repo (constantly "repo")]
    (let [paint (ready-page-paint page-uuid "Notes")]
      (is (= (str "repo-" page-uuid)
             (#'page/page-component-key (page-option (str page-uuid)) paint)
             (#'page/page-component-key (page-option "Notes") paint)
             (#'page/page-component-key (page-option "Renamed") paint))
          "The page component key ignores title/path name edits for the same page uuid.")
      (is (not= (#'page/page-component-key (page-option (str page-uuid)) paint)
                (#'page/page-component-key
                 (page-option (str parent-uuid))
                 (ready-page-paint parent-uuid "Other")))
          "Navigating to a different page remounts."))))

(deftest zoomed-parent-title-edits-do-not-change-child-tree-key-test
  (with-redefs [state/get-current-repo (constantly "repo")]
    (let [paint (ready-page-paint parent-uuid "parent" :zoomed? true)
          renamed (ready-page-paint parent-uuid "parent edited" :zoomed? true)
          option (page-option (str parent-uuid))
          heading-option {:page-name "Notes"
                          :parameters {:path {:name "Notes"
                                              :block-route-name "parent"}}
                          :current-page? true}
          renamed-heading-option (assoc-in heading-option
                                           [:parameters :path :block-route-name]
                                           "parent edited")]
      (is (= (str parent-uuid)
             (#'page/page-inner-key (:page paint))
             (#'page/page-inner-key (:page renamed)))
          "The child tree's React key stays on the zoomed block uuid while its title changes.")
      (is (= (str "repo-" parent-uuid)
             (#'page/page-component-key option paint)
             (#'page/page-component-key option renamed)
             (#'page/page-component-key heading-option paint)
             (#'page/page-component-key renamed-heading-option renamed))
          "Zoomed parent title edits do not remount the page tree."))))

