document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "article") {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get("id");

    fetch("articles.json")
      .then(response => response.json())
      .then(data => {
        const article = data.find(a => a.id == articleId);

        if (article) {
          document.title = `${article.title} • Truth For Life`;
          document.getElementById("post-title").innerText = article.title;
          document.getElementById("post-author").innerText = article.author.name;
          document.getElementById("post-date").innerText = article.date;
          document.getElementById("post-readtime").innerText = `${article.readTime} min read`;

          // Hero image
          if (article.heroImage) {
            document.getElementById("post-hero").innerHTML =
              `<img src="${article.heroImage}" alt="${article.title}">`;
          }

          // Main content
          document.getElementById("post-content").innerHTML = article.contentHTML;

          // Author details
          document.getElementById("author-avatar").src = article.author.avatar;
          document.getElementById("author-name").innerText = article.author.name;
          document.getElementById("author-bio").innerText = article.author.bio;
        } else {
          document.getElementById("post-content").innerHTML = "<p>Article not found.</p>";
        }
      })
      .catch(err => {
        console.error("Error loading article:", err);
        document.getElementById("post-content").innerHTML = "<p>Error loading article.</p>";
      });
  }
});












/*// Get the article ID from the URL
const params = new URLSearchParams(window.location.search);
const articleId = params.get('id');

// Fetch the JSON file and find the article
fetch('articles.json')
  .then(response => response.json())
  .then(data => {
    const article = data.find(a => a.id == articleId);

    if (article) {
      document.getElementById('article-title').innerText = article.title;
      document.getElementById('article-content').innerHTML = `<p>${article.content}</p>`;
    } else {
      document.getElementById('article-title').innerText = "Article Not Found";
      document.getElementById('article-content').innerHTML = "";
    }
  })
  .catch(error => {
    console.error("Error loading article:", error);
  });*/

