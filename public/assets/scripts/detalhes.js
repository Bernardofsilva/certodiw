document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/items';
    const FAVORITOS_URL = 'http://localhost:3000/favorites';
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    const idDetalhe = sessionStorage.getItem('idDetalhe');
    const detalhesDiv = document.getElementById('detalhes-filme');

    if (!idDetalhe) {
        detalhesDiv.innerHTML = '<p>Nenhum filme selecionado.</p>';
        return;
    }

    fetch(`${API_URL}/${idDetalhe}`)
        .then(res => res.json())
        .then(filme => {
            detalhesDiv.innerHTML = `
                <h2>${filme.titulo}</h2>
                <img src="${filme.imagem}" alt="${filme.titulo}" style="max-width:300px;">
                <p><strong>Gênero:</strong> ${filme.genero}</p>
                <p>${filme.descricao}</p>
                ${usuarioLogado ? `<button id="btn-fav">Favoritar</button>` : ''}
            `;

            if (usuarioLogado) {
                document.getElementById('btn-fav').addEventListener('click', () => {
                    toggleFavorito(filme.id);
                });
            }
        });

    function toggleFavorito(idFilme) {
        const userId = usuarioLogado.id;

        fetch(`${FAVORITOS_URL}?userId=${userId}`)
            .then(res => res.json())
            .then(favs => {
                let favsDoUsuario = favs[0];

                if (!favsDoUsuario) {
                    favsDoUsuario = { userId: userId, favoritos: [] };
                    fetch(FAVORITOS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(favsDoUsuario)
                    });
                }

                const jaFavoritado = favsDoUsuario.favoritos.includes(idFilme);

                if (jaFavoritado) {
                    favsDoUsuario.favoritos = favsDoUsuario.favoritos.filter(id => id !== idFilme);
                    alert('Removido dos favoritos.');
                } else {
                    favsDoUsuario.favoritos.push(idFilme);
                    alert('Adicionado aos favoritos!');
                }

                fetch(`${FAVORITOS_URL}/${favsDoUsuario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(favsDoUsuario)
                });
            });
    }
});
