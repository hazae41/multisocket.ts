# Multisocket

> WebSocket but with channels.

```typescript
const channel = await conn.open("/test", "Hello world")

console.log(await channel.read())

await channel.send(data)

const data2 = await channel.read()

await channel.close(data2)
```

### Server

Use Deno's WebSocket server on HTTP or HTTPS.

#### WebSocket (HTTP)

```typescript
const server = new WSServer({ port: 8443 })
```

#### WebSocket Secure (HTTPS)

```typescript
const server = new WSServer({ 
  port: 8443,
  certFile: "./cert.pem",
  keyFile: "./key.pem",
})
```

#### Example connection using promises

```typescript
// Async event listener (Mutevents)
server.on(["accept"], async (conn) => {

  // Wait for a message on the path "/hello"  
  const { channel, data } = 
    await conn.waitpath("/hello")

  try {
    // Validate message type
    if (typeof data !== "string")
      throw Error("Invalid data")

    console.log(data)

    // Simulate delay
    await Timeout.wait(100)

    // Send a message
    await channel.send("It works!")

    // Wait for a close message
    const final = await channel.final()

    // Validate message type
    if (typeof final !== "string")
      throw Error("Invalid data")

    console.log(final)

    // Close channel without message
    await conn.close()
  } catch (e: unknown) {
    // Close the channel with the error 
    await channel.catch(e)
  }
})
```

### Client

Use your browser WebSocket client on HTTP and HTTPS.

#### WebSocket (HTTP)

```typescript
const client =
  new WSClientConn("ws://localhost:8443")
```

#### WebSocket Secure (HTTPS)

```typescript
const client =
  new WSClientConn("wss://localhost:8443")
```

#### Example connection using promises

```typescript
// Wait for the connection (throws if failed)
await client.waitready

// Open a channel on a path with a message
const channel =
  await client.open("/hello", "Hello!")

try {
  // Wait for a message
  const message = await channel.read()

  // Validate message type
  if (typeof message !== "string")
    throw Error("Invalid data")

  console.log(message)

  // Simulate delay
  await Timeout.wait(100)

  // Close the channel with a message
  await channel.close("Bye!")

  // Close the channel with an error
  // await channel.throw("Error!")
} catch (e: unknown) {
  // Close the channel with an error
  await channel.catch(e)
}
```

Check `test/events.ts` for more examples