// STORAGE SYSTEM

const STORAGE_KEY = "pm_sites";
const HISTORY_KEY = "pm_history";

let sites = [];
let globalHistory = [];


// Load data from localStorage
function loadStorage(){

try{

sites = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
globalHistory = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

}catch(e){

sites = [];
globalHistory = [];

}

}


// Save data to localStorage
function saveStorage(){

localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
localStorage.setItem(HISTORY_KEY, JSON.stringify(globalHistory));

}


// Create new site object
function createSite(data){

return {

id: Date.now().toString(),

name: data.name || "",
url: data.url || "",
username: data.username || "",
password: data.password || "",

passDate: data.passDate || "",

favorite: data.favorite || false,

createdAt: Date.now(),
updatedAt: Date.now(),

history: []

};

}


// Add new site
function addSite(site){

sites.push(site);

globalHistory.push({

siteId: site.id,
siteName: site.name,

action: "created",

time: Date.now()

});

saveStorage();

}


// Update existing site
function updateSite(id, newData){

let site = sites.find(s => s.id === id);

if(!site) return;


// Save old password in site history
if(site.password !== newData.password){

site.history.push({

password: site.password,
changedAt: Date.now()

});

}


site.name = newData.name;
site.url = newData.url;
site.username = newData.username;
site.password = newData.password;
site.passDate = newData.passDate;
site.favorite = newData.favorite;

site.updatedAt = Date.now();


globalHistory.push({

siteId: site.id,
siteName: site.name,

action: "updated",

time: Date.now()

});


saveStorage();

}


// Delete site
function deleteSite(id){

let site = sites.find(s => s.id === id);

sites = sites.filter(s => s.id !== id);

globalHistory.push({

siteId: id,
siteName: site ? site.name : "",

action: "deleted",

time: Date.now()

});

saveStorage();

}


// Get site by id
function getSite(id){

return sites.find(s => s.id === id);

}


// Toggle favorite
function toggleFavorite(id){

let site = getSite(id);

if(!site) return;

site.favorite = !site.favorite;

saveStorage();

}


// Search system
function searchSites(keyword){

if(!keyword) return sites;

keyword = keyword.toLowerCase();

return sites.filter(site => {

let text = (
site.name +
site.url +
site.username +
site.password +
site.passDate
).toLowerCase();

return text.includes(keyword);

});

}


// Auto backup every 5 minutes
setInterval(()=>{

localStorage.setItem(
"pm_auto_backup",
JSON.stringify({

time: Date.now(),
sites,
globalHistory

})

);

}, 300000);


// Initialize
loadStorage();