const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const path = require("path");
const DBPath = path.join(__dirname, "cricketMatchDetails.db");
const sqlite3 = require("sqlite3");

let DBConnection = null;
const initializingDbAndServer = async () => {
  try {
    DBConnection = await open({
      filename: DBPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
};
initializingDbAndServer();

//Writting API's for client requirements:

// Get list of players using API's:
const convertFromDbObjectToResponseObject = (DBObject) => {
  return {
    playerId: DBObject.player_id,
    playerName: DBObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersListWithSqlQuery = `
SELECT *
FROM
player_details;
`;
  const playerList = await DBConnection.all(getPlayersListWithSqlQuery);
  response.send(
    playerList.map((eachPlayer) =>
      convertFromDbObjectToResponseObject(eachPlayer)
    )
  );
});

// Get Specific player using API:
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerWithSqlQuery = `
    SELECT *
    FROM
    player_details
    WHERE
    player_id = ${playerId};
    `;
  const player = await DBConnection.get(getSpecificPlayerWithSqlQuery);
  response.send(convertFromDbObjectToResponseObject(player));
});

// Update Specific player using API:
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateSpecificPlayerWithSqlQuery = `
    UPDATE
    player_details
    SET
        player_name = "${playerName}"
        WHERE
        player_id = ${playerId};
    `;
  await DBConnection.run(updateSpecificPlayerWithSqlQuery);
  response.send("Player Details Updated");
});

// Get Match details using API:
const convertDBObjectToResponseObject = (DBObject) => {
  return {
    matchId: DBObject.match_id,
    match: DBObject.match,
    year: DBObject.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchWithSqlQuery = `
    SELECT *
    FROM 
    match_details
    WHERE
    match_id = ${matchId};
    `;
  const matchDetails = await DBConnection.get(getSpecificMatchWithSqlQuery);
  response.send(convertDBObjectToResponseObject(matchDetails));
});

// get list of match of player using API:
const convertDbObjectTOResponseObject = (DBObject) => {
  return {
    matchId: DBObject.match_id,
    match: DBObject.match,
    year: DBObject.year,
  };
};
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchListSpecificPlayerWithSqlQuery = `
    SELECT *
    FROM
    player_match_score NATURAL JOIN match_details
    WHERE
    player_id = ${playerId};
    `;
  const matchList = await DBConnection.all(
    getMatchListSpecificPlayerWithSqlQuery
  );
  response.send(
    matchList.map((eachMatch) => convertDbObjectTOResponseObject(eachMatch))
  );
});

// Get list of players using API:
const convertDBObjectTOResponseObject = (DBObject) => {
  return {
    playerId: DBObject.player_id,
    playerName: DBObject.player_name,
  };
};
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerListWithSqlQuery = `
    SELECT *
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE
    match_id = ${matchId};
    `;
  const playerList = await DBConnection.all(getPlayerListWithSqlQuery);
  response.send(
    playerList.map((eachPlayer) => convertDBObjectTOResponseObject(eachPlayer))
  );
});

// Get statistics of specific player using API:
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsOfSpecificPlayerWithSqlQuery = `
    SELECT 
    player_details.player_id,
    player_details.player_name,
    SUM(score),
    SUM(fours),
    SUM(sixes)
    FROM
    player_details INNER JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id
    WHERE 
    player_details.player_id = ${playerId};
    `;
  const statistics = await DBConnection.get(
    getStatisticsOfSpecificPlayerWithSqlQuery
  );
  response.send({
    playerId: statistics["player_id"],
    playerName: statistics["player_name"],
    totalScore: statistics["SUM(score)"],
    totalFours: statistics["SUM(fours)"],
    totalSixes: statistics["SUM(sixes)"],
  });
});

module.exports = app;
