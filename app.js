let currentUser = null;
let selectedSource = null;
let selectedTarget = null;
let items = [];


/* =========================
   HELPERS
========================= */

function $(id) {
  return document.getElementById(id);
}


function money(value) {
  return "$" + Number(value).toFixed(2);
}


async function request(
  url,
  options = {}
) {

  const response =
    await fetch(url, {
      headers: {
        "Content-Type":
          "application/json"
      },

      ...options
    });


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.error ||
      "Ошибка сервера"
    );

  }


  return data;
}


/* =========================
   AUTH
========================= */

async function register() {

  const username =
    $("username")
      .value
      .trim();


  try {

    const data =
      await request(
        "/api/register",
        {
          method: "POST",

          body:
            JSON.stringify({
              username
            })
        }
      );


    enterApp(data.user);

  }

  catch (error) {

    $("authError")
      .textContent =
      error.message;

  }

}


async function login() {

  const username =
    $("username")
      .value
      .trim();


  try {

    const data =
      await request(
        "/api/login",
        {
          method: "POST",

          body:
            JSON.stringify({
              username
            })
        }
      );


    enterApp(data.user);

  }

  catch (error) {

    $("authError")
      .textContent =
      error.message;

  }

}


/* =========================
   ENTER APP
========================= */

function enterApp(user) {

  currentUser = user;

  $("auth")
    .classList
    .add("hidden");

  $("app")
    .classList
    .remove("hidden");


  $("currentUser")
    .textContent =
    "@" + user.username;


  updateBalance();

  loadItems();

  renderHistory();

}


/* =========================
   ITEMS
========================= */

async function loadItems() {

  const data =
    await request(
      "/api/items"
    );


  items =
    data.items;


  renderInventory();

  renderTargets();

}


function getItem(id) {

  return items.find(
    item =>
      item.id === id
  );

}


/* =========================
   INVENTORY
========================= */

function renderInventory() {

  const container =
    $("sourceItems");

  container.innerHTML = "";


  currentUser.inventory
    .forEach(id => {

      const item =
        getItem(id);


      if (!item) {
        return;
      }


      const card =
        createCard(
          item,
          "source"
        );


      container.appendChild(card);

    });

}


function renderTargets() {

  const container =
    $("targetItems");

  container.innerHTML = "";


  items
    .filter(item => {

      if (!selectedSource) {
        return true;
      }

      return (
        item.price >
        selectedSource.price
      );

    })
    .forEach(item => {

      const card =
        createCard(
          item,
          "target"
        );


      container.appendChild(card);

    });

}


/* =========================
   CARD
========================= */

function createCard(
  item,
  type
) {

  const card =
    document.createElement(
      "div"
    );


  card.className =
    "item";


  card.innerHTML = `

    <div class="rarity"></div>

    <div class="item-icon">
      ${item.icon}
    </div>

    <span class="item-name">
      ${item.name}
    </span>

    <span class="item-price">
      ${money(item.price)}
    </span>

  `;


  card.onclick = () => {

    if (type === "source") {

      selectedSource =
        item;

      document
        .querySelectorAll(
          "#sourceItems .item"
        )
        .forEach(
          element =>
            element.classList
              .remove(
                "selected"
              )
        );

      card.classList
        .add("selected");

      selectedTarget =
        null;

      $("targetIcon")
        .textContent =
        "?";

      $("targetName")
        .textContent =
        "Выбери цель";

      $("targetPrice")
        .textContent =
        "$0.00";

      renderTargets();

      updateUpgrade();

    }


    else {

      selectedTarget =
        item;

      document
        .querySelectorAll(
          "#targetItems .item"
        )
        .forEach(
          element =>
            element.classList
              .remove(
                "selected"
              )
        );

      card.classList
        .add("selected");

      updateUpgrade();

    }

  };


  return card;

}


/* =========================
   UPGRADE UI
========================= */

function updateUpgrade() {

  const button =
    $("upgradeButton");


  if (
    !selectedSource ||
    !selectedTarget
  ) {

    button.disabled =
      true;

    button.textContent =
      selectedSource
        ? "ВЫБРАТЬ ЦЕЛЬ"
        : "ВЫБРАТЬ ПРЕДМЕТ";

    return;

  }


  const chance =
    Math.min(
      94,
      (
        selectedSource.price /
        selectedTarget.price
      ) * 92
    );


  const multiplier =
    selectedTarget.price /
    selectedSource.price;


  $("targetIcon")
    .textContent =
    selectedTarget.icon;


  $("targetName")
    .textContent =
    selectedTarget.name;


  $("targetPrice")
    .textContent =
    money(
      selectedTarget.price
    );


  $("chance")
    .textContent =
    chance.toFixed(1) + "%";


  $("multiplier")
    .textContent =
    "x" +
    multiplier.toFixed(2);


  button.disabled =
    false;

  button.textContent =
    "ПРОКРУТИТЬ UPGRADE";

}


