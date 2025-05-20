### 3) JavaScript completo (arquivo `script.js`)

```js
// DADOS SIMULADOS NO LOCAL STORAGE
// Chaves:
// "voluntarios" => array de voluntários cadastrados
// "usuarioLogado" => nome do usuário logado (string)
// "escala" => array com escalas dos domingos

// ADMIN: senha fixa e telefone para 2FA
const ADMIN_SENHA2FA = "*98As6532";
const ADMIN_TELEFONE = "11987648493";

// CONTROLE DE PÁGINAS E ELEMENTOS
const loginSection = document.getElementById("login");
const cadastroSection = document.getElementById("cadastro");
const confirm2faSection = document.getElementById("confirmacao2fa");
const appSection = document.getElementById("app");

const formLogin = document.getElementById("formLogin");
const formCadastro = document.getElementById("formCadastroLogin");

const linkParaCadastro = document.getElementById("linkParaCadastro");
const linkParaLogin = document.getElementById("linkParaLogin");

const inputTelefone2fa = document.getElementById("inputTelefone2fa");
const inputSenha2fa = document.getElementById("inputSenha2fa");
const btnConfirmar2fa = document.getElementById("btnConfirmar2fa");

const navBar = document.getElementById("navBar");

const sectionEscalas = document.getElementById("escalas");
const listaEscalas = document.getElementById("listaEscalas");

const sectionRelatorios = document.getElementById("relatorios");
const relatorioResultado = document.getElementById("relatorioResultado");

const sectionControle = document.getElementById("controle");
const tabelaVolsBody = document.querySelector("#tblVols tbody");

const sectionEscalasGerais = document.getElementById("escalasGerais");
const listaEscalasGerais = document.getElementById("listaEscalasGerais");

const sectionRelatoriosGerais = document.getElementById("relatoriosGerais");
const selTurmaRel = document.getElementById("selTurmaRel");
const relatorioTurma = document.getElementById("relatorioTurma");

// ESTADO GLOBAL
let voluntarios = [];
let escala = [];
let usuarioLogado = null;
let usuarioLogadoObj = null;

// -------------------- UTILITÁRIOS --------------------

function salvarVoluntarios() {
  localStorage.setItem("voluntarios", JSON.stringify(voluntarios));
}

function carregarVoluntarios() {
  const data = localStorage.getItem("voluntarios");
  voluntarios = data ? JSON.parse(data) : [];
}

function salvarEscala() {
  localStorage.setItem("escala", JSON.stringify(escala));
}

function carregarEscala() {
  const data = localStorage.getItem("escala");
  escala = data ? JSON.parse(data) : [];
}

function salvarUsuarioLogado(nome) {
  localStorage.setItem("usuarioLogado", nome);
}

function carregarUsuarioLogado() {
  return localStorage.getItem("usuarioLogado");
}

function limparUsuarioLogado() {
  localStorage.removeItem("usuarioLogado");
}

function mostrarMensagem(msg) {
  alert(msg);
}

// Gera um ID único simples para novos voluntários
function gerarID() {
  return Math.random().toString(36).substr(2, 9);
}

// Filtra escalas para usuário
function getEscalasUsuario(nome) {
  return escala.filter(e => e.nome === nome);
}

// Filtra escalas gerais por turma e função
function getEscalasFiltradas(turma = "", funcao = "") {
  return escala.filter(e => {
    return (!turma || e.turma === turma) && (!funcao || e.funcao === funcao);
  });
}

// Valida telefone simples (apenas números)
function validarTelefone(tel) {
  return /^\d{10,11}$/.test(tel);
}

// -------------------- NAVEGAÇÃO ENTRE TELAS --------------------

function mostrarTela(tela) {
  loginSection.style.display = "none";
  cadastroSection.style.display = "none";
  confirm2faSection.style.display = "none";
  appSection.style.display = "none";

  switch (tela) {
    case "login":
      loginSection.style.display = "block";
      break;
    case "cadastro":
      cadastroSection.style.display = "block";
      break;
    case "2fa":
      confirm2faSection.style.display = "block";
      break;
    case "app":
      appSection.style.display = "flex";
      break;
  }
}

// -------------------- LOGIN E CADASTRO --------------------

linkParaCadastro.addEventListener("click", e => {
  e.preventDefault();
  mostrarTela("cadastro");
});

linkParaLogin.addEventListener("click", e => {
  e.preventDefault();
  mostrarTela("login");
});

formCadastro.addEventListener("submit", e => {
  e.preventDefault();

  const nome = document.getElementById("cadNome").value.trim();
  const turma = document.getElementById("cadTurma").value;
  const funcao = document.getElementById("cadFuncao").value;
  const contato = document.getElementById("cadContato").value.trim();
  const domingos = Number(document.getElementById("cadDomingos").value);
  const nascimento = document.getElementById("cadNascimento").value;
  const senha = document.getElementById("cadSenha").value;

  if (!nome || !turma || !funcao || !contato || !nascimento || !senha || !domingos) {
    mostrarMensagem("Preencha todos os campos corretamente!");
    return;
  }

  if (!validarTelefone(contato)) {
    mostrarMensagem("Telefone inválido! Use somente números com DDD (exemplo: 11987654321).");
    return;
  }

  if (voluntarios.some(v => v.nome.toLowerCase() === nome.toLowerCase())) {
    mostrarMensagem("Usuário já cadastrado com este nome.");
    return;
  }

  voluntarios.push({
    id: gerarID(),
    nome,
    turma,
    funcao,
    contato,
    domingos,
    nascimento,
    senha,
    escalasFeitas: 0,
    trocasFeitas: 0,
    trocasRecebidas: 0
  });

  salvarVoluntarios();
  mostrarMensagem("Cadastro realizado com sucesso! Faça login.");
  formCadastro.reset();
  mostrarTela("login");
});

formLogin.addEventListener("submit", e => {
  e.preventDefault();

  const nome = document.getElementById("loginNome").value.trim();
  const senha = document.getElementById("loginSenha").value;

  const user = voluntarios.find(v => v.nome.toLowerCase() === nome.toLowerCase());

  if (!user) {
    mostrarMensagem("Usuário não encontrado.");
    return;
  }

  if (user.senha !== senha) {
    mostrarMensagem("Senha incorreta.");
    return;
  }

  usuarioLogado = user.nome;
  usuarioLogadoObj = user;

  // Se admin, ir para 2FA, senão app direto
  if (user.funcao.toLowerCase() === "admin") {
    mostrarTela("2fa");
  } else {
    salvarUsuarioLogado(usuarioLogado);
    montarInterfaceUsuario();
    mostrarTela("app");
  }
});

// -------------------- 2FA ADMIN --------------------

btnConfirmar2fa.addEventListener("click", () => {
  const telefone = inputTelefone2fa.value.trim();
  const senha2fa = inputSenha2fa.value;

  if (telefone !== ADMIN_TELEFONE || senha2fa !== ADMIN_SENHA2FA) {
    mostrarMensagem("Telefone ou senha secreta incorretos.");
    return;
  }

  salvarUsuarioLogado(usuarioLogado);
  montarInterfaceUsuario();
  mostrarTela("app");
});

// -------------------- MONTAR INTERFACE --------------------

function montarInterfaceUsuario() {
  // Limpar nav
  navBar.innerHTML = "";

  // Carregar dados
  carregarVoluntarios();
  carregarEscala();

  // Mostrar abas baseadas na função
  if (!usuarioLogadoObj) {
    usuarioLogadoObj = voluntarios.find(v => v.nome === usuarioLogado);
  }
  const funcao = usuarioLogadoObj.funcao.toLowerCase();

  let abas = [];

  if (funcao === "admin") {
    abas = [
      { id: "controle", label: "Controle" },
      { id: "escalasGerais", label: "Escalas Gerais" },
      { id: "relatoriosGerais", label: "Relatórios Gerais" }
    ];
  } else {
    abas = [
      { id: "escalas", label: "Minhas Escalas" },
      { id: "relatorios", label: "Meu Relatório" }
    ];
  }

  // Criar botões de navegação
  abas.forEach((aba, idx) => {
    const btn = document.createElement("button");
    btn.textContent = aba.label;
    btn.dataset.aba = aba.id;
    if (idx === 0) btn.classList.add("active");
    btn.addEventListener("click", () => {
      mostrarAba(aba.id);
      navBar.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
    navBar.appendChild(btn);
  });

  // Mostrar a primeira aba automaticamente
  mostrarAba(abas[0].id);

  // Atualizar conteúdos das abas
  atualizarConteudoAbas();
}

// Alterna abas visíveis
function mostrarAba(id) {
  document.querySelectorAll(".aba").forEach(sec => {
    sec.style.display = sec.id === id ? "block" : "none";
  });
}

// Atualiza conteúdos das abas
function atualizarConteudoAbas() {
  const funcao = usuarioLogadoObj.funcao.toLowerCase();

  if (funcao === "admin") {
    preencherTabelaControle();
    preencherEscalasGerais();
    preencherRelatorioGeral();
  } else {
    preencherMinhasEscalas();
    preencherRelatorioPessoal();
  }
}

// -------------------- FUNÇÕES DO USUÁRIO --------------------

// Preenche escalas do voluntário
function preencherMinhasEscalas() {
  listaEscalas.innerHTML = "";

  const escalasUsuario = getEscalasUsuario(usuarioLogado);

  if (escalasUsuario.length === 0) {
    listaEscalas.innerHTML = "<p>Você não tem escalas atribuídas.</p>";
    return;
  }

  escalasUsuario.forEach(esc => {
    const card = document.createElement("div");
    card.classList.add("escala-card");
    card.textContent = `Domingo: ${esc.data} | Turma: ${esc.turma} | Função: ${esc.funcao} | Status: ${esc.status || "Confirmar"}`;
    card.style.cursor = esc.status === "Confirmado" ? "default" : "pointer";
    if (esc.status !== "Confirmado") {
      card.addEventListener("click", () => {
        esc.status = "Confirmado";
        usuarioLogadoObj.escalasFeitas++;
        salvarEscala();
        salvarVoluntarios();
        preencherMinhasEscalas();
        mostrarMensagem("Escala confirmada! Obrigado.");
      });
    }
    listaEscalas.appendChild(card);
  });
}

// Preenche relatório pessoal (simples)
function preencherRelatorioPessoal() {
  relatorioResultado.textContent = `
