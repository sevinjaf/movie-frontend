const API_KEY = 'SİZİN_TMDB_API_KEY'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentQuery = '';
let currentEndpoint = `${BASE_URL}/movie/popular`;


const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const loader = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');
const favCountSpan = document.getElementById('fav-count');

const modal = document.getElementById('movie-modal');
const modalDetails = document.getElementById('modal-details');
const closeModal = document.querySelector('.close-btn');

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

async function fetchMovies(url, page = 1) {
    showLoading(true);
    hideError();
    try {
        const response = await fetch(`${url}?api_key=${API_KEY}&language=az-AZ&page=${page}`);
        
        if (!response.ok) {
            throw new Error(`HTTP xətası! Status: ${response.status}`);
        }
        
        const data = await response.json();
        displayMovies(data.results);
        updatePagination(data.page, data.total_pages);
    } catch (error) {
        console.error("Fetch xətası:", error);
        showError();
    } finally {
        showLoading(false);
    }
}

async function searchMovies(query, page = 1) {
    if (!query.trim()) return;
    showLoading(true);
    hideError();
    try {
        const response = await axios.get(`${BASE_URL}/search/movie`, {
            params: {
                api_key: API_KEY,
                query: query,
                language: 'az-AZ',
                page: page
            }
        });
        
        displayMovies(response.data.results);
        updatePagination(response.data.page, response.data.total_pages);
    } catch (error) {
        console.error("Axios xətası:", error);
        showError();
    } finally {
        showLoading(false);
    }
}

async function fetchMovieDetails(movieId) {
    try {
        const response = await axios.get(`${BASE_URL}/movie/${movieId}`, {
            params: { api_key: API_KEY, language: 'az-AZ' }
        });
        showMovieModal(response.data);
    } catch (error) {
        alert("Film detallarını yükləmək mümkün olmadı.");
    }
}

function displayMovies(movies) {
    moviesGrid.innerHTML = '';
    
    if (movies.length === 0) {
        moviesGrid.innerHTML = '<p>Heç bir film tapılmadı.</p>';
        return;
    }

    movies.forEach(movie => {
        const isFav = favorites.some(fav => fav.id === movie.id);
        const card = document.createElement('div');
        card.classList.add('movie-card');
        
        const posterPath = movie.poster_path 
            ? `${IMAGE_BASE_URL}${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=Şəkil+Yoxdur';

        card.innerHTML = `
            <img src="${posterPath}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <div>
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span>⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                        <span>${movie.release_date ? movie.release_date.split('-')[0] : ''}</span>
                    </div>
                </div>
                <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${movie.id}">
                    ${isFav ? '❤️ Sevimlilərdən sil' : '🤍 Sevimlilərə əlavə et'}
                </button>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                fetchMovieDetails(movie.id);
            }
        });
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', () => toggleFavorite(movie, favBtn));

        moviesGrid.appendChild(card);
    });
}

function showMovieModal(movie) {
    modalDetails.innerHTML = `
        <h2>${movie.title}</h2>
        <p><strong>Orijinal ad:</strong> ${movie.original_title}</p>
        <p><strong>Janrlar:</strong> ${movie.genres.map(g => g.name).join(', ')}</p>
        <p><strong>Müddət:</strong> ${movie.runtime} dəqiqə</p>
        <p><strong>Büdcə:</strong> $${movie.budget ? movie.budget.toLocaleString() : 'Məlumat yoxdur'}</p>
        <p><strong>Gəlir:</strong> $${movie.revenue ? movie.revenue.toLocaleString() : 'Məlumat yoxdur'}</p>
        <p><strong>Təsvir:</strong> ${movie.overview || 'Təsvir mövcud deyil.'}</p>
    `;
    modal.classList.remove('hidden');
}
function toggleFavorite(movie, btnElement) {
    const index = favorites.findIndex(fav => fav.id === movie.id);
    if (index > -1) {
        favorites.splice(index, 1);
        btnElement.classList.remove('active');
        btnElement.textContent = '🤍 Sevimlilərə əlavə et';
    } else {
        favorites.push(movie);
        btnElement.classList.add('active');
        btnElement.textContent = '❤️ Sevimlilərdən sil';
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavCount();
}

function updateFavCount() {
    favCountSpan.textContent = favorites.length;
}


function updatePagination(page, totalPages) {
    currentPage = page;
    pageInfo.textContent = `Səhifə ${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

function showLoading(show) {
    loader.classList.toggle('hidden', !show);
}

function showError() {
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}


searchBtn.addEventListener('click', () => {
    currentQuery = searchInput.value.trim();
    if (currentQuery) {
        currentPage = 1;
        searchMovies(currentQuery, currentPage);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

let debounceTimer;
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    if (query.length > 2) {
        debounceTimer = setTimeout(() => {
            currentQuery = query;
            currentPage = 1;
            searchMovies(currentQuery, currentPage);
        }, 500);
    } else if (query.length === 0) {
        currentQuery = '';
        fetchMovies(currentEndpoint, 1);
    }
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        if (currentQuery) searchMovies(currentQuery, currentPage);
        else fetchMovies(currentEndpoint, currentPage);
    }
});

nextBtn.addEventListener('click', () => {
    currentPage++;
    if (currentQuery) searchMovies(currentQuery, currentPage);
    else fetchMovies(currentEndpoint, currentPage);
});

closeModal.addEventListener('click', () => modal.classList.add('hidden'));
window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

retryBtn.addEventListener('click', () => {
    if (currentQuery) searchMovies(currentQuery, currentPage);
    else fetchMovies(currentEndpoint, currentPage);
});


updateFavCount();
fetchMovies(currentEndpoint, 1);


const favoritesGrid = document.getElementById('favorites-grid');

if (favoritesGrid) {
    displayFavorites();
}

function displayFavorites() {
    favoritesGrid.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '<p>Hələ heç bir filmi sevimlilərə əlavə etməmisiniz.</p>';
        return;
    }

    favorites.forEach(movie => {
        const card = document.createElement('div');
        card.classList.add('movie-card');
        
        const posterPath = movie.poster_path 
            ? `${IMAGE_BASE_URL}${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=Şəkil+Yoxdur';

        card.innerHTML = `
            <img src="${posterPath}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <div>
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span>⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                        <span>${movie.release_date ? movie.release_date.split('-')[0] : ''}</span>
                    </div>
                </div>
                <button class="fav-btn active" data-id="${movie.id}">
                    ❤️ Sevimlilərdən sil
                </button>
            </div>
        `;

    
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                fetchMovieDetails(movie.id);
            }
        });

      
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', () => {
            const index = favorites.findIndex(fav => fav.id === movie.id);
            if (index > -1) {
                favorites.splice(index, 1);
                localStorage.setItem('favorites', JSON.stringify(favorites));
                updateFavCount();
                displayFavorites(); 
            }
        });

        favoritesGrid.appendChild(card);
    });
}