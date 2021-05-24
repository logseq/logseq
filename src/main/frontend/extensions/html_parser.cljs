(ns frontend.extensions.html-parser
  (:require [goog.object :as gobj]
            [hickory.core :as hickory]
            [cljs.core.match :refer-macros [match]]
            [frontend.config :as config]
            [frontend.util :as util]
            [clojure.string :as string]
            [clojure.walk :as walk]))

(defonce *inside-pre? (atom false))
(defn- hiccup-without-style
  [hiccup]
  (walk/postwalk (fn [f]
                   (if (map? f)
                     (dissoc f :style)
                     f)) hiccup))

(defn- export-hiccup
  [hiccup]
  (util/format "#+BEGIN_EXPORT hiccup\n%s\n#+END_EXPORT"

               (str (hiccup-without-style hiccup))))

(defn hiccup->doc-inner
  [format hiccup]
  (let [transform-fn (fn [hiccup]
                       (hiccup->doc-inner format hiccup))
        block-pattern (config/get-block-pattern format)
        map-join (fn [children] (apply str (map transform-fn children)))
        block-transform (fn [level children]
                          (str (apply str (repeat level block-pattern))
                               " "
                               (->> (map transform-fn children)
                                    (string/join " "))
                               "\n"))
        emphasis-transform (fn [tag attrs children]
                             (let [pattern (cond
                                             (contains? #{:b :strong} tag)
                                             (config/get-bold format)
                                             (contains? #{:i :em} tag)
                                             (config/get-italic format)
                                             (contains? #{:ins} tag)
                                             (config/get-underline format)
                                             (contains? #{:del} tag)
                                             (config/get-strike-through format)
                                             (contains? #{:mark} tag)
                                             (config/get-highlight format)
                                             :else
                                             nil)]
                               (str pattern (map-join children) pattern)))
        wrapper (fn [tag content]
                  (cond
                    (contains? #{:p :hr :ul :ol :dl :table :pre :blockquote :aside :canvas
                                 :center :figure :figcaption :fieldset :div :footer
                                 :header} tag)
                    (str "\n\n" content "\n\n")

                    (contains? #{:thead :tr :li} tag)
                    (str content "\n")

                    :else
                    content))
        single-hiccup-transform
        (fn [x]
          (do
            (cond
              (vector? x)
              (let [[tag attrs & children] x
                    result (match tag
                             :head nil
                             :h1 (block-transform 1 children)
                             :h2 (block-transform 2 children)
                             :h3 (block-transform 3 children)
                             :h4 (block-transform 4 children)
                             :h5 (block-transform 5 children)
                             :h6 (block-transform 6 children)
                             :a (let [href (:href attrs)
                                      title (:title attrs)
                                      label (map-join children)
                                      has-img-tag? (util/safe-re-find #"\[:img" (str x))]
                                  (if has-img-tag?
                                    (export-hiccup x)
                                    (case format
                                      :markdown (util/format "[%s](%s)" label href)
                                      :org (util/format "[[%s][%s]]" href label)
                                      nil)))
                             :img (let [src (:src attrs)
                                        alt (:alt attrs)]
                                    (case format
                                      :markdown (util/format "![%s](%s)" alt src)
                                      :org (util/format "[[%s][%s]]" src alt)
                                      nil))
                             :p (util/format "%s"
                                             (map-join children))

                             :hr (config/get-hr format)

                             (_ :guard #(contains? #{:b :strong
                                                     :i :em
                                                     :ins
                                                     :del
                                                     :mark} %))
                             (emphasis-transform tag attrs children)

                             :code (if @*inside-pre?
                                     (map-join children)
                                     (let [pattern (config/get-code format)]
                                       (str " "
                                            (str pattern (first children) pattern)
                                            " ")))

                             :pre
                             (do
                               (reset! *inside-pre? true)
                               (let [content (string/trim (doall (map-join children)))]
                                 (reset! *inside-pre? false)
                                 (case format
                                   :markdown (if (util/starts-with? content "```")
                                               content
                                               (str "```\n" content "\n```"))
                                   :org (if (util/starts-with? content "#+BEGIN_SRC")
                                          content
                                          (util/format "#+BEGIN_SRC\n%s\n#+END_SRC" content))
                                   nil)))

                             :blockquote
                             (case format
                               :markdown (str "> " (map-join children))
                               :org (util/format "#+BEGIN_QUOTE\n%s\n#+END_QUOTE" (map-join children))
                               nil)

                             :li
                             (str "- " (map-join children))

                             :dt
                             (case format
                               :org (str "- " (map-join children) " ")
                               :markdown (str (map-join children) "\n")
                               nil)

                             :dd
                             (case format
                               :markdown (str ": " (map-join children) "\n")
                               :org (str ":: " (map-join children) "\n")
                               nil)

                             :thead
                             (case format
                               :markdown (let [columns (count (last (first children)))]
                                           (str
                                            (map-join children)
                                            (str "| " (string/join " | "
                                                                   (repeat columns "----"))
                                                 " |")))
                               :org (let [columns (count (last (first children)))]
                                      (str
                                       (map-join children)
                                       (str "|" (string/join "+"
                                                             (repeat columns "----"))
                                            "|")))
                               nil)
                             :tr
                             (str "| "
                                  (->> (map transform-fn children)
                                       (string/join " | "))
                                  " |")

                             (_ :guard #(contains? #{:aside :center :figure :figcaption :fieldset :footer :header} %))
                             (export-hiccup x)

                             :else (map-join children))]
                (wrapper tag result))

              (string? x)
              x

              :else
              (println "hiccup->doc error: " x))))
        result (if (vector? (first hiccup))
                 (for [x hiccup]
                   (single-hiccup-transform x))
                 (single-hiccup-transform hiccup))]
    (apply str result)))

(defn hiccup->doc
  [format hiccup]
  (let [s (hiccup->doc-inner format hiccup)]
    (if (string/blank? s)
      ""
      (-> s
          (string/trim)
          (string/replace "\n\n\n\n" "\n\n")
          (string/replace "\n\n\n" "\n\n")))))

(defn html-decode-hiccup
  [hiccup]
  (walk/postwalk (fn [f]
                   (if (string? f)
                     (goog.string.unescapeEntities f)
                     f)) hiccup))

(defn parse
  [format html]
  (when-not (string/blank? html)
    (let [hiccup (hickory/as-hiccup (hickory/parse html))
          decoded-hiccup (html-decode-hiccup hiccup)]
      (hiccup->doc format decoded-hiccup))))

(comment
  ;; | Syntax      | Description | Test Text     |``
  ;; | :---        |    :----:   |          ---: |
  ;; | Header      | Title       | Here's this   |
  ;; | Paragraph   | Text        | And more      |

  (def img-link
    [:a {:href "https://www.markdownguide.org/book/", :style "box-sizing: border-box; color: rgb(0, 123, 255); text-decoration: none; background-color: transparent;"} [:img {:src "https://d33wubrfki0l68.cloudfront.net/cb41dd8e38b0543a305f9c56db89b46caa802263/25192/assets/images/book-cover.jpg", :class "card-img", :alt "Markdown Guide book cover", :style "box-sizing: border-box; vertical-align: middle; border-style: none; flex-shrink: 0; width: 205.75px; border-radius: calc(0.25rem - 1px);"}]]))
