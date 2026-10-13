var Enderecos = (function () {
  'use strict';

  var $form, formulario, clienteAtual = null;
  var dados; // API de dados restrita ao usuário logado (DB.doUsuario)

  var CAMPOS = {
    cep: '#endereco-cep',
    rua: '#endereco-rua',
    numero: '#endereco-numero',
    complemento: '#endereco-complemento',
    bairro: '#endereco-bairro',
    cidade: '#endereco-cidade',
    estado: '#endereco-estado',
    pais: '#endereco-pais',
    principal: '#endereco-principal'
  };

  /** Seletor do card que representa o endereço na listagem. */
  function seletorRegistro(id) {
    return '[data-registro="endereco-' + Number(id) + '"]';
  }

  /* ------------------------------ Cabeçalho do cliente ------------------------------ */

  function iniciais(nome) {
    var partes = String(nome).trim().split(/\s+/);
    return ((partes[0] || '').charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : '')).toUpperCase();
  }

  function renderizarCliente() {
    var c = clienteAtual;
    var idade = Utils.calcularIdade(c.data_nascimento);
    $('#cliente-avatar').text(iniciais(c.nome));
    $('#cliente-nome').text(c.nome);
    $('#cliente-detalhes').html(
      '<span><i class="bi bi-hash"></i>ID ' + c.id + '</span>' +
      '<span><i class="bi bi-person-vcard me-1"></i>' + Utils.mascaraCPF(c.cpf) + '</span>' +
      '<span><i class="bi bi-calendar3 me-1"></i>' + Utils.formatarData(c.data_nascimento) + (idade !== null ? ' (' + idade + ' anos)' : '') + '</span>' +
      (c.telefone ? '<span><i class="bi bi-telephone me-1"></i>' + Utils.mascaraTelefone(c.telefone) + '</span>' : '') +
      '<span><i class="bi bi-phone me-1"></i>' + Utils.mascaraCelular(c.celular) + '</span>'
    );
  }

  /* ------------------------------ Listagem ------------------------------ */

  /**
   * Renderiza os cards de endereço.
   * @param {object} [destaque] { id, tipo: 'criado' | 'editado' } registro a realçar
   */
  function renderizarLista(destaque) {
    var lista = dados.listarEnderecos(clienteAtual.id);

    $('#total-enderecos').text(lista.length ? lista.length + ' endereço(s)' : '');
    document.getElementById('vazio-enderecos').exibir(lista.length === 0);

    var html = lista.map(function (e) {
      var linha1 = Utils.escapeHtml(e.rua) + (e.numero ? ', ' + Utils.escapeHtml(e.numero) : '') +
        (e.complemento ? ' - ' + Utils.escapeHtml(e.complemento) : '');
      var principal = e.principal === true;
      return (
        '<div class="col-12 col-md-6 col-xl-4" data-registro="endereco-' + e.id + '">' +
          '<div class="card h-100 shadow-sm card-endereco' + (principal ? ' principal' : ' border-0') + '">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start mb-2">' +
                (principal
                  ? '<span class="badge text-bg-success"><i class="bi bi-star-fill me-1"></i>Principal</span>'
                  : '<span class="badge text-bg-light border text-muted">Secundário</span>') +
                '<small class="text-muted">#' + e.id + '</small>' +
              '</div>' +
              '<p class="fw-semibold mb-1">' + linha1 + '</p>' +
              '<p class="mb-1 small">' + Utils.escapeHtml(e.bairro) + '</p>' +
              '<p class="mb-1 small">' + Utils.escapeHtml(e.cidade) + ' / ' + Utils.escapeHtml(e.estado) + ' - ' + Utils.escapeHtml(e.pais) + '</p>' +
              '<p class="mb-0 small text-muted"><i class="bi bi-mailbox me-1"></i>CEP ' + Utils.mascaraCEP(e.cep) + '</p>' +
            '</div>' +
            '<div class="card-footer bg-transparent d-flex flex-wrap gap-2">' +
              (principal ? '' :
                '<button type="button" class="btn btn-sm btn-outline-success btn-principal" data-id="' + e.id + '"><i class="bi bi-star me-1"></i>Tornar principal</button>') +
              '<button type="button" class="btn btn-sm btn-outline-primary btn-editar-endereco ms-auto" data-id="' + e.id + '" title="Editar"><i class="bi bi-pencil"></i><span class="ms-1">Editar</span></button>' +
              '<button type="button" class="btn btn-sm btn-outline-danger btn-excluir-endereco" data-id="' + e.id + '" title="Excluir"><i class="bi bi-trash"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    });

    $('#lista-enderecos').html(html.join(''));
    if (destaque) Aviso.destacar(seletorRegistro(destaque.id) + ' .card-endereco', destaque.tipo);
  }

  /** Exibe a tela de endereços do cliente. Retorna false se o cliente não existir. */
  function mostrar(clienteId) {
    clienteAtual = dados.buscarCliente(clienteId);
    if (!clienteAtual) return false;
    renderizarCliente();
    renderizarLista();
    return true;
  }

  /* ------------------------------ Formulário ------------------------------ */

  function abrirFormulario(id) {
    $form[0].reset();
    Utils.limparValidacao($form);

    var e = id ? dados.buscarEndereco(id) : null;
    var qtd = dados.listarEnderecos(clienteAtual.id).length;

    formulario.definirModo(e ? 'editar' : 'novo', e ? 'Editar endereço' : 'Novo endereço');
    $('#endereco-id').val(e ? e.id : '');
    $('#endereco-cliente').val(clienteAtual.id);
    $('#endereco-cliente-nome').val(clienteAtual.nome);

    var $principal = $(CAMPOS.principal);
    var $ajuda = $('#ajuda-principal');

    if (e) {
      Object.keys(CAMPOS).forEach(function (campo) {
        if (campo !== 'principal') $(CAMPOS[campo]).val(e[campo]);
      });
      $(CAMPOS.cep).val(Utils.mascaraCEP(e.cep));
      $principal.prop('checked', e.principal === true);
    } else {
      $(CAMPOS.pais).val('Brasil');
      $principal.prop('checked', qtd === 0);
    }

    // O endereço principal não pode ser desmarcado diretamente; o primeiro endereço é sempre principal.
    var travado = (e && e.principal === true) || (!e && qtd === 0);
    $principal.prop('disabled', travado);
    $ajuda.text(
      !e && qtd === 0 ? 'O primeiro endereço do cliente é obrigatoriamente o principal.' :
      travado ? 'Para trocar o principal, marque outro endereço como principal.' :
      'Ao marcar, o endereço principal atual passará a ser secundário.'
    );

    formulario.abrir();
  }

  function validarFormulario() {
    var ok = true;
    function erro(campo, msg) { Utils.marcarInvalido($(CAMPOS[campo]), msg); ok = false; }

    if (!Utils.validarCEP($(CAMPOS.cep).val())) erro('cep', 'CEP inválido. Use o formato 00000-000.');
    ['rua', 'bairro', 'cidade', 'estado', 'pais'].forEach(function (campo) {
      if (!$(CAMPOS[campo]).val().trim()) erro(campo);
    });

    if (!ok) $form.find('.is-invalid').first().trigger('focus');
    return ok;
  }

  function salvar(ev) {
    ev.preventDefault();
    Utils.limparValidacao($form);
    if (!validarFormulario()) return;

    var novo = !$('#endereco-id').val();
    var valores = { id: $('#endereco-id').val(), cliente_id: clienteAtual.id, principal: $(CAMPOS.principal).is(':checked') };
    Object.keys(CAMPOS).forEach(function (campo) {
      if (campo !== 'principal') valores[campo] = $(CAMPOS[campo]).val();
    });

    try {
      var endereco = dados.salvarEndereco(valores);
      var descricao = endereco.rua + (endereco.numero ? ', ' + endereco.numero : '');
      formulario.fechar();
      if (novo) {
        Aviso.criado('"' + descricao + '" foi adicionado' + (endereco.principal ? ' como endereço principal.' : '.'), 'Endereço cadastrado');
      } else {
        Aviso.editado('"' + descricao + '" foi atualizado.', 'Endereço atualizado');
      }
      renderizarLista({ id: endereco.id, tipo: novo ? 'criado' : 'editado' });
    } catch (erro) {
      if (erro instanceof DB.ErroValidacao && erro.campo && CAMPOS[erro.campo]) {
        Utils.marcarInvalido($(CAMPOS[erro.campo]), erro.message);
        // O switch "principal" não tem mensagem abaixo do campo; avisa por notificação.
        if (erro.campo === 'principal') Aviso.alerta(erro.message, 'Não foi possível salvar');
      } else {
        console.error(erro);
        Aviso.erro(erro.message || 'Erro ao salvar o endereço.');
      }
    }
  }

  function excluir(id) {
    var e = dados.buscarEndereco(id);
    if (!e) return;
    var total = dados.listarEnderecos(e.cliente_id).length;
    var aviso = '';
    if (e.principal === true && total > 1) {
      aviso = '<br><small class="text-muted">Este é o endereço principal; outro endereço será definido como principal automaticamente.</small>';
    } else if (total === 1) {
      aviso = '<br><small class="text-danger">Este é o único endereço do cliente.</small>';
    }

    var descricao = e.rua + (e.numero ? ', ' + e.numero : '');
    Confirmacao.abrir({
      tipo: 'excluir',
      titulo: 'Excluir endereço?',
      mensagem: 'O endereço <strong>' + Utils.escapeHtml(descricao) + '</strong> será removido permanentemente.' + aviso
    }).then(function (ok) {
      if (!ok) return;
      return Aviso.animarSaida(seletorRegistro(id)).then(function () {
        dados.excluirEndereco(id);
        var novoPrincipal = e.principal === true ? dados.listarEnderecos(e.cliente_id)[0] : null;
        Aviso.excluido(
          '"' + descricao + '" foi removido.' + (novoPrincipal ? ' Novo principal: ' + novoPrincipal.rua + '.' : ''),
          'Endereço excluído'
        );
        renderizarLista(novoPrincipal ? { id: novoPrincipal.id, tipo: 'editado' } : null);
      });
    });
  }

  /* ------------------------------ Busca de CEP (ViaCEP) ------------------------------ */

  function buscarCEP(silencioso) {
    var cep = Utils.somenteDigitos($(CAMPOS.cep).val());
    if (cep.length !== 8) {
      if (!silencioso) Utils.marcarInvalido($(CAMPOS.cep), 'Informe um CEP com 8 dígitos.');
      return;
    }

    var $btn = $('#btn-buscar-cep');
    $btn.prop('disabled', true).find('.spinner-border').removeClass('d-none');
    $btn.find('.bi').addClass('d-none');

    var controle = window.AbortController ? new AbortController() : null;
    var timeout = setTimeout(function () { if (controle) controle.abort(); }, 6000);

    fetch('https://viacep.com.br/ws/' + cep + '/json/', controle ? { signal: controle.signal } : {})
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (d.erro) {
          Utils.marcarInvalido($(CAMPOS.cep), 'CEP não encontrado. Preencha o endereço manualmente.');
          if (!silencioso) Aviso.alerta('CEP não encontrado. Preencha o endereço manualmente.');
          return;
        }
        if (d.logradouro) $(CAMPOS.rua).val(d.logradouro);
        if (d.bairro) $(CAMPOS.bairro).val(d.bairro);
        if (d.localidade) $(CAMPOS.cidade).val(d.localidade);
        if (d.uf) $(CAMPOS.estado).val(d.uf);
        $(CAMPOS.pais).val('Brasil');
        $form.find('.is-invalid').removeClass('is-invalid');
        $(d.logradouro ? CAMPOS.numero : CAMPOS.rua).trigger('focus');
      })
      .catch(function () {
        if (!silencioso) Aviso.alerta('Não foi possível consultar o CEP (sem conexão?). Preencha manualmente.');
      })
      .finally(function () {
        clearTimeout(timeout);
        $btn.prop('disabled', false).find('.spinner-border').addClass('d-none');
        $btn.find('.bi').removeClass('d-none');
      });
  }

  /* ------------------------------ Inicialização ------------------------------ */

  /**
   * @param {object} dadosUsuario retorno de DB.doUsuario(id do usuário logado)
   */
  function iniciar(dadosUsuario) {
    dados = dadosUsuario;
    $form = $('#form-endereco');
    formulario = $form.closest('app-modal-formulario')[0];

    $(CAMPOS.cep).on('input', function () {
      this.value = Utils.mascaraCEP(this.value);
      // Busca automática quando o CEP é preenchido por completo.
      if (Utils.somenteDigitos(this.value).length === 8) buscarCEP(true);
    });
    $(CAMPOS.estado).on('input', function () {
      if (this.value.length <= 2) this.value = this.value.toUpperCase();
    });
    $('#btn-buscar-cep').on('click', function () { buscarCEP(false); });
    $form.on('input change', 'input', function () { $(this).removeClass('is-invalid'); });
    $('#modalEndereco').on('shown.bs.modal', function () { $(CAMPOS.cep).trigger('focus'); });

    $form.on('submit', salvar);

    $('#btn-novo-endereco').on('click', function () { abrirFormulario(null); });
    $('#lista-enderecos')
      .on('click', '.btn-editar-endereco', function () { abrirFormulario($(this).data('id')); })
      .on('click', '.btn-excluir-endereco', function () { excluir($(this).data('id')); })
      .on('click', '.btn-principal', function () {
        var id = $(this).data('id');
        var e = dados.buscarEndereco(id);
        dados.definirPrincipal(id);
        Aviso.editado('"' + e.rua + (e.numero ? ', ' + e.numero : '') + '" agora é o endereço principal.', 'Endereço principal alterado');
        renderizarLista({ id: id, tipo: 'editado' });
      });

    $('#btn-editar-cliente-atual').on('click', function () {
      Clientes.abrirFormulario(clienteAtual.id, function () {
        mostrar(clienteAtual.id);
        Aviso.destacar('#card-cliente-atual', 'editado');
      });
    });
  }

  return { iniciar: iniciar, mostrar: mostrar };
})();
