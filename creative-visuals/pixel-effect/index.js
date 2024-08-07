const canvas = document.getElementById("my-canvas");
const ctx = canvas.getContext("2d");

const img = new Image();
img.src = "valorant.png";

// Arrays to hold brightness values and particles
let brightnessArray = [];
let particlesArray = [];
let rgbArray = [];

class Particle {
  constructor() {
    // Ensure particles start from bright areas of the image
    this.x = Math.random() * canvas.width;
    this.y = 0;
    this.brightness = 0;
    this.velocity = Math.random() * 3 + 0.1;
    this.radius = Math.random() * 1.5 + 1;
  }

  update() {
    this.y += this.velocity;

    // Wrap the particle to the top when it moves out of the canvas height
    if (this.y >= canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
    }

    //const index = Math.floor(this.y) * canvas.width + Math.floor(this.x);
    this.brightness =
      brightnessArray[
        Math.floor(this.y - 1) * canvas.width + Math.floor(this.x)
      ];
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle =
      rgbArray[Math.floor(this.y - 1) * canvas.width + Math.floor(this.x)];
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Loop through each pixel to calculate brightness and store RGB values
  for (let i = 0; i < imageData.data.length; i += 4) {
    const red = imageData.data[i];
    const green = imageData.data[i + 1];
    const blue = imageData.data[i + 2];
    const brightness = (red + green + blue) / 3;
    brightnessArray.push(brightness);
    rgbArray.push(`rgb(${red}, ${green}, ${blue})`);
  }

  // Generate particles in bright areas of the image
  const numParticles = 10000;
  for (let i = 0; i < numParticles; i++) {
    const randomIndex = Math.floor(Math.random() * brightnessArray.length);
    particlesArray.push(new Particle());
    // if (brightnessArray[randomIndex] > 50) {
    //   // Threshold to focus on bright areas
    //   const x = randomIndex % canvas.width;
    //   const y = Math.floor(randomIndex / canvas.width);
    //   particlesArray.push(new Particle(x, y));
    // }
  }

  const animate = () => {
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particlesArray.forEach((particle) => {
      particle.update();
      ctx.globalAlpha = particle.brightness * 0.002;
      particle.draw();
    });

    requestAnimationFrame(animate);
  };

  animate();
};
