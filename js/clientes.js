var Clientes = (function () {
  'use strict';

  var $form, formulario, aoSalvarCallback = null;
  var dados; // API de dados restrita ao usuário logado (DB.doUsuario)

  var CAMPOS = {
    nome: '#cliente-nome-input',
    cpf: '#cliente-cpf',
    data_nascimento: '#cliente-nascimento',
    telefone: '#cliente-telefone',
    celular: '#cliente-celular'
  };

  function seletorRegistro(id) {
    return '[data-registro="cliente-' + Number(id) + '"]';
  }

  function telefoneFormatado(valor) {
    var d = Utils.somenteDigitos(valor);
    if (!d) return '<span class="text-muted">—</span>';
    return Utils.escapeHtml(d.length === 11 ? Utils.mascaraCelular(d) : Utils.mascaraTelefone(d));
  }

  function enderecoResumo(c) {
    var e = c.endereco_principal;
    if (!e) {
      return '<span class="badge text-bg-warning"><i class="bi bi-exclamation-triangle me-1"></i>Sem endereço</span>';
    }
    var extra = c.qtd_enderecos > 1
      ? ' <span class="badge rounded-pill text-bg-light border" title="Total de endereços">+' + (c.qtd_enderecos - 1) + '</span>'
      : '';
    return Utils.escapeHtml(e.cidade + ' / ' + e.estado) + extra;
  }

  function botoesAcao(c) {
    return (
      '<div class="btn-group btn-group-sm" role="group">' +
        '<a class="btn btn-outline-success" href="#cliente/' + c.id + '" title="Endereços"><i class="bi bi-geo-alt"></i><span class="d-md-none ms-1">Endereços</span></a>' +
        '<button type="button" class="btn btn-outline-primary btn-editar-cliente" data-id="' + c.id + '" title="Editar"><i class="bi bi-pencil"></i><span class="d-md-none ms-1">Editar</span></button>' +
        '<button type="button" class="btn btn-outline-danger btn-excluir-cliente" data-id="' + c.id + '" title="Excluir"><i class="bi bi-trash"></i><span class="d-md-none ms-1">Excluir</span></button>' +
      '</div>'
    );
  }

  /* ------------------------------ Listagem ------------------------------ */

  function filtrar(clientes, termo) {
    termo = Utils.normalizar(termo);
    if (!termo) return clientes;
    var termoDigitos = Utils.somenteDigitos(termo);
    return clientes.filter(function (c) {
      var e = c.endereco_principal || {};
      var texto = Utils.normalizar([c.nome, e.cidade, e.estado, e.bairro].join(' '));
      if (texto.indexOf(termo) !== -1) return true;
      return termoDigitos.length > 0 && (c.cpf + ' ' + c.telefone + ' ' + c.celular).indexOf(termoDigitos) !== -1;
    });
  }

  /**
   * Renderiza a listagem.
   * @param {object} [destaque] { id, tipo: 'criado' | 'editado' } registro a realçar
   */
  function renderizar(destaque) {
    var todos = dados.listarClientes();
    var termo = $('#busca-clientes').val();
    var lista = filtrar(todos, termo);

    $('#total-clientes').text(
      todos.length === 0 ? '' :
      termo ? lista.length + ' de ' + todos.length + ' cliente(s)' : todos.length + ' cliente(s) cadastrado(s)'
    );

    var linhas = lista.map(function (c) {
      return (
        '<tr data-registro="cliente-' + c.id + '">' +
          '<td class="fw-semibold">' + Utils.escapeHtml(c.nome) + '</td>' +
          '<td class="text-nowrap">' + Utils.mascaraCPF(c.cpf) + '</td>' +
          '<td class="text-nowrap">' + Utils.formatarData(c.data_nascimento) + '</td>' +
          '<td class="text-nowrap">' + telefoneFormatado(c.telefone) + '</td>' +
          '<td class="text-nowrap">' + telefoneFormatado(c.celular) + '</td>' +
          '<td>' + enderecoResumo(c) + '</td>' +
          '<td class="text-end text-nowrap">' + botoesAcao(c) + '</td>' +
        '</tr>'
      );
    });
    $('#tabela-clientes').html(linhas.join(''));

    var cards = lista.map(function (c) {
      var idade = Utils.calcularIdade(c.data_nascimento);
      return (
        '<div class="card border-0 shadow-sm mb-2 card-cliente" data-registro="cliente-' + c.id + '">' +
          '<div class="card-body">' +
            '<div class="d-flex justify-content-between align-items-start gap-2 mb-2">' +
              '<h2 class="h6 mb-0 fw-semibold">' + Utils.escapeHtml(c.nome) + '</h2>' +
              '<div class="text-end small">' + enderecoResumo(c) + '</div>' +
            '</div>' +
            '<dl class="row small mb-2">' +
              '<dt class="col-4 text-muted fw-normal">CPF</dt><dd class="col-8 mb-1">' + Utils.mascaraCPF(c.cpf) + '</dd>' +
              '<dt class="col-4 text-muted fw-normal">Nascimento</dt><dd class="col-8 mb-1">' + Utils.formatarData(c.data_nascimento) + (idade !== null ? ' (' + idade + ' anos)' : '') + '</dd>' +
              '<dt class="col-4 text-muted fw-normal">Telefone</dt><dd class="col-8 mb-1">' + telefoneFormatado(c.telefone) + '</dd>' +
              '<dt class="col-4 text-muted fw-normal">Celular</dt><dd class="col-8 mb-0">' + telefoneFormatado(c.celular) + '</dd>' +
            '</dl>' +
            '<div class="d-grid">' + botoesAcao(c).replace('btn-group btn-group-sm', 'btn-group btn-group-sm w-100') + '</div>' +
          '</div>' +
        '</div>'
      );
    });
    $('#cards-clientes').html(cards.join(''));

    var vazio = lista.length === 0;
    var estadoVazio = document.getElementById('vazio-clientes');
    estadoVazio.exibir(vazio);
    estadoVazio.definirMensagem(todos.length === 0
      ? 'Nenhum cliente cadastrado. Clique em "Novo cliente" para começar.'
      : 'Nenhum cliente encontrado para "' + termo + '".');
    $('#card-tabela-clientes').toggleClass('d-md-block', !vazio);

    if (destaque) Aviso.destacar(seletorRegistro(destaque.id), destaque.tipo);
  }

  /* ------------------------------ Formulário ------------------------------ */

  /**
   * Abre o formulário de cliente.
   * @param {number|null} id  ID para edição ou null para novo cliente
   * @param {function} aoSalvar callback(cliente, novo) executado após salvar
   */
  function abrirFormulario(id, aoSalvar) {
    aoSalvarCallback = aoSalvar || null;
    $form[0].reset();
    Utils.limparValidacao($form);
    $(CAMPOS.data_nascimento).attr('max', Utils.hojeISO());

    var c = id ? dados.buscarCliente(id) : null;
    formulario.definirModo(c ? 'editar' : 'novo', c ? 'Editar cliente' : 'Novo cliente');
    $('#cliente-id').val(c ? c.id : '');

    if (c) {
      $(CAMPOS.nome).val(c.nome);
      $(CAMPOS.cpf).val(Utils.mascaraCPF(c.cpf));
      $(CAMPOS.data_nascimento).val(c.data_nascimento);
      $(CAMPOS.telefone).val(Utils.mascaraTelefone(c.telefone));
      $(CAMPOS.celular).val(Utils.mascaraCelular(c.celular));
    }
    formulario.abrir();
  }

  /** Validação no cliente (feedback imediato); a regra definitiva está no DB. */
  function validarFormulario() {
    var ok = true;
    function erro(campo, msg) { Utils.marcarInvalido($(CAMPOS[campo]), msg); ok = false; }

    var nome = $(CAMPOS.nome).val().trim();
    if (nome.length < 3 || nome.indexOf(' ') === -1) erro('nome', 'Informe o nome completo (nome e sobrenome).');
    if (!Utils.validarCPF($(CAMPOS.cpf).val())) erro('cpf', 'CPF inválido.');
    if (!Utils.validarDataNascimento($(CAMPOS.data_nascimento).val())) erro('data_nascimento', 'Data de nascimento inválida (não pode ser futura).');
    var tel = $(CAMPOS.telefone).val();
    if (Utils.somenteDigitos(tel) && !Utils.validarTelefone(tel)) erro('telefone', 'Telefone inválido. Use o formato (00) 0000-0000.');
    if (!Utils.validarCelular($(CAMPOS.celular).val())) erro('celular', 'Celular inválido. Use o formato (00) 90000-0000.');

    if (!ok) $form.find('.is-invalid').first().trigger('focus');
    return ok;
  }

  function salvar(e) {
    e.preventDefault();
    Utils.limparValidacao($form);
    if (!validarFormulario()) return;

    var novo = !$('#cliente-id').val();
    try {
      var cliente = dados.salvarCliente({
        id: $('#cliente-id').val(),
        nome: $(CAMPOS.nome).val(),
        cpf: $(CAMPOS.cpf).val(),
        data_nascimento: $(CAMPOS.data_nascimento).val(),
        telefone: $(CAMPOS.telefone).val(),
        celular: $(CAMPOS.celular).val()
      });
      formulario.fechar();
      if (novo) {
        Aviso.criado('"' + cliente.nome + '" foi cadastrado. Agora cadastre o endereço principal.', 'Cliente cadastrado');
      } else {
        Aviso.editado('Os dados de "' + cliente.nome + '" foram atualizados.', 'Cliente atualizado');
      }
      renderizar({ id: cliente.id, tipo: novo ? 'criado' : 'editado' });
      if (aoSalvarCallback) aoSalvarCallback(cliente, novo);
    } catch (erro) {
      if (erro instanceof DB.ErroValidacao && erro.campo && CAMPOS[erro.campo]) {
        Utils.marcarInvalido($(CAMPOS[erro.campo]), erro.message);
        $(CAMPOS[erro.campo]).trigger('focus');
      } else {
        console.error(erro);
        Aviso.erro(erro.message || 'Erro ao salvar o cliente.');
      }
    }
  }

  function excluir(id, aoExcluir) {
    var c = dados.buscarCliente(id);
    if (!c) return;
    var qtd = dados.listarEnderecos(id).length;
    Confirmacao.abrir({
      tipo: 'excluir',
      titulo: 'Excluir cliente?',
      mensagem: 'O cliente <strong>' + Utils.escapeHtml(c.nome) + '</strong> será removido permanentemente.' +
        (qtd ? '<br><small class="text-danger">' + qtd + ' endereço(s) vinculado(s) também serão excluídos.</small>' : '')
    }).then(function (ok) {
      if (!ok) return;
      return Aviso.animarSaida(seletorRegistro(id)).then(function () {
        dados.excluirCliente(id);
        Aviso.excluido(
          qtd ? '"' + c.nome + '" e ' + qtd + ' endereço(s) foram removidos.' : '"' + c.nome + '" foi removido.',
          'Cliente excluído'
        );
        renderizar();
        if (aoExcluir) aoExcluir();
      });
    });
  }

  /* ------------------------------ Inicialização ------------------------------ */

  /**
   * @param {object} dadosUsuario retorno de DB.doUsuario(id do usuário logado)
   */
  function iniciar(dadosUsuario) {
    dados = dadosUsuario;
    $form = $('#form-cliente');
    formulario = $form.closest('app-modal-formulario')[0];

    // Máscaras
    $(CAMPOS.cpf).on('input', function () { this.value = Utils.mascaraCPF(this.value); });
    $(CAMPOS.telefone).on('input', function () { this.value = Utils.mascaraTelefone(this.value); });
    $(CAMPOS.celular).on('input', function () { this.value = Utils.mascaraCelular(this.value); });
    $form.on('input change', 'input', function () { $(this).removeClass('is-invalid'); });

    $('#modalCliente').on('shown.bs.modal', function () { $(CAMPOS.nome).trigger('focus'); });

    $form.on('submit', salvar);

    $('#btn-novo-cliente').on('click', function () {
      abrirFormulario(null, function (cliente, novo) {
        // Após cadastrar, leva direto para os endereços (endereço principal é obrigatório).
        if (novo) window.location.hash = 'cliente/' + cliente.id;
      });
    });

    $('#view-clientes').on('click', '.btn-editar-cliente', function () {
      abrirFormulario($(this).data('id'));
    });
    $('#view-clientes').on('click', '.btn-excluir-cliente', function () {
      excluir($(this).data('id'));
    });

    var timer;
    $('#busca-clientes').on('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { renderizar(); }, 150);
    });
  }

  return {
    iniciar: iniciar,
    renderizar: renderizar,
    abrirFormulario: abrirFormulario,
    excluir: excluir
  };
})();
