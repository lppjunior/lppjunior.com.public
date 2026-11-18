// Same snippet the Vite projects inject: script first in <head>, noscript iframe first in <body>.

export function gtmHeadScript (gtmId) {
  return `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});</script>`
}

export function gtmBodyNoscript (gtmId) {
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>`
}

export function injectGtm (html, gtmId) {
  if (!gtmId) return html
  return html
    .replace('<head>', match => `${match}\n    ${gtmHeadScript(gtmId)}`)
    .replace('<body>', match => `${match}\n    ${gtmBodyNoscript(gtmId)}`)
}
