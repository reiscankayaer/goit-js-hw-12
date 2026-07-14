import axios from "axios";
import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

// DOM Elemanları
const form = document.querySelector("#search-form");
const gallery = document.querySelector("#gallery");
const loader = document.querySelector("#loader");
const loadMoreBtn = document.querySelector("#load-more");

// Global Değişkenler (Sayfalama İçin)
let query = "";
let page = 1;
const perPage = 40; // Yönerge: Her sayfada 40 görsel

// Lightbox Başlatma
let lightbox = new SimpleLightbox(".gallery a", {
  captionsData: "alt",
  captionDelay: 250,
});

// Olay Dinleyicileri
form.addEventListener("submit", onSearch);
loadMoreBtn.addEventListener("click", onLoadMore);

// 1. Yeni Arama Yapıldığında Çalışacak Async Fonksiyon
async function onSearch(event) {
  event.preventDefault();
  
  query = event.currentTarget.elements.searchQuery.value.trim();
  if (!query) return;

  // Yeni aramada her şeyi sıfırla
  page = 1;
  gallery.innerHTML = "";
  loadMoreBtn.style.display = "none";
  loader.style.display = "block";

  try {
    const data = await fetchImages(query, page);
    loader.style.display = "none";

    // Eğer sonuç yoksa
    if (data.hits.length === 0) {
      iziToast.error({
        message: "Sorry, there are no images matching your search query. Please, try again!",
        position: "topRight",
        backgroundColor: "#ef4040",
        messageColor: "#fff",
      });
      return;
    }

    // Sonuçları ekrana bas
    renderGallery(data.hits);

    // Eğer toplam görsel sayısı 40'tan fazlaysa butonu göster
    if (data.totalHits > perPage) {
      loadMoreBtn.style.display = "block";
    }
  } catch (error) {
    loader.style.display = "none";
    iziToast.error({ message: "Bir şeyler ters gitti!", position: "topRight" });
  }
}

// 2. Load More Butonuna Basıldığında Çalışacak Async Fonksiyon
async function onLoadMore() {
  page += 1; // Sayfayı artır
  loadMoreBtn.style.display = "none"; // Yüklenirken butonu gizle
  loader.style.display = "block"; // Loader'ı göster

  try {
    const data = await fetchImages(query, page);
    renderGallery(data.hits);
    loader.style.display = "none";

    // Yönerge: Smooth Scroll (Pürüzsüz Kaydırma)
    smoothScroll();

    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil(data.totalHits / perPage);

    // Eğer son sayfaya ulaştıysak
    if (page >= totalPages) {
      iziToast.info({
        message: "We're sorry, but you've reached the end of search results.",
        position: "topRight",
        backgroundColor: "#4e75ff",
        messageColor: "#fff",
      });
    } else {
      // Hala sayfa varsa butonu geri getir
      loadMoreBtn.style.display = "block";
    }
  } catch (error) {
    loader.style.display = "none";
    iziToast.error({ message: "Görseller yüklenirken hata oluştu!", position: "topRight" });
  }
}

// 3. Axios ile API'den Veri Çeken Async Fonksiyon
async function fetchImages(q, p) {
  const API_KEY = "56616492-365663f16d6efa67721cffd28";
  const BASE_URL = "https://pixabay.com/api/";

  // Yönerge: Axios kullanımı
  const response = await axios.get(BASE_URL, {
    params: {
      key: API_KEY,
      q: q,
      image_type: "photo",
      orientation: "horizontal",
      safesearch: true,
      page: p,
      per_page: perPage,
    },
  });

  return response.data;
}

// 4. HTML Oluşturup DOM'a Ekleyen Fonksiyon
function renderGallery(images) {
  const markup = images
    .map(
      (image) => `
      <a href="${image.largeImageURL}" class="photo-card">
        <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
        <div class="info">
          <p class="info-item"><b>Likes</b> ${image.likes}</p>
          <p class="info-item"><b>Views</b> ${image.views}</p>
          <p class="info-item"><b>Comments</b> ${image.comments}</p>
          <p class="info-item"><b>Downloads</b> ${image.downloads}</p>
        </div>
      </a>`
    )
    .join("");

  // Eski HTML'i silmeden sonuna ekler (Load more için kritik)
  gallery.insertAdjacentHTML("beforeend", markup);
  
  // Yönerge: Yeni öğeler eklendikten sonra refresh
  lightbox.refresh();
}

// 5. Kaydırma Efekti Fonksiyonu (Yönergedeki getBoundingClientRect kullanımı)
function smoothScroll() {
  const { height: cardHeight } = gallery.firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: "smooth",
  });
}