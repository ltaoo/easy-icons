const path = require("path");

const { generateIcons } = require("./index");

// generateIcons();
generateIcons({
  iconsPath: "@cf2e/icons-svg/lib",
  output: path.resolve(__dirname, "../src"),
  asnPath: "@cf2e/icons-svg",
});
