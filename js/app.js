"use strict";

const state = {
  basketOpened: false,
  celebrationStarted: false,
  audioPlaying: false,
  mysteryTimer: null
};

// Tiempos principales en milisegundos. Puedes modificarlos desde aquí.
const timing = {
  dawnStart: 700,
  flowersStart: 1200,
  mysteryStart: 1400,
  hintStart: 2700,
  catPeek: 400,
  catOpen: 900,
  parchmentOpen: 1100,
  mysteryRepeat: 4200,
  mysteryEffect: 1700,
  ambientMobile: 1200,
  ambientDesktop: 850
};

const basketEffects = ["is-mysterious", "show-eyes", "show-paw"];

const scene = document.querySelector("#scene");
const stars = document.querySelector("#stars");
const basket = document.querySelector("#basket");
const cat = document.querySelector("#cat");
const parchment = document.querySelector("#parchment");
const hint = document.querySelector("#hint");
const particles = document.querySelector("#particles");
const music = document.querySelector("#music");
const basketSound = document.querySelector("#basketSound");
const musicButton = document.querySelector("#musicButton");
const recipientName = document.querySelector("#recipientName");
const accordionItems = [...document.querySelectorAll(".message-item")];
const celebrationButton = document.querySelector("#celebrationButton");

const wait = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));
const randomBetween = (minimum, maximum) => Math.random() * (maximum - minimum) + minimum;

// Escena inicial
function createStars() {
  for (let index = 0; index < 45; index += 1) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.left = `${randomBetween(3, 97)}%`;
    star.style.top = `${randomBetween(3, 72)}%`;
    star.style.animationDelay = `${randomBetween(0, 2)}s`;
    star.style.transform = `scale(${randomBetween(0.6, 1.5)})`;
    stars.appendChild(star);
  }
}

async function startExperience() {
  createStars();
  startAmbientPetals();

  await wait(timing.dawnStart);
  scene.classList.add("scene--dawn");

  await wait(timing.flowersStart);
  scene.classList.add("scene--flowers");

  await wait(timing.mysteryStart);
  startBasketMystery();

  await wait(timing.hintStart);
  hint.classList.add("is-visible");
}

function setRecipientName() {
  const nameFromUrl = new URLSearchParams(window.location.search).get("para");
  const name = nameFromUrl?.trim().slice(0, 40);
  recipientName.firstChild.textContent = name ? `Para ${name} ` : "Para ti ";
}

// Canasta y estados del gato
function startBasketMystery() {
  playMysteryMoment();
  state.mysteryTimer = window.setInterval(playMysteryMoment, timing.mysteryRepeat);
}

function playMysteryMoment() {
  if (state.basketOpened) return;

  const effect = basketEffects[Math.floor(Math.random() * basketEffects.length)];
  basket.classList.add(effect);
  window.setTimeout(() => basket.classList.remove(effect), timing.mysteryEffect);
}

async function openBasket() {
  if (state.basketOpened) return;
  state.basketOpened = true;
  window.clearInterval(state.mysteryTimer);

  hint.classList.remove("is-visible");
  basket.classList.remove("is-mysterious", "show-eyes", "show-paw");
  basket.classList.add("is-open");
  createSparkles(14);
  startAudio();

  await wait(timing.catPeek);
  cat.classList.add("is-visible");
  showCatState("peek");

  await wait(timing.catOpen);
  showCatState("open");

  await wait(timing.parchmentOpen);
  showCatState("parchment");
  parchment.classList.add("is-open");
}

// Acordeón manual
function setupAccordion() {
  accordionItems.forEach(item => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      accordionItems.forEach(otherItem => {
        if (otherItem !== item) otherItem.open = false;
      });
    });
  });
}

// Polen, pétalos y celebración
function createParticle(type) {
  const particle = document.createElement("i");
  particle.className = `particle particle--${type}`;
  particle.style.left = `${randomBetween(2, 98)}%`;
  particle.style.setProperty("--duration", `${randomBetween(4.5, 8)}s`);
  particle.style.setProperty("--drift", `${randomBetween(-90, 90)}px`);
  particle.style.setProperty("--spin", `${randomBetween(180, 720)}deg`);
  particle.style.animationDelay = `${randomBetween(0, 1.2)}s`;
  particles.appendChild(particle);
  particle.addEventListener("animationend", () => particle.remove(), { once: true });
}

function createSparkles(amount) {
  for (let index = 0; index < amount; index += 1) {
    window.setTimeout(() => createParticle("sparkle"), index * 90);
  }
}

function startAmbientPetals() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const interval = window.innerWidth < 600 ? timing.ambientMobile : timing.ambientDesktop;
  window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    const particleType = Math.random() < 0.75 ? "pollen" : "petal";
    createParticle(particleType);
  }, interval);
}

function startCelebration() {
  if (state.celebrationStarted) return;
  state.celebrationStarted = true;
  parchment.classList.remove("is-open");
  showCatState("celebration");
  scene.classList.add("scene--celebrating");

  let created = 0;
  const petalTimer = window.setInterval(() => {
    createParticle(created % 4 === 0 ? "sparkle" : "petal");
    created += 1;
    if (created >= 45) window.clearInterval(petalTimer);
  }, 180);
}

function showCatState(name) {
  cat.dataset.state = name;
}

// Audios opcionales
async function playTrack(track, volume) {
  try {
    track.volume = volume;
    await track.play();
    return true;
  } catch {
    return false;
  }
}

async function startAudio() {
  const musicWasPaused = music.paused;
  if (musicWasPaused) music.volume = 0;

  const musicStarted = await playTrack(music, musicWasPaused ? 0 : music.volume);
  const basketStarted = state.basketOpened
    ? await playTrack(basketSound, 0.45)
    : false;

  state.audioPlaying = musicStarted || basketStarted;

  if (state.audioPlaying) {
    musicButton.classList.add("is-playing");
    musicButton.setAttribute("aria-label", "Desactivar audios");
  }

  if (musicStarted && musicWasPaused) fadeInMusic();
}

function stopAudio() {
  music.pause();
  basketSound.pause();
  state.audioPlaying = false;
  musicButton.classList.remove("is-playing");
  musicButton.setAttribute("aria-label", "Activar audios");
}

function toggleAudio() {
  if (state.audioPlaying) stopAudio();
  else startAudio();
}

function ensureBackgroundAudio() {
  if (!state.audioPlaying) startAudio();
}

function fadeInMusic() {
  const fadeTimer = window.setInterval(() => {
    music.volume = Math.min(0.55, music.volume + 0.05);
    if (music.volume >= 0.55) window.clearInterval(fadeTimer);
  }, 100);
}

// Inicio de la página
function initialize() {
  basket.addEventListener("click", openBasket);
  celebrationButton.addEventListener("click", startCelebration);
  musicButton.addEventListener("click", toggleAudio);
  music.addEventListener("error", () => {
    musicButton.title = "Falta music.mp3 en assets/audio.";
  });
  basketSound.addEventListener("error", () => {
    musicButton.title = "Falta basket-open.mp3 en assets/audio.";
  });

  // Intenta iniciar al cargar. Si el navegador lo bloquea, inicia con el primer toque.
  startAudio();
  window.addEventListener("pointerdown", ensureBackgroundAudio, { once: true });
  window.addEventListener("keydown", ensureBackgroundAudio, { once: true });

  setupAccordion();
  setRecipientName();
  startExperience();
}

initialize();
