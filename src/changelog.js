export { changelog };

function loadMarkdownText(path, cb) {
  fetch(path)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then((markdownText) => {
      cb(markdownText); // Call the callback with the raw markdown text
    })
    .catch((error) => {
      console.error("Error loading markdown file:", error);
    });
}

const changelog = (msgs) => {
  loadMarkdownText("CHANGELOG.md", (markdownText) => {
    const div = document.createElement("DIV");
    div.classList.add("changelog-content");
    for (let line of markdownText.split("\n")) {
      if (line.startsWith("# ")) {
        const h1 = document.createElement("H1");
        h1.innerHTML = line.substring(2);
        div.appendChild(h1);
      }
      if (line.startsWith("- ")) {
        const li = document.createElement("LI");
        li.innerHTML = line.substring(2).replace(/\_(.*?)\_/g, "<em>$1</em>");
        div.appendChild(li);
      }
    }
    div.addEventListener("click", () => msgs.hide());
    msgs.div(div);
  });
};
