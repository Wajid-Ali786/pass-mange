// Main application logic

const form = document.getElementById("siteForm");
const siteNameInput = document.getElementById("siteName");
const siteUrlInput = document.getElementById("siteUrl");
const sitePasswordInput = document.getElementById("sitePassword");
const sitesContainer = document.getElementById("sitesContainer");

let sites = [];

// Load sites from localStorage
function loadSites(){

const saved = localStorage.getItem("sites");

if(saved){
sites = JSON.parse(saved);
}

renderSites();

}

// Save sites to localStorage
function saveSites(){

localStorage.setItem("sites", JSON.stringify(sites));

}

// Render site cards
function renderSites(){

sitesContainer.innerHTML = "";

sites.forEach((site,index)=>{

const card = document.createElement("div");
card.className = "site-card";

card.innerHTML = `
<h3 class="site-name">${site.name}</h3>
<p class="site-url">${site.url}</p>

<div class="card-actions">

<button onclick="copyPassword(${index})">Copy</button>

<button onclick="deleteSite(${index})">Delete</button>

</div>
`;

sitesContainer.appendChild(card);

});

}

// Add new site
if(form){

form.addEventListener("submit",(e)=>{

e.preventDefault();

const name = siteNameInput.value.trim();
const url = siteUrlInput.value.trim();
const password = sitePasswordInput.value.trim();

if(!name || !url || !password){

showToast("Please fill all fields","error");
return;

}

const newSite = {
name,
url,
password
};

sites.push(newSite);

saveSites();

renderSites();

form.reset();

showToast("Site added successfully","success");

});

}

// Delete site
function deleteSite(index){

sites.splice(index,1);

saveSites();

renderSites();

showToast("Site deleted","error");

}

// Copy password
function copyPassword(index){

const password = sites[index].password;

navigator.clipboard.writeText(password);

showToast("Password copied");

}

// Initialize app
loadSites();