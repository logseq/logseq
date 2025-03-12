import {
  spawn,
  SpawnOptions,
  ChildProcess,
  Serializable,
  SendHandle,
  MessageOptions,
} from 'child_process'
import { PluginLogger } from './helpers'

const logger = new PluginLogger('Execute Binary Hundler', { console: true })

export class Child_process_config {
  private _command: string = 'whoami' // default command
  stdoutEncoding: BufferEncoding = 'utf8'

  // default Spawn Options (read me here https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)
  options: SpawnOptions = {
    stdio: ['pipe', 'pipe', process.stderr], // child sharing only stderr.
    shell: true, // Allows execution of shell commands
    cwd: window.logseq.Experiments.pluginLocal.localRoot, // Current working directory of the child process.
  }

  set_command(c: string) {
    this._command = c
  }

  /**
   * hundlers of all envent listeners for `stdout`.
   */
  stdoutOnData: (data: any | null | undefined) => void = (
    data: any | null | undefined
  ): void => {
    logger.info(`Output: ${data}`)
  }
  stdoutOnPause: () => void = (): void => {
    logger.info(`Process Paused`)
  }
  stdoutOnResume: () => void = (): void => {
    logger.info(`Process Resumed`)
  }
  stdoutOnReadableChunk: (chunk: any | null | undefined) => void = (
    chunk: any | null | undefined
  ): void => {}

  stdoutOnError: (err: Error | null | undefined) => void = (
    err: Error | null | undefined
  ): void => {
    logger.error(err)
  }
  stdoutOnClose: () => void = (): void => {
    logger.info('Stream closed')
  }
  stdoutOnEnd: () => void = (): void => {
    logger.info('End of input')
  }

  /**
   * hundlers of all envent listeners for `stderr`.
   */
  stderrOnData: (data: any | null | undefined) => void = (data: any): void => {
    logger.info(`Output: ${data.toString()}`)
  }
  stderrOnPause: () => void = (): void => {
    logger.info(`Process Paused`)
  }
  stderrOnResume: () => void = (): void => {
    logger.info(`Process Resumed`)
  }
  stderrOnReadableChunk: (chunk: any | null | undefined) => void = (
    chunk: any
  ): void => {}

  stderrOnError: (err: Error | null | undefined) => void = (
    err: Error | null | undefined
  ): void => {
    logger.error(err)
  }
  stderrOnClose: () => void = (): void => {
    logger.info('Stream closed')
  }
  stderrOnEnd: () => void = (): void => {
    logger.info('End of input')
  }

  /**
   * hundlers of all envent listeners for `stdin`.
   *
   */
  stdinOnData: (data: any | null | undefined) => void = (data: any) => {
    logger.info(`Output: ${data}`)
  }
  stdinOnError: (err: Error | null | undefined) => void = (
    err: Error | null | undefined
  ): void => {
    logger.error(`Output: ${err}`)
  }
  stdinOnDrain: () => void = (): void => {
    logger.info('Buffer is ready for more data.')
  }
  stdinOnFinish: () => void = (): void => {
    logger.info('All writes completed.')
  }
  stdinOnClose: () => void = (): void => {
    logger.info('Stream closed.')
  }

  /**
   * hundlers of all envent listeners for `process`.
   */
  onClose = (code: number) => {
    if (code === 0) {
      logger.info(`Command '${this._command}' executed successfully.`)
    } else {
      logger.error(`Command '${this._command}' failed with exit code: ${code}`)
    }
  }
  onError: (err: Error | null | undefined) => void = (
    err: Error | null | undefined
  ): void => {
    logger.error(`Output: ${err}`)
  }
}

export class PluginChildProcess {
  private _process: ChildProcess

  constructor(process: ChildProcess) {
    this._process = process
  }

  get childProcess(): ChildProcess {
    return this._process
  }

  /**
   * Returns the process identifier (PID) of the child process.
   * If the child process fails to spawn due to an error, the value is and `error` is emitted.
   */
  getPID(): number | undefined {
    return this._process.pid
  }

