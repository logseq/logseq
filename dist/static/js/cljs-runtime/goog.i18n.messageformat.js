goog.provide("goog.i18n.MessageFormat");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.i18n.CompactNumberFormatSymbols");
goog.require("goog.i18n.NumberFormat");
goog.require("goog.i18n.NumberFormatSymbols");
goog.require("goog.i18n.ordinalRules");
goog.require("goog.i18n.pluralRules");
goog.i18n.MessageFormat = function(pattern) {
  this.pattern_ = pattern;
  this.initialLiterals_ = null;
  this.literals_ = null;
  this.parsedPattern_ = null;
  this.numberFormatter_ = goog.i18n.MessageFormat.getNumberFormatter_();
};
goog.i18n.MessageFormat.numberFormatterSymbols_ = null;
goog.i18n.MessageFormat.compactNumberFormatterSymbols_ = null;
goog.i18n.MessageFormat.numberFormatter_ = null;
goog.i18n.MessageFormat.LITERAL_PLACEHOLDER_ = "﷟_";
goog.i18n.MessageFormat.Element_ = {STRING:0, BLOCK:1};
goog.i18n.MessageFormat.BlockType_ = {PLURAL:0, ORDINAL:1, SELECT:2, SIMPLE:3, STRING:4, UNKNOWN:5};
goog.i18n.MessageFormat.OTHER_ = "other";
goog.i18n.MessageFormat.REGEX_LITERAL_ = new RegExp("'([{}#].*?)'", "g");
goog.i18n.MessageFormat.REGEX_DOUBLE_APOSTROPHE_ = new RegExp("''", "g");
goog.i18n.MessageFormat.TypeVal_;
goog.i18n.MessageFormat.BlockTypeVal_;
goog.i18n.MessageFormat.getNumberFormatter_ = function() {
  var currentSymbols = goog.i18n.NumberFormatSymbols;
  var currentCompactSymbols = goog.i18n.CompactNumberFormatSymbols;
  if (goog.i18n.MessageFormat.numberFormatterSymbols_ !== currentSymbols || goog.i18n.MessageFormat.compactNumberFormatterSymbols_ !== currentCompactSymbols) {
    goog.i18n.MessageFormat.numberFormatterSymbols_ = currentSymbols;
    goog.i18n.MessageFormat.compactNumberFormatterSymbols_ = currentCompactSymbols;
    goog.i18n.MessageFormat.numberFormatter_ = new goog.i18n.NumberFormat(goog.i18n.NumberFormat.Format.DECIMAL);
  }
  return goog.i18n.MessageFormat.numberFormatter_;
};
goog.i18n.MessageFormat.prototype.format = function(namedParameters) {
  return this.format_(namedParameters, false);
};
goog.i18n.MessageFormat.prototype.formatIgnoringPound = function(namedParameters) {
  return this.format_(namedParameters, true);
};
goog.i18n.MessageFormat.prototype.format_ = function(namedParameters, ignorePound) {
  this.init_();
  if (!this.parsedPattern_ || this.parsedPattern_.length == 0) {
    return "";
  }
  this.literals_ = goog.array.clone(this.initialLiterals_);
  var result = [];
  this.formatBlock_(this.parsedPattern_, namedParameters, ignorePound, result);
  var message = result.join("");
  if (!ignorePound) {
    goog.asserts.assert(message.search("#") == -1, "Not all # were replaced.");
  }
  while (this.literals_.length > 0) {
    message = message.replace(this.buildPlaceholder_(this.literals_), this.literals_.pop());
  }
  return message;
};
goog.i18n.MessageFormat.prototype.formatBlock_ = function(parsedPattern, namedParameters, ignorePound, result) {
  for (var i = 0; i < parsedPattern.length; i++) {
    switch(parsedPattern[i].type) {
      case goog.i18n.MessageFormat.BlockType_.STRING:
        result.push(parsedPattern[i].value);
        break;
      case goog.i18n.MessageFormat.BlockType_.SIMPLE:
        var pattern = parsedPattern[i].value;
        this.formatSimplePlaceholder_(pattern, namedParameters, result);
        break;
      case goog.i18n.MessageFormat.BlockType_.SELECT:
        var pattern = parsedPattern[i].value;
        this.formatSelectBlock_(pattern, namedParameters, ignorePound, result);
        break;
      case goog.i18n.MessageFormat.BlockType_.PLURAL:
        var pattern = parsedPattern[i].value;
        this.formatPluralOrdinalBlock_(pattern, namedParameters, goog.i18n.pluralRules.select, ignorePound, result);
        break;
      case goog.i18n.MessageFormat.BlockType_.ORDINAL:
        var pattern = parsedPattern[i].value;
        this.formatPluralOrdinalBlock_(pattern, namedParameters, goog.i18n.ordinalRules.select, ignorePound, result);
        break;
      default:
        goog.asserts.fail("Unrecognized block type: " + parsedPattern[i].type);
    }
  }
};
goog.i18n.MessageFormat.prototype.formatSimplePlaceholder_ = function(parsedPattern, namedParameters, result) {
  var value = namedParameters[parsedPattern];
  if (value === undefined) {
    result.push("Undefined parameter - " + parsedPattern);
    return;
  }
  this.literals_.push(value);
  result.push(this.buildPlaceholder_(this.literals_));
};
goog.i18n.MessageFormat.prototype.formatSelectBlock_ = function(parsedPattern, namedParameters, ignorePound, result) {
  var argumentIndex = parsedPattern.argumentIndex;
  if (namedParameters[argumentIndex] === undefined) {
    result.push("Undefined parameter - " + argumentIndex);
    return;
  }
  var option = parsedPattern[namedParameters[argumentIndex]];
  if (option === undefined) {
    option = parsedPattern[goog.i18n.MessageFormat.OTHER_];
    goog.asserts.assertArray(option, "Invalid option or missing other option for select block.");
  }
  this.formatBlock_(option, namedParameters, ignorePound, result);
};
goog.i18n.MessageFormat.prototype.formatPluralOrdinalBlock_ = function(parsedPattern, namedParameters, pluralSelector, ignorePound, result) {
  var argumentIndex = parsedPattern.argumentIndex;
  var argumentOffset = parsedPattern.argumentOffset;
  var pluralValue = +namedParameters[argumentIndex];
  if (isNaN(pluralValue)) {
    result.push("Undefined or invalid parameter - " + argumentIndex);
    return;
  }
  var diff = pluralValue - argumentOffset;
  var option = parsedPattern[namedParameters[argumentIndex]];
  if (option === undefined) {
    var item = pluralSelector(Math.abs(diff));
    goog.asserts.assertString(item, "Invalid plural key.");
    option = parsedPattern[item];
    if (option === undefined) {
      option = parsedPattern[goog.i18n.MessageFormat.OTHER_];
    }
    goog.asserts.assertArray(option, "Invalid option or missing other option for plural block.");
  }
  var pluralResult = [];
  this.formatBlock_(option, namedParameters, ignorePound, pluralResult);
  var plural = pluralResult.join("");
  goog.asserts.assertString(plural, "Empty block in plural.");
  if (ignorePound) {
    result.push(plural);
  } else {
    var localeAwareDiff = this.numberFormatter_.format(diff);
    result.push(plural.replace(/#/g, localeAwareDiff));
  }
};
goog.i18n.MessageFormat.prototype.init_ = function() {
  if (this.pattern_) {
    this.initialLiterals_ = [];
    var pattern = this.insertPlaceholders_(this.pattern_);
    this.parsedPattern_ = this.parseBlock_(pattern);
    this.pattern_ = null;
  }
};
goog.i18n.MessageFormat.prototype.insertPlaceholders_ = function(pattern) {
  var literals = this.initialLiterals_;
  var buildPlaceholder = goog.bind(this.buildPlaceholder_, this);
  pattern = pattern.replace(goog.i18n.MessageFormat.REGEX_DOUBLE_APOSTROPHE_, function() {
    literals.push("'");
    return buildPlaceholder(literals);
  });
  pattern = pattern.replace(goog.i18n.MessageFormat.REGEX_LITERAL_, function(match, text) {
    literals.push(text);
    return buildPlaceholder(literals);
  });
  return pattern;
};
goog.i18n.MessageFormat.prototype.extractParts_ = function(pattern) {
  var prevPos = 0;
  var braceStack = [];
  var results = [];
  var braces = /[{}]/g;
  braces.lastIndex = 0;
  var match;
  while (match = braces.exec(pattern)) {
    var pos = match.index;
    if (match[0] == "}") {
      var brace = braceStack.pop();
      goog.asserts.assert(brace !== undefined && brace == "{", "No matching { for }.");
      if (braceStack.length == 0) {
        var part = {};
        part.type = goog.i18n.MessageFormat.Element_.BLOCK;
        part.value = pattern.substring(prevPos, pos);
        results.push(part);
        prevPos = pos + 1;
      }
    } else {
      if (braceStack.length == 0) {
        var substring = pattern.substring(prevPos, pos);
        if (substring != "") {
          results.push({type:goog.i18n.MessageFormat.Element_.STRING, value:substring});
        }
        prevPos = pos + 1;
      }
      braceStack.push("{");
    }
  }
  goog.asserts.assert(braceStack.length == 0, "There are mismatched { or } in the pattern.");
  var substring = pattern.substring(prevPos);
  if (substring != "") {
    results.push({type:goog.i18n.MessageFormat.Element_.STRING, value:substring});
  }
  return results;
};
goog.i18n.MessageFormat.PLURAL_BLOCK_RE_ = /^\s*(\w+)\s*,\s*plural\s*,(?:\s*offset:(\d+))?/;
goog.i18n.MessageFormat.ORDINAL_BLOCK_RE_ = /^\s*(\w+)\s*,\s*selectordinal\s*,/;
goog.i18n.MessageFormat.SELECT_BLOCK_RE_ = /^\s*(\w+)\s*,\s*select\s*,/;
goog.i18n.MessageFormat.prototype.parseBlockType_ = function(pattern) {
  if (goog.i18n.MessageFormat.PLURAL_BLOCK_RE_.test(pattern)) {
    return goog.i18n.MessageFormat.BlockType_.PLURAL;
  }
  if (goog.i18n.MessageFormat.ORDINAL_BLOCK_RE_.test(pattern)) {
    return goog.i18n.MessageFormat.BlockType_.ORDINAL;
  }
  if (goog.i18n.MessageFormat.SELECT_BLOCK_RE_.test(pattern)) {
    return goog.i18n.MessageFormat.BlockType_.SELECT;
  }
  if (/^\s*\w+\s*/.test(pattern)) {
    return goog.i18n.MessageFormat.BlockType_.SIMPLE;
  }
  return goog.i18n.MessageFormat.BlockType_.UNKNOWN;
};
goog.i18n.MessageFormat.prototype.parseBlock_ = function(pattern) {
  var result = [];
  var parts = this.extractParts_(pattern);
  for (var i = 0; i < parts.length; i++) {
    var block = {};
    if (goog.i18n.MessageFormat.Element_.STRING == parts[i].type) {
      block.type = goog.i18n.MessageFormat.BlockType_.STRING;
      block.value = parts[i].value;
    } else if (goog.i18n.MessageFormat.Element_.BLOCK == parts[i].type) {
      var blockType = this.parseBlockType_(parts[i].value);
      switch(blockType) {
        case goog.i18n.MessageFormat.BlockType_.SELECT:
          block.type = goog.i18n.MessageFormat.BlockType_.SELECT;
          block.value = this.parseSelectBlock_(parts[i].value);
          break;
        case goog.i18n.MessageFormat.BlockType_.PLURAL:
          block.type = goog.i18n.MessageFormat.BlockType_.PLURAL;
          block.value = this.parsePluralBlock_(parts[i].value);
          break;
        case goog.i18n.MessageFormat.BlockType_.ORDINAL:
          block.type = goog.i18n.MessageFormat.BlockType_.ORDINAL;
          block.value = this.parseOrdinalBlock_(parts[i].value);
          break;
        case goog.i18n.MessageFormat.BlockType_.SIMPLE:
          block.type = goog.i18n.MessageFormat.BlockType_.SIMPLE;
          block.value = parts[i].value;
          break;
        default:
          goog.asserts.fail("Unknown block type for pattern: " + parts[i].value);
      }
    } else {
      goog.asserts.fail("Unknown part of the pattern.");
    }
    result.push(block);
  }
  return result;
};
goog.i18n.MessageFormat.prototype.parseSelectBlock_ = function(pattern) {
  var argumentIndex = "";
  var replaceRegex = goog.i18n.MessageFormat.SELECT_BLOCK_RE_;
  pattern = pattern.replace(replaceRegex, function(string, name) {
    argumentIndex = name;
    return "";
  });
  var result = {};
  result.argumentIndex = argumentIndex;
  var parts = this.extractParts_(pattern);
  var pos = 0;
  while (pos < parts.length) {
    var key = parts[pos].value;
    goog.asserts.assertString(key, "Missing select key element.");
    pos++;
    goog.asserts.assert(pos < parts.length, "Missing or invalid select value element.");
    var value;
    if (goog.i18n.MessageFormat.Element_.BLOCK == parts[pos].type) {
      value = this.parseBlock_(parts[pos].value);
    } else {
      goog.asserts.fail("Expected block type.");
    }
    result[key.replace(/\s/g, "")] = value;
    pos++;
  }
  goog.asserts.assertArray(result[goog.i18n.MessageFormat.OTHER_], "Missing other key in select statement.");
  return result;
};
goog.i18n.MessageFormat.prototype.parsePluralBlock_ = function(pattern) {
  var argumentIndex = "";
  var argumentOffset = 0;
  var replaceRegex = goog.i18n.MessageFormat.PLURAL_BLOCK_RE_;
  pattern = pattern.replace(replaceRegex, function(string, name, offset) {
    argumentIndex = name;
    if (offset) {
      argumentOffset = parseInt(offset, 10);
    }
    return "";
  });
  var result = {};
  result.argumentIndex = argumentIndex;
  result.argumentOffset = argumentOffset;
  var parts = this.extractParts_(pattern);
  var pos = 0;
  while (pos < parts.length) {
    var key = parts[pos].value;
    goog.asserts.assertString(key, "Missing plural key element.");
    pos++;
    goog.asserts.assert(pos < parts.length, "Missing or invalid plural value element.");
    var value;
    if (goog.i18n.MessageFormat.Element_.BLOCK == parts[pos].type) {
      value = this.parseBlock_(parts[pos].value);
    } else {
      goog.asserts.fail("Expected block type.");
    }
    result[key.replace(/\s*(?:=)?(\w+)\s*/, "$1")] = value;
    pos++;
  }
  goog.asserts.assertArray(result[goog.i18n.MessageFormat.OTHER_], "Missing other key in plural statement.");
  return result;
};
goog.i18n.MessageFormat.prototype.parseOrdinalBlock_ = function(pattern) {
  var argumentIndex = "";
  var replaceRegex = goog.i18n.MessageFormat.ORDINAL_BLOCK_RE_;
  pattern = pattern.replace(replaceRegex, function(string, name) {
    argumentIndex = name;
    return "";
  });
  var result = {};
  result.argumentIndex = argumentIndex;
  result.argumentOffset = 0;
  var parts = this.extractParts_(pattern);
  var pos = 0;
  while (pos < parts.length) {
    var key = parts[pos].value;
    goog.asserts.assertString(key, "Missing ordinal key element.");
    pos++;
    goog.asserts.assert(pos < parts.length, "Missing or invalid ordinal value element.");
    if (goog.i18n.MessageFormat.Element_.BLOCK == parts[pos].type) {
      var value = this.parseBlock_(parts[pos].value);
    } else {
      goog.asserts.fail("Expected block type.");
    }
    result[key.replace(/\s*(?:=)?(\w+)\s*/, "$1")] = value;
    pos++;
  }
  goog.asserts.assertArray(result[goog.i18n.MessageFormat.OTHER_], "Missing other key in selectordinal statement.");
  return result;
};
goog.i18n.MessageFormat.prototype.buildPlaceholder_ = function(literals) {
  goog.asserts.assert(literals.length > 0, "Literal array is empty.");
  var index = (literals.length - 1).toString(10);
  return goog.i18n.MessageFormat.LITERAL_PLACEHOLDER_ + index + "_";
};

//# sourceMappingURL=goog.i18n.messageformat.js.map
