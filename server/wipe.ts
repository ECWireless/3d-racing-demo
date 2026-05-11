import { sql } from "./db";

await sql`
  truncate table
    race_room_results,
    race_room_players,
    race_rooms,
    race_results,
    players
  restart identity cascade
`;

console.log("Database data wiped. Schema is unchanged.");