  /**
   * The `pauseStdout()` method causes a stream in flowing mode to stop emitting 'data' events,
   * thus exiting flow mode. Any data that becomes available will remain in the internal buffer.
   *
   * @param timeoutMS - delay
   */
  pauseStdout(timeoutMS: number = 0): void {
    setTimeout(() => this._process.stdout?.pause(), timeoutMS)
  }

  /**
   * The `resumeStdout()` method causes an explicitly paused `Readable` stream to
   * resume emitting `data' events, putting the stream into flowing mode.
   * The `resumeStdout()` method can be used to fully consume the data from a
   * stream without actually processing any of that data.
   *
   * @param timeoutMS
   */
  resumeStdout(timeoutMS: number = 0): void {
    setTimeout(() => this._process.stdout?.resume(), timeoutMS)
  }

  /**
   * ==============
   * This description is taken from the Office child_process library.
   * ==============
   *
   * The return value is `true` if the internal buffer is less than the`highWaterMark` configured when the stream was created after admitting `chunk`.
   * If `false` is returned, further attempts to write data to the stream should
   * stop until the 'drain' event is emitted.
   *
   *
   * While a stream is not draining, calls to `write()` will buffer `chunk`, and
   * return false. Once all currently buffered chunks are drained (accepted for
   * delivery by the operating system), the `'drain'` event will be emitted.
   * Once `write()` returns false, do not write more chunks
   * until the `'drain'` event is emitted. While calling `write()` on a stream that
   * is not draining is allowed, Node.js will buffer all written chunks until
   * maximum memory usage occurs, at which point it will abort unconditionally.
   * Even before it aborts, high memory usage will cause poor garbage collector
   * performance and high RSS (which is not typically released back to the system,
   * even after the memory is no longer required). Since TCP sockets may never
   * drain if the remote peer does not read the data, writing a socket that is
   * not draining may lead to a remotely exploitable vulnerability.
   *
   * @param data - data to be writen to stdin
   * @param encoding - type of encoding :
   * type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "base64url" | "latin1" | "binary" | "hex"
   * @param callback - callback
   * @returns
   */
  writeToStdin(
    data: string,
    encoding: BufferEncoding,
    callback?: (error: Error | null | undefined) => void
  ): boolean | undefined {
    return this._process.stdin?.write(data, encoding, callback)
  }

  /**
   * ==============
   * This description is taken from the Office child_process library.
   * ==============
   *
   * Calling the `endStdin()` method signals that no more data will be written
   * to the `Writable`. The optional `chunk` and `encoding` arguments allow one
   * final additional chunk of data to be written immediately before closing the
   * stream.
   *
   * Calling the {@link write} method after calling {@link end} will raise an error.
   *
   *
   * @param chunk
   * @param encoding
   * @param cb
   */
  endStdin(chunk: any, encoding: BufferEncoding, cb?: () => void): void {
    this._process.stdin?.end(chunk, encoding, cb)
  }

