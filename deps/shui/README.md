## Description

This library provides a set of UI components for use within logseq.

## API

This library is under the parent namespace `logseq.shui`. This library provides 
several namespaces, all of which will be versioned, with the exception of `logseq.shui.context`.

An example of a versioned namespace is the table namespace:

`logseq.shui.table.v2`

`root` components are exported from each versioned file to indicate the root component to be rendered:

`logseq.shui.table.v2/root`

Each root component should expect two arguments, `props` and `context`. 

## `props`

Ultimately, components in shui will need to be used by JavaScript. While it is idiomatic in clojure to
use a list of properties, it is idiomatic in react to use a single props map. Shui components should therefore 
stick to this convention when possible to ease the conversion between the two languages. 

## `context` 

Context is a set of functions that call back to the main application. These are abstracted out into a context 
object to make it clear what is used internally, and what is used externally.
