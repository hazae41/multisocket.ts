import { WSClientConn, WSServer } from "../mod.ts"
import { Timeout } from "../deps/timeout.ts"

// Open a WS server on HTTP
const server = new WSServer({ port: 8443 })

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

async function connect() {
  const client =
    new WSClientConn("ws://localhost:8443")

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
}

connect()