export class CloseError extends Error {
  constructor(
    readonly reason?: string,
    readonly from?: string,
  ) {
    super(`Closed`)
  }
}

export class ConnectionCloseError extends CloseError {
  constructor(
    readonly reason?: string
  ) {
    super(reason, "connection")
  }
}

export class ChannelCloseError extends CloseError {
  constructor(
    readonly reason?: string
  ) {
    super(reason, "channel")
  }
}
