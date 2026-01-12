// config/agenda.ts
import Agenda from "agenda";
import dotenv from 'dotenv';
dotenv.config()
// const agenddotenv.cona = new Agenda({
//     db: { address: process.env.MONGODB_CONNECTION_STRING!, collection: "agendaJobs" },
//     processEvery: "1 minute" // Checks for due jobs every minute
// });

// // Start Agenda
// async function() {
//     await agenda.start();
//     console.log("Agenda Automation Engine Started");
// }

const agenda = new Agenda({
    db: {
        address: process.env.MONGODB_CONNECTION_STRING!,
        collection: "automation_jobs", // This will be the new collection in your DB
    },
    // This tells Agenda to check for due jobs every 1 minute
    processEvery: "1 minute",
    // Ensure it doesn't try to run jobs if the DB is not ready
    maxConcurrency: 20,
});

// Basic error logging
agenda.on("error", (err) => {
    console.error("Agenda Connection Error:", err);
});

export default agenda;