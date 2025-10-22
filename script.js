  const bookName = document.getElementById('bookName');
  const bookAuthor = document.getElementById('bookAuthor');
  const bookCategory = document.getElementById('bookCategory');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const bookList = document.getElementById('bookList');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const emptyMsg = document.getElementById('emptyMsg');
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toastText');

  // --- State ---
  let editIndex = null; // null = new, number = editing index
  let books = JSON.parse(localStorage.getItem('bookHolder')) || [];

  // --- Utility: show toast ---
  function showToast(message, duration = 2200) {
    toastText.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('animate-toast-in');
    // remove after timeout
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('animate-toast-in');
    }, duration);
  }

  // --- Save / Add / Update ---
  saveBtn.addEventListener('click', () => {
    const name = bookName.value.trim();
    const author = bookAuthor.value.trim();
    const category = bookCategory.value;

    if (!name || !author || !category) {
      showToast('Please fill all fields.');
      return;
    }

    const bookObj = { name, author, category, createdAt: Date.now() };

    if (editIndex === null) {
      // add
      books.push(bookObj);
      showToast('Book added.');
    } else {
      // update
      books[editIndex] = { ...books[editIndex], ...bookObj };
      editIndex = null;
      saveBtn.textContent = 'Save';
      showToast('Book updated.');
    }

    // persist
    localStorage.setItem('bookHolder', JSON.stringify(books));
    // clear form and re-render
    clearForm();
    renderBooks();
    // focus back to name for quick entry
    bookName.focus();
  });

  // --- Clear form ---
  clearBtn.addEventListener('click', clearForm);
  function clearForm() {
    bookName.value = '';
    bookAuthor.value = '';
    bookCategory.value = '';
    editIndex = null;
    saveBtn.textContent = 'Save';
  }

  // --- Render books ---
  function renderBooks() {
    // apply search
    const q = (searchInput.value || '').trim().toLowerCase();
    let filtered = books.filter(b => {
      if (!q) return true;
      return b.name.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
    });

    // apply sort
    const sort = sortSelect.value;
    if (sort === 'newest') {
      filtered.sort((a,b) => b.createdAt - a.createdAt);
    } else if (sort === 'name-asc') {
      filtered.sort((a,b) => a.name.localeCompare(b.name));
    } else if (sort === 'name-desc') {
      filtered.sort((a,b) => b.name.localeCompare(a.name));
    } else if (sort === 'author-asc') {
      filtered.sort((a,b) => a.author.localeCompare(b.author));
    }

    // render or show empty
    bookList.innerHTML = '';
    if (filtered.length === 0) {
      emptyMsg.classList.remove('hidden');
    } else {
      emptyMsg.classList.add('hidden');
      filtered.forEach((b, idx) => {
        // Use a stable index reference: find index in original books array for actions
        const origIndex = books.findIndex(x => x.createdAt === b.createdAt);

        const card = document.createElement('article');
        card.className = 'bg-white rounded-lg shadow p-4 animate-card-in flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <h3 class="text-md font-semibold text-slate-900">${escapeHtml(b.name)}</h3>
            <p class="text-sm text-slate-600 mt-1">by <span class="font-medium">${escapeHtml(b.author)}</span></p>
            <p class="text-xs inline-block mt-3 px-2 py-1 rounded-full text-slate-700 bg-slate-100">${escapeHtml(b.category)}</p>
          </div>
          <div class="mt-4 flex items-center justify-between gap-2">
            <a href="#" class="text-sm text-indigo-600 hover:underline">Buy now</a>
            <div class="flex gap-2">
              <button class="editBtn inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700 transition" data-idx="${origIndex}">
                Edit
              </button>
              <button class="deleteBtn inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500 text-white text-sm hover:bg-rose-600 transition" data-idx="${origIndex}">
                Delete
              </button>
            </div>
          </div>
        `;

        // add hover subtle transform
        card.classList.add('hover:shadow-md', 'transition', 'transform', 'hover:-translate-y-1');

        bookList.appendChild(card);
      });
    }

    // attach event listeners to new buttons
    document.querySelectorAll('.editBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = Number(btn.dataset.idx);
        startEdit(idx);
      });
    });
    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = Number(btn.dataset.idx);
        handleDelete(idx);
      });
    });
  }

  // --- Edit ---
  function startEdit(index) {
    const book = books[index];
    if (!book) return;
    bookName.value = book.name;
    bookAuthor.value = book.author;
    bookCategory.value = book.category;
    editIndex = index;
    saveBtn.textContent = 'Update';
    bookName.focus();
  }

  // --- Delete ---
  function handleDelete(index) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    books.splice(index, 1);
    localStorage.setItem('bookHolder', JSON.stringify(books));
    renderBooks();
    showToast('Book deleted.');
  }

  // --- Search debounce for smoother UX ---
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderBooks, 240);
  });

  sortSelect.addEventListener('change', renderBooks);

  // --- Helpers ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // initial load
  document.addEventListener('DOMContentLoaded', () => {
    renderBooks();
  });

  // keyboard shortcut: Enter while in name field saves quickly
  bookName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBtn.click();
    }
  });