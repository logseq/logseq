(ns frontend.page-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.page :as page]))

(def ^:private page-uuid #uuid "11111111-1111-1111-1111-111111111111")
(def ^:private parent-uuid #uuid "22222222-2222-2222-2222-222222222222")

(defn- page-route
  [name]
  {:path (str "/page/" name)
   :data {:name :page}
   :parameters {:path {:name name}}})

(defn- page-block-route
  [page-name block-route-name]
  {:path (str "/page/" page-name "/block/" block-route-name)
   :data {:name :page-block}
   :parameters {:path {:name page-name
                       :block-route-name block-route-name}}})

(defn- ready-paint
  [block-uuid title & {:keys [zoomed?]}]
  {:status :ready
   :page (cond-> {:block/uuid block-uuid
                  :block/title title}
           zoomed?
           (assoc :block/page {:db/id 1}))})

(deftest route-view-key-stays-stable-when-page-title-path-changes-test
  (let [paint (ready-paint page-uuid "Notes")
        by-uuid (page-route (str page-uuid))
        by-title (page-route "Notes")
        by-renamed (page-route "Renamed")]
    (is (= (str page-uuid)
           (page/route-view-key by-uuid paint)
           (page/route-view-key by-title paint)
           (page/route-view-key by-renamed paint))
        "Route-view keeps the same page mounted when only the title/path name changes.")))

(deftest route-view-key-stays-stable-when-zoomed-parent-title-changes-test
  (let [paint (ready-paint parent-uuid "parent" :zoomed? true)
        renamed (ready-paint parent-uuid "parent edited" :zoomed? true)
        by-uuid (page-route (str parent-uuid))
        by-heading (page-block-route "Notes" "parent")
        by-renamed-heading (page-block-route "Notes" "parent edited")]
    (is (= (str parent-uuid)
           (page/route-view-key by-uuid paint)
           (page/route-view-key by-uuid renamed)
           (page/route-view-key by-heading paint)
           (page/route-view-key by-renamed-heading renamed))
        "Zoomed parent title edits do not remount the child tree.")))