Nome: ${usuarioLogadoObj.nome}
Turma: ${usuarioLogadoObj.turma}
Função: ${usuarioLogadoObj.funcao}

Escalas confirmadas: ${usuarioLogadoObj.escalasFeitas}
Trocas feitas: ${usuarioLogadoObj.trocasFeitas}
Trocas recebidas: ${usuarioLogadoObj.trocasRecebidas}
  `.trim();
}

// -------------------- FUNÇÕES ADMIN --------------------

// Preenche tabela de controle
function preencherTabelaControle() {
  tabelaVolsBody.innerHTML = "";

  voluntarios.forEach(v => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${v.nome}</td>
      <td>${v.turma}</td>
      <td>${v.funcao}</td>
      <td>${v.contato}</td>
      <td><button class="btn-reset" data-id="${v.id}">Resetar Senha</button></td>
      <td><button class="btn-remover" data-id="${v.id}">Remover</button></td>
    `;

    tabelaVolsBody.appendChild(tr);
  });

  // Eventos botões resetar senha
  tabelaVolsBody.querySelectorAll(".btn-reset").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const v = voluntarios.find(x => x.id === id);
      if (!v) return;
      v.senha = "1234";
      salvarVoluntarios();
      mostrarMensagem(`Senha de ${v.nome} resetada para '1234'`);
    };
  });

  // Eventos botões remover
  tabelaVolsBody.querySelectorAll(".btn-remover").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      if (confirm("Tem certeza que quer remover este voluntário?")) {
        voluntarios = voluntarios.filter(v => v.id !== id);
        salvarVoluntarios();
        preencherTabelaControle();
        mostrarMensagem("Voluntário removido.");
      }
    };
  });
}

