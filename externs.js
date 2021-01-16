var git = {};
git.walk = function() {};
git.walkBeta1 = function() {};
git.TREE = function() {};
git.log = function() {};
var fs = {};
fs.unlink = function() {};
fs.readdir = function() {};
fs.rmdir = function() {};
fs.rimraf = function() {};
var dummy = {};
dummy.populateStat = function() {};
dummy.populateHash = function() {};
dummy.oid = function() {};
dummy.fullpath = function() {};
dummy.getRangeAt = function() {};
dummy.getElementsByClassName = function() {};
dummy.containsNode = function() {};
dummy.select = function() {};
dummy.closest = function () {};
dummy.setAttribute = function() {};
dummy.getAttribute = function() {};
dummy.font = function() {};
dummy.measureText = function() {};
dummy.fillStyle = function() {};
dummy.fillRect = function() {};
dummy.filltextAlign = function() {};
dummy.textBaseLine = function() {};
dummy.fillText = function() {};
dummy.beginPath = function() {};
dummy.arc = function() {};
dummy.fill = function() {};
dummy.getData = function() {};
dummy.zoomToFit = function() {};
dummy.folder = function() {};
dummy.file = function() {};
dummy.generateAsync = function() {};
dummy.showOpenFilePicker = function() {};
dummy.showDirectoryPicker = function() {};
dummy.getDirectoryHandle = function() {};
dummy.getFileHandle = function() {};
dummy.removeEntry = function() {};
dummy.getFile = function() {};
dummy.text = function() {};
dummy.requestPermission = function() {};
dummy.queryPermission = function() {};
dummy.verifyPermission = function() {};
dummy.createWritable = function() {};
dummy.write = function() {};
dummy.close = function() {};
dummy.values = function() {};
// Do we really need those?
dummy.filter = function() {};
dummy.concat = function() {};
dummy.diff_main = function() {};
dummy.patch_make = function() {};
dummy.patch_apply = function() {};

/**
 * @typedef {{
 *     recursive: (undefined | boolean),
 * }}
 */
var openDirectoryOptions;
/**
 * @param {(undefined | openDirectoryOptions)} options
 * @param {function} cb
 */
var openDirectory = function(options, cb) {};
