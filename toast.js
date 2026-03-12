// Toast notification system

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.innerHTML = message;

  toast.classList.remove("show");

  if (type === "error") {
    toast.style.background = "#e74c3c";
  } else if (type === "success") {
    toast.style.background = "#2ecc71";
  } else {
    toast.style.background = "#333";
  }

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* Example usage later in the app:

    showToast("Site added","success")
    showToast("Password copied")
    showToast("Site deleted","error") */
