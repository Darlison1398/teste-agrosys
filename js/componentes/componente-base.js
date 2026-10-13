var ComponenteBase = (function () {
  'use strict';

  class ComponenteBase extends HTMLElement {
    connectedCallback() {
      if (this._renderizado) return; // evita renderizar duas vezes
      this._renderizado = true;
      this.innerHTML = this.renderizar(this.innerHTML.trim());
      if (this.aposRenderizar) this.aposRenderizar();
    }

    attr(nome, padrao) {
      return this.hasAttribute(nome) ? this.getAttribute(nome) : (padrao === undefined ? '' : padrao);
    }

    attrSeguro(nome, padrao) {
      return Utils.escapeHtml(this.attr(nome, padrao));
    }

    renderizar(conteudo) {
      return conteudo;
    }
  }

  return ComponenteBase;
})();
