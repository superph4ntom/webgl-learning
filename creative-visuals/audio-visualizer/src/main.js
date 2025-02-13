/*
    Audio Spectrum Visualizer - ASV
    Copyright: Goncalo Marques, 2024
    I did this for the fun of understanding how I could visualize audio in a fun way
    just because it's cool! 
    The sample audio is made from my own remix - I am a musician on my free time and
    experiment VST instruments, synths, etc. Work in progress.
*/
import { formatTime } from "./util/index";
import track01 from "./assets/public-domain-usa-swan-lake-cut.mp3";
import "./style.css";

// config
const config = {
  FFT_SIZE: 256,
  ASV: {
    COLOR: "white",
    JUMP_FORCE: 1,
    FALL_FORCE: 2,
    DAMPING: 0.2,
    BALL_GAP_DISTANCE: 30,
    BALL_BOTTOM_DISTANCE: 100,
    SOUND_THRESHOLD: 20,
  },
};

// init
const canvas = document.querySelector(".canvas");
const canvasContext = canvas.getContext("2d");
const currentTimeText = document.querySelector(".current-time");
const trackDurationText = document.querySelector(".end-time");
const audioButton = document.querySelector(".button");
const audioContext = new AudioContext();
const audioAnalyzer = audioContext.createAnalyser();
const audioTrack = new Audio(track01);
let isPlaying = false;
let synthwaveOffset = 0;

// create the ASV balls
let balls = generateBalls();

audioAnalyzer.fftSize = config.FFT_SIZE;

// create a MediaElementSourceNode from the audio element
const audioSource = audioContext.createMediaElementSource(audioTrack);

// create frequency data array -> then we can determine when the
// balls lift up or down depending on the frequency
const bufferLength = audioAnalyzer.frequencyBinCount;
const frequencyDataArray = new Uint8Array(bufferLength);

audioSource.connect(audioAnalyzer);
audioAnalyzer.connect(audioContext.destination);

// event listeners
audioButton.addEventListener("click", audioControl);
// waits for metadata to be available and the it add the total seconds to the UI
audioSource.mediaElement.addEventListener("loadedmetadata", setTrackMetadata, {
  once: true,
});
audioTrack.addEventListener("ended", setTrackEnd);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", () => audioContext.close());
// ---------------

// fancy ball, not.
function createBall(xAxis, yAxis) {
  return {
    x: xAxis,
    y: yAxis,
    radius: 8,
    color: config.ASV.COLOR,
    jumpForce: config.ASV.JUMP_FORCE,
    fallForce: config.ASV.FALL_FORCE,
    isFalling: true,
    baseY: yAxis,
    targetY: yAxis,
    maxJumpHeight: canvas.height * 0.8,
    damping: config.ASV.DAMPING,
  };
}

// I think the code speaks by itself
function drawBall(ball) {
  canvasContext.fillStyle = ball.color;
  canvasContext.beginPath();
  canvasContext.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  canvasContext.fill();
}

// move the ball towards the targetY with damping - omega smooth
function moveToTargetY(ball) {
  const distanceToTarget = ball.targetY - ball.y;
  ball.y += distanceToTarget * ball.damping; // apply damping effect
}

// generate balls and return them as an array
function generateBalls() {
  const gapDistance = config.ASV.BALL_GAP_DISTANCE;
  const distanceFromBottom = config.ASV.BALL_BOTTOM_DISTANCE;
  const amountOfBalls = Math.floor(canvas.width / gapDistance);
  const balls = [];

  for (let index = 0; index < amountOfBalls; index++) {
    balls.push(
      createBall(
        gapDistance + index * gapDistance,
        canvas.height - distanceFromBottom
      )
    );
  }

  return balls;
}

function getFrequencyData() {
  audioAnalyzer.getByteFrequencyData(frequencyDataArray);
  return frequencyDataArray;
}

function drawProgressBorder() {
  if (!audioTrack.duration) return;

  const progress = audioTrack.currentTime / audioTrack.duration;
  const width = canvas.width;
  const height = canvas.height;

  const perimeter = 2 * (width + height);
  canvasContext.lineWidth = 10;
  canvasContext.strokeStyle = "#fff";

  canvasContext.beginPath();
  canvasContext.rect(0, 0, width, height);

  canvasContext.setLineDash([perimeter]);
  canvasContext.lineDashOffset = perimeter * (1 - progress);

  canvasContext.stroke();

  // Reset line dash settings
  canvasContext.setLineDash([]);
}

