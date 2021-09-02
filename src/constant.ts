import { readFileSync } from "fs";
import { resolve } from "path";

import template from "lodash.template";

const THIS_ROOT_DIR = resolve(__dirname);
export const TEMPLATES_DIR = resolve(THIS_ROOT_DIR, "../templates");

export const REACT_TS_ICON_COMPONENTS_DIR = resolve(TEMPLATES_DIR, "react-ts");
export const REACT_JS_ICON_COMPONENTS_DIR = resolve(TEMPLATES_DIR, "react-js");

export function r(...paths: string[]) {
  return resolve(THIS_ROOT_DIR, ...paths);
}

/* -------------- React Component --------------- */
const REACT_TS_ICON_COMPONENT_TEMPLATE = `// DON NOT EDIT IT MANUALLY
import * as React from 'react';
import <%= svgIdentifier %>Svg from '<%= iconsPath %>/<%= svgIdentifier %>';
import AntdIcon, { AntdIconProps } from '../components/AntdIcon';

const <%= svgIdentifier %> = (
  props: AntdIconProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) => <AntdIcon {...props} ref={ref} icon={<%= svgIdentifier %>Svg} />;

<%= svgIdentifier %>.displayName = '<%= svgIdentifier %>';
export default React.forwardRef<HTMLSpanElement, AntdIconProps>(<%= svgIdentifier %>);`;

const REACT_JS_ICON_COMPONENT_TEMPLATE = `// DON NOT EDIT IT MANUALLY
import * as React from 'react';
import <%= svgIdentifier %>Svg from '<%= iconsPath %>/<%= svgIdentifier %>';
import AntdIcon from '../components/AntdIcon';

const <%= svgIdentifier %> = (
  props,
  ref,
) => <AntdIcon {...props} ref={ref} icon={<%= svgIdentifier %>Svg} />;

<%= svgIdentifier %>.displayName = '<%= svgIdentifier %>';
export default React.forwardRef(<%= svgIdentifier %>);`;

export const reactTsIconComponentRenderer = template(
  REACT_TS_ICON_COMPONENT_TEMPLATE
);
export const reactJsIconComponentRenderer = template(
  REACT_JS_ICON_COMPONENT_TEMPLATE
);
