#!/usr/bin/env node
/**
 * Extracts metadata about the Logseq JS SDK from the generated *.d.ts files.
 *
 * This script uses ts-morph so we can rely on the TypeScript compiler's view of
 * the declarations. We intentionally read the emitted declaration files in
 * dist/ so that consumers do not need to depend on the source layout.
 *
 * The resulting schema is written to dist/logseq-sdk-schema.json and contains
 * a simplified representation that downstream tooling (Babashka) can consume.
 */

const fs = require('node:fs');
const path = require('node:path');
const { Project, Node } = require('ts-morph');

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'logseq-sdk-schema.json');
const DECL_FILES = [
  'LSPlugin.d.ts',
  'LSPlugin.user.d.ts',
];

/**
 * Interfaces whose methods will be turned into CLJS wrappers at runtime.
 * These correspond to `logseq.<Namespace>` targets in the JS SDK.
 */
const TARGET_INTERFACES = [
  'IAppProxy',
  'IEditorProxy',
  'IDBProxy',
  'IUIProxy',
  'IUtilsProxy',
  'IGitProxy',
  'IAssetsProxy',
];

/**
 * Simple heuristics to determine whether a parameter should be converted via
 * cljs-bean when crossing the JS <-> CLJS boundary.
 */
const BEAN_TO_JS_REGEX =
  /(Record<|Array<|Partial<|UIOptions|UIContainerAttrs|StyleString|StyleOptions|object|any|unknown|IHookEvent|BlockEntity|PageEntity|Promise<\s*Record)/i;

const project = new Project({
  compilerOptions: { allowJs: true },
});

DECL_FILES.forEach((file) => {
  const full = path.join(DIST_DIR, file);
  if (fs.existsSync(full)) {
    project.addSourceFileAtPath(full);
  }
});

const schema = {
  generatedAt: new Date().toISOString(),
  interfaces: {},
  classes: {},
};

const serializeDoc = (symbol) => {
  if (!symbol) return undefined;
  const decl = symbol.getDeclarations()[0];
  if (!decl) return undefined;

  const docs = decl
    .getJsDocs()
    .map((doc) => doc.getComment())
    .filter(Boolean);
  return docs.length ? docs.join('\n\n') : undefined;
};

const serializeParameter = (signature, symbol, memberNode) => {
  const name = symbol.getName();
  const declaration = symbol.getDeclarations()[0];

  let typeText;
  let optional = symbol.isOptional?.() ?? false;
  let rest = symbol.isRestParameter?.() ?? false;

  if (declaration && Node.isParameterDeclaration(declaration)) {
    typeText = declaration.getType().getText();
    optional = declaration.hasQuestionToken?.() ?? false;
    rest = declaration.isRestParameter?.() ?? false;
  } else {
    const location =
      signature.getDeclaration?.() ??
      memberNode ??
      declaration ??
      symbol.getDeclarations()[0];
    typeText = symbol.getTypeAtLocation(location).getText();
  }

  const convertToJs = BEAN_TO_JS_REGEX.test(typeText);

  return {
    name,
    type: typeText,
    optional,
    rest,
    beanToJs: convertToJs,
  };
};

const serializeSignature = (sig, memberNode) => {
  const params = sig.getParameters().map((paramSymbol) =>
    serializeParameter(sig, paramSymbol, memberNode)
  );
  const returnType = sig.getReturnType().getText();
  return {
    parameters: params,
    returnType,
  };
};

const serializeCallable = (symbol, member) => {
  if (!symbol) return null;
  const type = symbol.getTypeAtLocation(member);
  const callSignatures = type.getCallSignatures();
  if (!callSignatures.length) {
    return null;
  }

  return {
    name: symbol.getName(),
    documentation: serializeDoc(symbol),
    signatures: callSignatures.map((sig) => serializeSignature(sig, member)),
  };
};

const sourceFiles = project.getSourceFiles();
sourceFiles.forEach((source) => {
  source.getInterfaces().forEach((iface) => {
    const name = iface.getName();
    if (!TARGET_INTERFACES.includes(name)) {
      return;
    }

    const interfaceSymbol = iface.getType().getSymbol();
    const doc = serializeDoc(interfaceSymbol);
    const methods = iface
      .getMembers()
      .map((member) => serializeCallable(member.getSymbol(), member))
      .filter(Boolean);

    schema.interfaces[name] = {
      documentation: doc,
      methods,
    };
  });

  source.getClasses().forEach((cls) => {
    const name = cls.getName();
    if (name !== 'LSPluginUser') {
      return;
    }

    const classSymbol = cls.getType().getSymbol();
    const doc = serializeDoc(classSymbol);
    const methods = cls
      .getInstanceMethods()
      .filter((method) => method.getName() !== 'constructor')
      .map((method) => serializeCallable(method.getSymbol(), method))
      .filter(Boolean);
    const getters = cls.getGetAccessors().map((accessor) => ({
      name: accessor.getName(),
      documentation: serializeDoc(accessor.getSymbol()),
      returnType: accessor.getReturnType().getText(),
    }));

    schema.classes[name] = {
      documentation: doc,
      methods,
      getters,
    };
  });
});

fs.mkdirSync(DIST_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(schema, null, 2));

console.log(`Wrote ${OUTPUT_FILE}`);
