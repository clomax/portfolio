// Jump to sections on the same page without adding to the browser history, so
// Back returns to the previous page instead of stepping back through sections.
// location.replace() still does a normal jump to the section: the address shows
// it, and scrolling and keyboard focus behave as they would following the link.
document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = e.target.closest('a[href^="#"]');
  if (!link || link.hash.length < 2) return;
  e.preventDefault();
  location.replace(link.hash);
});
