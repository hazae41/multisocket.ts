import { Abort } from "../deps/abortable.ts";
import { EventEmitter } from "../deps/mutevents.ts";
import { Timeout } from "../deps/timeout.ts";

import { WSMessage } from "./types.ts";
import { WSConn } from "./conn.ts";

import {
  ChannelCloseError,
  CloseError
} from "./errors.ts";

export interface WSChannelEvents {
  open: undefined
  close: unknown
  message: unknown
}

export class WSChannel extends EventEmitter<WSChannelEvents> {
  state: "open" | "closed" = "closed"

  /**
   * Create a new unopened channel
   * @param conn Connection
   * @param uuid Channel UUID
   */
  constructor(
    readonly conn: WSConn,
    readonly uuid: string
  ) {
    super()

    conn.once(["close"], this.reemit("close"))

    this.once(["open"], () => this.state = "open")
    this.once(["close"], () => this.state = "closed")
  }

  get closed() { return this.state === "closed" }

  /**
   * Redirects errors to the remote
   * @param e Error to redirect
   * @throws unknown if not an Error
   */
  async catch(e: unknown) {
    if (e instanceof Error && !this.closed)
      await this.throw(e.message)
  }

  /**
   * Open the channel with some data (or not)
   * @param path Path
   * @param data Data to send
   */
  async open(path: string, data?: unknown) {
    const { conn, uuid } = this;
    await conn.send(
      { uuid, type: "open", path, data })
    await this.emit("open", undefined)
  }

  /**
   * Close the channel with some data (or not)
   * @param data Data to send
   */
  async close(data?: unknown) {
    const { conn, uuid } = this;
    await conn.send(
      { uuid, type: "close", data })
    await this.emit("close", undefined)
  }

  /**
   * Close the channel with an error
   * @param reason Error reason
   */
  async throw(reason?: string) {
    const { conn, uuid } = this;
    await conn.send(
      { uuid, type: "error", reason })
    await this.emit("close",
      new ChannelCloseError(reason))
  }

  /**
   * Send some data
   * @param data Data to send
   */
  async send(data?: unknown) {
    const { conn, uuid } = this;
    await conn.send({ uuid, data })
  }

  /**
   * Wait for any message.
   * Throws if it's closed with an error or timed out
   * @param delay Timeout delay
   * @returns Some typed data
   * @throw CloseError | TimeoutError
   */
  async read(delay = 0) {
    const message = this.wait(["message"])
    const close = this.wait(["close"])

    const result = delay > 0
      ? await Timeout.race([message, close], delay)
      : await Abort.race([message, close])

    if (result instanceof CloseError)
      throw result

    return result
  }

  /**
   * Wait for a close message.
   * Throws if it's closed with an error, timed out, or if we received a normal message.
   */
  async final(delay = 0) {
    const close = this.wait(["close"])
    const message = this.error(["message"])
      .catch(() => new Error("Unexpected message"))

    const result = delay > 0
      ? await Timeout.race([message, close], delay)
      : await Abort.race([message, close])

    if (result instanceof CloseError)
      throw result

    return result
  }
}