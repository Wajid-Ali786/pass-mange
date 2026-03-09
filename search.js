// Search system for filtering saved sites

const searchInput = document.getElementById("searchInput");

function searchSites(){

const value = searchInput.value.toLowerCase();

const cards = document.querySelectorAll(".site-card");

cards.forEach(card => {

const siteName = card.querySelector(".site-name").innerText.toLowerCase();
const siteUrl = card.querySelector(".site-url").innerText.toLowerCase();

if(siteName.includes(value) || siteUrl.includes(value)){
card.style.display = "block";
}else{
card.style.display = "none";
}

});

}

if(searchInput){
searchInput.addEventListener("input",searchSites);
}