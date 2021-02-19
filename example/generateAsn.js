const { generateAsn } = require("../bin/commands");

const { OUTPUT_DIR, SVG_DIR } = require("./constants");
generateAsn({
  svg: SVG_DIR,
  output: OUTPUT_DIR,
});
