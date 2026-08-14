(ns frontend.extensions.pdf.assets-test
  (:require [cljs.test :as test :refer [are async deftest testing]]
            [frontend.db.async :as db-async]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.util :as util]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [promesa.core :as p]))

(deftest highlight-color-id-loads-closed-values-through-worker-test
  (async done
    (let [calls (atom [])
          original-get-property-closed-values db-async/<get-property-closed-values]
      (set! db-async/<get-property-closed-values
            (fn [repo property-id]
              (swap! calls conj [repo property-id])
              (p/resolved [{:db/id 1 :block/title "blue"}
                           {:db/id 2 :block/title "yellow"}])))
      (-> (pdf-assets/<highlight-color-id "test" "yellow")
          (p/then
           (fn [color-id]
             (test/is (= 2 color-id))
             (test/is (= [["test" :logseq.property.pdf/hl-color]] @calls))))
          (p/catch
           (fn [error]
             (test/is false (str error))))
          (p/finally
           (fn []
             (set! db-async/<get-property-closed-values original-get-property-closed-values)
             (done)))))))

(deftest fix-local-asset-pagename
  (testing "matched filenames"
    (are [x y] (= y (pdf-utils/fix-local-asset-pagename x))
      "2015_Book_Intertwingled_1659920114630_0" "2015 Book Intertwingled"
      "hls__2015_Book_Intertwingled_1659920114630_0" "2015 Book Intertwingled"
      "hls/2015_Book_Intertwingled_1659920114630_0" "hls/2015 Book Intertwingled"
      "hls__sicp__-1234567" "sicp"))
  (testing "non matched filenames"
    (are [x y] (= y (pdf-utils/fix-local-asset-pagename x))
      "foo" "foo"
      "foo_bar" "foo_bar"
      "foo__bar" "foo__bar"
      "foo_bar.pdf" "foo_bar.pdf")))

(deftest inflate-asset-normalizes-local-assets-url-on-windows
  (with-redefs [util/electron? (constantly true)
                util/win32? true]
    (test/is (= "assets:///C/logseq__colon/Users/charlie/sicp.pdf"
                (:url (pdf-assets/inflate-asset
                       "C:/Users/charlie/sicp.pdf"
                       {:href "assets:///C:/Users/charlie/sicp.pdf"}))))))
