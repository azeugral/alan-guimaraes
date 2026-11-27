(function () {
  var d = document;
  var WA = '5542999785113';

  /* ---------- hero: o esboço do polvo vira o mural pintado (MP4 em loop; versão 4:5 no celular em pé) ---------- */
  var hero = d.querySelector('.hero'), v = d.querySelector('.h-vid');
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cel = window.matchMedia('(max-width:860px) and (min-height:521px)');
  function fonte() {
    var n = cel.matches ? 'cel' : 'pc';
    v.poster = 'img/hero/' + n + '.webp';
    if (reduz) return;
    if (v.dataset.n === n) return;
    v.dataset.n = n; v.src = 'img/hero/' + n + '.mp4';
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  fonte();
  cel.addEventListener ? cel.addEventListener('change', fonte) : cel.addListener(fonte);
  d.addEventListener('visibilitychange', function () { if (!d.hidden && !reduz) v.play().catch(function () {}); });
  requestAnimationFrame(function () { hero.classList.add('pronto'); });

  /* ---------- topo e gaveta ---------- */
  var topo = d.getElementById('topo'), gav = d.getElementById('gaveta'), burger = d.getElementById('burger');
  function rolar() { topo.classList.toggle('solido', scrollY > 30 || !gav.hidden); }
  addEventListener('scroll', rolar, { passive: true }); rolar();
  function gaveta(a) { gav.hidden = !a; burger.setAttribute('aria-expanded', a); d.body.style.overflow = a ? 'hidden' : ''; rolar(); }
  burger.addEventListener('click', function () { gaveta(gav.hidden); });
  gav.addEventListener('click', function (e) { if (e.target.closest('a')) gaveta(false); });

  /* ---------- entrada ao rolar ---------- */
  var io = new IntersectionObserver(function (es) {
    var meio = innerWidth / 2;
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var r = e.boundingClientRect, dist = Math.abs(r.left + r.width / 2 - meio) / meio;
      e.target.style.transitionDelay = Math.round(Math.min(1, dist) * 240) + 'ms';
      e.target.classList.add('vis'); io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  function observar() { d.querySelectorAll('.rev:not(.vis),.item:not(.vis):not(.sai)').forEach(function (el) { io.observe(el); }); }

  /* ---------- trabalhos ---------- */
  var grade = d.getElementById('grade'), mais = d.getElementById('mais'), filtro = 'todos';
  var passoN = 24, limite = passoN;
  PECAS.forEach(function (p, i) {
    var f = d.createElement('figure'); f.className = 'item'; f.tabIndex = 0; f.dataset.i = i;
    f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Ampliar: ' + p.l);
    f.innerHTML = '<div class="fr"><img src="img/p/' + p.c + '.webp" alt="' + p.l + ', tatuagem de Alan Guimarães" width="720" height="900" draggable="false"></div>';
    grade.appendChild(f);
  });
  var itens = [].slice.call(grade.children);
  function visiveis() { return itens.filter(function (el) { return filtro === 'todos' || PECAS[el.dataset.i].t === filtro; }); }
  function aplicar() {
    var vs = visiveis();
    itens.forEach(function (el) { el.classList.add('sai'); });
    vs.forEach(function (el, k) { if (k < limite) el.classList.remove('sai'); });
    mais.hidden = vs.length <= limite;
    observar();
  }
  aplicar();
  d.querySelectorAll('.filtros button').forEach(function (b) {
    b.addEventListener('click', function () {
      d.querySelectorAll('.filtros button').forEach(function (x) { x.classList.toggle('on', x === b); });
      filtro = b.dataset.f; limite = passoN; aplicar();
      itens.forEach(function (el) { if (!el.classList.contains('sai')) el.classList.add('vis'); });
    });
  });
  mais.addEventListener('click', function () { limite += passoN; aplicar(); });

  /* ---------- formulário: campos de tattoo somem para piercing e mural ---------- */
  var form = d.getElementById('form'), erro = d.getElementById('erro');
  function servico() {
    var s = form.servico.value, tat = s === 'Tatuagem';
    d.getElementById('f-estilo').hidden = !tat;
    d.getElementById('f-cob').hidden = !tat;
    d.getElementById('f-tam').hidden = !tat;
    d.getElementById('l-local').textContent = s === 'Piercing' ? 'Qual piercing / onde' : s === 'Tatuagem' ? 'Local do corpo' : 'Onde fica a parede';
    form.local.placeholder = s === 'Piercing' ? 'Ex.: nostril, daith, umbigo' : s === 'Tatuagem' ? 'Ex.: antebraço' : 'Ex.: fachada de loja em Rebouças';
  }
  form.addEventListener('change', function (e) { if (e.target.name === 'servico') servico(); });
  function marcaServico(s) { var r = form.querySelector('input[name="servico"][value="' + s + '"]'); if (r) { r.checked = true; servico(); } }
  d.querySelectorAll('[data-servico]').forEach(function (a) { a.addEventListener('click', function () { marcaServico(a.dataset.servico); }); });

  /* lightbox */
  var lb = d.getElementById('lb'), lbImg = d.getElementById('lbImg'), atualLb = 0, lista = [];
  function abrirLb(i) { lista = visiveis().map(function (el) { return +el.dataset.i; }); atualLb = Math.max(0, lista.indexOf(i)); mostrar(); lb.hidden = false; d.body.style.overflow = 'hidden'; }
  function mostrar() { var p = PECAS[lista[atualLb]]; d.getElementById('lbTit').textContent = p.l; lbImg.src = 'img/g/' + p.c + '.webp'; lbImg.alt = p.l + ', tatuagem de Alan Guimarães'; }
  function passo(n) { atualLb = (atualLb + n + lista.length) % lista.length; mostrar(); }
  function fechar() { lb.hidden = true; d.body.style.overflow = ''; }
  grade.addEventListener('click', function (e) { var f = e.target.closest('.item'); if (f) abrirLb(+f.dataset.i); });
  grade.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { var f = e.target.closest('.item'); if (f) { e.preventDefault(); abrirLb(+f.dataset.i); } } });
  d.getElementById('lbX').onclick = fechar;
  d.getElementById('lbP').onclick = function () { passo(-1); };
  d.getElementById('lbS').onclick = function () { passo(1); };
  d.getElementById('lbQuero').onclick = function () {
    var p = PECAS[lista[atualLb]];
    marcaServico('Tatuagem');
    d.getElementById('ideia').value = 'Quero uma peça como esta do portfólio: ' + p.l + '.';
    var mapa = { floral: 'Floral e fine line', religiosa: 'Religiosa', lettering: 'Lettering', pb: 'Preto e cinza', traco: 'Traço e old school', delicadas: 'Delicada' };
    var r = form.querySelector('input[name="estilo"][value="' + mapa[p.t] + '"]'); if (r) r.checked = true;
    fechar();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  lb.addEventListener('click', function (e) { if (e.target === lb) fechar(); });
  addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') fechar(); if (e.key === 'ArrowLeft') passo(-1); if (e.key === 'ArrowRight') passo(1);
  });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 45) passo(dx < 0 ? 1 : -1); tx = null; });

  /* ---------- pedido pelo WhatsApp ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form), nomeC = (f.get('nome') || '').trim(), s = f.get('servico');
    if (!nomeC) { erro.hidden = false; form.nome.focus(); return; }
    erro.hidden = true;
    var local = (f.get('local') || '').trim() || 'a definir';
    var l = ['Olá, Alan! Sou *' + nomeC + '* e quero um orçamento.', '', '*Serviço:* ' + s];
    if (s === 'Tatuagem') l.push('*Estilo:* ' + f.get('estilo'), '*Cobertura:* ' + f.get('cob'), '*Local do corpo:* ' + local, '*Tamanho:* ' + f.get('tamanho'));
    else if (s === 'Piercing') l.push('*Piercing:* ' + local);
    else l.push('*Parede:* ' + local);
    l.push('*Onde prefiro:* ' + f.get('cidade'), '*Disponibilidade:* ' + f.get('quando'));
    var ideia = (f.get('ideia') || '').trim();
    if (ideia) l.push('', '*Ideia:* ' + ideia);
    if (s !== 'Piercing') l.push('', 'Vou mandar a referência e a foto do local aqui na conversa.');
    l.push('(pedido enviado pelo site)');
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(l.join('\n')), '_blank', 'noopener');
  });
})();
