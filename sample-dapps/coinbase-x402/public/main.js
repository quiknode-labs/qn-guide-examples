document.addEventListener("DOMContentLoaded", function() {
  initializeCollapsibles();
  initializeCopyButtons();
});

function initializeCollapsibles() {
  const triggers = document.querySelectorAll(".collapsible-trigger");
  
  triggers.forEach(trigger => {
    trigger.addEventListener("click", function() {
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      
      if (content && content.classList.contains("collapsible-content")) {
        content.classList.toggle("active");
      }
    });
  });
}

function initializeCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const targetId = btn.getAttribute("data-copy-target");
      const codeElem = document.getElementById(targetId);
      
      if (codeElem) {
        navigator.clipboard
          .writeText(codeElem.innerText)
          .then(() => {
            const originalText = btn.textContent;
            btn.textContent = "Copied!";
            setTimeout(() => {
              btn.textContent = originalText;
            }, 1200);
          })
          .catch(err => {
            console.error("Failed to copy: ", err);
          });
      }
    });
  });
}