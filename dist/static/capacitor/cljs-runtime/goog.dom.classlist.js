goog.provide("goog.dom.classlist");
goog.require("goog.array");
goog.dom.classlist.ALWAYS_USE_DOM_TOKEN_LIST = goog.define("goog.dom.classlist.ALWAYS_USE_DOM_TOKEN_LIST", false);
goog.dom.classlist.getClassName_ = function(element) {
  return typeof element.className == "string" ? element.className : element.getAttribute && element.getAttribute("class") || "";
};
goog.dom.classlist.get = function(element) {
  if (goog.dom.classlist.ALWAYS_USE_DOM_TOKEN_LIST || element.classList) {
    return element.classList;
  }
  return goog.dom.classlist.getClassName_(element).match(/\S+/g) || [];
};
goog.dom.classlist.set = function(element, className) {
  if (typeof element.className == "string") {
    element.className = className;
    return;
  } else if (element.setAttribute) {
    element.setAttribute("class", className);
  }
};
goog.dom.classlist.contains = function(element, className) {
  if (goog.dom.classlist.ALWAYS_USE_DOM_TOKEN_LIST || element.classList) {
    return element.classList.contains(className);
  }
  return goog.array.contains(goog.dom.classlist.get(element), className);
};
goog.dom.classlist.add = function(element, className) {
  if (goog.dom.classlist.ALWAYS_USE_DOM_TOKEN_LIST || element.classList) {
    element.classList.add(className);
    return;
  }
  if (!goog.dom.classlist.contains(element, className)) {
    var oldClassName = goog.dom.classlist.getClassName_(element);
    goog.dom.classlist.set(element, oldClassName + (oldClassName.length > 0 ? " " + className : className));
  }
};
goog.dom.classlist.addAll = function(element, classesToAdd) {
  if (goog.dom.classlist.ALWAYS_USE_DOM_TOKEN_LIST || element.classList) {
    Array.prototype.forEach.call(classesToAdd, function(className) {
      goog.dom.classlist.add(element, className);
    });
    return;
  }
  var classMap = {};
  Array.prototype.forEach.call(goog.dom.classlist.get(element), function(className) {
    classMap[className] = true;
  });
  Array.prototype.forEach.call(classesToAdd, function(className) {
    classMap[className] = true;
  });
  var newClassName = "";
  for (var className in classMap) {
    newClassName += newClassName.length > 0 ? " " + className : className;
  }
  goog.dom.classlist.set(element, newClassName);
};
goog.dom.classlist.remove = function(element, className) {
  if (goog.dom.classlist.ALWAYS_USE_DOM_TOKEN_LIST || element.classList) {
    element.classList.remove(className);
    return;
  }
  if (goog.dom.classlist.contains(element, className)) {
    goog.dom.classlist.set(element, Array.prototype.filter.call(goog.dom.classlist.get(element), function(c) {
      return c != className;
    }).join(" "));
  }
};
goog.dom.classlist.removeAll = function(element, classesToRemove) {
  if (goog.dom.classlist.ALWAYS_USE_DOM_TOKEN_LIST || element.classList) {
    Array.prototype.forEach.call(classesToRemove, function(className) {
      goog.dom.classlist.remove(element, className);
    });
    return;
  }
  goog.dom.classlist.set(element, Array.prototype.filter.call(goog.dom.classlist.get(element), function(className) {
    return !goog.array.contains(classesToRemove, className);
  }).join(" "));
};
goog.dom.classlist.enable = function(element, className, enabled) {
  if (enabled) {
    goog.dom.classlist.add(element, className);
  } else {
    goog.dom.classlist.remove(element, className);
  }
};
goog.dom.classlist.enableAll = function(element, classesToEnable, enabled) {
  var f = enabled ? goog.dom.classlist.addAll : goog.dom.classlist.removeAll;
  f(element, classesToEnable);
};
goog.dom.classlist.swap = function(element, fromClass, toClass) {
  if (goog.dom.classlist.contains(element, fromClass)) {
    goog.dom.classlist.remove(element, fromClass);
    goog.dom.classlist.add(element, toClass);
    return true;
  }
  return false;
};
goog.dom.classlist.toggle = function(element, className) {
  var add = !goog.dom.classlist.contains(element, className);
  goog.dom.classlist.enable(element, className, add);
  return add;
};
goog.dom.classlist.addRemove = function(element, classToRemove, classToAdd) {
  goog.dom.classlist.remove(element, classToRemove);
  goog.dom.classlist.add(element, classToAdd);
};

//# sourceMappingURL=goog.dom.classlist.js.map
