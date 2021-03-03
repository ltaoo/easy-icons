const { generateIcons } = require("../bin/commands");
const { ASN_DIR, OUTPUT_DIR } = require("./constants");

// generateIcons({
//   iconsPath: "@cf2e/icons-svg/lib",
//   output: OUTPUT_DIR,
//   asnPath: "@cf2e/icons-svg",
// });
// console.log(ASN_DIR);
generateIcons({
  asnPath: ASN_DIR,
  output: OUTPUT_DIR,
  iconsPath: "../asn",
});
