(ns frontend.clipboard-write-test
  "Tests for `writeClipboard` in src/main/frontend/utils.js against a stubbed
  `navigator.clipboard` that refuses what Firefox refuses."
  (:require ["/frontend/utils" :as utils]
            [cljs.test :refer [async deftest is testing]]
            [promesa.core :as p]))

(def ^:private blocks-type "web application/logseq")

(def ^:private copied
  {:text "- a\n- b"
   :html "<ul><li>a</li><li>b</li></ul>"
   :blocks "{:graph \"test\" :blocks []}"})

(defn- <write-clipboard
  "Calls `writeClipboard` with a fake window and resolves to
  {:outcome :written | :rejected, :items [type-set ...], :texts [string ...]}.
  `refuses-item?` and `throws-item?` take the set of types of a ClipboardItem;
  a refused write rejects, `throws-item?` makes the ClipboardItem constructor
  throw."
  [{:keys [refuses-item? throws-item? refuses-text?]
    :or {refuses-item? (constantly false)
         throws-item? (constantly false)}}]
  (let [written-items (atom [])
        written-texts (atom [])
        original-item-class (.-ClipboardItem js/globalThis)
        item-types (fn [^js item] (set (js/Object.keys (.-data item))))
        clipboard-item-class (fn [data]
                               (this-as this
                                 (when (throws-item? (set (js/Object.keys data)))
                                   (throw (js/TypeError. "Type not supported")))
                                 (set! (.-data this) data)
                                 this))
        clipboard #js {:write (fn [items]
                                (let [types (item-types (first items))]
                                  (if (refuses-item? types)
                                    (js/Promise.reject (js/Error. "NotAllowedError"))
                                    (do (swap! written-items conj types)
                                        (js/Promise.resolve nil)))))
                       :writeText (fn [text]
                                    (if refuses-text?
                                      (js/Promise.reject (js/Error. "NotAllowedError"))
                                      (do (swap! written-texts conj text)
                                          (js/Promise.resolve nil))))}]
    (set! (.-ClipboardItem js/globalThis) clipboard-item-class)
    (-> (utils/writeClipboard (clj->js copied) #js {:navigator #js {:clipboard clipboard}})
        (p/then (fn [_] :written))
        (p/catch (fn [_] :rejected))
        (p/then (fn [outcome]
                  {:outcome outcome :items @written-items :texts @written-texts}))
        (p/finally (fn [_ _]
                     (set! (.-ClipboardItem js/globalThis) original-item-class))))))

(defn- has-blocks-type?
  [item-types]
  (contains? item-types blocks-type))

(deftest write-clipboard-keeps-the-logseq-format-where-it-is-supported-test
  (async done
    (-> (p/let [{:keys [outcome items]} (<write-clipboard {})]
          (is (= :written outcome))
          (is (some has-blocks-type? items)
              "A browser that accepts the format receives the copied blocks.")
          (is (every? #(contains? % "text/plain") items)))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))

(deftest write-clipboard-falls-back-when-the-logseq-format-is-rejected-test
  (async done
    (-> (p/let [{:keys [outcome items]} (<write-clipboard {:refuses-item? has-blocks-type?})]
          (is (= :written outcome)
              "Firefox rejects the \"web application/logseq\" type; the copy still succeeds.")
          (is (seq items))
          (is (not-any? has-blocks-type? items))
          (is (every? #(contains? % "text/plain") items)
              "The fallback keeps the plain text.")
          (is (every? #(contains? % "text/html") items)
              "The fallback keeps the html."))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))

(deftest write-clipboard-falls-back-when-the-clipboard-item-constructor-throws-test
  (async done
    (-> (p/let [{:keys [outcome items]} (<write-clipboard {:throws-item? has-blocks-type?})]
          (is (= :written outcome))
          (is (seq items))
          (is (not-any? has-blocks-type? items)))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))

(deftest write-clipboard-falls-back-to-plain-text-test
  (async done
    (-> (p/let [{:keys [outcome items texts]} (<write-clipboard {:refuses-item? (constantly true)})]
          (is (= :written outcome))
          (is (empty? items))
          (is (= [(:text copied)] texts)
              "When no ClipboardItem can be written, writeText receives the text."))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))

(deftest write-clipboard-rejects-when-every-write-is-refused-test
  (async done
    (-> (p/let [{:keys [outcome items texts]} (<write-clipboard {:refuses-item? (constantly true)
                                                                 :refuses-text? true})]
          (testing "a caller that deletes after copying (cut) must be able to tell"
            (is (= :rejected outcome))
            (is (empty? items))
            (is (empty? texts))))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))
