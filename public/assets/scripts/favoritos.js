document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/items';
    const FAVORITOS_URL = 'http://localhost:3000/favorites';
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    const listaFavoritos = document.getElementById('favoritos-lista');

    if (!usuarioLogado) {
        alert('Você precisa estar logado para visualizar os favoritos.');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('logout').addEventListener('click', () => {
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html';
    });

    function carregarFavoritos() {
        fetch(`${FAVORITOS_URL}?userId=${usuarioLogado.id}`)
            .then(response => response.json())
            .then(favs => {
                if (favs.length === 0 || favs[0].favoritos.length === 0) {
                    listaFavoritos.innerHTML = '<p>Você ainda não tem favoritos.</p>';
                    return;
                }

                const favoritosIds = favs[0].favoritos;

                fetch(API_URL)
                    .then(response => response.json())
                    .then(itens => {
                        const favoritosFilmes = itens.filter(item => favoritosIds.includes(item.id));

                        listaFavoritos.innerHTML = '';

                        favoritosFilmes.forEach(filme => {
                            const card = document.createElement('div');
                            card.classList.add('card-item');

                            card.innerHTML = `
                                <img src="${filme.imagem}" alt="${filme.titulo}">
                                <h3>${filme.titulo}</h3>
                                <p>${filme.descricao}</p>
                            `;

                            listaFavoritos.appendChild(card);
                        });
                    });
            });
    }

    carregarFavoritos();
});
