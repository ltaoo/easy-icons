import React, { useEffect } from "react";
import { insertCss } from 'insert-css';
import { generate as generateColor } from "@ant-design/colors"; // import warn from 'rc-util/lib/warning';

export function warning(valid, message) {
  //   warn(valid, `[@ant-design/icons] ${message}`);
  if (!valid) {
    console.error(`[@ant-design/icons] ${message}`);
  }
}
export function isIconDefinition(target) {
  return typeof target === "object" && typeof target.name === "string" && typeof target.theme === "string" && (typeof target.icon === "object" || typeof target.icon === "function");
}
export function normalizeAttrs(attrs = {}) {
  return Object.keys(attrs).reduce((acc, key) => {
    const val = attrs[key];

    switch (key) {
      case "class":
        acc.className = val;
        delete acc.class;
        break;

      default:
        acc[key] = val;
    }

    return acc;
  }, {});
}
export function generate(node, key, rootProps) {
  if (!rootProps) {
    return React.createElement(node.tag, {
      key,
      ...normalizeAttrs(node.attrs)
    }, (node.children || []).map((child, index) => generate(child, `${key}-${node.tag}-${index}`)));
  }

  return React.createElement(node.tag, {
    key,
    ...normalizeAttrs(node.attrs),
    ...rootProps
  }, (node.children || []).map((child, index) => generate(child, `${key}-${node.tag}-${index}`)));
}
export function getSecondaryColor(primaryColor) {
  // choose the second color
  return generateColor(primaryColor)[0];
}
export function normalizeTwoToneColors(twoToneColor) {
  if (!twoToneColor) {
    return [];
  }

  return Array.isArray(twoToneColor) ? twoToneColor : [twoToneColor];
} // These props make sure that the SVG behaviours like general text.
// Reference: https://blog.prototypr.io/align-svg-icons-to-text-and-say-goodbye-to-font-icons-d44b3d7b26b4

export const svgBaseProps = {
  width: "1em",
  height: "1em",
  fill: "currentColor",
  "aria-hidden": "true",
  focusable: "false"
};
export const iconStyles = `
.anticon {
  display: inline-block;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.anticon > * {
  line-height: 1;
}

.anticon svg {
  display: inline-block;
}

.anticon::before {
  display: none;
}

.anticon .anticon-icon {
  display: block;
}

.anticon[tabindex] {
  cursor: pointer;
}

.anticon-spin::before,
.anticon-spin {
  display: inline-block;
  -webkit-animation: loadingCircle 1s infinite linear;
  animation: loadingCircle 1s infinite linear;
}

@-webkit-keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
`;
let cssInjectedFlag = false;
export const useInsertStyles = (styleStr = iconStyles) => {
  useEffect(() => {
    if (!cssInjectedFlag) {
      insertCss(styleStr, {
        prepend: true
      });
      cssInjectedFlag = true;
    }
  }, []);
};