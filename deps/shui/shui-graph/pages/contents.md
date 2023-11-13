- [[About Shui]]
- [[shui/components]] if there was text here
    - beta
        - [[shui/components/table]]
    - up next
        - [[shui/components/button]]
        - [[shui/components/input]]
        - [[shui/components/tooltip]]
        - [[shui/components/text]]
    - future
        - [[shui/components/icon]]
        - [[shui/components/tag]]
        - [[shui/components/toggle]]
        - [[shui/components/context-menu]]
        - [[shui/components/right-sidebar]]
        - [[shui/components/modal]]
        - [[shui/components/properties]]
        - [[shui/components/code]]
          collapsed:: true
            - ```css
              :root {
                --lx-blue-1: #123456;
              }
              ```
            - ```clojurescript
              (js/document.style.setProperty "--lx-blue-1" ""#abcdef")
              ```
            - ```python
              # This is a single-line comment
              """
              This is a
              multi-line comment (docstring)
              """

              # Import statement
              import math

              # Constant
              CONSTANT = 3.14159

              # Function definition, decorators and function call
              @staticmethod
              def add_numbers(x, y):
                  """This function adds two numbers"""
                  return x + y

              result = add_numbers(5, 7)

              # Built-in functions
              print(f"Sum is: {result}")

              # Class definition and object creation
              class MyClass:
                  # Class variable
                  class_var = "I'm a class variable"

                  def __init__(self, instance_var):
                      # Instance variable
                      self.instance_var = instance_var

                  def method(self):
                      return self.instance_var

              # Creating object of the class
              obj = MyClass("I'm an instance variable")
              print(obj.method())

              # Control flow - if, elif, else
              num = 10
              if num > 0:
                  print("Positive number")
              elif num == 0:
                  print("Zero")
              else:
                  print("Negative number")

              # For loop and range function
              for i in range(5):
                  print(i)

              # List comprehension
              squares = [x**2 for x in range(10)]

              # Generator expression
              gen = (x**2 for x in range(10))

              # While loop
              count = 0
              while count < 5:
                  print(count)
                  count += 1

              # Exception handling
              try:
                  # Division by zero
                  x = 1 / 0
              except ZeroDivisionError as e:
                  print("Handling run-time error:", e)

              # Lambda function
              double = lambda x: x * 2
              print(double(5))

              # File I/O
              with open('test.txt', 'r') as file:
                  content = file.read()

              # Assert
              assert num > 0, "Number is not positive"

              ```
            - ```clojure
              ;; This is a comment

              ;; Numbers
              42
              2.71828

              ;; Strings
              "Hello, world!"

              ;; Characters
              \a

              ;; Booleans
              true
              false

              ;; Lists
              '(1 2 3 4 5)

              ;; Vectors
              [1 2 3 4 5]

              ;; Maps
              {:name "John Doe" :age 30 :email "john.doe@example.com"}

              ;; Sets
              #{1 2 3 4 5}

              ;; Functions
              (defn add-numbers [x y]
                "This function adds two numbers."
                (+ x y))

              (def result (add-numbers 5 7))
              (println "Sum is: " result)

              ;; Anonymous function
              (#(+ %1 %2) 5 7)

              ;; Conditionals
              (if (> result 0)
                (println "Positive number")
                (println "Zero or negative number"))

              ;; Loops
              (loop [x 0]
                (when (< x 5)
                  (println x)
                  (recur (+ x 1))))

              ;; For
              (for [x (range 5)] (println x))

              ;; Map over a list
              (map inc '(1 2 3))

              ;; Exception handling
              (try
                (/ 1 0)
                (catch ArithmeticException e
                  (println "Caught an exception: " (.getMessage e))))

              ;; Macros
              (defmacro unless [pred a b]
                `(if (not ~pred) ~a ~b))

              (unless true
                (println "This will not print")
                (println "This will print"))

              ;; Keywords
              :foo
              :bar/baz


              ```
            - ```css
              .example {
                something: "#abc123"
              }
              ```
- [[shui/colors]]
    - We want to switch to radix variables
    - We want to make it easy to customize with themes
    - We want to support as much old themes as possible
    - var(--ui-button-color,
      collapsed:: true
        - var(--logseq-button-primary-color,
          collapsed:: true
            - var(--lx-color-6)))
    - light and dark variants
- [[shui/inline]]
    -
- /
-
-
