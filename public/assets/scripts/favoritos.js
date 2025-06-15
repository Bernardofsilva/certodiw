document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/items';
    const FAVORITOS_URL = 'http://localhost:3000/favorites';
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    const listaFavoritos = document.getElementById('lista-favoritos');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');

    if (!usuarioLogado) {
        alert('Você precisa estar logado para visualizar os favoritos.');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('logout').addEventListener('click', () => {
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html';
    });

    document.querySelector('.close-modal')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    function carregarFavoritos() {
        fetch(`${FAVORITOS_URL}?userId=${usuarioLogado.id}`)
            .then(response => response.json())
            .then(favs => {
                if (favs.length === 0 || favs[0].favoritos.length === 0) {
                    listaFavoritos.innerHTML = '<p class="sem-favoritos">Você ainda não tem filmes favoritos.</p>';
                    return;
                }

                const favoritosIds = favs[0].favoritos;

                fetch(API_URL)
                    .then(response => response.json())
                    .then(itens => {
                        const favoritosFilmes = itens.filter(item => favoritosIds.includes(item.id));
                        renderizarFavoritos(favoritosFilmes);
                    });
            })
            .catch(error => {
                console.error('Erro ao carregar favoritos:', error);
                listaFavoritos.innerHTML = '<p class="erro-carregamento">Ocorreu um erro ao carregar seus favoritos.</p>';
            });
    }

    function renderizarFavoritos(filmes) {
        listaFavoritos.innerHTML = '';
        
        // Criar container grid igual à home
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';
        gridContainer.style.maxWidth = '1200px';
        gridContainer.style.margin = '20px auto';
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        gridContainer.style.gap = '15px';
        gridContainer.style.padding = '0 10px';

        filmes.forEach(filme => {
            const card = document.createElement('div');
            card.classList.add('card-item');

            card.innerHTML = `
                <img src="${filme.imagem}" alt="${filme.titulo}" loading="lazy">
                <h3>${filme.titulo}</h3>
                <p>${filme.descricao.substring(0, 100)}...</p>
                <button class="btn-remover-favorito" data-id="${filme.id}">Remover dos Favoritos</button>
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-remover-favorito')) {
                    abrirModal(filme);
                }
            });

            card.querySelector('.btn-remover-favorito').addEventListener('click', (e) => {
                e.stopPropagation();
                removerFavorito(filme.id);
            });

            gridContainer.appendChild(card);
        });

        listaFavoritos.appendChild(gridContainer);
    }

    function abrirModal(filme) {
        modalBody.innerHTML = `
            <div class="modal-poster">
                <img src="${filme.imagem}" alt="${filme.titulo}">
            </div>
            <div class="modal-info">
                <h2>${filme.titulo}</h2>
                <p><strong>Gênero:</strong> ${filme.genero}</p>
                <p>${filme.descricao}</p>
            </div>
        `;
        modal.style.display = 'block';
    }

    function removerFavorito(idFilme) {
        fetch(`${FAVORITOS_URL}?userId=${usuarioLogado.id}`)
            .then(res => res.json())
            .then(favs => {
                const favsDoUsuario = favs[0];
                if (!favsDoUsuario) return;

                favsDoUsuario.favoritos = favsDoUsuario.favoritos.filter(id => id !== idFilme);

                return fetch(`${FAVORITOS_URL}/${favsDoUsuario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(favsDoUsuario)
                });
            })
            .then(() => {
                carregarFavoritos();
            })
            .catch(error => {
                console.error('Erro ao remover favorito:', error);
                alert('Ocorreu um erro ao remover o filme dos favoritos.');
            });
    }

    carregarFavoritos();
});