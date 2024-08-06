const canvas = document.getElementById("my-canvas");
const ctx = canvas.getContext("2d");

const img = new Image();
img.src = "curry.png";

let brightnessArray = [];

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.brightness = 0;
    this.velocity = Math.random() * 3 + 0.1;
    this.radius = Math.random() * 1.5 + 1;
  }

  update() {
    this.y += this.velocity;

    if (this.y >= canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
    }
  }
}

img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  console.log(imageData.data);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const red = imageData.data[i * 4];
    const green = imageData.data[i * 4 + 1];
    const blue = imageData.data[i * 4 + 2];
    const brightness = (red + green + blue) / 3;
    brightnessArray.push(brightness);
  }

  //generate 10.000 particles
  for (let i = 0; i < 10000; i++) {
    // particlesArray(new Particle());
  }
};