// Preenche escalas gerais
function preencherEscalasGerais() {
  listaEscalasGerais.innerHTML = "";

  if (escala.length === 0) {
    listaEscalasGerais.innerHTML = "<p>Nenhuma escala cadastrada.</p>";
    return;
  }

  escala.forEach(e => {
    const card = document.createElement("div");
    card.classList.add("escala-card");
    card.textContent = `Domingo: ${e.data} | Nome: ${e.nome} | Turma: ${e.turma} | Função: ${e.funcao} | Status: ${e.status || "Pendente"}`;
    listaEscalasGerais.appendChild(card);
  });
}

// Preenche relatório geral
function preencherRelatorioGeral() {
  let turmaFiltro = selTurmaRel.value;

  let relatorio = voluntarios
    .filter(v => !turmaFiltro || v.turma === turmaFiltro)
    .map(v => {
      return `Nome: ${v.nome}
Turma: ${v.turma}
Função: ${v.funcao}
Escalas confirmadas: ${v.escalasFeitas}
Trocas feitas: ${v.trocasFeitas}
Trocas recebidas: ${v.trocasRecebidas}
---------------------------`;
    })
    .join("\n");

  if (!relatorio) relatorio = "Nenhum voluntário encontrado para o filtro selecionado.";

  relatorioTurma.textContent = relatorio;
}

// Atualiza relatório ao mudar filtro
selTurmaRel.addEventListener("change", preencherRelatorioGeral);


function inicializar() {
  carregarVoluntarios();
  carregarEscala();

  const nomeLogado = carregarUsuarioLogado();
  if (nomeLogado) {
    usuarioLogado = nomeLogado;
    usuarioLogadoObj = voluntarios.find(v => v.nome === nomeLogado);
    montarInterfaceUsuario();
    mostrarTela("app");
  } else {
    mostrarTela("login");
  }
}

inicializar();