/* =========================
   PERFORM UPGRADE
========================= */

async function performUpgrade() {

  if (
    !selectedSource ||
    !selectedTarget
  ) {
    return;
  }


  const button =
    $("upgradeButton");

  const result =
    $("result");


  button.disabled =
    true;


  result.className =
    "result";

  result.textContent =
    "ПРОВЕРКА...";


  try {

    const data =
      await request(
        "/api/upgrade",
        {
          method: "POST",

          body:
            JSON.stringify({

              username:
                currentUser.username,

              sourceId:
                selectedSource.id,

              targetId:
                selectedTarget.id

            })

        }
      );


    currentUser =
      data.user;


    const upgrade =
      data.result;


    if (upgrade.win) {

      result.className =
        "result win";

      result.textContent =
        "✓ УСПЕШНЫЙ АПГРЕЙД";

    }

    else {

      result.className =
        "result lose";

      result.textContent =
        "✕ НЕУДАЧА";

    }


    selectedSource =
      null;

    selectedTarget =
      null;


    $("targetIcon")
      .textContent =
      "?";


    $("targetName")
      .textContent =
      "Выбери цель";


    $("targetPrice")
      .textContent =
      "$0.00";


    $("chance")
      .textContent =
      "0%";


    $("multiplier")
      .textContent =
      "x0.00";


    renderInventory();

    renderTargets();

    renderHistory();

    updateBalance();


    button.textContent =
      "ВЫБРАТЬ ПРЕДМЕТ";

  }

  catch (error) {

    result.className =
      "result lose";

    result.textContent =
      error.message;

  }

  finally {

    setTimeout(() => {

      button.disabled =
        true;

    }, 500);

  }

}


/* =========================
   HISTORY
========================= */

function renderHistory() {

  const container =
    $("historyList");

  container.innerHTML = "";


  if (
    !currentUser ||
    !currentUser.history.length
  ) {

    container.innerHTML = `
      <div class="history-row">
        <span>
          История пока пустая
        </span>
      </div>
    `;

    return;

  }


  currentUser.history
    .slice(0, 20)
    .forEach(result => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "history-row";


      row.innerHTML = `

        <span>

          <strong>
            ${result.sourceName}
          </strong>

          →

          ${result.targetName}

        </span>

        <span
          class="${
            result.win
              ? "win"
              : "lose"
          }"
        >

          ${
            result.win
              ? "WIN"
              : "FAIL"
          }

          ·

          ${result.chance}%

        </span>

      `;


      container.appendChild(
        row
      );

    });

}


/* =========================
   BALANCE
========================= */

function updateBalance() {

  $("balance")
    .textContent =
    money(
      currentUser.balance
    );

}


async function addBalance() {

  try {

    const data =
      await request(
        "/api/balance/add",
        {
          method: "POST",

          body:
            JSON.stringify({
              username:
                currentUser.username
            })
        }
      );


    currentUser.balance =
      data.balance;


    updateBalance();

  }

  catch (error) {

    alert(
      error.message
    );

  }

}


/* =========================
   CLEAR SOURCE
========================= */

function clearSource() {

  selectedSource =
    null;

  selectedTarget =
    null;


  document
    .querySelectorAll(
      ".item"
    )
    .forEach(
      card =>
        card.classList
          .remove(
            "selected"
          )
    );


  $("targetIcon")
    .textContent =
    "?";


  $("targetName")
    .textContent =
    "Выбери цель";


  $("targetPrice")
    .textContent =
    "$0.00";


  $("chance")
    .textContent =
    "0%";


  $("multiplier")
    .textContent =
    "x0.00";


  renderTargets();

  updateUpgrade();

}


/* =========================
   EVENTS
========================= */

$("registerButton")
  .addEventListener(
    "click",
    register
  );


$("loginExisting")
  .addEventListener(
    "click",
    login
  );


$("upgradeButton")
  .addEventListener(
    "click",
    performUpgrade
  );


$("addBalance")
  .addEventListener(
    "click",
    addBalance
  );


$("clearSource")
  .addEventListener(
    "click",
    clearSource
  );


$("username")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        login();

      }

    }
  );
