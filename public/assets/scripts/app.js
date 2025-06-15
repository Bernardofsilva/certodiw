document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/items';
    const FAVORITOS_URL = 'http://localhost:3000/favorites';
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    const listaItens = document.getElementById('lista-itens');
    const campoPesquisa = document.getElementById('campo-pesquisa');
    const btnPesquisar = document.getElementById('btn-pesquisar');
    const btnLimpar = document.getElementById('btn-limpar');
    const selectGenero = document.getElementById('genero');

    if (usuarioLogado) {
        document.getElementById('menu-login').style.display = 'none';
        document.getElementById('menu-logout').style.display = 'inline';
        document.getElementById('menu-favoritos').style.display = 'inline';
        if (usuarioLogado.admin) {
            document.getElementById('menu-cadastro').style.display = 'inline';
        } else {
            document.getElementById('menu-cadastro').style.display = 'none';
        }
    }

    document.getElementById('menu-logout')?.addEventListener('click', () => {
        sessionStorage.removeItem('usuarioLogado');
        window.location.reload();
    });

    function carregarFilmes(filtroGenero = 'todos', textoPesquisa = '') {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                listaItens.innerHTML = '';

                if (usuarioLogado) {
                    fetch(`${FAVORITOS_URL}?userId=${usuarioLogado.id}`)
                        .then(response => response.json())
                        .then(favs => {
                            const favoritos = favs.length > 0 ? favs[0].favoritos : [];
                            renderizarFilmes(data, favoritos, filtroGenero, textoPesquisa);
                        });
                } else {
                    renderizarFilmes(data, [], filtroGenero, textoPesquisa);
                }
            });
    }

    function renderizarFilmes(data, favoritos, filtroGenero, textoPesquisa) {
        let filmesFiltrados = data;

        if (filtroGenero !== 'todos') {
            filmesFiltrados = filmesFiltrados.filter(f => f.genero === filtroGenero);
        }

        if (textoPesquisa.trim() !== '') {
            filmesFiltrados = filmesFiltrados.filter(f =>
                f.titulo.toLowerCase().includes(textoPesquisa.toLowerCase()) ||
                f.descricao.toLowerCase().includes(textoPesquisa.toLowerCase())
            );
        }

        filmesFiltrados.forEach(filme => {
            const card = document.createElement('div');
            card.classList.add('card-item');

            card.innerHTML = `
                <img src="${filme.imagem}" alt="${filme.titulo}">
                <h3>${filme.titulo}</h3>
                <p>${filme.descricao}</p>
                ${usuarioLogado ? `<button class="btn-favorito" data-id="${filme.id}">
                    ${favoritos.includes(filme.id) ? '❤️' : '🤍'}
                </button>` : ''}
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-favorito')) {
                    sessionStorage.setItem('idDetalhe', filme.id);
                    window.location.href = 'detalhes.html';
                }
            });

            if (usuarioLogado) {
                card.querySelector('.btn-favorito').addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorito(filme.id, e.target);
                });
            }

            listaItens.appendChild(card);
        });
    }

    function toggleFavorito(idFilme, btn) {
        fetch(`${FAVORITOS_URL}?userId=${usuarioLogado.id}`)
            .then(res => res.json())
            .then(favs => {
                let favsDoUsuario = favs[0];

                if (!favsDoUsuario) {
                    favsDoUsuario = { userId: usuarioLogado.id, favoritos: [] };
                    return fetch(FAVORITOS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(favsDoUsuario)
                    }).then(response => response.json());
                }

                return Promise.resolve(favsDoUsuario);
            })
            .then(favsDoUsuario => {
                const jaFavoritado = favsDoUsuario.favoritos.includes(idFilme);

                if (jaFavoritado) {
                    favsDoUsuario.favoritos = favsDoUsuario.favoritos.filter(id => id !== idFilme);
                    btn.textContent = '🤍';
                } else {
                    favsDoUsuario.favoritos.push(idFilme);
                    btn.textContent = '❤️';
                }

                return fetch(`${FAVORITOS_URL}/${favsDoUsuario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(favsDoUsuario)
                });
            })
            .then(() => {
                carregarFilmes(selectGenero.value, campoPesquisa.value);
            });
    }

    selectGenero.addEventListener('change', () => {
        carregarFilmes(selectGenero.value, campoPesquisa.value);
    });

    btnPesquisar.addEventListener('click', () => {
        carregarFilmes(selectGenero.value, campoPesquisa.value);
    });

    btnLimpar.addEventListener('click', () => {
        campoPesquisa.value = '';
        selectGenero.value = 'todos';
        carregarFilmes();
    });

    carregarFilmes();
});
