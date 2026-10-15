/* Test-only SDL event replay for an isolated native application. */
#include <SDL.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <time.h>

static SDL_Window *target;
static FILE *script;
static double started;
static unsigned long next_ms;
static int pending;
static char command[32], arguments[192];
static double next_open;

static double clock_seconds(void) {
  struct timespec t;
  clock_gettime(CLOCK_MONOTONIC, &t);
  return (double)t.tv_sec + (double)t.tv_nsec / 1e9;
}

static SDL_Window *script_create_window(const char *title, int x, int y,
                                        int w, int h, Uint32 flags) {
  SDL_Window *window = SDL_CreateWindow(title, x, y, w, h, flags);
  if (window) {
    if (target) { fprintf(stderr, "replay: multiple SDL windows are unsupported\n"); abort(); }
    target = window;
    fprintf(stderr, "replay: window id=%u title=%s\n", SDL_GetWindowID(window), title);
  }
  return window;
}

static void read_command(void) {
  char line[256];
  while (fgets(line, sizeof line, script)) {
    if (line[0] == '#' || line[0] == '\n') continue;
    arguments[0] = 0;
    int fields = sscanf(line, "%lu %31s %191[^\n]", &next_ms, command, arguments);
    if (fields < 2) { fprintf(stderr, "replay: invalid command: %s", line); abort(); }
    pending = 1;
    return;
  }
  if (ferror(script)) { perror("replay read"); abort(); }
  pending = 0;
}

static int script_poll_event(SDL_Event *event) {
  int found = SDL_PollEvent(event);
  if (found || !event || !target) return found;
  double now = clock_seconds();
  if (!started) started = now;
  const char *path = getenv("LOGSEQ_TEST_INPUT_SCRIPT");
  if (!path) return 0;
  if (!script && now >= next_open) {
    next_open = now + 0.1;
    script = fopen(path, "r");
    if (script) read_command();
  }
  if (!pending || (now-started)*1000. < (double)next_ms) return 0;
  memset(event, 0, sizeof *event);
  Uint32 id = SDL_GetWindowID(target);
  Uint32 stamp = SDL_GetTicks();
  if (!strcmp(command, "move")) {
    event->type = SDL_MOUSEMOTION;
    event->motion.timestamp = stamp; event->motion.windowID = id;
    if (sscanf(arguments, "%d %d", &event->motion.x, &event->motion.y) != 2) abort();
  } else if (!strcmp(command, "down") || !strcmp(command, "up")) {
    event->type = !strcmp(command, "down") ? SDL_MOUSEBUTTONDOWN : SDL_MOUSEBUTTONUP;
    event->button.timestamp = stamp; event->button.windowID = id;
    event->button.button = SDL_BUTTON_LEFT; event->button.clicks = 1;
    event->button.state = event->type == SDL_MOUSEBUTTONDOWN ? SDL_PRESSED : SDL_RELEASED;
    if (sscanf(arguments, "%d %d", &event->button.x, &event->button.y) != 2) abort();
  } else if (!strcmp(command, "text")) {
    event->type = SDL_TEXTINPUT; event->text.timestamp = stamp; event->text.windowID = id;
    if (strlen(arguments) >= sizeof event->text.text) abort();
    strcpy(event->text.text, arguments);
  } else if (!strcmp(command, "key") || !strcmp(command, "release")) {
    int key, mods;
    if (sscanf(arguments, "%d %d", &key, &mods) != 2) abort();
    event->type = !strcmp(command, "key") ? SDL_KEYDOWN : SDL_KEYUP;
    event->key.timestamp = stamp; event->key.windowID = id;
    event->key.state = event->type == SDL_KEYDOWN ? SDL_PRESSED : SDL_RELEASED;
    event->key.keysym.sym = key; event->key.keysym.mod = mods;
    event->key.keysym.scancode = SDL_GetScancodeFromKey(key);
  } else if (!strcmp(command, "wheel")) {
    event->type = SDL_MOUSEWHEEL; event->wheel.timestamp = stamp; event->wheel.windowID = id;
    if (sscanf(arguments, "%f %f", &event->wheel.preciseX, &event->wheel.preciseY) != 2) abort();
    event->wheel.x = (int)event->wheel.preciseX; event->wheel.y = (int)event->wheel.preciseY;
  } else if (!strcmp(command, "resize")) {
    int w, h;
    if (sscanf(arguments, "%d %d", &w, &h) != 2) abort();
    SDL_SetWindowSize(target, w, h);
    event->type = SDL_WINDOWEVENT; event->window.timestamp = stamp; event->window.windowID = id;
    event->window.event = SDL_WINDOWEVENT_SIZE_CHANGED;
    event->window.data1 = w; event->window.data2 = h;
  } else if (!strcmp(command, "quit")) {
    event->type = SDL_QUIT;
  } else { fprintf(stderr, "replay: unknown command %s\n", command); abort(); }
  fprintf(stderr, "replay: at=%.1f clock_s=%.9f command=%s args=%s\n", (now-started)*1000., (double)SDL_GetPerformanceCounter() / (double)SDL_GetPerformanceFrequency(), command, arguments);
  read_command();
  return 1;
}

#define INTERPOSE(replacement, original) \
  __attribute__((used)) static struct { const void *replace; const void *original; } \
  interpose_##original __attribute__((section("__DATA,__interpose"))) = \
  {(const void *)(uintptr_t)&replacement, (const void *)(uintptr_t)&original}

INTERPOSE(script_create_window, SDL_CreateWindow);
INTERPOSE(script_poll_event, SDL_PollEvent);
