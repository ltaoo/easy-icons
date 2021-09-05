import * as React from "react";
import classNames from "classnames";
import { warning, svgBaseProps } from "./utils";
const Icon = React.forwardRef((props, ref) => {
  const {
    // affect outter <i>...</i>
    className,
    // affect inner <svg>...</svg>
    component: Component,
    viewBox,
    spin,
    rotate,
    tabIndex,
    onClick,
    // children
    children,
    ...restProps
  } = props;

  if (!!Component || !!children) {
    console.error("Should have `component` prop or `children`.");
  } // warning(
  //   Boolean(Component || children),
  //   'Should have `component` prop or `children`.',
  // );
  // useInsertStyles();


  const classString = classNames("anticon", className);
  const svgClassString = classNames({
    "anticon-spin": !!spin
  });
  const svgStyle = rotate ? {
    msTransform: `rotate(${rotate}deg)`,
    transform: `rotate(${rotate}deg)`
  } : undefined;
  const innerSvgProps = { ...svgBaseProps,
    className: svgClassString,
    style: svgStyle,
    viewBox
  };

  if (!viewBox) {
    delete innerSvgProps.viewBox;
  } // component > children


  const renderInnerNode = () => {
    if (Component) {
      return <Component {...innerSvgProps}>{children}</Component>;
    }

    if (children) {
      warning(Boolean(viewBox) || React.Children.count(children) === 1 && React.isValidElement(children) && React.Children.only(children).type === "use", "Make sure that you provide correct `viewBox`" + " prop (default `0 0 1024 1024`) to the icon.");
      return <svg {...innerSvgProps} viewBox={viewBox}>
            {children}
          </svg>;
    }

    return null;
  };

  let iconTabIndex = tabIndex;

  if (iconTabIndex === undefined && onClick) {
    iconTabIndex = -1;
  }

  return <span role="img" {...restProps} ref={ref} tabIndex={iconTabIndex} onClick={onClick} className={classString}>
        {renderInnerNode()}
      </span>;
});
Icon.displayName = "AntdIcon";
export default Icon;