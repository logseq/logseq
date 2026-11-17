// Desktop graph reads use the native database transport. Published-page memory
// workers belong to the browser build and must not enter the desktop bundle.
export async function open() {
  throw new Error("Published-page memory databases are unavailable in the native desktop build");
}
export async function invoke() {
  throw new Error("Published-page memory databases are unavailable in the native desktop build");
}
