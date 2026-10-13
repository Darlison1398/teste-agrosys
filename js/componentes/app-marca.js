(function () {
  'use strict';

  var NOME = 'Agrosys';
  var ICONE = 'bi-flower1';

  class AppMarca extends ComponenteBase {
    renderizar() {
      if (this.attr('variante') === 'login') {
        return (
          '<div class="text-center mb-4 text-white">' +
            '<div class="logo-circulo mb-2"><i class="bi ' + ICONE + '"></i></div>' +
            '<h1 class="h3 fw-bold mb-0">' + NOME + '</h1>' +
            (this.attr('subtitulo') ? '<p class="mb-0 opacity-75">' + this.attrSeguro('subtitulo') + '</p>' : '') +
          '</div>'
        );
      }
      return '<a class="navbar-brand fw-bold" href="#"><i class="bi ' + ICONE + ' me-1"></i> ' + NOME + '</a>';
    }
  }

  customElements.define('app-marca', AppMarca);
})();
