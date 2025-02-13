export function formatTime(seconds) {
  const formatedSeconds = Math.floor(seconds);
  const minutes = Math.floor(formatedSeconds / 60);
  const remainingSeconds = formatedSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
