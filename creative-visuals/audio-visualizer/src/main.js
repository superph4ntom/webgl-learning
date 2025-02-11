/*
    Copyright: Goncalo Marques, 2024
    I did this for the fun of understanding how I could visualize audio in a fun way
    just because it's cool! 
    The sample audio is made from my own remix - I am a musician on my free time and
    experiment VST instruments, synths, etc. Work in progress.
*/
import track from "./assets/public-domain-usa-swan-lake-cut.mp3";
import "./style.css";

// config
const config = {
  FFT_SIZE: 256,
  EQ: {
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
const audioButton = document.querySelector(".button");
const audioContext = new AudioContext();
const audioAnalyzer = audioContext.createAnalyser();
const audioTrack = new Audio(track);
let isPlaying = false;

// create the EQ balls
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
window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", () => audioContext.close());
// ---------------

// fancy ball, not.
function createBall(xAxis, yAxis) {
  return {
    x: xAxis,
    y: yAxis,
    radius: 8,
    color: config.EQ.COLOR,
    jumpForce: config.EQ.JUMP_FORCE,
    fallForce: config.EQ.FALL_FORCE,
    isFalling: true,
    baseY: yAxis,
    targetY: yAxis,
    maxJumpHeight: canvas.height * 0.8,
    damping: config.EQ.DAMPING,
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
  const gapDistance = config.EQ.BALL_GAP_DISTANCE;
  const distanceFromBottom = config.EQ.BALL_BOTTOM_DISTANCE;
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

function animate() {
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  const frequencyData = getFrequencyData();
  const soundThreshold = config.EQ.SOUND_THRESHOLD;

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

  requestAnimationFrame(animate);
}

function audioControl() {
  if (audioContext.state === "suspended" && !isPlaying) {
    isPlaying = true;
    audioContext.resume().then(() => {
      audioTrack.play();
    });
  } else {
    isPlaying = false;
    audioContext.suspend().then(() => {
      audioTrack.pause();
    });
  }

  audioButton.innerText = isPlaying === true ? "pause" : "play";
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