function drawSynthwaveBackground() {
  const horizonHeight = canvas.height * 0.4;
  const vanishingPointX = canvas.width / 2;
  const vanishingPointY = horizonHeight;
  const totalHorizonLines = 20;

  // Save the current context state so that changes only affect the lines
  canvasContext.save();

  canvasContext.strokeStyle = "#fff";
  canvasContext.shadowColor = "#ededed"; // White glow
  canvasContext.lineWidth = 1;
  canvasContext.shadowBlur = 6;

  // draw horizon lines
  for (let index = 0; index <= totalHorizonLines; index++) {
    // modulo %1 to keep the progress between 0 and 1, progress is current the distance from the horizon
    let progress = (index / totalHorizonLines + synthwaveOffset) % 1;

    // vertical position y with ease
    const waveVerticalPositionY =
      horizonHeight + (canvas.height - horizonHeight) * Math.pow(progress, 2);

    // 0 at the bottom and 1 at the horizonHeight.
    const distanceFromBottomX =
      (canvas.height - waveVerticalPositionY) / (canvas.height - horizonHeight);

    const leftBoundary = distanceFromBottomX * vanishingPointX;
    const rightBoundary =
      canvas.width - distanceFromBottomX * (canvas.width - vanishingPointX);

    canvasContext.beginPath();
    canvasContext.moveTo(leftBoundary, waveVerticalPositionY);
    canvasContext.lineTo(rightBoundary, waveVerticalPositionY);
    canvasContext.stroke();
  }

  // draw vertical lines
  const spaceBetweenWaves = 32;
  for (let x = 0; x <= canvas.width; x += spaceBetweenWaves) {
    canvasContext.beginPath();
    canvasContext.moveTo(x, canvas.height);
    canvasContext.lineTo(vanishingPointX, vanishingPointY);
    canvasContext.stroke();

    // incorrect code that generates a cool effect
    // const randomOffset = Math.random() * 10 - 5; // Random offset between -5 and 5 pixels
    // const startX = x + randomOffset; // Offset the starting X position a bit

    // canvasContext.beginPath();
    // canvasContext.moveTo(startX, canvas.height);
    // canvasContext.lineTo(vanishingPointX, vanishingPointY);
    // canvasContext.stroke();
  }

  // move the synthwave offset
  synthwaveOffset += 0.005;

  // Reset glow effect after drawing the lines
  canvasContext.shadowColor = "transparent";
  canvasContext.shadowBlur = 0;
}

function animate() {
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  drawSynthwaveBackground();

  const frequencyData = getFrequencyData();
  const soundThreshold = config.ASV.SOUND_THRESHOLD;

  balls.forEach((ball, index) => {
    if (index < frequencyData.length) {
      const frequencyValue = frequencyData[index];

      if (frequencyValue > soundThreshold) {
        ball.targetY =
          ball.baseY - Math.min(frequencyValue * 3, ball.maxJumpHeight);
      } else {
        ball.targetY = ball.baseY;
      }

      moveToTargetY(ball);
      drawBall(ball);
    }
  });

  if (isPlaying) {
    setTrackTime();
    drawProgressBorder();
  }

  requestAnimationFrame(animate);
}

function audioControl() {
  if (!isPlaying) {
    audioContext.resume().then(() => {
      audioTrack.play();
    });
    isPlaying = true;
  } else {
    audioContext.suspend().then(() => {
      audioTrack.pause();
    });
    isPlaying = false;
  }

  audioButton.innerText = isPlaying === true ? "pause" : "play";
}

function setTrackMetadata() {
  trackDurationText.innerText = formatTime(audioTrack.duration);
}

// set track time
function setTrackTime() {
  const currentTime = Math.floor(audioContext.currentTime);
  currentTimeText.innerText = formatTime(currentTime);
}

function setTrackEnd() {
  isPlaying = false;
  audioButton.innerText = "play";
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // wipe canvasContext to avoid re-renders and eating more ram/resources
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  balls = generateBalls();
}

// start the animation
animate();

resizeCanvas();
