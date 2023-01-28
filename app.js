const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

module.exports = app;
const dbPath = path.join(__dirname, "covid19India.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const statesListCase = (list) => {
  return {
    stateId: list.state_id,
    stateName: list.state_name,
    population: list.population,
  };
};

const districtListCase = (list) => {
  return {
    districtId: list.district_id,
    districtName: list.district_name,
    stateId: list.state_id,
    cases: list.cases,
    cured: list.cured,
    active: list.cured,
    deaths: list.deaths,
  };
};

// 1. GET ALL STATES
app.get("/states/", async (request, response) => {
  const query = `
  SELECT 
  * 
  FROM 
  district 
  ORDER BY 
  district_id;`;

  const statesList = await db.all(query);
  response.send(statesList);
});

// 2. GET BY STATE ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `
  SELECT 
  * 
  FROM 
  state 
  WHERE 
  state_id = ${stateId};`;
  const stateById = await db.get(query);
  response.send(statesListCase(stateById));
});

// 3. POST
app.post("/districts/", async (request, response) => {
  const districtsDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsDetails;

  const query = `
  INSERT INTO 
  district(
    district_name, 
    state_id, 
    cases, 
    cured, 
    active, 
    deaths)
  VALUES (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths} 
    )`;
  await db.run(query);
  response.send("District Successfully Added");
});

// 4. GET BY DISTRICT IDS
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
  SELECT 
  * 
  FROM 
  district
  WHERE 
  district_id = ${districtId};`;
  const stateById = await db.get(query);
  response.send(stateById);
});

// 5. DELETE
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
  DELETE FROM 
  district
  WHERE 
  district_id = ${districtId};`;
  await db.run(query);
  response.send("District Removed");
});

// 6. PUT
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const query = `
  UPDATE 
  district 
  SET 
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE 
  district_id = ${districtId};`;
  await db.run(query);
  response.send("District Details Updated");
});

// 7. GET STATES ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `
  SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
  FROM 
    district 
  WHERE
  state_id = ${stateId};`;

  const stats = await db.get(query);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});
