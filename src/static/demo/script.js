let countdownValue = 30; // 倒计时初始值
let elapsedTime = 0; // 用时
let score = 0; // 得分
let countdownInterval;
let elapsedInterval;

function startGame() {
  resetGame(); // Reset game state
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.add("clickable");
    cell.style.cursor = "pointer";
    cell.style.backgroundColor = "white";
    cell.innerHTML = ""; // Clear cell content
  });

  countdownInterval = setInterval(() => {
    if (countdownValue > 0) {
      countdownValue--;
      document.getElementById("countdown").innerText = countdownValue;
    } else {
      endGame();
    }
  }, 1000);

  elapsedInterval = setInterval(() => {
    elapsedTime++;
    document.getElementById("elapsed").innerText = elapsedTime;
  }, 1000);
}

function endGame() {
  clearInterval(countdownInterval);
  clearInterval(elapsedInterval);
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("clickable");
    cell.style.cursor = "not-allowed";
  });
}

function resetGame() {
  clearInterval(countdownInterval);
  clearInterval(elapsedInterval);
  countdownValue = 30;
  elapsedTime = 0;
  score = 0;

  document.getElementById("countdown").innerText = countdownValue;
  document.getElementById("elapsed").innerText = elapsedTime;
  document.getElementById("score").innerText = score;

  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("clickable");
    cell.style.cursor = "not-allowed";
    cell.style.backgroundColor = "gray";
    cell.innerHTML = "x"; // Mark cell as unclickable
  });
}

function cellClick(cell) {
  if (cell.classList.contains("clickable")) {
    score += 10;
    document.getElementById("score").innerText = score;
    cell.style.backgroundColor = "green"; // Change color on click
    cell.classList.remove("clickable"); // Make cell unclickable
  }
}
