/**
 * 文档站发布
 */
const ghpages = require("gh-pages");
const chalk = require("chalk");

ghpages.publish("docs-dist", (error) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log(chalk.greenBright("Success"), "Deploy docs to gh-pages");
});
