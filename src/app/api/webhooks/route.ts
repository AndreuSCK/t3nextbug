import { Webhook } from "svix";
import { headers } from "next/headers";
import { type WebhookEvent } from "@clerk/nextjs/server";

import { api } from "~/trpc/server";

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  // console.log("Webhook body:", body);
  const parsedBody = JSON.parse(body) as WebhookEvent;

  if (eventType === "user.created") {
    if (!parsedBody.data.id) {
      console.error("No user ID found in webhook payload");
      return new Response("Error occured", {
        status: 400,
      });
    }
    const existingUser = await api.user.queryUser({
      clerkId: parsedBody.data.id,
    });
    if (existingUser) {
      console.error("User already exists");
      return new Response("Error occured", {
        status: 400,
      });
    }
    const newUser = await api.user.createUser({
      clerkId: parsedBody.data.id,
    });
    console.log("New user created:", newUser);
  }
  if (eventType === "user.deleted") {
    if (!parsedBody.data.id) {
      console.error("No user ID found in webhook payload");
      return new Response("Error occured", {
        status: 400,
      });
    }
    const existingUser = await api.user.queryUser({
      clerkId: parsedBody.data.id,
    });
    if (!existingUser) {
      console.error("User does not exist");
      return new Response("Error occured", {
        status: 400,
      });
    }
    const deletedUser = api.user.deleteUser({
      id: existingUser.id,
    });
    console.log("User deleted:", deletedUser);
  }

  return new Response("", { status: 200 });
}
