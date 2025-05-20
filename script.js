// — Cria admin padrão se não existir —
let vs = JSON.parse(localStorage.getItem('voluntarios')||'[]');
if (!vs.find(u=>u.role==='Admin')) {
  vs.push({ nome:'admin', senha:'*98As6532', telefone:'11987648493', turma:'-', funcao:'Admin', role:'Admin' });
  localStorage.setItem('voluntarios', JSON.stringify(vs));
}

// — Helpers de DOM —
const navBar = document.getElementById('navBar'),
      loginSec = document.getElementById('login'),
      appDiv   = document.getElementById('app');
const sections = id=>document.getElementById(id);
function show(id){
  document.querySelectorAll('.aba').forEach(s=>s.classList.remove('ativa'));
  sections(id).classList.add('ativa');
  if (id==='controle') montarControle();
  if (id==='escalas') montarEscalas();
  if (id==='escalasGerais') montarEscalasGerais();
  if (id==='relatorios') montarRelatorio();
  if (id==='relatoriosGerais') montarRelatorioGerais();
}

// — Login/Cadastro UI toggle —
document.getElementById('linkParaCadastro').onclick = e=>{
  e.preventDefault();
  formLogin.style.display='none'; formCadastroLogin.style.display='block';
};
document.getElementById('linkParaLogin').onclick = e=>{
  e.preventDefault();
  formCadastroLogin.style.display='none'; formLogin.style.display='block';
};

// — Cadastro —
formCadastroLogin.onsubmit = e=>{
  e.preventDefault();
  const nome= cadNome.value.trim(),
        turma= cadTurma.value,
        func= cadFuncao.value,
        contato= cadContato.value.trim(),
        dom= parseInt(cadDomingos.value),
        nasc= cadNascimento.value,
        sen= cadSenha.value;
  if(!nome||!turma||!func||!contato||!dom||!nasc||!sen){
    return alert('Preencha todos os campos!');
  }
  let vs = JSON.parse(localStorage.getItem('voluntarios')||'[]');
  if(vs.some(v=>v.nome.toLowerCase()===nome.toLowerCase())){
    return alert('Nome já cadastrado!');
  }
  vs.push({ nome,turma,funcao:func,contato,domingos:dom,nascimento:nasc,senha:sen,role:'User' });
  localStorage.setItem('voluntarios',JSON.stringify(vs));
  alert('Cadastro OK! Faça login.');
  formCadastroLogin.reset();
  formCadastroLogin.style.display='none';
  formLogin.style.display='block';
};

// — Login com autenticação em duas etapas para Admin —
formLogin.onsubmit = e=>{
  e.preventDefault();
  const nome= loginNome.value.trim(), sen= loginSenha.value;
  vs = JSON.parse(localStorage.getItem('voluntarios')||'[]');
  const u = vs.find(v=>v.nome===nome&&v.senha===sen);
  if(!u){ alert('Credenciais inválidas'); return; }
  if(u.role==='Admin'){
    const codigo = prompt("Digite o código de verificação enviado para seu telefone (11987648493):");
    if(codigo !== '998763'){ alert('Código incorreto.'); return; }
  }
  sessionStorage.setItem('currentUser',JSON.stringify(u));
  loginSec.style.display='none'; appDiv.style.display='block';
  buildNav(u.role);
  show(u.role==='Admin'?'controle':'escalas');
};

// — Logout —
function logout(){
  sessionStorage.removeItem('currentUser');
  appDiv.style.display='none'; loginSec.style.display='block';
}

// — Monta Nav Dinâmica —
function buildNav(role){
  navBar.innerHTML = '';
  function btn(txt,sec,cls=''){ return `<button class="${cls}" onclick="show('${sec}')">${txt}</button>`; }
  if(role==='Admin'){
    navBar.innerHTML += btn('Controle','controle')+
                        btn('Escala Geral','escalasGerais')+
                        btn('Relatórios Gerais','relatoriosGerais');
  } else {
    navBar.innerHTML += btn('Minhas Escalas','escalas')+
                        btn('Meu Relatório','relatorios');
  }
  navBar.innerHTML += btn('Sair','','logout','logout')  
                   .replace('onclick="show', 'onclick="logout');
}

// — Inicialização —
logout();
