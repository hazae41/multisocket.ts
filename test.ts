import { WSServer } from "./src/server.ts"
import { WSClientConn } from "./src/client.ts"
import { Timeout } from "./deps/timeout.ts"

const server = new WSServer({ port: 8443 })

server.on(["accept"], async (conn) => {
  const msg = await conn.waitpath("/hello")
  const { channel, data } = msg

  try {
    if (typeof data !== "string")
      throw Error("Invalid data")

    // Open message
    console.log(data)

    await Timeout.wait(100)

    await channel.send("It works!")

    const final = await channel.final()

    if (typeof final !== "string")
      throw Error("Invalid data")

    console.log(final)
    await conn.close()
  } catch (e: unknown) {
    await channel.catch(e)
  }
})

async function connect() {
  const client =
    new WSClientConn("ws://localhost:8443")
  await client.waitready

  const channel =
    await client.open("/hello", "Hello!")

  try {
    const message = await channel.read()

    if (typeof message !== "string")
      throw Error("Invalid data")

    console.log(message)

    await Timeout.wait(100)

    await channel.throw("Bye!")
  } catch (e: unknown) {
    await channel.catch(e)
  }
}

connect()