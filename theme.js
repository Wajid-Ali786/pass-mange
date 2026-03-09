// Theme toggle system

const themeBtn = document.getElementById("themeToggle");

function loadTheme(){

const savedTheme = localStorage.getItem("theme");

if(savedTheme === "dark"){
document.body.classList.add("dark");
}

}

function toggleTheme(){

document.body.classList.toggle("dark");

if(document.body.classList.contains("dark")){
localStorage.setItem("theme","dark");
}
else{
localStorage.setItem("theme","light");
}

}

if(themeBtn){
themeBtn.addEventListener("click",toggleTheme);
}

loadTheme();