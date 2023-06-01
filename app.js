const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(5000, () => {
      console.log("Server Running at http://localhost:5000/");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initializeDBAndServer();

//Register API1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const checkExistingUser = `
    SELECT
    *
    FROM
    user
    WHERE
    username = '${username}';`;

  const isUserExisting = await db.get(checkExistingUser);

  if (isUserExisting === undefined) {
    //user not exit so creating new account
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      const creatingUser = `
           INSERT INTO user
           (username,name,password,gender,location)
           VALUES
           ('${username}',
           '${name}',
           '${hashedPassword}',
           '${gender}',
           '${location}'
           );`;

      await db.run(creatingUser);

      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login API2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const checkValidUser = `
    SELECT
    *
    FROM
    user
    WHERE
    username = '${username}';`;

  const isUserExisting = await db.get(checkValidUser);

  if (isUserExisting === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(
      password,
      isUserExisting.password
    );

    if (isPasswordCorrect) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Change Password API3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const gettingUserQuery = `
    SELECT
    *
    FROM
    user
    WHERE 
    username = '${username}';`;

  const existingUser = await db.get(gettingUserQuery);

  isOldPasswordCorrect = await bcrypt.compare(
    oldPassword,
    existingUser.password
  );

  if (isOldPasswordCorrect) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatingPassword = `
            UPDATE user
            SET
            password = '${hashedPassword}'
            WHERE
            username = '${username}';`;

      await db.run(updatingPassword);

      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
