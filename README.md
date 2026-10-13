# Agrosys: Cadastro de Clientes e Endereços

Sistema web simples para cadastrar clientes e os endereços deles. Cada usuário tem a sua conta e vê só os próprios clientes.

Projeto feito para a **Avaliação Técnica Agrosys**.

---

## Como abrir

1. Descompacte a pasta.
2. Dê dois cliques no arquivo **`index.html`**.

Não precisa instalar nada nem ter internet. Funciona no Chrome, Edge ou Firefox.

---

## Primeiro acesso

O sistema começa vazio. Escolha uma das opções:

**Opção 1: criar sua conta**
Na tela de login, clique na aba **Cadastrar**, preencha os dados e depois entre com seu usuário e senha.

**Opção 2: usar os dados de exemplo**
1. Na tela de login, clique em **Configurações**.
2. Selecione o arquivo **`banco-exemplo.json`** (ou arraste para a área indicada).
3. Clique em **Importar banco de dados** e confirme.

Depois é só entrar com um destes usuários:

| Usuário     | Senha      | Clientes |
|-------------|------------|----------|
| `admin`     | `admin123` | 4        |
| `avaliador` | `agrosys`  | 2        |

---

## O que dá para fazer

### Clientes
- Ver a lista de clientes e buscar por nome, CPF, telefone ou cidade.
- Cadastrar um cliente com **nome completo, CPF, data de nascimento, telefone e celular**.
- Editar ou excluir um cliente. Ao excluir um cliente, os endereços dele também são apagados.

### Endereços
- Clique no ícone de 📍 (ou em **Endereços**, no celular) ao lado do cliente.
- Cadastre um ou mais endereços. Ao digitar o CEP, rua, bairro, cidade e estado são preenchidos automaticamente (essa parte precisa de internet).
- Um endereço é sempre o **principal**. O primeiro já entra como principal. Para trocar, clique em **Tornar principal** em outro endereço.

### Banco de dados
- **Exportar** (botão no topo, depois de entrar): baixa um arquivo `.json` com os seus dados.
- **Configurações** (na tela de login): importa um banco pronto ou exporta o banco completo.

---

## Regras importantes

- Não existem dois usuários com o mesmo nome de usuário.
- Você não pode ter dois clientes com o mesmo CPF.
- Cada usuário só vê e altera **os próprios clientes**. Os dados de um não aparecem para o outro.
- Todo cliente com endereço tem exatamente **um endereço principal**.

---

## Avisos na tela

O sistema mostra o que aconteceu a cada ação:

- 🟢 **Verde**: algo foi cadastrado.
- 🔵 **Azul**: algo foi alterado.
- 🔴 **Vermelho**: algo foi excluído.
- 🟡 **Amarelo**: atenção (por exemplo, CEP não encontrado).

Antes de excluir, o sistema sempre pede confirmação. Se você fechar um formulário sem salvar, ele avisa que as alterações serão perdidas.

---

## Funciona no celular?

Sim. No celular a lista de clientes aparece em cartões e os formulários abrem em tela cheia.

---

## Onde ficam os dados?

No próprio navegador (localStorage). Por isso:

- Se você trocar de navegador ou de computador, os dados não vão junto. Use **Exportar** para guardar uma cópia e **Configurações → Importar** para restaurar.
- Limpar os dados do navegador apaga o banco.

---

## Dúvidas comuns

**Esqueci a senha. E agora?**
Não existe recuperação de senha. Crie uma conta nova ou importe o `banco-exemplo.json` de novo.

**O CEP não preencheu sozinho.**
A busca precisa de internet. Sem conexão, é só preencher o endereço à mão.

**Quero começar do zero.**
Limpe os dados do site no navegador (F12 → Application → Local Storage). Para voltar só aos dados de exemplo, importe o `banco-exemplo.json` de novo.

---

## Feito com

HTML, CSS e JavaScript, com [AlaSQL](https://github.com/AlaSQL/alasql) (banco de dados SQL no navegador), Bootstrap 5 e jQuery.

Detalhes técnicos e instruções para o avaliador estão no arquivo **`INFO.txt`**.
