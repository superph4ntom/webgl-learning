/* eslint-env browser */

// Initialize canvas
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Get audio element
const audioElement = document.getElementById("audioElement");

// Create Audio Context
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 512;

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
  jumpForce: 0,
  fallForce: 0.5,
  isFalling: true,
  baseY: y, // Store the original Y position for resetting
  targetY: y, // Target height for the ball
  maxJumpHeight: 150, // Max height above baseY
});

// Function to draw a ball
const drawBall = (ball) => {
  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
};

// Function to make the ball move towards the targetY
const moveToTargetY = (ball) => {
  const distanceToTarget = ball.targetY - ball.y;
  if (Math.abs(distanceToTarget) > 1) {
    ball.y += distanceToTarget * 1.2; // Increase sensitivity for faster movement
  } else {
    ball.y = ball.targetY;
  }
};

// Generate balls and return them as an array
const generateBalls = () => {
  const distance = 30;
  const amountOfBalls = Math.floor(canvas.width / distance) - 2;
  const balls = [];
  for (let i = 0; i < amountOfBalls; i++) {
    balls.push(createBall(distance + i * distance, canvas.height - 100));
  }
  return balls;
};

const balls = generateBalls();

// Function to get frequency data
const getFrequencyData = () => {
  analyser.getByteFrequencyData(frequencyDataArray);
  return Array.from(frequencyDataArray);
};

// Function to handle user interaction
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

// Add an event listener to resume the AudioContext on user interaction
document.addEventListener("click", resumeAudioContext);
document.addEventListener("touchstart", resumeAudioContext);

// Animation function
const animate = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Retrieve frequency data
  const frequencyData = getFrequencyData();

  // Define a threshold to ignore very small sound levels
  const soundThreshold = 10; // Adjust this threshold based on your needs

  balls.forEach((ball, index) => {
    if (index < frequencyData.length) {
      const frequencyValue = frequencyData[index];

      // Increase the sensitivity multiplier to make balls more responsive
      if (frequencyValue > soundThreshold) {
        ball.targetY =
          ball.baseY - Math.min(frequencyValue * 0.4, ball.maxJumpHeight); // Increased sensitivity
      } else {
        ball.targetY = ball.baseY; // No significant sound, so target baseY
      }

      // Move the ball towards the target height with increased sensitivity
      moveToTargetY(ball);

      drawBall(ball);
    }
  });

  requestAnimationFrame(animate);
};

// Start the animation
animate();
