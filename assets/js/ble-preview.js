// The preview links are explicit; visiting a preview never changes the live site.
document.querySelectorAll("[data-app-version]").forEach((select) => {
  select.addEventListener("change", () => {
    if (select.value) window.location.assign(select.value);
  });
});
