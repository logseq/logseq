goog.provide("goog.dom.forms");
goog.require("goog.dom.InputType");
goog.require("goog.dom.TagName");
goog.require("goog.dom.safe");
goog.require("goog.structs.Map");
goog.require("goog.window");
goog.dom.forms.submitFormInNewWindow = function(form, opt_submitElement) {
  var formData = goog.dom.forms.getFormDataMap(form);
  var action = form.action;
  var method = form.method;
  if (opt_submitElement) {
    if (goog.dom.InputType.SUBMIT != opt_submitElement.type.toLowerCase()) {
      throw new Error("opt_submitElement does not have a valid type.");
    }
    var submitValue = goog.dom.forms.getValue(opt_submitElement);
    if (submitValue != null) {
      goog.dom.forms.addFormDataToMap_(formData, opt_submitElement.name, submitValue);
    }
    if (opt_submitElement.getAttribute("formaction")) {
      action = opt_submitElement.getAttribute("formaction");
    }
    if (opt_submitElement.getAttribute("formmethod")) {
      method = opt_submitElement.getAttribute("formmethod");
    }
  }
  return goog.dom.forms.submitFormDataInNewWindow(action, method, formData);
};
goog.dom.forms.submitFormDataInNewWindow = function(actionUri, method, formData) {
  var newWin = goog.window.openBlank("", {noreferrer:true});
  if (!newWin) {
    return false;
  }
  var newDocument = newWin.document;
  var newForm = newDocument.createElement("form");
  newForm.method = method;
  goog.dom.safe.setFormElementAction(newForm, actionUri);
  formData.forEach(function(fieldValues, fieldName) {
    for (var i = 0; i < fieldValues.length; i++) {
      var fieldValue = fieldValues[i];
      var newInput = newDocument.createElement("input");
      newInput.name = fieldName;
      newInput.value = fieldValue;
      newInput.type = "hidden";
      HTMLFormElement.prototype.appendChild.call(newForm, newInput);
    }
  });
  HTMLFormElement.prototype.submit.call(newForm);
  return true;
};
goog.dom.forms.getFormDataMap = function(form) {
  var map = new goog.structs.Map();
  goog.dom.forms.getFormDataHelper_(form, map, goog.dom.forms.addFormDataToMap_);
  return map;
};
goog.dom.forms.getFormDataString = function(form) {
  var sb = [];
  goog.dom.forms.getFormDataHelper_(form, sb, goog.dom.forms.addFormDataToStringBuffer_);
  return sb.join("\x26");
};
goog.dom.forms.getFormDataHelper_ = function(form, result, fnAppend) {
  var els = form.elements;
  for (var el, i = 0; el = els.item(i); i++) {
    if (el.form != form || el.disabled || el.tagName == goog.dom.TagName.FIELDSET) {
      continue;
    }
    var name = el.name;
    switch(el.type.toLowerCase()) {
      case goog.dom.InputType.FILE:
      case goog.dom.InputType.SUBMIT:
      case goog.dom.InputType.RESET:
      case goog.dom.InputType.BUTTON:
        break;
      case goog.dom.InputType.SELECT_MULTIPLE:
        var values = goog.dom.forms.getValue(el);
        if (values != null) {
          for (var value, j = 0; value = values[j]; j++) {
            fnAppend(result, name, value);
          }
        }
        break;
      default:
        var value = goog.dom.forms.getValue(el);
        if (value != null) {
          fnAppend(result, name, value);
        }
    }
  }
  var inputs = form.getElementsByTagName(String(goog.dom.TagName.INPUT));
  for (var input, i = 0; input = inputs[i]; i++) {
    if (input.form == form && input.type.toLowerCase() == goog.dom.InputType.IMAGE) {
      name = input.name;
      fnAppend(result, name, input.value);
      fnAppend(result, name + ".x", "0");
      fnAppend(result, name + ".y", "0");
    }
  }
};
goog.dom.forms.addFormDataToMap_ = function(map, name, value) {
  var array = map.get(name);
  if (!array) {
    array = [];
    map.set(name, array);
  }
  array.push(value);
};
goog.dom.forms.addFormDataToStringBuffer_ = function(sb, name, value) {
  sb.push(encodeURIComponent(name) + "\x3d" + encodeURIComponent(value));
};
goog.dom.forms.hasFileInput = function(form) {
  var els = form.elements;
  for (var el, i = 0; el = els[i]; i++) {
    if (!el.disabled && el.type && el.type.toLowerCase() == goog.dom.InputType.FILE) {
      return true;
    }
  }
  return false;
};
goog.dom.forms.setDisabled = function(el, disabled) {
  if (el.tagName == goog.dom.TagName.FORM) {
    var els = el.elements;
    for (var i = 0; el = els.item(i); i++) {
      goog.dom.forms.setDisabled(el, disabled);
    }
  } else {
    if (disabled == true) {
      el.blur();
    }
    el.disabled = disabled;
  }
};
goog.dom.forms.focusAndSelect = function(el) {
  el.focus();
  if (el.select) {
    el.select();
  }
};
goog.dom.forms.hasValue = function(el) {
  var value = goog.dom.forms.getValue(el);
  return !!value;
};
goog.dom.forms.hasValueByName = function(form, name) {
  var value = goog.dom.forms.getValueByName(form, name);
  return !!value;
};
goog.dom.forms.getValue = function(input) {
  var type = input.type;
  if (typeof type === "string") {
    var el = input;
    switch(type.toLowerCase()) {
      case goog.dom.InputType.CHECKBOX:
      case goog.dom.InputType.RADIO:
        return goog.dom.forms.getInputChecked_(el);
      case goog.dom.InputType.SELECT_ONE:
        return goog.dom.forms.getSelectSingle_(el);
      case goog.dom.InputType.SELECT_MULTIPLE:
        return goog.dom.forms.getSelectMultiple_(el);
      default:
    }
  }
  return input.value != null ? input.value : null;
};
goog.dom.forms.getValueByName = function(form, name) {
  var els = form.elements[name];
  if (!els) {
    return null;
  } else if (els.type) {
    return goog.dom.forms.getValue(els);
  } else {
    for (var i = 0; i < els.length; i++) {
      var val = goog.dom.forms.getValue(els[i]);
      if (val) {
        return val;
      }
    }
    return null;
  }
};
goog.dom.forms.getInputChecked_ = function(el) {
  return el.checked ? el.value : null;
};
goog.dom.forms.getSelectSingle_ = function(el) {
  var selectedIndex = el.selectedIndex;
  return selectedIndex >= 0 ? el.options[selectedIndex].value : null;
};
goog.dom.forms.getSelectMultiple_ = function(el) {
  var values = [];
  for (var option, i = 0; option = el.options[i]; i++) {
    if (option.selected) {
      values.push(option.value);
    }
  }
  return values.length ? values : null;
};
goog.dom.forms.setValue = function(el, opt_value) {
  var type = el.type;
  switch(typeof type === "string" && type.toLowerCase()) {
    case goog.dom.InputType.CHECKBOX:
    case goog.dom.InputType.RADIO:
      goog.dom.forms.setInputChecked_(el, opt_value);
      return;
    case goog.dom.InputType.SELECT_ONE:
      goog.dom.forms.setSelectSingle_(el, opt_value);
      return;
    case goog.dom.InputType.SELECT_MULTIPLE:
      goog.dom.forms.setSelectMultiple_(el, opt_value);
      return;
    default:
      el.value = opt_value != null ? opt_value : "";
  }
};
goog.dom.forms.setInputChecked_ = function(el, opt_value) {
  el.checked = opt_value;
};
goog.dom.forms.setSelectSingle_ = function(el, opt_value) {
  el.selectedIndex = -1;
  if (typeof opt_value === "string") {
    for (var option, i = 0; option = el.options[i]; i++) {
      if (option.value == opt_value) {
        option.selected = true;
        break;
      }
    }
  }
};
goog.dom.forms.setSelectMultiple_ = function(el, opt_value) {
  if (typeof opt_value === "string") {
    opt_value = [opt_value];
  }
  for (var option, i = 0; option = el.options[i]; i++) {
    option.selected = false;
    if (opt_value) {
      for (var value, j = 0; value = opt_value[j]; j++) {
        if (option.value == value) {
          option.selected = true;
        }
      }
    }
  }
};

//# sourceMappingURL=goog.dom.forms.js.map
