import * as React from 'react';
import Icon from './Icon';
const customCache = new Set();

function isValidCustomScriptUrl(scriptUrl) {
  return Boolean(typeof scriptUrl === 'string' && scriptUrl.length && !customCache.has(scriptUrl));
}

function createScriptUrlElements(scriptUrls, index = 0) {
  const currentScriptUrl = scriptUrls[index];

  if (isValidCustomScriptUrl(currentScriptUrl)) {
    const script = document.createElement('script');
    script.setAttribute('src', currentScriptUrl);
    script.setAttribute('data-namespace', currentScriptUrl);

    if (scriptUrls.length > index + 1) {
      script.onload = () => {
        createScriptUrlElements(scriptUrls, index + 1);
      };

      script.onerror = () => {
        createScriptUrlElements(scriptUrls, index + 1);
      };
    }

    customCache.add(currentScriptUrl);
    document.body.appendChild(script);
  }
}

export default function create(options = {}) {
  const {
    scriptUrl,
    extraCommonProps = {}
  } = options;
  /**
   * DOM API required.
   * Make sure in browser environment.
   * The Custom Icon will create a <script/>
   * that loads SVG symbols and insert the SVG Element into the document body.
   */

  if (scriptUrl && typeof document !== 'undefined' && typeof window !== 'undefined' && typeof document.createElement === 'function') {
    if (Array.isArray(scriptUrl)) {
      // 因为iconfont资源会把svg插入before，所以前加载相同type会覆盖后加载，为了数组覆盖顺序，倒叙插入
      createScriptUrlElements(scriptUrl.reverse());
    } else {
      createScriptUrlElements([scriptUrl]);
    }
  }

  const Iconfont = React.forwardRef((props, ref) => {
    const {
      type,
      children,
      ...restProps
    } = props; // children > type

    let content = null;

    if (props.type) {
      content = <use xlinkHref={`#${type}`} />;
    }

    if (children) {
      content = children;
    }

    return <Icon {...extraCommonProps} {...restProps} ref={ref}>
                    {content}
                </Icon>;
  });
  Iconfont.displayName = 'Iconfont';
  return Iconfont;
}