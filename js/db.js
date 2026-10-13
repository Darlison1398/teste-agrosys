/**
 * db.js
 * Camada de acesso a dados utilizando o AlaSQL.
 *
 * O banco é criado no localStorage do navegador (persistente entre sessões),
 * conforme o exemplo da documentação da avaliação:
 *   CREATE localStorage DATABASE IF NOT EXISTS ...
 *   ATTACH localStorage DATABASE ...
 *   USE ...
 *
 * Toda regra de negócio relacionada aos dados (unicidade de usuário/CPF,
 * endereço principal obrigatório, exclusão em cascata etc.) fica aqui,
 * para que as telas apenas consumam esta API.
 *
 * Isolamento por usuário:
 *   Cada cliente pertence a um usuário (coluna clientes.usuario_id) e os
 *   endereços pertencem ao cliente. As operações de clientes/endereços só
 *   existem através de DB.doUsuario(usuarioId), que aplica o filtro do
 *   usuário em TODAS as consultas. Assim um usuário nunca lê, altera ou
 *   exclui dados de outro, mesmo informando IDs manualmente na URL.
 */
var DB = (function () {
  'use strict';

  var NOME_BANCO = 'agrosysdb';
  var VERSAO_FORMATO = 2;
  var TABELAS = ['usuarios', 'clientes', 'enderecos'];

  var SQL_CLIENTES =
    'CREATE TABLE IF NOT EXISTS clientes (' +
    '  id INT PRIMARY KEY,' +
    '  usuario_id INT,' +
    '  nome STRING,' +
    '  cpf STRING,' +
    '  data_nascimento STRING,' +
    '  telefone STRING,' +
    '  celular STRING,' +
    '  criado_em STRING,' +
    '  atualizado_em STRING' +
    ')';

  /** Erro de regra de negócio (mensagem amigável para o usuário). */
  function ErroValidacao(mensagem, campo) {
    this.name = 'ErroValidacao';
    this.message = mensagem;
    this.campo = campo || null;
  }
  ErroValidacao.prototype = Object.create(Error.prototype);

  /* ------------------------------------------------------------------ *
   * Inicialização
   * ------------------------------------------------------------------ */

  function iniciar() {
    alasql('CREATE localStorage DATABASE IF NOT EXISTS ' + NOME_BANCO);
    alasql('ATTACH localStorage DATABASE ' + NOME_BANCO);
    alasql('USE ' + NOME_BANCO);

    alasql(
      'CREATE TABLE IF NOT EXISTS usuarios (' +
      '  id INT PRIMARY KEY,' +
      '  nome STRING,' +
      '  usuario STRING,' +
      '  senha_hash STRING,' +
      '  salt STRING,' +
      '  criado_em STRING' +
      ')'
    );

    alasql(SQL_CLIENTES);

    alasql(
      'CREATE TABLE IF NOT EXISTS enderecos (' +
      '  id INT PRIMARY KEY,' +
      '  cliente_id INT,' +
      '  cep STRING,' +
      '  rua STRING,' +
      '  numero STRING,' +
      '  complemento STRING,' +
      '  bairro STRING,' +
      '  cidade STRING,' +
      '  estado STRING,' +
      '  pais STRING,' +
      '  principal BOOLEAN,' +
      '  criado_em STRING,' +
      '  atualizado_em STRING' +
      ')'
    );

    migrarClientesSemDono();
  }

  /**
   * Migração de bancos criados antes do isolamento por usuário.
   * - Se a tabela clientes ainda não tem a coluna usuario_id, ela é recriada
   *   (o ALTER TABLE do AlaSQL não persiste a nova coluna no localStorage).
   * - Clientes sem dono são atribuídos ao primeiro usuário cadastrado.
   */
  function migrarClientesSemDono() {
    var colunas = alasql('SHOW COLUMNS FROM clientes').map(function (c) { return c.columnid; });
    if (colunas.indexOf('usuario_id') === -1) {
      var registros = alasql('SELECT * FROM clientes');
      alasql('DROP TABLE clientes');
      alasql(SQL_CLIENTES);
      if (registros.length) {
        alasql('INSERT INTO clientes SELECT * FROM ?', [registros.map(function (c) {
          return Object.assign({ usuario_id: null }, c);
        })]);
      }
    }

    var primeiro = alasql('SELECT MIN(id) AS id FROM usuarios')[0].id;
    if (primeiro) {
      var semDono = alasql('SELECT id FROM clientes WHERE usuario_id IS NULL OR usuario_id = 0');
      if (semDono.length) alasql('UPDATE clientes SET usuario_id = ? WHERE usuario_id IS NULL OR usuario_id = 0', [primeiro]);
    }
  }

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */

  function agora() {
    return new Date().toISOString();
  }

  /**
   * Gera o próximo ID de uma tabela.
   * (O AUTOINCREMENT do AlaSQL não é persistido de forma confiável no
   * engine de localStorage, por isso o ID é calculado manualmente.)
   */
  function proximoId(tabela) {
    var r = alasql('SELECT MAX(id) AS maximo FROM ' + tabela);
    var max = r.length && r[0].maximo ? Number(r[0].maximo) : 0;
    return max + 1;
  }

  function texto(valor) {
    return String(valor === null || valor === undefined ? '' : valor).trim();
  }

  /* ------------------------------------------------------------------ *
   * Usuários
   * ------------------------------------------------------------------ */

  function buscarUsuarioPorLogin(usuario) {
    var r = alasql('SELECT * FROM usuarios WHERE LOWER(usuario) = ?', [texto(usuario).toLowerCase()]);
    return r[0] || null;
  }

  function buscarUsuarioPorId(id) {
    var r = alasql('SELECT id, nome, usuario, criado_em FROM usuarios WHERE id = ?', [Number(id)]);
    return r[0] || null;
  }

  function cadastrarUsuario(dados) {
    var nome = texto(dados.nome);
    var usuario = texto(dados.usuario).toLowerCase();
    var senha = String(dados.senha || '');

    if (nome.length < 3) throw new ErroValidacao('Informe seu nome (mínimo 3 caracteres).', 'nome');
    if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) {
      throw new ErroValidacao('Usuário deve ter de 3 a 30 caracteres (letras, números, ponto, hífen ou sublinhado).', 'usuario');
    }
    if (senha.length < 6) throw new ErroValidacao('A senha deve ter no mínimo 6 caracteres.', 'senha');
    if (buscarUsuarioPorLogin(usuario)) throw new ErroValidacao('Este usuário já está cadastrado.', 'usuario');

    var salt = Utils.gerarSalt();
    var registro = {
      id: proximoId('usuarios'),
      nome: nome,
      usuario: usuario,
      senha_hash: Utils.hashSenha(senha, salt),
      salt: salt,
      criado_em: agora()
    };
    alasql('INSERT INTO usuarios VALUES ?', [registro]);
    return buscarUsuarioPorId(registro.id);
  }

  /** Retorna o usuário (sem dados sensíveis) se as credenciais forem válidas. */
  function autenticar(usuario, senha) {
    var u = buscarUsuarioPorLogin(usuario);
    if (!u) return null;
    if (Utils.hashSenha(String(senha || ''), u.salt) !== u.senha_hash) return null;
    return buscarUsuarioPorId(u.id);
  }

  /* ------------------------------------------------------------------ *
   * Endereço principal (regra interna, já recebe IDs validados)
   * ------------------------------------------------------------------ */

  function marcarPrincipal(enderecoId, clienteId) {
    alasql('UPDATE enderecos SET principal = false WHERE cliente_id = ?', [clienteId]);
    alasql('UPDATE enderecos SET principal = true WHERE id = ?', [enderecoId]);
  }

  /**
   * Garante a regra: todo cliente com endereços possui exatamente um
   * endereço principal. Caso não exista, o mais antigo é promovido.
   */
  function garantirPrincipal(clienteId) {
    var enderecos = alasql('SELECT id, principal FROM enderecos WHERE cliente_id = ? ORDER BY id', [Number(clienteId)]);
    if (!enderecos.length) return;
    var principais = enderecos.filter(function (e) { return e.principal === true; });
    if (principais.length === 1) return;
    marcarPrincipal(principais.length ? principais[0].id : enderecos[0].id, Number(clienteId));
  }

  /* ------------------------------------------------------------------ *
   * Dados de um usuário (clientes e endereços)
   * ------------------------------------------------------------------ */

  /**
   * Retorna a API de clientes/endereços restrita ao usuário informado.
   * @param {number} usuarioId ID do usuário logado
   */
  function doUsuario(usuarioId) {
    usuarioId = Number(usuarioId);
    if (!usuarioId || !buscarUsuarioPorId(usuarioId)) throw new ErroValidacao('Usuário inválido.');

    /* ------------------------------ Clientes ------------------------------ */

    function buscarCliente(id) {
      var r = alasql('SELECT * FROM clientes WHERE id = ? AND usuario_id = ?', [Number(id), usuarioId]);
      return r[0] || null;
    }

    /** Busca o cliente do usuário ou lança erro (protege contra IDs de outro usuário). */
    function exigirCliente(id) {
      var c = buscarCliente(id);
      if (!c) throw new ErroValidacao('Cliente não encontrado.', 'cliente_id');
      return c;
    }

    /**
     * Lista os clientes do usuário com informações do endereço principal e a
     * quantidade de endereços cadastrados.
     */
    function listarClientes() {
      var clientes = alasql('SELECT * FROM clientes WHERE usuario_id = ? ORDER BY nome', [usuarioId]);
      var ids = {};
      clientes.forEach(function (c) { ids[c.id] = true; });
      var enderecos = alasql('SELECT * FROM enderecos').filter(function (e) { return ids[e.cliente_id]; });

      return clientes.map(function (c) {
        var doCliente = enderecos.filter(function (e) { return e.cliente_id === c.id; });
        var principal = doCliente.filter(function (e) { return e.principal === true; })[0] || null;
        return Object.assign({}, c, {
          qtd_enderecos: doCliente.length,
          endereco_principal: principal
        });
      });
    }

    function validarCliente(dados, idAtual) {
      var nome = texto(dados.nome).replace(/\s+/g, ' ');
      var cpf = Utils.somenteDigitos(dados.cpf);
      var nascimento = texto(dados.data_nascimento);
      var telefone = Utils.somenteDigitos(dados.telefone);
      var celular = Utils.somenteDigitos(dados.celular);

      if (nome.length < 3 || nome.indexOf(' ') === -1) {
        throw new ErroValidacao('Informe o nome completo (nome e sobrenome).', 'nome');
      }
      if (!Utils.validarCPF(cpf)) throw new ErroValidacao('CPF inválido.', 'cpf');
      if (!Utils.validarDataNascimento(nascimento)) {
        throw new ErroValidacao('Data de nascimento inválida (não pode ser futura).', 'data_nascimento');
      }
      if (telefone && !Utils.validarTelefone(telefone)) {
        throw new ErroValidacao('Telefone inválido. Use o formato (00) 0000-0000.', 'telefone');
      }
      if (!Utils.validarCelular(celular)) {
        throw new ErroValidacao('Celular inválido. Use o formato (00) 90000-0000.', 'celular');
      }

      // CPF único na carteira do usuário (não revela clientes de outros usuários).
      var duplicado = alasql(
        'SELECT id FROM clientes WHERE cpf = ? AND usuario_id = ? AND id <> ?',
        [cpf, usuarioId, Number(idAtual) || 0]
      );
      if (duplicado.length) throw new ErroValidacao('Já existe um cliente cadastrado com este CPF.', 'cpf');

      return {
        nome: nome,
        cpf: cpf,
        data_nascimento: nascimento,
        telefone: telefone,
        celular: celular
      };
    }

    function salvarCliente(dados) {
      var id = Number(dados.id) || 0;
      if (id) exigirCliente(id);
      var v = validarCliente(dados, id);

      if (id) {
        alasql(
          'UPDATE clientes SET nome = ?, cpf = ?, data_nascimento = ?, telefone = ?, celular = ?, atualizado_em = ? WHERE id = ? AND usuario_id = ?',
          [v.nome, v.cpf, v.data_nascimento, v.telefone, v.celular, agora(), id, usuarioId]
        );
        return buscarCliente(id);
      }

      v.id = proximoId('clientes');
      v.usuario_id = usuarioId;
      v.criado_em = agora();
      v.atualizado_em = v.criado_em;
      alasql('INSERT INTO clientes VALUES ?', [v]);
      return buscarCliente(v.id);
    }

    /** Exclui o cliente e todos os seus endereços. */
    function excluirCliente(id) {
      var c = exigirCliente(id);
      alasql('DELETE FROM enderecos WHERE cliente_id = ?', [c.id]);
      alasql('DELETE FROM clientes WHERE id = ? AND usuario_id = ?', [c.id, usuarioId]);
    }

    /* ------------------------------ Endereços ------------------------------ */

    function listarEnderecos(clienteId) {
      if (!buscarCliente(clienteId)) return [];
      return alasql(
        'SELECT * FROM enderecos WHERE cliente_id = ? ORDER BY id',
        [Number(clienteId)]
      ).sort(function (a, b) {
        // principal sempre no topo
        return (b.principal === true) - (a.principal === true) || a.id - b.id;
      });
    }

    /** Busca o endereço somente se ele pertencer a um cliente do usuário. */
    function buscarEndereco(id) {
      var e = alasql('SELECT * FROM enderecos WHERE id = ?', [Number(id)])[0];
      return e && buscarCliente(e.cliente_id) ? e : null;
    }

    function exigirEndereco(id) {
      var e = buscarEndereco(id);
      if (!e) throw new ErroValidacao('Endereço não encontrado.');
      return e;
    }

    function validarEndereco(dados) {
      var v = {
        cliente_id: Number(dados.cliente_id),
        cep: Utils.somenteDigitos(dados.cep),
        rua: texto(dados.rua),
        numero: texto(dados.numero),
        complemento: texto(dados.complemento),
        bairro: texto(dados.bairro),
        cidade: texto(dados.cidade),
        estado: texto(dados.estado).toUpperCase(),
        pais: texto(dados.pais)
      };

      exigirCliente(v.cliente_id);
      if (!Utils.validarCEP(v.cep)) throw new ErroValidacao('CEP inválido. Use o formato 00000-000.', 'cep');
      if (!v.rua) throw new ErroValidacao('Informe a rua.', 'rua');
      if (!v.bairro) throw new ErroValidacao('Informe o bairro.', 'bairro');
      if (!v.cidade) throw new ErroValidacao('Informe a cidade.', 'cidade');
      if (!v.estado) throw new ErroValidacao('Informe o estado.', 'estado');
      if (!v.pais) throw new ErroValidacao('Informe o país.', 'pais');

      return v;
    }

    /** Define um endereço como principal, desmarcando os demais do cliente. */
    function definirPrincipal(enderecoId) {
      var e = exigirEndereco(enderecoId);
      marcarPrincipal(e.id, e.cliente_id);
    }

    function salvarEndereco(dados) {
      var id = Number(dados.id) || 0;
      var v = validarEndereco(dados);
      var deveSerPrincipal = dados.principal === true;

      if (id) {
        var atual = exigirEndereco(id);
        if (atual.cliente_id !== v.cliente_id) throw new ErroValidacao('Endereço não pertence a este cliente.');
        if (atual.principal === true && !deveSerPrincipal) {
          throw new ErroValidacao(
            'Este é o endereço principal. Para alterá-lo, marque outro endereço como principal.',
            'principal'
          );
        }
        alasql(
          'UPDATE enderecos SET cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, pais = ?, atualizado_em = ? WHERE id = ?',
          [v.cep, v.rua, v.numero, v.complemento, v.bairro, v.cidade, v.estado, v.pais, agora(), id]
        );
      } else {
        // O primeiro endereço do cliente é sempre o principal.
        var qtd = alasql('SELECT COUNT(*) AS qtd FROM enderecos WHERE cliente_id = ?', [v.cliente_id])[0].qtd;
        if (qtd === 0) deveSerPrincipal = true;

        id = proximoId('enderecos');
        v.id = id;
        v.principal = false;
        v.criado_em = agora();
        v.atualizado_em = v.criado_em;
        alasql('INSERT INTO enderecos VALUES ?', [v]);
      }

      if (deveSerPrincipal) marcarPrincipal(id, v.cliente_id);
      garantirPrincipal(v.cliente_id);
      return buscarEndereco(id);
    }

    function excluirEndereco(id) {
      var e = exigirEndereco(id);
      alasql('DELETE FROM enderecos WHERE id = ?', [e.id]);
      garantirPrincipal(e.cliente_id);
    }

    /* ------------------------------ Exportação ------------------------------ */

    /**
     * Exporta somente os dados do usuário (a própria conta, seus clientes e
     * endereços), no mesmo formato aceito pela importação.
     */
    function exportar() {
      var clientes = alasql('SELECT * FROM clientes WHERE usuario_id = ? ORDER BY id', [usuarioId]);
      var ids = {};
      clientes.forEach(function (c) { ids[c.id] = true; });
      return JSON.stringify({
        aplicacao: 'Agrosys CRUD',
        versao: VERSAO_FORMATO,
        escopo: 'usuario',
        exportado_em: agora(),
        usuarios: alasql('SELECT * FROM usuarios WHERE id = ?', [usuarioId]),
        clientes: clientes,
        enderecos: alasql('SELECT * FROM enderecos ORDER BY id').filter(function (e) { return ids[e.cliente_id]; })
      }, null, 2);
    }

    return {
      listarClientes: listarClientes,
      buscarCliente: buscarCliente,
      salvarCliente: salvarCliente,
      excluirCliente: excluirCliente,
      listarEnderecos: listarEnderecos,
      buscarEndereco: buscarEndereco,
      salvarEndereco: salvarEndereco,
      excluirEndereco: excluirEndereco,
      definirPrincipal: definirPrincipal,
      exportar: exportar
    };
  }

  /* ------------------------------------------------------------------ *
   * Banco completo: exportação / importação (tela de Configurações)
   * ------------------------------------------------------------------ */

  /** Exporta o banco inteiro (todas as tabelas, todos os usuários). */
  function exportar() {
    var dados = {
      aplicacao: 'Agrosys CRUD',
      versao: VERSAO_FORMATO,
      escopo: 'completo',
      exportado_em: agora()
    };
    TABELAS.forEach(function (t) {
      dados[t] = alasql('SELECT * FROM ' + t + ' ORDER BY id');
    });
    return JSON.stringify(dados, null, 2);
  }

  function estatisticas() {
    var r = {};
    TABELAS.forEach(function (t) {
      r[t] = alasql('SELECT COUNT(*) AS qtd FROM ' + t)[0].qtd;
    });
    return r;
  }

  /**
   * Valida e normaliza os registros de um backup antes da importação.
   * Lança ErroValidacao em caso de estrutura inválida.
   */
  function validarBackup(dados) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
      throw new ErroValidacao('Arquivo inválido: o conteúdo deve ser um objeto JSON.');
    }
    var possuiTabela = TABELAS.some(function (t) { return Array.isArray(dados[t]); });
    if (!possuiTabela) {
      throw new ErroValidacao('Arquivo inválido: nenhuma das tabelas esperadas (' + TABELAS.join(', ') + ') foi encontrada.');
    }

    var usuarios = (dados.usuarios || []).map(function (u, i) {
      if (!u || !u.usuario || !u.senha_hash || !u.salt) {
        throw new ErroValidacao('Usuário na posição ' + (i + 1) + ' está incompleto.');
      }
      return {
        id: Number(u.id) || i + 1,
        nome: texto(u.nome),
        usuario: texto(u.usuario).toLowerCase(),
        senha_hash: String(u.senha_hash),
        salt: String(u.salt),
        criado_em: u.criado_em || agora()
      };
    });

    // Arquivos antigos (sem usuario_id) têm os clientes atribuídos ao primeiro usuário.
    var idsUsuarios = {};
    usuarios.forEach(function (u) { idsUsuarios[u.id] = true; });
    var donoPadrao = usuarios.length ? Math.min.apply(null, usuarios.map(function (u) { return u.id; })) : null;

    var clientes = (dados.clientes || []).map(function (c, i) {
      if (!c || !c.nome || !c.cpf) throw new ErroValidacao('Cliente na posição ' + (i + 1) + ' está incompleto.');
      var dono = Number(c.usuario_id) || donoPadrao;
      if (!dono) throw new ErroValidacao('Arquivo inválido: existem clientes, mas nenhum usuário para ser o dono deles.');
      if (!idsUsuarios[dono]) {
        throw new ErroValidacao('Arquivo inválido: cliente ' + (c.id || i + 1) + ' pertence a um usuário inexistente (' + dono + ').');
      }
      return {
        id: Number(c.id) || i + 1,
        usuario_id: dono,
        nome: texto(c.nome),
        cpf: Utils.somenteDigitos(c.cpf),
        data_nascimento: texto(c.data_nascimento),
        telefone: Utils.somenteDigitos(c.telefone),
        celular: Utils.somenteDigitos(c.celular),
        criado_em: c.criado_em || agora(),
        atualizado_em: c.atualizado_em || c.criado_em || agora()
      };
    });

    var enderecos = (dados.enderecos || []).map(function (e, i) {
      if (!e || !e.cliente_id) throw new ErroValidacao('Endereço na posição ' + (i + 1) + ' não possui cliente.');
      return {
        id: Number(e.id) || i + 1,
        cliente_id: Number(e.cliente_id),
        cep: Utils.somenteDigitos(e.cep),
        rua: texto(e.rua),
        numero: texto(e.numero),
        complemento: texto(e.complemento),
        bairro: texto(e.bairro),
        cidade: texto(e.cidade),
        estado: texto(e.estado).toUpperCase(),
        pais: texto(e.pais),
        principal: e.principal === true || e.principal === 1 || e.principal === 'true',
        criado_em: e.criado_em || agora(),
        atualizado_em: e.atualizado_em || e.criado_em || agora()
      };
    });

    function verificarUnico(lista, chave, descricao) {
      var vistos = {};
      lista.forEach(function (item) {
        var valor = chave(item);
        if (vistos[valor]) throw new ErroValidacao('Arquivo inválido: ' + descricao + ' duplicado (' + valor + ').');
        vistos[valor] = true;
      });
    }
    verificarUnico(usuarios, function (u) { return u.id; }, 'ID de usuário');
    verificarUnico(usuarios, function (u) { return u.usuario; }, 'usuário');
    verificarUnico(clientes, function (c) { return c.id; }, 'ID de cliente');
    verificarUnico(clientes, function (c) { return 'usuário ' + c.usuario_id + ' / CPF ' + c.cpf; }, 'CPF');
    verificarUnico(enderecos, function (e) { return e.id; }, 'ID de endereço');

    var idsClientes = {};
    clientes.forEach(function (c) { idsClientes[c.id] = true; });
    enderecos.forEach(function (e) {
      if (!idsClientes[e.cliente_id]) {
        throw new ErroValidacao('Arquivo inválido: endereço ' + e.id + ' referencia um cliente inexistente (' + e.cliente_id + ').');
      }
    });

    return { usuarios: usuarios, clientes: clientes, enderecos: enderecos };
  }

  /**
   * Substitui todo o conteúdo do banco pelo conteúdo do JSON informado.
   * @param {string} json conteúdo do arquivo
   * @returns {object} quantidade de registros importados por tabela
   */
  function importar(json) {
    var dados;
    try {
      dados = JSON.parse(json);
    } catch (e) {
      throw new ErroValidacao('O arquivo selecionado não é um JSON válido.');
    }

    var limpos = validarBackup(dados);

    TABELAS.forEach(function (t) {
      alasql('DELETE FROM ' + t);
      if (limpos[t].length) alasql('INSERT INTO ' + t + ' SELECT * FROM ?', [limpos[t]]);
    });

    // Corrige eventuais inconsistências de endereço principal.
    limpos.clientes.forEach(function (c) { garantirPrincipal(c.id); });

    return estatisticas();
  }

  return {
    ErroValidacao: ErroValidacao,
    iniciar: iniciar,
    // usuários
    cadastrarUsuario: cadastrarUsuario,
    autenticar: autenticar,
    buscarUsuarioPorId: buscarUsuarioPorId,
    // clientes e endereços (sempre restritos a um usuário)
    doUsuario: doUsuario,
    // banco completo
    exportar: exportar,
    importar: importar,
    estatisticas: estatisticas
  };
})();
