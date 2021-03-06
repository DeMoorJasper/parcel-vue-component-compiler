/* globals __VUE_SSR_CONTEXT__ */
import listToStyles from './list-to-styles'

export default function (parentId, list, isProduction, context) {
  if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
    context = __VUE_SSR_CONTEXT__
  }
  if (context) {
    if (!context.hasOwnProperty('styles')) {
      Object.defineProperty(context, 'styles', {
        enumerable: true,
        get: () => renderStyles(context._styles)
      })
      // expose renderStyles for vue-server-renderer (vuejs/#6353)
      context._renderStyles = renderStyles
    }

    const styles = context._styles || (context._styles = {})
    list = listToStyles(parentId, list)
    if (isProduction) {
      addStyleProd(styles, list)
    } else {
      addStyleDev(styles, list)
    }
  }
}

// In production, render as few style tags as possible.
// (mostly because IE9 has a limit on number of style tags)
function addStyleProd (styles, list) {
  for (let i = 0; i < list.length; i++) {
    const parts = list[i].parts
    for (var j = 0; j < parts.length; j++) {
      const part = parts[j]
      // group style tags by media types.
      const id = part.media || 'default'
      const style = styles[id]
      if (style) {
        if (style.ids.indexOf(part.id) < 0) {
          style.ids.push(part.id)
          style.css += '\n' + part.css
        }
      } else {
        styles[id] = {
          ids: [part.id],
          css: part.css,
          media: part.media
        }
      }
    }
  }
}

// In dev we use individual style tag for each module for hot-reload
// and source maps.
function addStyleDev (styles, list) {
  for (let i = 0; i < list.length; i++) {
    const parts = list[i].parts
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j]
      styles[part.id] = {
        ids: [part.id],
        css: part.css,
        media: part.media
      }
    }
  }
}

function renderStyles (styles) {
  var css = ''
  for (const key in styles) {
    const style = styles[key]
    css +=
      '<style data-vue-ssr-id="' +
      style.ids.join(' ') +
      '"' +
      (style.media ? ' media="' + style.media + '"' : '') +
      '>' +
      style.css +
      '</style>'
  }
  return css
}
