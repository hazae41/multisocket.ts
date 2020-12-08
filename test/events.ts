import { WSServer } from "../src/server.ts"
import { WSClientConn } from "../src/client.ts"

const server = new WSServer({ port: 8443 })

// When a connection is accepted
server.on(["accept"], (conn) => {

  // When a channel is opened on "/test"
  const offtest = conn.paths.on(["/test"],
    (msg) => {
      const { channel } = msg

      // When a message is received
      const offmsg = channel.on(["message"],
        async (data) => {
          console.log("Client said:", data)

          const response = window.prompt("Server:")

          await channel.send(response)
        }
      )

      // Clean up event listener
      channel.once(["close"], offmsg)
    }
  )

  // Clean up event listener
  conn.once(["close"], offtest)
})

async function connect() {
  const client =
    new WSClientConn("ws://localhost:8443")

  await client.waitready

  const channel =
    await client.open("/test")

  for (let i = 0; i < 3; i++) {
    const request = window.prompt("Client:")
    await channel.send(request)

    const response = await channel.read()
    console.log("Server said:", response)
  }

  await channel.close()
  Deno.exit()
}

connect()