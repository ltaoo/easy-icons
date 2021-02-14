const vfs = require('vinyl-fs');
const globby = require('globby');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const files = globby.sync('src/asn/**/*.ts', { cwd: __dirname });

const Icon = require('./src/icons/SearchOutlined');

// const html = `
// `;
// const App = () => {

// };
console.log(React.createElement(Icon));
// const html = ReactDOMServer.renderToString(React.createElement(Icon));
// console.log(html);
