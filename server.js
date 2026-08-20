const express = require("express");
const path = require("path");

const {
  findUser,
  createUser,
  updateUser
} = require("./database");

const app = express();

const PORT = 3000;


/* =========================
   CONFIG
========================= */

app.use(express.json());

app.use(
  express.static(__dirname)
);


/* =========================
   ITEMS
========================= */

const ITEMS = [

  {
    id: "neon-fang",
    name: "Neon Fang",
    price: 12.50,
    icon: "🔪",
    rarity: "Rare"
  },

  {
    id: "phantom-ak",
    name: "Phantom AK",
    price: 28.40,
    icon: "🔫",
    rarity: "Rare"
  },

  {
    id: "cyber-awp",
    name: "Cyber AWP",
    price: 42.90,
    icon: "⚡",
    rarity: "Epic"
  },

  {
    id: "void-gloves",
    name: "Void Gloves",
    price: 68.00,
    icon: "🧤",
    rarity: "Epic"
  },

  {
    id: "solar-knife",
    name: "Solar Knife",
    price: 115.00,
    icon: "🗡️",
    rarity: "Legendary"
  },

  {
    id: "quantum-karambit",
    name: "Quantum Karambit",
    price: 240.00,
    icon: "💠",
    rarity: "Legendary"
  },

  {
    id: "aurora-m4",
    name: "Aurora M4",
    price: 310.00,
    icon: "🌌",
    rarity: "Mythic"
  },

  {
    id: "eclipse-dragon",
    name: "Eclipse Dragon",
    price: 520.00,
    icon: "🐉",
    rarity: "Mythic"
  }

];


function getItem(id) {
  return ITEMS.find(
    item => item.id === id
  );
}


/* =========================
   AUTH
========================= */

app.post("/api/register", (req, res) => {

  const username =
    String(req.body.username || "")
      .trim()
      .toLowerCase();

  if (!username) {
    return res.status(400).json({
      error: "Введите имя"
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      error: "Минимум 3 символа"
    });
  }

  if (findUser(username)) {
    return res.status(409).json({
      error: "Пользователь уже существует"
    });
  }

  const user =
    createUser(username);

  res.json({
    user: sanitizeUser(user)
  });

});


app.post("/api/login", (req, res) => {

  const username =
    String(req.body.username || "")
      .trim()
      .toLowerCase();

  const user =
    findUser(username);

  if (!user) {
    return res.status(404).json({
      error: "Пользователь не найден"
    });
  }

  res.json({
    user: sanitizeUser(user)
  });

});


/* =========================
   USER
========================= */

app.get("/api/user/:username", (req, res) => {

  const user =
    findUser(req.params.username);

  if (!user) {
    return res.status(404).json({
      error: "Пользователь не найден"
    });
  }

  res.json({
    user: sanitizeUser(user)
  });

});


function sanitizeUser(user) {

  return {
    id: user.id,
    username: user.username,
    balance: user.balance,
    inventory: user.inventory,
    history: user.history
  };

}


/* =========================
   ITEMS API
========================= */

app.get("/api/items", (req, res) => {

  res.json({
    items: ITEMS
  });

});


/* =========================
   ADD DEMO BALANCE
========================= */

app.post("/api/balance/add", (req, res) => {

  const user =
    findUser(req.body.username);

  if (!user) {
    return res.status(404).json({
      error: "Пользователь не найден"
    });
  }

  user.balance += 25;

  updateUser(user);

  res.json({
    balance: user.balance
  });

});


/* =========================
   UPGRADE
========================= */

app.post("/api/upgrade", (req, res) => {

  const username =
    String(req.body.username || "");

  const sourceId =
    String(req.body.sourceId || "");

  const targetId =
    String(req.body.targetId || "");

  const user =
    findUser(username);

  if (!user) {
    return res.status(404).json({
      error: "Пользователь не найден"
    });
  }

  const source =
    getItem(sourceId);

  const target =
    getItem(targetId);

  if (!source || !target) {
    return res.status(400).json({
      error: "Предмет не найден"
    });
  }


  /*
    Проверяем, действительно ли
    предмет есть в инвентаре.
  */

  if (!user.inventory.includes(sourceId)) {

    return res.status(400).json({
      error: "Предмет отсутствует в инвентаре"
    });

  }


  /*
    Нельзя выбирать цель дешевле
    или равную исходному предмету.
  */

  if (target.price <= source.price) {

    return res.status(400).json({
      error: "Цель должна быть дороже"
    });

  }


  /*
    Демо-формула вероятности.
  */

  const chance =
    Math.min(
      94,
      (source.price / target.price) * 92
    );


  const roll =
    Math.random() * 100;

  const win =
    roll < chance;


  /*
    Удаляем исходный предмет.
  */

  const inventoryIndex =
    user.inventory.indexOf(sourceId);

  user.inventory.splice(
    inventoryIndex,
    1
  );


  if (win) {

    /*
      При победе выдаём цель.
    */

    user.inventory.push(targetId);

  }


  const result = {

    id:
      Date.now(),

    source:
      sourceId,

    target:
      targetId,

    sourceName:
      source.name,

    targetName:
      target.name,

    chance:
      Number(chance.toFixed(2)),

    win,

    time:
      new Date().toISOString()

  };


  user.history.unshift(result);


  /*
    Ограничиваем историю.
  */

  user.history =
    user.history.slice(0, 50);


  updateUser(user);


  res.json({

    result,

    user:
      sanitizeUser(user)

  });

});


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});


/* =========================
   SERVER
========================= */

app.listen(
  PORT,
  () => {

    console.log(
      `NEONFORGE running at http://localhost:${PORT}`
    );

  }
);
