import { generate, getSecondaryColor, isIconDefinition, warning, useInsertStyles } from "./utils";
const twoToneColorPalette = {
  primaryColor: "#333",
  secondaryColor: "#E6E6E6",
  calculated: false
};

function setTwoToneColors({
  primaryColor,
  secondaryColor
}) {
  twoToneColorPalette.primaryColor = primaryColor;
  twoToneColorPalette.secondaryColor = secondaryColor || getSecondaryColor(primaryColor);
  twoToneColorPalette.calculated = !!secondaryColor;
}

function getTwoToneColors() {
  return { ...twoToneColorPalette
  };
}

const IconBase = props => {
  const {
    icon,
    className,
    onClick,
    style,
    primaryColor,
    secondaryColor,
    ...restProps
  } = props;
  let colors = twoToneColorPalette;

  if (primaryColor) {
    colors = {
      primaryColor,
      secondaryColor: secondaryColor || getSecondaryColor(primaryColor)
    };
  }

  useInsertStyles();
  warning(isIconDefinition(icon), `icon should be icon definiton, but got ${icon}`);

  if (!isIconDefinition(icon)) {
    return null;
  }

  let target = icon;

  if (target && typeof target.icon === "function") {
    target = { ...target,
      icon: target.icon(colors.primaryColor, colors.secondaryColor)
    };
  }

  return generate(target.icon, `svg-${target.name}`, {
    className,
    onClick,
    style,
    "data-icon": target.name,
    width: "1em",
    height: "1em",
    fill: "currentColor",
    "aria-hidden": "true",
    ...restProps
  });
};

IconBase.displayName = "IconReact";
IconBase.getTwoToneColors = getTwoToneColors;
IconBase.setTwoToneColors = setTwoToneColors;
export default IconBase;