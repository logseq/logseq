(ns frontend.components.page-title-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.page :as page]
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

(defn- render-page-title
  "Renders `db-page-title` with a block container that only shows whether it
   was given the hover action row."
  [option]
  (with-redefs [block/block-container
                (fn [config _page]
                  (react/createElement
                   "div" nil
                   (when (:page-title-actions-cp config)
                     (react/createElement "span" #js {:className "page-title-actions-marker"}))))]
    (render-static
     (page/db-page-title {:db/id 1
                          :block/uuid (random-uuid)
                          :block/title "Preview page"}
                         option))))

(deftest page-title-shows-hover-actions-outside-the-preview-popup-test
  (is (string/includes? (render-page-title {}) "page-title-actions-marker")
      "The page title keeps the Add icon and Set property row on a full page."))

(deftest page-title-hides-hover-actions-in-the-preview-popup-test
  (is (not (string/includes? (render-page-title {:preview? true}) "page-title-actions-marker"))
      "The preview popup shows no hover action row: it sits above the title and is clipped by the popup."))
