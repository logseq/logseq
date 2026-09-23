(ns frontend.extensions.code.language-registry
  "Static registry of the languages the CodeMirror 6 editor supports.
   The descriptor table mirrors @codemirror/language-data (v6.5.2): each
   entry's :source/:package/:entry matches the corresponding upstream
   LanguageDescription. `frontend.extensions.code.languages.js` is the
   generated companion file that resolves a descriptor :id to its
   LanguageSupport/StreamLanguage extension."
  (:require [clojure.string :as string]))

(def supported-sources #{:native :nextjournal :legacy :plain-text :plugin})

(def ^:private ^:large-vars/data-var languages
  [{:id :plain-text
    :display "Plain Text"
    :names #{"plain" "plain-text" "plaintext" "text"}
    :extensions #{"txt"}
    :source :plain-text}
   {:id :clojure
    :display "Clojure"
    :names #{"clj" "cljc" "cljs" "clojure" "clojurescript" "edn"}
    :extensions #{"clj" "cljc" "cljs" "edn"}
    :source :nextjournal
    :package "@nextjournal/lezer-clojure"
    :entry :parser},
   {:id :c
    :display "C"
    :names #{"c"}
    :extensions #{"c" "h" "ino"}
    :source :native
    :package "@codemirror/lang-cpp"
    :entry :cpp},
   {:id :cpp
    :display "C++"
    :names #{"c++" "cpp"}
    :extensions #{"c++" "cc" "cpp" "cxx" "h++" "hh" "hpp" "hxx"}
    :source :native
    :package "@codemirror/lang-cpp"
    :entry :cpp},
   {:id :cql
    :display "CQL"
    :names #{"cassandra" "cql"}
    :extensions #{"cql"}
    :source :native
    :package "@codemirror/lang-sql"
    :entry :sql},
   {:id :css
    :display "CSS"
    :names #{"css"}
    :extensions #{"css"}
    :source :native
    :package "@codemirror/lang-css"
    :entry :css},
   {:id :go
    :display "Go"
    :names #{"go"}
    :extensions #{"go"}
    :source :native
    :package "@codemirror/lang-go"
    :entry :go},
   {:id :html
    :display "HTML"
    :names #{"html" "xhtml"}
    :extensions #{"handlebars" "hbs" "htm" "html"}
    :source :native
    :package "@codemirror/lang-html"
    :entry :html},
   {:id :java
    :display "Java"
    :names #{"java"}
    :extensions #{"java"}
    :source :native
    :package "@codemirror/lang-java"
    :entry :java},
   {:id :javascript
    :display "JavaScript"
    :names #{"ecmascript" "javascript" "js" "node"}
    :extensions #{"cjs" "js" "mjs"}
    :source :native
    :package "@codemirror/lang-javascript"
    :entry :javascript},
   {:id :jinja
    :display "Jinja"
    :names #{"jinja"}
    :extensions #{"j2" "jinja" "jinja2"}
    :source :native
    :package "@codemirror/lang-jinja"
    :entry :jinja},
   {:id :json
    :display "JSON"
    :names #{"json" "json5"}
    :extensions #{"json" "map"}
    :source :native
    :package "@codemirror/lang-json"
    :entry :json},
   {:id :jsx
    :display "JSX"
    :names #{"jsx"}
    :extensions #{"jsx"}
    :source :native
    :package "@codemirror/lang-javascript"
    :entry :javascript},
   {:id :less
    :display "LESS"
    :names #{"less"}
    :extensions #{"less"}
    :source :native
    :package "@codemirror/lang-less"
    :entry :less},
   {:id :liquid
    :display "Liquid"
    :names #{"liquid"}
    :extensions #{"liquid"}
    :source :native
    :package "@codemirror/lang-liquid"
    :entry :liquid},
   {:id :mariadb-sql
    :display "MariaDB SQL"
    :names #{"mariadb sql"}
    :source :native
    :package "@codemirror/lang-sql"
    :entry :sql},
   {:id :markdown
    :display "Markdown"
    :names #{"markdown"}
    :extensions #{"markdown" "md" "mkd"}
    :source :native
    :package "@codemirror/lang-markdown"
    :entry :markdown},
   {:id :ms-sql
    :display "MS SQL"
    :names #{"ms sql"}
    :source :native
    :package "@codemirror/lang-sql"
    :entry :sql},
   {:id :mysql
    :display "MySQL"
    :names #{"mysql"}
    :source :native
    :package "@codemirror/lang-sql"
    :entry :sql},
   {:id :php
    :display "PHP"
    :names #{"php"}
    :extensions #{"php" "php3" "php4" "php5" "php7" "phtml"}
    :source :native
    :package "@codemirror/lang-php"
    :entry :php},
   {:id :plsql
    :display "PLSQL"
    :names #{"plsql"}
    :extensions #{"pls"}
    :source :native
    :package "@codemirror/lang-sql"
    :entry :sql},
   {:id :postgresql
    :display "PostgreSQL"
    :names #{"postgresql"}
    :source :native
    :package "@codemirror/lang-sql"
    :entry :sql},
   {:id :python
    :display "Python"
    :names #{"python"}
    :extensions #{"build" "bzl" "py" "pyw"}
    :source :native
    :package "@codemirror/lang-python"
    :entry :python},
   {:id :rust
    :display "Rust"
    :names #{"rust"}
    :extensions #{"rs"}
    :source :native
    :package "@codemirror/lang-rust"
    :entry :rust},
   {:id :sass
    :display "Sass"
    :names #{"sass"}
    :extensions #{"sass"}
    :source :native
    :package "@codemirror/lang-sass"
    :entry :sass},
   {:id :scss
    :display "SCSS"
    :names #{"scss"}
    :extensions #{"scss"}
    :source :native
    :package "@codemirror/lang-sass"
    :entry :sass},
   {:id :sql
    :display "SQL"
    :names #{"sql"}
    :extensions #{"sql"}
    :source :native
    :package "@codemirror/lang-sql"
    :entry :sql},
   {:id :sqlite
    :display "SQLite"
    :names #{"sqlite"}
    :source :native
    :package "@codemirror/lang-sql"
    :entry :sql},
   {:id :tsx
    :display "TSX"
    :names #{"tsx"}
    :extensions #{"tsx"}
    :source :native
    :package "@codemirror/lang-javascript"
    :entry :javascript},
   {:id :typescript
    :display "TypeScript"
    :names #{"ts" "typescript"}
    :extensions #{"cts" "mts" "ts"}
    :source :native
    :package "@codemirror/lang-javascript"
    :entry :javascript},
   {:id :webassembly
    :display "WebAssembly"
    :names #{"webassembly"}
    :extensions #{"wast" "wat"}
    :source :native
    :package "@codemirror/lang-wast"
    :entry :wast},
   {:id :xml
    :display "XML"
    :names #{"rss" "wsdl" "xml" "xsd"}
    :extensions #{"svg" "xml" "xsd" "xsl"}
    :source :native
    :package "@codemirror/lang-xml"
    :entry :xml},
   {:id :yaml
    :display "YAML"
    :names #{"yaml" "yml"}
    :extensions #{"yaml" "yml"}
    :source :native
    :package "@codemirror/lang-yaml"
    :entry :yaml},
   {:id :apl
    :display "APL"
    :names #{"apl"}
    :extensions #{"apl" "dyalog"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :apl},
   {:id :pgp
    :display "PGP"
    :names #{"asciiarmor" "pgp"}
    :extensions #{"asc" "pgp" "sig"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :asciiarmor},
   {:id :asn-1
    :display "ASN.1"
    :names #{"asn.1"}
    :extensions #{"asn" "asn1"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :asn1},
   {:id :asterisk
    :display "Asterisk"
    :names #{"asterisk"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :asterisk},
   {:id :brainfuck
    :display "Brainfuck"
    :names #{"brainfuck"}
    :extensions #{"b" "bf"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :brainfuck},
   {:id :cobol
    :display "Cobol"
    :names #{"cobol"}
    :extensions #{"cob" "cpy"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :cobol},
   {:id :csharp
    :display "C#"
    :names #{"c#" "cs" "csharp"}
    :extensions #{"cs"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :clike},
   {:id :closure-stylesheets-gss
    :display "Closure Stylesheets (GSS)"
    :names #{"closure stylesheets (gss)"}
    :extensions #{"gss"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :css},
   {:id :cmake
    :display "CMake"
    :names #{"cmake"}
    :extensions #{"cmake" "cmake.in"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :cmake},
   {:id :coffeescript
    :display "CoffeeScript"
    :names #{"coffee" "coffee-script" "coffeescript"}
    :extensions #{"coffee"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :coffeescript},
   {:id :common-lisp
    :display "Common Lisp"
    :names #{"common lisp" "lisp"}
    :extensions #{"cl" "el" "lisp"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :commonlisp},
   {:id :cypher
    :display "Cypher"
    :names #{"cypher"}
    :extensions #{"cyp" "cypher"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :cypher},
   {:id :cython
    :display "Cython"
    :names #{"cython"}
    :extensions #{"pxd" "pxi" "pyx"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :python},
   {:id :crystal
    :display "Crystal"
    :names #{"crystal"}
    :extensions #{"cr"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :crystal},
   {:id :d
    :display "D"
    :names #{"d"}
    :extensions #{"d"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :d},
   {:id :dart
    :display "Dart"
    :names #{"dart"}
    :extensions #{"dart"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :clike},
   {:id :diff
    :display "diff"
    :names #{"diff"}
    :extensions #{"diff" "patch"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :diff},
   {:id :dockerfile
    :display "Dockerfile"
    :names #{"dockerfile"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :dockerfile},
   {:id :dtd
    :display "DTD"
    :names #{"dtd"}
    :extensions #{"dtd"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :dtd},
   {:id :dylan
    :display "Dylan"
    :names #{"dylan"}
    :extensions #{"dyl" "dylan" "intr"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :dylan},
   {:id :ebnf
    :display "EBNF"
    :names #{"ebnf"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :ebnf},
   {:id :ecl
    :display "ECL"
    :names #{"ecl"}
    :extensions #{"ecl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :ecl},
   {:id :eiffel
    :display "Eiffel"
    :names #{"eiffel"}
    :extensions #{"e"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :eiffel},
   {:id :elm
    :display "Elm"
    :names #{"elm"}
    :extensions #{"elm"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :elm},
   {:id :erlang
    :display "Erlang"
    :names #{"erlang"}
    :extensions #{"erl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :erlang},
   {:id :esper
    :display "Esper"
    :names #{"esper"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :sql},
   {:id :factor
    :display "Factor"
    :names #{"factor"}
    :extensions #{"factor"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :factor},
   {:id :fcl
    :display "FCL"
    :names #{"fcl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :fcl},
   {:id :forth
    :display "Forth"
    :names #{"forth"}
    :extensions #{"4th" "forth" "fth"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :forth},
   {:id :fortran
    :display "Fortran"
    :names #{"fortran"}
    :extensions #{"f" "f77" "f90" "f95" "for"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :fortran},
   {:id :fsharp
    :display "F#"
    :names #{"f#" "fsharp"}
    :extensions #{"fs"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mllike},
   {:id :gas
    :display "Gas"
    :names #{"gas"}
    :extensions #{"s"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :gas},
   {:id :gherkin
    :display "Gherkin"
    :names #{"gherkin"}
    :extensions #{"feature"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :gherkin},
   {:id :groovy
    :display "Groovy"
    :names #{"groovy"}
    :extensions #{"gradle" "groovy"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :groovy},
   {:id :haskell
    :display "Haskell"
    :names #{"haskell"}
    :extensions #{"hs"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :haskell},
   {:id :haxe
    :display "Haxe"
    :names #{"haxe"}
    :extensions #{"hx"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :haxe},
   {:id :hxml
    :display "HXML"
    :names #{"hxml"}
    :extensions #{"hxml"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :haxe},
   {:id :http
    :display "HTTP"
    :names #{"http"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :http},
   {:id :idl
    :display "IDL"
    :names #{"idl"}
    :extensions #{"pro"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :idl},
   {:id :json-ld
    :display "JSON-LD"
    :names #{"json-ld" "jsonld"}
    :extensions #{"jsonld"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :javascript},
   {:id :julia
    :display "Julia"
    :names #{"julia"}
    :extensions #{"jl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :julia},
   {:id :kotlin
    :display "Kotlin"
    :names #{"kotlin"}
    :extensions #{"kt" "kts"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :clike},
   {:id :livescript
    :display "LiveScript"
    :names #{"livescript" "ls"}
    :extensions #{"ls"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :livescript},
   {:id :lua
    :display "Lua"
    :names #{"lua"}
    :extensions #{"lua"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :lua},
   {:id :mirc
    :display "mIRC"
    :names #{"mirc"}
    :extensions #{"mrc"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mirc},
   {:id :mathematica
    :display "Mathematica"
    :names #{"mathematica"}
    :extensions #{"nb" "wl" "wls"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mathematica},
   {:id :modelica
    :display "Modelica"
    :names #{"modelica"}
    :extensions #{"mo"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :modelica},
   {:id :mumps
    :display "MUMPS"
    :names #{"mumps"}
    :extensions #{"mps"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mumps},
   {:id :mbox
    :display "Mbox"
    :names #{"mbox"}
    :extensions #{"mbox"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mbox},
   {:id :nginx
    :display "Nginx"
    :names #{"nginx"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :nginx},
   {:id :nsis
    :display "NSIS"
    :names #{"nsis"}
    :extensions #{"nsh" "nsi"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :nsis},
   {:id :ntriples
    :display "NTriples"
    :names #{"ntriples"}
    :extensions #{"nq" "nt"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :ntriples},
   {:id :objective-c
    :display "Objective-C"
    :names #{"objc" "objective-c"}
    :extensions #{}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :clike},
   {:id :objective-c-2
    :display "Objective-C++"
    :names #{"objc++" "objective-c++"}
    :extensions #{"mm"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :clike},
   {:id :ocaml
    :display "OCaml"
    :names #{"ocaml"}
    :extensions #{"ml" "mli" "mll" "mly"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mllike},
   {:id :octave
    :display "Octave"
    :names #{"octave"}
    :extensions #{"m"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :octave},
   {:id :oz
    :display "Oz"
    :names #{"oz"}
    :extensions #{"oz"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :oz},
   {:id :pascal
    :display "Pascal"
    :names #{"pascal"}
    :extensions #{"p" "pas"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :pascal},
   {:id :perl
    :display "Perl"
    :names #{"perl"}
    :extensions #{"pl" "pm"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :perl},
   {:id :pig
    :display "Pig"
    :names #{"pig"}
    :extensions #{"pig"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :pig},
   {:id :powershell
    :display "PowerShell"
    :names #{"powershell"}
    :extensions #{"ps1" "psd1" "psm1"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :powershell},
   {:id :properties-files
    :display "Properties files"
    :names #{"ini" "properties" "properties files"}
    :extensions #{"in" "ini" "properties"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :properties},
   {:id :protobuf
    :display "ProtoBuf"
    :names #{"protobuf"}
    :extensions #{"proto"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :protobuf},
   {:id :pug
    :display "Pug"
    :names #{"jade" "pug"}
    :extensions #{"jade" "pug"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :pug},
   {:id :puppet
    :display "Puppet"
    :names #{"puppet"}
    :extensions #{"pp"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :puppet},
   {:id :q
    :display "Q"
    :names #{"q"}
    :extensions #{"q"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :q},
   {:id :r
    :display "R"
    :names #{"r" "rscript"}
    :extensions #{"r"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :r},
   {:id :rpm-changes
    :display "RPM Changes"
    :names #{"rpm changes"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :rpm},
   {:id :rpm-spec
    :display "RPM Spec"
    :names #{"rpm spec"}
    :extensions #{"spec"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :rpm},
   {:id :ruby
    :display "Ruby"
    :names #{"jruby" "macruby" "rake" "rb" "rbx" "ruby"}
    :extensions #{"rb"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :ruby},
   {:id :sas
    :display "SAS"
    :names #{"sas"}
    :extensions #{"sas"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :sas},
   {:id :scala
    :display "Scala"
    :names #{"scala"}
    :extensions #{"scala"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :clike},
   {:id :scheme
    :display "Scheme"
    :names #{"scheme"}
    :extensions #{"scm" "ss"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :scheme},
   {:id :shell
    :display "Shell"
    :names #{"bash" "sh" "shell" "zsh"}
    :extensions #{"bash" "ksh" "sh"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :shell},
   {:id :sieve
    :display "Sieve"
    :names #{"sieve"}
    :extensions #{"sieve" "siv"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :sieve},
   {:id :smalltalk
    :display "Smalltalk"
    :names #{"smalltalk"}
    :extensions #{"st"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :smalltalk},
   {:id :solr
    :display "Solr"
    :names #{"solr"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :solr},
   {:id :sml
    :display "SML"
    :names #{"sml"}
    :extensions #{"fun" "smackspec" "sml"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mllike},
   {:id :sparql
    :display "SPARQL"
    :names #{"sparql" "sparul"}
    :extensions #{"rq" "sparql"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :sparql},
   {:id :spreadsheet
    :display "Spreadsheet"
    :names #{"excel" "formula" "spreadsheet"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :spreadsheet},
   {:id :squirrel
    :display "Squirrel"
    :names #{"squirrel"}
    :extensions #{"nut"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :clike},
   {:id :stylus
    :display "Stylus"
    :names #{"stylus"}
    :extensions #{"styl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :stylus},
   {:id :swift
    :display "Swift"
    :names #{"swift"}
    :extensions #{"swift"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :swift},
   {:id :stex
    :display "sTeX"
    :names #{"stex"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :stex},
   {:id :latex
    :display "LaTeX"
    :names #{"latex" "tex"}
    :extensions #{"ltx" "tex" "text"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :stex},
   {:id :systemverilog
    :display "SystemVerilog"
    :names #{"systemverilog"}
    :extensions #{"sv" "svh"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :verilog},
   {:id :tcl
    :display "Tcl"
    :names #{"tcl"}
    :extensions #{"tcl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :tcl},
   {:id :textile
    :display "Textile"
    :names #{"textile"}
    :extensions #{"textile"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :textile},
   {:id :tiddlywiki
    :display "TiddlyWiki"
    :names #{"tiddlywiki"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :tiddlywiki},
   {:id :tiki-wiki
    :display "Tiki wiki"
    :names #{"tiki wiki"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :tiki},
   {:id :toml
    :display "TOML"
    :names #{"toml"}
    :extensions #{"toml"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :toml},
   {:id :troff
    :display "Troff"
    :names #{"troff"}
    :extensions #{"1" "2" "3" "4" "5" "6" "7" "8" "9"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :troff},
   {:id :ttcn
    :display "TTCN"
    :names #{"ttcn"}
    :extensions #{"ttcn" "ttcn3" "ttcnpp"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :ttcn},
   {:id :ttcn-cfg
    :display "TTCN_CFG"
    :names #{"ttcn_cfg"}
    :extensions #{"cfg"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :ttcn-cfg},
   {:id :turtle
    :display "Turtle"
    :names #{"turtle"}
    :extensions #{"ttl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :turtle},
   {:id :webidl
    :display "Web IDL"
    :names #{"web idl"}
    :extensions #{"webidl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :webidl},
   {:id :vb-net
    :display "VB.NET"
    :names #{"vb.net"}
    :extensions #{"vb"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :vb},
   {:id :vbscript
    :display "VBScript"
    :names #{"vbscript"}
    :extensions #{"vbs"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :vbscript},
   {:id :velocity
    :display "Velocity"
    :names #{"velocity"}
    :extensions #{"vtl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :velocity},
   {:id :verilog
    :display "Verilog"
    :names #{"verilog"}
    :extensions #{"v"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :verilog},
   {:id :vhdl
    :display "VHDL"
    :names #{"vhdl"}
    :extensions #{"vhd" "vhdl"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :vhdl},
   {:id :xquery
    :display "XQuery"
    :names #{"xquery"}
    :extensions #{"xq" "xqm" "xquery" "xqy" "xy"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :xquery},
   {:id :yacas
    :display "Yacas"
    :names #{"yacas"}
    :extensions #{"ys"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :yacas},
   {:id :z80
    :display "Z80"
    :names #{"z80"}
    :extensions #{"z80"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :z80},
   {:id :mscgen
    :display "MscGen"
    :names #{"mscgen"}
    :extensions #{"msc" "mscgen" "mscin"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mscgen},
   {:id :xu
    :display "Xù"
    :names #{"x\u00f9"}
    :extensions #{"xu"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mscgen},
   {:id :msgenny
    :display "MsGenny"
    :names #{"msgenny"}
    :extensions #{"msgenny"}
    :source :legacy
    :package "@codemirror/legacy-modes"
    :entry :mscgen},
   {:id :vue
    :display "Vue"
    :names #{"vue"}
    :extensions #{"vue"}
    :source :native
    :package "@codemirror/lang-vue"
    :entry :vue},
   {:id :angular-template
    :display "Angular Template"
    :names #{"angular template"}
    :source :native
    :package "@codemirror/lang-angular"
    :entry :angular}])

(defn- normalize-key
  [value]
  (some-> value str string/lower-case string/trim (string/replace #"^\." "")))

(defn supported-languages
  []
  languages)

(defn valid-language-descriptor?
  [descriptor]
  (and (map? descriptor)
       (keyword? (:id descriptor))
       (seq (:names descriptor))
       (contains? supported-sources (:source descriptor))
       (case (:source descriptor)
         :plain-text true
         ;; Plugin descriptors resolve their LanguageSupport via an opaque
         ;; `:support` value or an async `:load` fn.
         :plugin (boolean (or (:support descriptor) (:load descriptor)))
         (and (string? (:package descriptor))
              (keyword? (:entry descriptor))))))

(defn- lookup-pairs
  [field]
  (mapcat
   (fn [descriptor]
     (for [lookup-key (->> (get descriptor field)
                           (map normalize-key)
                           (remove string/blank?))]
       [lookup-key descriptor]))
   languages))

(defn- duplicate-keys
  [field]
  (->> (lookup-pairs field)
       (map first)
       frequencies
       (keep (fn [[lookup-key cnt]]
               (when (> cnt 1)
                 lookup-key)))
       set))

(defn duplicate-name-keys
  []
  (duplicate-keys :names))

(defn duplicate-extension-keys
  []
  (duplicate-keys :extensions))

(def ^:private name-index
  (delay (into {} (lookup-pairs :names))))

(def ^:private extension-index
  (delay (into {} (lookup-pairs :extensions))))

(defn language-by-name
  [language-name]
  (get @name-index (normalize-key language-name)))

(defn language-by-subname
  "Best-effort lookup for partial language names: the language whose `:names`
   set contains an entry that has `language-name` as a substring (e.g. \"oca\"
   or \"cam\" resolves to :ocaml). Shorter matching names win; ties resolve in
   registry order."
  [language-name]
  (let [lookup-key (normalize-key language-name)]
    (when (and (not (string/blank? lookup-key))
               (>= (count lookup-key) 2))
      (->> languages
           (keep (fn [descriptor]
                   (when-let [matched (->> (:names descriptor)
                                           (map normalize-key)
                                           (filter #(string/includes? % lookup-key))
                                           (sort-by count)
                                           first)]
                     [matched descriptor])))
           (sort-by (comp count first))
           first
           second))))

(defn language-by-extension
  [extension]
  (get @extension-index (normalize-key extension)))

(defn plain-text-language
  []
  (language-by-name "plain-text"))

(defn legacy-language?
  [language-name]
  (= :legacy (:source (language-by-name language-name))))
