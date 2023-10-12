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
fs.lstat = function () {};

var dummy = {};
dummy.populateStat = function() {};
dummy.populateHash = function() {};
dummy.oid = function() {};
dummy.fullpath = function() {};
dummy.getRangeAt = function() {};
dummy.getElementsByClassName = function() {};
dummy.containsNode = function() {};
dummy.select = function() {};
dummy.search = function() {};
dummy.add = function() {};
dummy.remove = function() {};
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
dummy.prepare = function() {};
dummy.run = function() {};
dummy.all = function() {};
dummy.transaction = function() {};
dummy.getPath = function() {};
dummy.getDoc = function() {};
dummy.setValue = function() {};
dummy.data = function() {};
dummy.triangle = function() {};
dummy.vee = function() {};
dummy.destroy = function() {};
dummy.changeData = function() {};
dummy.layout = function() {};
dummy.render = function() {};
dummy.get = function() {};
dummy.addItem = function() {};
dummy.removeItem = function() {};
dummy.resetNodeStyle = function() {};
dummy.forEachNeighbor = function() {};
dummy.graph = function() {};
dummy.forEachEdge = function() {};
dummy.resetEdgeStyle = function() {};
dummy.getNodeAttributes = function() {};
dummy.setNodeAttribute = function() {};
dummy.resetView = function() {};
dummy.destroy = function() {};
dummy.size = function() {};
dummy.id = function() {};
dummy.color = function() {};
dummy.TEXT = function() {};
dummy.TextType = function() {};
dummy.attr = function() {};
dummy.force = function() {};
dummy.distance = function() {};
dummy.links = function() {};
dummy.distanceMax = function() {};
dummy.theta = function() {};
dummy.strength = function() {};
dummy.radius = function() {};
dummy.tick = function() {};
dummy.stop = function() {};
dummy.addNode = function() {};
dummy.addEdge = function() {};
dummy.source = function() {};
dummy.target = function() {};
dummy.PixiGraph = function() {};
dummy.createGraphWithGraph = function() {};
dummy.resetView = function() {};
dummy.dropNode = function() {};
dummy.dropEdge = function() {};
dummy.unhoverNode = function() {};

dummy.bounding = function() {};
dummy.getPageView = function() {};
dummy.convertToPdfPoint = function() {};
dummy.scrollPageIntoView = function() {};
dummy.convertToViewportRectangle = function() {};
dummy.init = function() {};
dummy.commit = function() {};
dummy.raw = function() {};
dummy.onHeadersReceived = function() {};
dummy.responseHeaders = function() {};
dummy.velocityDecay = function() {};
dummy.velocityDecay = function() {};
dummy.updatePosition = function() {};
dummy.getNodesObjects = function() {};
dummy.getEdgesObjects = function() {};
dummy.alphaTarget = function() {};
dummy.restart = function() {};
dummy.observe = function() {};
dummy.contentRect = function() {};
dummy.height = function() {};
dummy.createShapes = function() {};
dummy.updateShapes = function() {};
// hickory related, ATTRIBUTE will be $ATTRIBUTE$
dummy.ATTRIBUTE = function() {};
dummy.COMMENT = function() {};
dummy.DOCUMENT = function() {};
dummy.DOCUMENT_TYPE = function() {};
dummy.ELEMENT = function() {};
dummy.TEXT = function() {};
dummy.isAbsolute = function() {};

var utils = {}
utils.withFileTypes = true;
utils.accessTime = 0;
utils.modifiedTime = 0;
utils.changeTime = 0;
utils.birthTime = 0;
utils.atimeMs = 0;
utils.mtimeMs = 0;
utils.ctimeMs = 0;
utils.birthtimeMs = 0;

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
