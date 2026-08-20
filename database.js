const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "database.json");

const defaultDatabase = {
  users: [],
  nextUserId: 1
};

if (!fs.existsSync(file)) {
  fs.writeFileSync(
    file,
    JSON.stringify(defaultDatabase, null, 2)
  );
}

function load() {
  return JSON.parse(
    fs.readFileSync(file, "utf8")
  );
}

function save(data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2)
  );
}

function findUser(username) {
  const db = load();

  return db.users.find(
    user => user.username === username
  );
}

function createUser(username) {
  const db = load();

  const user = {
    id: db.nextUserId++,
    username,
    balance: 125,
    inventory: [
      "neon-fang",
      "phantom-ak",
      "cyber-awp",
      "void-gloves"
    ],
    history: [],
    createdAt: new Date().toISOString()
  };

  db.users.push(user);

  save(db);

  return user;
}

function updateUser(user) {
  const db = load();

  const index = db.users.findIndex(
    item => item.id === user.id
  );

  if (index === -1) {
    throw new Error("User not found");
  }

  db.users[index] = user;

  save(db);

  return user;
}

module.exports = {
  load,
  save,
  findUser,
  createUser,
  updateUser
};
