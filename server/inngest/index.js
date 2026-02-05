import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

// inngest function to save user data to a database
// const syncUserCreation = inngest.createFunction(
//     { id: 'sync-user-from-clerk' },
//     { event: 'clerk/user.created' },
//     async ({ event }) => {
//         const { data } = event
//         await prisma.user.create({
//             data: {
//                 id: data.id,
//                 email: data?.email_addresses[0]?.email_address,
//                 name: data?.first_name + " " + data?.last_name,
//                 image: data?.image_url,
//             }
//         })
//     }
// )

const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const data = event.data;

        // Guard: Clerk sometimes sends empty email_addresses
        if (!data?.email_addresses?.length) {
            console.log("User created without email, skipping:", data.id);
            return;
        }

        await prisma.user.upsert({
            where: { id: data.id },
            update: {
                email: data.email_addresses[0].email_address,
                name: `${data.first_name || ""} ${data.last_name || ""}`,
                image: data.image_url,
            },
            create: {
                id: data.id,
                email: data.email_addresses[0].email_address,
                name: `${data.first_name || ""} ${data.last_name || ""}`,
                image: data.image_url,
            },
        });
    }
);



//inngest function to delete the user data
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-from-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { data } = event
        await prisma.user.delete({
            where: {
                id: data.id,
            }
        })
    }
)

//inngest function to update the user data

const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { data } = event
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + " " + data?.last_name,
                image: data?.image_url,
            }
        })
    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];