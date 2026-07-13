const intro = document.getElementById("intro");
const invitation = document.getElementById("invitation");
const openInviteBtn = document.getElementById("openInviteBtn");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const backgroundMusic = document.getElementById("backgroundMusic");
const countdownSection = document.querySelector(".countdown-section");

const OPENING_DURATION_MS = 1200;
const MUSIC_VOLUME = 0.16;
const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
const ONE_HOUR_MS = ONE_MINUTE_MS * 60;
const ONE_DAY_MS = ONE_HOUR_MS * 24;

let isOpening = false;

function isMusicPlaying() {
  return !!backgroundMusic && !backgroundMusic.paused && !backgroundMusic.ended;
}

function updateMusicToggleState(isPlaying) {
  if (!musicToggleBtn) return;
  const label = isPlaying ? "Musiqani to'xtatish" : "Musiqani yoqish";
  musicToggleBtn.classList.toggle("is-playing", isPlaying);
  musicToggleBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
  musicToggleBtn.setAttribute("aria-label", label);
  musicToggleBtn.setAttribute("title", label);
}

function playBackgroundMusic() {
  if (!backgroundMusic) return;
  backgroundMusic.loop = true;
  backgroundMusic.volume = MUSIC_VOLUME;
  const playPromise = backgroundMusic.play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise.then(() => updateMusicToggleState(true)).catch(() => updateMusicToggleState(false));
  }
}

function toggleBackgroundMusic() {
  if (!backgroundMusic) return;
  if (isMusicPlaying()) {
    backgroundMusic.pause();
    updateMusicToggleState(false);
  } else {
    playBackgroundMusic();
  }
}

function openInvitation() {
  if (isOpening) return;
  isOpening = true;

  playBackgroundMusic();
  // Konvert nechi marta ochilganini sanaymiz - javobini kutmaymiz
  const countUrl = openInviteBtn.dataset.countUrl || "/ochildi/";
  fetch(countUrl, { method: "POST", keepalive: true }).catch(() => {});
  intro.classList.add("opened");
  openInviteBtn.setAttribute("aria-expanded", "true");

  window.setTimeout(() => {
    document.body.classList.remove("intro-active");
    window.scrollTo(0, 0);

    invitation.setAttribute("aria-hidden", "false");
    intro.classList.add("fade-out");

    revealVisibleSections();
    window.setTimeout(() => {
      intro.hidden = true;
    }, 900);
  }, OPENING_DURATION_MS);
}

function revealVisibleSections() {
  const reveals = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    reveals.forEach((node) => node.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );

  reveals.forEach((node, index) => {
    node.style.transitionDelay = `${Math.min(index * 90, 360)}ms`;
    observer.observe(node);
  });
}

function setCountdownValues(days, hours, minutes, seconds) {
  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

function updateCountdown(targetWeddingDate) {
  const countdownMessage = document.getElementById("countdownMessage");
  const difference = targetWeddingDate - Date.now();

  if (difference <= 0) {
    setCountdownValues(0, 0, 0, 0);
    countdownMessage.textContent = "Bugun aynan o'sha kun. Sizni kutamiz.";
    return false;
  }

  const days = Math.floor(difference / ONE_DAY_MS);
  const hours = Math.floor((difference % ONE_DAY_MS) / ONE_HOUR_MS);
  const minutes = Math.floor((difference % ONE_HOUR_MS) / ONE_MINUTE_MS);
  const seconds = Math.floor((difference % ONE_MINUTE_MS) / ONE_SECOND_MS);

  setCountdownValues(days, hours, minutes, seconds);
  countdownMessage.textContent = "Sizni intiqlik bilan kutamiz.";
  return true;
}

if (openInviteBtn) {
  openInviteBtn.addEventListener("click", openInvitation);
}
if (musicToggleBtn) {
  musicToggleBtn.addEventListener("click", toggleBackgroundMusic);
}
if (backgroundMusic) {
  // Konvert ochilishini kutmasdan yuklab boshlaymiz - bosilganda darhol chalinadi
  backgroundMusic.load();
}

if (countdownSection) {
  const targetWeddingDate = new Date(countdownSection.dataset.weddingIso).getTime();
  updateCountdown(targetWeddingDate);
  const countdownInterval = window.setInterval(() => {
    const hasTimeLeft = updateCountdown(targetWeddingDate);
    if (!hasTimeLeft) {
      window.clearInterval(countdownInterval);
    }
  }, 1000);
}
