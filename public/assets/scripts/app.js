document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/items';
    const FAVORITOS_URL = 'http://localhost:3000/favorites';
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    const listaItens = document.getElementById('lista-itens');
    const campoPesquisa = document.getElementById('campo-pesquisa');
    const btnPesquisar = document.getElementById('btn-pesquisar');
    const btnLimpar = document.getElementById('btn-limpar');
    const selectGenero = document.getElementById('genero');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close-modal');

    // Cache de elementos e verificação de usuário
    if (usuarioLogado) {
        document.getElementById('menu-login').style.display = 'none';
        document.getElementById('menu-logout').style.display = 'inline';
        document.getElementById('menu-favoritos').style.display = 'inline';
        document.getElementById('menu-cadastro').style.display = usuarioLogado.admin ? 'inline' : 'none';
    }

    // Event Listeners
    document.getElementById('menu-logout')?.addEventListener('click', () => {
        sessionStorage.removeItem('usuarioLogado');
        window.location.reload();
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Funções principais
    function carregarFilmes(filtroGenero = 'todos', textoPesquisa = '') {
        fetchWithErrorHandling(API_URL)
            .then(data => {
                listaItens.innerHTML = '';

                if (usuarioLogado) {
                    fetchWithErrorHandling(`${FAVORITOS_URL}?userId=${usuarioLogado.id}`)
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
                <img src="${filme.imagem}" alt="${filme.titulo}" loading="lazy">
                <h3>${filme.titulo}</h3>
                <p>${filme.descricao.substring(0, 100)}...</p>
                ${usuarioLogado ? `<button class="btn-favorito" data-id="${filme.id}">
                    ${favoritos.includes(filme.id) ? '❤️' : '🤍'}
                </button>` : ''}
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-favorito')) {
                    abrirModal(filme);
                }
            });

            if (usuarioLogado) {
                card.querySelector('.btn-favorito')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorito(filme.id, e.target);
                });
            }

            listaItens.appendChild(card);
        });
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

    function toggleFavorito(idFilme, btn) {
        fetchWithErrorHandling(`${FAVORITOS_URL}?userId=${usuarioLogado.id}`)
            .then(favs => {
                let favsDoUsuario = favs[0];

                if (!favsDoUsuario) {
                    favsDoUsuario = { userId: usuarioLogado.id, favoritos: [] };
                    return fetchWithErrorHandling(FAVORITOS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(favsDoUsuario)
                    }).then(() => favsDoUsuario);
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

                return fetchWithErrorHandling(`${FAVORITOS_URL}/${favsDoUsuario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(favsDoUsuario)
                });
            })
            .then(() => {
                carregarFilmes(selectGenero.value, campoPesquisa.value);
            });
    }

    function fetchWithErrorHandling(url, options) {
        return fetch(url, options)
            .then(res => {
                if (!res.ok) throw new Error('Erro na requisição');
                return res.json();
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro. Por favor, tente novamente.');
            });
    }

    // Event Listeners para filtros
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

    // Inicialização
    carregarFilmes();
});
document.addEventListener('DOMContentLoaded', () => {
    // ... (código existente até a linha 20)

    // Variáveis do carrossel
    let currentSlide = 0;
    let slides = [];
    let intervalId;

    // Inicialização
    carregarFilmes();
    iniciarCarrossel();

    function iniciarCarrossel() {
        fetch(API_URL)
            .then(res => res.json())
            .then(filmes => {
                // Pegar os 5 primeiros filmes para o carrossel
                slides = filmes.slice(0, 5);
                renderizarCarrossel();
                iniciarAutoPlay();
            });
    }

    function renderizarCarrossel() {
        const carrosselSlides = document.querySelector('.carrossel-slides');
        const carrosselDots = document.querySelector('.carrossel-dots');

        carrosselSlides.innerHTML = '';
        carrosselDots.innerHTML = '';

        slides.forEach((filme, index) => {
            // Criar slide
            const slide = document.createElement('div');
            slide.className = 'carrossel-slide';
            slide.innerHTML = `
                <img src="${filme.imagem}" alt="${filme.titulo}" loading="lazy">
                <div class="carrossel-slide-info">
                    <h3>${filme.titulo}</h3>
                    <p>${filme.descricao.substring(0, 100)}...</p>
                </div>
            `;
            carrosselSlides.appendChild(slide);

            // Criar dot
            const dot = document.createElement('div');
            dot.className = `carrossel-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => {
                goToSlide(index);
            });
            carrosselDots.appendChild(dot);
        });

        // Event listeners para os botões
        document.querySelector('.carrossel-btn.prev').addEventListener('click', prevSlide);
        document.querySelector('.carrossel-btn.next').addEventListener('click', nextSlide);
    }

    function goToSlide(index) {
        const carrosselSlides = document.querySelector('.carrossel-slides');
        const dots = document.querySelectorAll('.carrossel-dot');
        
        currentSlide = index;
        carrosselSlides.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Atualizar dots ativos
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
        resetAutoPlay();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        goToSlide(currentSlide);
        resetAutoPlay();
    }

    function iniciarAutoPlay() {
        intervalId = setInterval(nextSlide, 5000);
    }

    function resetAutoPlay() {
        clearInterval(intervalId);
        iniciarAutoPlay();
    }

    // ... (restante do código existente)
});