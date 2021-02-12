const fs = require("fs");
const path = require("path");

const { generate, fake } = require("../lib");

// const result = generate({
//     from: './svg/outlined',
//     to: './result',
// });
// console.log(result);

const string = fs.readFileSync(
  path.resolve(__dirname, "./svg/outlined/search.svg"),
  "utf-8"
);
fake(string, "search");