  /**
   * ==============
   * This description is taken from the Office child_process library.
   * ==============
   *
   *
   * The `subprocess.kill()` method sends a signal to the child process. If no
   * argument is given, the process will be sent the `'SIGTERM'` signal. See [`signal(7)`](http://man7.org/linux/man-pages/man7/signal.7.html) for a list of available signals. This function
   * returns `true` if [`kill(2)`](http://man7.org/linux/man-pages/man2/kill.2.html) succeeds, and `false` otherwise.
   *
   * ```js
   * const { spawn } = require('node:child_process');
   * const grep = spawn('grep', ['ssh']);
   *
   * grep.on('close', (code, signal) => {
   *   console.log(
   *     `child process terminated due to receipt of signal ${signal}`);
   * });
   *
   * // Send SIGHUP to process.
   * grep.kill('SIGHUP');
   * ```
   *
   * The `ChildProcess` object may emit an `'error'` event if the signal
   * cannot be delivered. Sending a signal to a child process that has already exited
   * is not an error but may have unforeseen consequences. Specifically, if the
   * process identifier (PID) has been reassigned to another process, the signal will
   * be delivered to that process instead which can have unexpected results.
   *
   * While the function is called `kill`, the signal delivered to the child process
   * may not actually terminate the process.
   *
   * See [`kill(2)`](http://man7.org/linux/man-pages/man2/kill.2.html) for reference.
   *
   * On Windows, where POSIX signals do not exist, the `signal` argument will be
   * ignored, and the process will be killed forcefully and abruptly (similar to`'SIGKILL'`).
   * See `Signal Events` for more details.
   *
   * On Linux, child processes of child processes will not be terminated
   * when attempting to kill their parent. This is likely to happen when running a
   * new process in a shell or with the use of the `shell` option of `ChildProcess`:
   *
   * ```js
   * 'use strict';
   * const { spawn } = require('node:child_process');
   *
   * const subprocess = spawn(
   *   'sh',
   *   [
   *     '-c',
   *     `node -e "setInterval(() => {
   *       console.log(process.pid, 'is alive')
   *     }, 500);"`,
   *   ], {
   *     stdio: ['inherit', 'inherit', 'inherit'],
   *   },
   * );
   *
   * setTimeout(() => {
   *   subprocess.kill(); // Does not terminate the Node.js process in the shell.
   * }, 2000);
   * ```
   * @since v0.1.90
   */
  kill(signal?: NodeJS.Signals | number): boolean {
    return this._process.kill(signal)
  }

