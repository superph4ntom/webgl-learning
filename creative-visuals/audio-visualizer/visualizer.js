/* eslint-env browser */

// Initialize canvas
const canvas = document.getElementById("myCanvas");
const context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Get audio element
const audioElement = document.getElementById("audioElement");

// Create Audio Context
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 1024;

// Create a MediaElementSourceNode from the audio element
const source = audioContext.createMediaElementSource(audioElement);
source.connect(analyser);
analyser.connect(audioContext.destination);

// Create frequency data array
const bufferLength = analyser.frequencyBinCount;
const frequencyDataArray = new Uint8Array(bufferLength);

// Function to create a ball object
const createBall = (x, y) => ({
  x,
  y,
  radius: 8,
  color: "white",
  jumpForce: 1,
  fallForce: 1,
  isFalling: true,
  baseY: y, // Store the original Y position for resetting
  targetY: y, // Target height for the ball
  maxJumpHeight: canvas.height, // Max height above baseY
  damping: 0.2, // Damping factor to smooth out movements
});

// Function to draw a ball
const drawBall = (ball) => {
  context.fillStyle = ball.color;
  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  context.fill();
};

// Function to make the ball move towards the targetY with damping
const moveToTargetY = (ball) => {
  const distanceToTarget = ball.targetY - ball.y;
  ball.y += distanceToTarget * ball.damping; // Apply damping effect
};

// Generate balls and return them as an array
const generateBalls = () => {
  const gapDistance = 30;
  const distanceFromBottom = 100;
  const amountOfBalls = Math.floor(canvas.width / gapDistance) - 2;
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
};

const balls = generateBalls();

// Function to get frequency data
const getFrequencyData = () => {
  analyser.getByteFrequencyData(frequencyDataArray);
  return frequencyDataArray;
};

// Animation function
const animate = () => {
  // clear canvas before rendering a new equalizer
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Retrieve frequency data
  const frequencyData = getFrequencyData();

  // Define a threshold to ignore very small sound levels
  const soundThreshold = 10;

  balls.forEach((ball, index) => {
    if (index < frequencyData.length) {
      const frequencyValue = frequencyData[index];

      // Adjust sensitivity multiplier and apply damping effect
      if (frequencyValue > soundThreshold) {
        ball.targetY =
          ball.baseY - Math.min(frequencyValue * 1.9, ball.maxJumpHeight); // Adjusted sensitivity
      } else {
        ball.targetY = ball.baseY; // No significant sound, so target baseY
      }

      // Move the ball towards the target height with damping
      moveToTargetY(ball);
      drawBall(ball);
    }
  });

  requestAnimationFrame(animate);
};

// Start the animation
animate();

// Function to handle user interaction - a little hacky but for demo purposes
const resumeAudioContext = () => {
  if (audioContext.state === "suspended") {
    audioContext
      .resume()
      .then(() => {
        console.log("AudioContext resumed successfully");
      })
      .catch((error) => {
        console.error("Error resuming AudioContext:", error);
      });
  }
};

// Event listener to resume the AudioContext on user interaction - a little hacky but for demo purposes
document.addEventListener("click", resumeAudioContext);
document.addEventListener("touchstart", resumeAudioContext);