  /**
   * ==============
   * This description is taken from the Office child_process library.
   * ==============
   *
   * When an IPC channel has been established between the parent and child (
   * i.e. when using {@link fork}), the `subprocess.send()` method can
   * be used to send messages to the child process. When the child process is a
   * Node.js instance, these messages can be received via the `'message'` event.
   *
   * The message goes through serialization and parsing. The resulting
   * message might not be the same as what is originally sent.
   *
   * For example, in the parent script:
   *
   * ```js
   * const cp = require('node:child_process');
   * const n = cp.fork(`${__dirname}/sub.js`);
   *
   * n.on('message', (m) => {
   *   console.log('PARENT got message:', m);
   * });
   *
   * // Causes the child to print: CHILD got message: { hello: 'world' }
   * n.send({ hello: 'world' });
   * ```
   *
   * And then the child script, `'sub.js'` might look like this:
   *
   * ```js
   * process.on('message', (m) => {
   *   console.log('CHILD got message:', m);
   * });
   *
   * // Causes the parent to print: PARENT got message: { foo: 'bar', baz: null }
   * process.send({ foo: 'bar', baz: NaN });
   * ```
   *
   * Child Node.js processes will have a `process.send()` method of their own
   * that allows the child to send messages back to the parent.
   *
   * There is a special case when sending a `{cmd: 'NODE_foo'}` message. Messages
   * containing a `NODE_` prefix in the `cmd` property are reserved for use within
   * Node.js core and will not be emitted in the child's `'message'` event. Rather, such messages are emitted using the`'internalMessage'` event and are consumed internally by Node.js.
   * Applications should avoid using such messages or listening for`'internalMessage'` events as it is subject to change without notice.
   *
   * The optional `sendHandle` argument that may be passed to `subprocess.send()` is
   * for passing a TCP server or socket object to the child process. The child will
   * receive the object as the second argument passed to the callback function
   * registered on the `'message'` event. Any data that is received
   * and buffered in the socket will not be sent to the child.
   *
   * The optional `callback` is a function that is invoked after the message is
   * sent but before the child may have received it. The function is called with a
   * single argument: `null` on success, or an `Error` object on failure.
   *
   * If no `callback` function is provided and the message cannot be sent, an`'error'` event will be emitted by the `ChildProcess` object. This can
   * happen, for instance, when the child process has already exited.
   *
   * `subprocess.send()` will return `false` if the channel has closed or when the
   * backlog of unsent messages exceeds a threshold that makes it unwise to send
   * more. Otherwise, the method returns `true`. The `callback` function can be
   * used to implement flow control.
   *
   * #### Example: sending a server object
   *
   * The `sendHandle` argument can be used, for instance, to pass the handle of
   * a TCP server object to the child process as illustrated in the example below:
   *
   * ```js
   * const subprocess = require('node:child_process').fork('subprocess.js');
   *
   * // Open up the server object and send the handle.
   * const server = require('node:net').createServer();
   * server.on('connection', (socket) => {
   *   socket.end('handled by parent');
   * });
   * server.listen(1337, () => {
   *   subprocess.send('server', server);
   * });
   * ```
   *
   * The child would then receive the server object as:
   *
   * ```js
   * process.on('message', (m, server) => {
   *   if (m === 'server') {
   *     server.on('connection', (socket) => {
   *       socket.end('handled by child');
   *     });
   *   }
   * });
   * ```
   *
   * Once the server is now shared between the parent and child, some connections
   * can be handled by the parent and some by the child.
   *
   * While the example above uses a server created using the `node:net` module,`node:dgram` module servers use exactly the same workflow with the exceptions of
   * listening on a `'message'` event instead of `'connection'` and using`server.bind()` instead of `server.listen()`. This is, however, only
   * supported on Unix platforms.
   *
   * #### Example: sending a socket object
   *
   * Similarly, the `sendHandler` argument can be used to pass the handle of a
   * socket to the child process. The example below spawns two children that each
   * handle connections with "normal" or "special" priority:
   *
   * ```js
   * const { fork } = require('node:child_process');
   * const normal = fork('subprocess.js', ['normal']);
   * const special = fork('subprocess.js', ['special']);
   *
   * // Open up the server and send sockets to child. Use pauseOnConnect to prevent
   * // the sockets from being read before they are sent to the child process.
   * const server = require('node:net').createServer({ pauseOnConnect: true });
   * server.on('connection', (socket) => {
   *
   *   // If this is special priority...
   *   if (socket.remoteAddress === '74.125.127.100') {
   *     special.send('socket', socket);
   *     return;
   *   }
   *   // This is normal priority.
   *   normal.send('socket', socket);
   * });
   * server.listen(1337);
   * ```
   *
   * The `subprocess.js` would receive the socket handle as the second argument
   * passed to the event callback function:
   *
   * ```js
   * process.on('message', (m, socket) => {
   *   if (m === 'socket') {
   *     if (socket) {
   *       // Check that the client socket exists.
   *       // It is possible for the socket to be closed between the time it is
   *       // sent and the time it is received in the child process.
   *       socket.end(`Request handled with ${process.argv[2]} priority`);
   *     }
   *   }
   * });
   * ```
   *
   * Do not use `.maxConnections` on a socket that has been passed to a subprocess.
   * The parent cannot track when the socket is destroyed.
   *
   * Any `'message'` handlers in the subprocess should verify that `socket` exists,
   * as the connection may have been closed during the time it takes to send the
   * connection to the child.
   * @param options The `options` argument, if present, is an object used to parameterize the sending of certain types of handles. `options` supports the following properties:
   */
  send(
    message: Serializable,
    sendHandle?: SendHandle,
    options?: MessageOptions,
    callback?: (error: Error | null) => void
  ): boolean {
    return this._process.send(message, sendHandle, options, callback)
  }
}

export class executeBinary {
  /**
   * Executes a binary in a shell and handles its input/output streams in real time.
   * @param command - The command to execute.
   * @param args - Additional arguments to the command.
   * @param {Child_process_config} config - An instance of "Child_process_config", which allows you to quickly configure spawned
   * spawned processes
   * Note:
   *   'executeBinary' uses the nodejs 'child_process' api to
   *   to spawn processes suitable when you want to execute a binary and handle its input/output
   *   and handle its input/output streams, while being highly configurable.
   *
   * @returns ChildProcess instance
   *
   */
  Binary(
    command: string,
    args: string[] = [],
    config: Child_process_config = new Child_process_config()
  ): PluginChildProcess | null {
    logger.info('cwd: ', window.logseq.Experiments.pluginLocal.localRoot)
    config.set_command(command)

    if (!command) {
      logger.error('No command provided.')
      return null
    }

    logger.info(`Executing command: ${command} ${args.join(' ')}`)

    const _process: ChildProcess = spawn(command, args, config.options)

    this.setEventsListeners(_process, config)

    const PlugProc = new PluginChildProcess(_process)

    return PlugProc
  }

  /**
   * Configures event listeners for a child process's standard input (stdin),
   * standard output (stdout), standard error (stderr), and the process itself.
   * This method utilizes a `Child_process_config` object to dynamically attach
   * the appropriate callbacks for various events, ensuring modularity and flexibility.
   *
   * @param {Child_process_config} config - The configuration object containing
   * the callback functions for handling specific events.
   *
   * Standard Output (stdout):
   * - data: Called when data is available to read.
   * - pause: Invoked when the stream is paused.
   * - resume: Invoked when the stream resumes.
   * - end: Triggered when the stream ends and no more data will be provided.
   * - close: Triggered when the stream is closed.
   * - error: Called when an error occurs with the stream.
   * - readable: Invoked when the stream is readable, and chunks can be read explicitly.
   *
   * Standard Error (stderr):
   * - Events are similar to stdout: `data`, `pause`, `resume`, `end`, `close`, `error`, and `readable`.
   * - Handles error-specific output of the process.
   *
   * Standard Input (stdin):
   * - data: Not typically emitted but provided for consistency.
   * - error: Triggered on input stream errors.
   * - drain: Indicates the stream is ready to accept more data after buffering.
   * - finish: Called when the input stream has been closed.
   * - close: Triggered when the input stream is fully closed.
   *
   * Process:
   * - close: Invoked when the process exits and all streams have been closed.
   * - error: Triggered if there is an error during process execution.
   *
   * Implementation Details:
   * - Encoding for `stdout` is set dynamically using the provided `stdoutEncoding` in the config.
   * - The `readable` event for both `stdout` and `stderr` reads chunks manually and invokes
   * the corresponding `stdoutOnReadableChunk` or `stderrOnReadableChunk` callback.
   *
   */
  private setEventsListeners(
    _process: ChildProcess,
    config: Child_process_config
  ): void {
    _process.stdout?.setEncoding(config.stdoutEncoding) // for text input

    /**
     * stdout and stderr Event listeners
     * The defined events on documents include:
     * 1. close
     * 2. data
     * 3. end
     * 4. error
     * 5. pause
     * 6. readable
     * 7. resume
     **/
    _process.stdout?.on('data', config.stdoutOnData)
    _process.stdout?.on('pause', config.stdoutOnPause)
    _process.stdout?.on('resume', config.stdoutOnResume)
    _process.stdout?.on('end', config.stdoutOnEnd)
    _process.stdout?.on('close', config.stdoutOnClose)
    _process.stdout?.on('error', config.stdoutOnError)
    _process.stdout?.on('readable', () => {
      let chunk: any
      while ((chunk = _process.stdout?.read()) !== null) {
        config.stdoutOnReadableChunk(chunk)
      }
    })

    _process.stderr?.on('data', config.stderrOnData)
    _process.stderr?.on('pause', config.stderrOnPause)
    _process.stderr?.on('resume', config.stderrOnResume)
    _process.stderr?.on('end', config.stderrOnEnd)
    _process.stderr?.on('close', config.stderrOnClose)
    _process.stderr?.on('error', config.stderrOnError)
    _process.stderr?.on('readable', () => {
      let chunk: any
      while ((chunk = _process.stderr?.read()) !== null) {
        config.stderrOnReadableChunk(chunk)
      }
    })

    /**
     * stdin Event listeners
     * The defined events on documents include:
     * 1. close
     * 2. drain
     * 3. error
     * 4. finish
     */
    _process.stdin?.on('data', config.stdinOnData)
    _process.stdin?.on('error', config.stdinOnError)
    _process.stdin?.on('drain', config.stdinOnDrain)
    _process.stdin?.on('finish', config.stdinOnFinish)
    _process.stdin?.on('close', config.stdinOnClose)

    /**
     * Process Event listeners
     * The defined events on documents include:
     * 1. close
     * 2. error
     */
    _process.on('close', config.onClose)
    _process.on('error', config.onError)
  }
}
